# L3 — Interactive / agentic (acts, human in the loop)

**Goal:** the bot can *do things*, but a human always approves mutations. It picks
the right target, streams progress, and only chimes into threads when addressed.

## Checklist

- [ ] **`POST /interactions`** route (signed like everything else).
- [ ] **Human-in-the-loop approvals** — drafts as Block Kit, applied only on click.
- [ ] **Buttons resolve in place** (`chat.update`) so they can't be actioned twice.
- [ ] **Dry-run validation** before presenting drafts.
- [ ] **Slash commands** for one-shot invocations.
- [ ] **Routing / clarification ladder** for ambiguous targets.
- [ ] **Live status streaming** of agent steps into the composer.
- [ ] **Monitored-thread decision** — reply to non-mentions only when addressed.

## Mutations require a human

A query never mutates state. It produces **drafts** (persisted as `draft`), rendered
as one Block Kit card per change with an `actions` block keyed to the proposal id:

```ts
{ type: "actions", block_id: `apply_${proposal.id}`, elements: [
  { type: "button", style: "primary", action_id: "approve", text: { type: "plain_text", text: "Approve & apply" },
    value: proposal.id, confirm: { /* confirm dialog */ } },
  { type: "button", action_id: "reject", text: { type: "plain_text", text: "Reject" }, value: proposal.id },
]}
```

Approve routes through the **exact same** operation + audit + version path as your
web app. Attribute Slack-initiated changes to a **service user** (see L4).

## Buttons resolve in place

On an interaction, edit the original message (`chat.update`), replacing the
`actions` block with a `context` status line. Prevents double-clicks and shows the
outcome where the buttons were.

```ts
const blocks = original.blocks.map(b =>
  b.block_id === `apply_${id}`
    ? { type: "context", elements: [{ type: "mrkdwn", text: `:white_check_mark: Appled by <@${user}> · v${version}` }] }
    : b);
await slack("chat.update", { channel, ts, text, blocks }, env);
```

## Dry-run validation before presenting

Simulate drafts against an **in-memory copy** of state, cumulatively (so two drafts
aimed at the same slot are caught), and drop any that wouldn't apply — note the
drops in the reply so intent stays visible.

```ts
let working = snapshot; const kept = [], dropped = [];
for (const p of proposals) {
  const res = applyOperation(working, toOperation(p, working));   // pure, no writes
  if (res.ok) { working = res.snapshot; kept.push(p); }
  else dropped.push({ summary: p.summary, reason: res.conflict.message });
}
```

## Routing / clarification ladder

Don't guess recklessly across repos/projects/customers/environments:

1. One target exists → use it.
2. Channel is associated with one target → use it.
3. Deterministic match on names/aliases/keywords/paths.
4. LLM classifier with the **bounded** target list + Slack context.
5. Low confidence / plausible alternatives → ask with a Block Kit `static_select`.

Persist pending clarification in the store with a short TTL; on selection,
**re-validate the target still exists**, start the session, then delete the key.

```ts
await kv.put(`pending:${channel}:${threadKey}`, JSON.stringify({ message, userId, context }), { expirationTtl: 3600 });
```

## Live status streaming

If your core streams steps (`turn`, `tool_call`, …), map them to `setStatus`
updates ("is checking the Agents track…", "is scanning for conflicts…"). De-dupe
so you don't call `setStatus` on every token.

```ts
let last = "";
await runBotQuery({ message, sessionKey }, { emit: (ev) => {
  const s = statusFor(ev); if (!s || s === last) return; last = s;
  void slack("assistant.threads.setStatus", { channel_id: channel, thread_ts: threadKey, status: s }, env);
}});
```

## Monitored-thread "should I reply?"

A plain reply (no @mention) in a thread the bot is already in is ambiguous:

1. Bot not participating in the thread → ignore.
2. Message actually @mentions the bot → let the `app_mention` event handle it (don't double-reply).
3. Otherwise a **cheap model call** "is this aimed at me?"; reply only if yes, and
   reply **quietly** (threaded answer, no reaction/status). When in doubt, stay out.
   Fall back to a conservative heuristic if no model key.

## Slash commands

Ack with an ephemeral "working on it…", then post the answer to `response_url`
(`response_type: in_channel`). One-shot, no thread — skip session continuity but
still record observability (L4) and support per-request flags (e.g. `--history`).

## Anti-patterns

- ❌ Applying changes straight from a query (no approval).
- ❌ Leaving buttons live after a click → double-applies.
- ❌ Presenting drafts you never validated → 409 on approve.
- ❌ Guessing the target when several are plausible.
- ❌ Replying to every thread message → the bot becomes a nuisance.
- ❌ `setStatus` on every streamed token → rate-limit churn.
- ❌ Forgetting to re-validate a selected target before acting on it.

## Graduate when…

A change is drafted, approved with a confirm dialog, applied through the canonical
audit path, and its button rewrites in place; ambiguous targets prompt a select
menu; the bot streams progress; and it stays quiet in threads unless addressed.
