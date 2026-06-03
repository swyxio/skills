# L3 — Interactive / agentic (acts, human in the loop)

**Goal:** the bot can *do things*, but a human always approves mutations. It picks
the right target, streams progress, and only chimes into threads when addressed.

## Checklist

- [ ] **`POST /interactions`** route (signed like everything else).
- [ ] **Human-in-the-loop approvals** — drafts as Block Kit, applied only on click.
- [ ] **Buttons resolve in place** (`chat.update`) so they can't be actioned twice.
- [ ] **Dry-run validation** before presenting drafts.
- [ ] **Rich, actionable drafts** — render computed evidence/artifacts, bulk + edit-before-apply, deep links.
- [ ] **Slash commands** for one-shot invocations.
- [ ] **Routing / clarification ladder** for ambiguous targets.
- [ ] **Live status streaming** of agent steps into the composer (native version → L4).
- [ ] **Monitored-thread decision** — reply to non-mentions only when addressed (heuristic-first).

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
web app. Attribute Slack-initiated changes to a **service user** (see L5).

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

## Rich, actionable drafts

A draft card should show **what the agent computed**, not just prose, and make the
next action one click:

- **Surface evidence + artifacts.** If your core computed conflicts, metrics, or a
  placement plan, render them as compact blocks — don't return them in the payload
  and then drop them on the Slack surface. (Showing the real numbers is the right
  fix; *bypassing* the model to hand-compute a canned summary is not — see the
  classifier war story below.)
- **Bulk actions.** For multi-draft sets add **Approve all / Reject all** alongside
  per-card buttons; your cumulative dry-run already sequenced them safely.
- **Edit before apply.** A third button opens a modal (`views.open`) pre-filled with
  the patch fields (title, owner, target via `static_select` of valid options); on
  `view_submission`, apply the **edited** patch through the same canonical path
  (the apply function should already accept a patch override). Removes the
  "placeholder → go fix it in the web app" round-trip.
- **Deep links.** Add an "Open in <app>" link/button to the durable web surface for
  each draft/target — Slack triggers, the web app is the system of record.

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

### Classifier input hygiene — route on the request, not the context

Every router above (deterministic keyword match, LLM classifier, any fast-path
that picks a canned answer) must inspect **only the user's raw request**. Never
the channel topic, thread history, or session memory you prepend for grounding.
Keep context a separate argument all the way down — not just at the API boundary.

> **War story (real, shipped to prod).** A scheduling bot had a keyword fast path:
> `/\b(how many|count|open slots?|conflicts?|metrics?)\b/` → return a deterministic
> computed summary instead of calling the model. Separately, L2 context prepended
> the channel topic + thread history onto the message *inside* the core, and the
> classifier ran on that combined string. The channel topic contained the word
> "conflicts". Result: **every single prompt** matched the fast path and returned
> the identical canned summary, ignoring whatever the user actually typed. It
> looked like the model was broken; the model was never called. Two compounding
> mistakes: (1) the classifier saw context it should never have seen, and (2) the
> bypass was **silent** — no log said "answered deterministically", so it took a
> code trace to find. Fixes: classify on the raw request only, pass `contextNote`
> as its own field through to the prompt builder, log every non-model path, and
> prefer letting the model answer (grounded by deterministic reports it can look
> up) rather than keyword-guessing intent. Reserve any no-model fast path for
> **explicit command syntax** (e.g. `set field X to Y`), which can't misfire.

## Live status streaming

If your core streams steps (`turn`, `tool_call`, …), map them to `setStatus`
updates ("is checking the Agents track…", "is scanning for conflicts…"). De-dupe
so you don't call `setStatus` on every token. (The composer-status version is the
L3 baseline; **L4 upgrades the *same* event stream** to native `chat.*Stream`
chunks — a typed answer + a live tool-call timeline in the message itself.)

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

**Cost control:** run the cheap heuristic *first* and only escalate to the model
call when it's genuinely ambiguous — otherwise you pay for a classifier call on
every message in every thread the bot has ever touched. Optionally cache a
per-thread "engaged" flag so a busy thread isn't re-classified on each reply.

## Slash commands

Ack with an ephemeral "working on it…", then post the answer to `response_url`
(`response_type: in_channel`). One-shot, no thread — skip session continuity but
still record observability (L5) and support per-request flags (e.g. `--history`).

## Anti-patterns

- ❌ Applying changes straight from a query (no approval).
- ❌ Leaving buttons live after a click → double-applies.
- ❌ Presenting drafts you never validated → 409 on approve.
- ❌ Guessing the target when several are plausible.
- ❌ Replying to every thread message → the bot becomes a nuisance.
- ❌ `setStatus` on every streamed token → rate-limit churn.
- ❌ Forgetting to re-validate a selected target before acting on it.
- ❌ Running an intent classifier / fast-path router over the **context-augmented** message instead of the raw request — a stray keyword in a channel topic then reroutes every prompt.
- ❌ Keyword-guessing intent to short-circuit the model, when the model could answer better grounded on the same deterministic data. Reserve no-model paths for explicit command syntax + a true fallback.
- ❌ Silently taking a non-model / canned-answer path with no log — undebuggable when it misfires.
- ❌ Computing evidence/artifacts in the core and then rendering only the prose answer on Slack — show the conflicts/metrics/plan you already have.
- ❌ A model classifier call on *every* monitored-thread message when a cheap heuristic would filter most of them first.

## Graduate when…

A change is drafted, approved with a confirm dialog, applied through the canonical
audit path, and its button rewrites in place; ambiguous targets prompt a select
menu; the bot streams progress; and it stays quiet in threads unless addressed.
