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
- [ ] **Inline flags** (`!help`, `!model`, `!audit`) — shared parser, strip before planning, help lists model slugs.
- [ ] **Routing / clarification ladder** for ambiguous targets.
- [ ] **Live status streaming** of agent steps into the composer (native version → L4).
- [ ] **Monitored-thread decision** — reply to non-mentions only when addressed (heuristic-first).
- [ ] **Rich outputs + in-message settings** — file/media uploads, control buttons under output (Regenerate/Variation/Settings), a `views.open` settings modal persisted per thread.

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

## Rich outputs: file/media uploads + in-message controls + a settings modal

When the bot produces an **artifact** (a generated image, a rendered chart, a PDF)
rather than text, give it the same affordances Slack gives the Cursor/agent apps:
the file plus buttons to iterate, plus a modal to change settings — no flag-typing
required. This is the `:repeat: Regenerate · :sparkles: Variation · :gear: Settings`
pattern.

### Uploading files (external upload flow)

Three steps, needs `files:read` (download user attachments) + `files:write`:
`files.getUploadURLExternal` → `POST` the bytes to that URL → `files.completeUploadExternal`
(shares it in the channel/thread). For **multiple files in one message**, reserve +
PUT each file, then call `completeUploadExternal` **once** with all file ids.

> **Gotcha (cost me an iteration):** `completeUploadExternal` **ignores `blocks`
> when `initial_comment` is present.** To attach action buttons to a file message,
> send `blocks` (a `section` caption + an `actions` block) and **omit
> `initial_comment`** — you can't have both. If you only need a caption, use
> `initial_comment`.

```ts
// caption + iterate buttons travel WITH the image (no initial_comment)
await slack("files.completeUploadExternal", {
  files: fileIds, channel_id: channel, thread_ts: threadTs,
  blocks: [
    { type: "section", text: { type: "mrkdwn", text: caption } },
    { type: "actions", elements: [
      { type: "button", action_id: "img_regen",   text: { type: "plain_text", text: ":repeat: Regenerate" }, value: threadKey },
      { type: "button", action_id: "img_variation",text: { type: "plain_text", text: ":sparkles: Variation" }, value: threadKey },
      { type: "button", action_id: "img_settings", text: { type: "plain_text", text: ":gear: Settings" },     value: threadKey },
    ]},
  ],
}, env);
```

**Stateless iteration without a blob store:** to "edit the last output", re-read the
thread (`conversations.replies`) and re-download the prior image(s) as references —
don't stand up R2/S3 just to remember the last render. Distinguish the bot's own
outputs (`bot_id` set) from human-supplied references so "Regenerate" replays the
original sources instead of recursively editing its own last frame.

**Attaching a file is itself an intent signal.** A picture on a mention/DM is an
unambiguous "work with this" — route to the media path without requiring a flag
(but still classify on the raw text, not the prepended context — see above).

### A settings modal (`views.open` + `view_submission`)

Mirror the Cursor "Change Settings" UX: a `:gear:` button opens a modal of
`static_select`s (model, aspect, quality, # variations), saved **per thread** and
reused by every later run + button press. Per-message flags (e.g. `!size`) override
the stored setting for that one request.

- **Opening:** a modal needs a fresh `trigger_id` from the `block_actions`
  interaction; it's valid **~3s**. Ack `200` immediately, then call `views.open`
  in the background (no slow work before it).
- **Saving:** on `view_submission` return an **empty `200`** (or `{response_action}`)
  within 3s to close the modal; persist in the background. Read selections from
  `view.state.values[block_id][action_id].selected_option.value`.
- **Carry routing context through the round-trip** in `view.private_metadata`
  (JSON of `{ threadKey, channel, threadTs }`) — the submission payload has no
  message context otherwise.
- **Pre-fill** each select's `initial_option` from current settings so the modal
  shows where things stand.

### Two things the interactivity endpoint must do

1. **Branch on `payload.type`** (`block_actions` vs `view_submission`) — don't
   assume `actions[0]` exists. A modal submit has no `actions`.
2. **A button `value` is ≤ 2000 chars** — stash a **key** (the thread key), then
   re-derive channel/threadTs from `payload.container.thread_ts || message.thread_ts
   || message.ts` and `payload.channel.id`. Never serialize the whole payload into a
   button value.

```ts
const type = String(payload.type || "");
if (type === "view_submission") {
  if (payload.view?.callback_id === "img_settings_modal") schedule(saveSettings(payload.view));
  return new Response("", { status: 200 });          // closes the modal
}
// else block_actions:
if (actionId === "img_settings") { schedule(openModal(triggerId, channel, threadTs)); return ack200(); }
if (actionId === "img_regen" || actionId === "img_variation") { schedule(regenerate(...)); return ack200(); }
```

Keep the heavy generate-and-upload logic in **one shared core** that both the
events path (mention/DM/thread) and the button path call — so Regenerate behaves
exactly like a fresh request, just replaying the stored prompt + settings.

## Inline message flags (`!help`, `!model`, `!audit`)

Slack has no settings UI for model tier or sensitive lookups. Use **strip-before-planning**
flags in the message text (mentions, DMs, slash commands) and a single parser shared
across entry points.

### Why each flag exists

| Flag | When to use | Why not default? |
|------|-------------|------------------|
| **`!help`** | Onboarding, “what can you do?” | Static docs should not cost a model call or pollute session |
| **`!model <slug>`** | Hard reasoning, multistep placement, debugging bad answers | Production default should stay fast/cheap |
| **`!audit [6h\|3d\|1w]`** | “Who changed what?” | Audit log is opt-in, token-heavy, and needs stronger model + prefetch |
| **`!mine`** | “What did I change?” | Needs requester identity from Slack user → email mapping |
| **`!verbose`** | Debug a specific edit | Full diffs blow context size |

Natural language **“not by me”** / **“except me”** should map to `exclude:<requester-email>` on history filters (complement of `!mine`).

### Parser contract

```ts
// functions/_lib/slack-flags.ts (AIEWF reference)
export function parseSlackFlags(text: string): {
  text: string;           // stripped message → planner
  helpRequested: boolean;
  modelSlug: string | null;  // validated against shared registry
  historyAccess: boolean;
  historyAfter: string | null;
  historyMine: boolean;
  historyVerbose: boolean;
  excludeSelf: boolean;
};
```

**Rules:**

1. **`!help` first** — if set (or message is only `help`), post `buildHelpBlocks()` and return. No planner.
2. **Strip all flags** from `text` before `runBotQuery({ message })` — persisted request stays clean.
3. **`!model`** — accept `!model slug` or `!model:slug`; ignore unknown slugs (list valid ones in help).
4. **`!audit`** — implies `historyAccess`; default window 24h unless `!audit 6h` / `3d` / `1w`.
5. Build `historyQueryPrefix` server-side (`after:`, `actor:`, `exclude:`) — prepend to every history lookup so the model cannot drop the window.
6. **Audit mode:** prefetch history **before** agent turn 1; bump `maxTurns`; pick audit-default model unless `!model` overrides.
7. **Slash commands** use the same parser (not a parallel `--history` path that drifts).

### Help blocks should be the source of truth

`buildHelpBlocks(appOrigin)` should include:

- How to invoke (@mention, DM, `/command`)
- Ask vs draft vs instant-edit syntax
- Full flag reference + **every model slug** from `AI_MODEL_OPTIONS`
- One combined example: `!model openai-gpt-5.4-high !audit 2d edits not by me`

Keep `SLACK_HELP_TEXT` as a one-liner that points to `!help`.

### Best practices

- ✅ One registry for model slugs (web dropdown + Slack `!model` + footer metadata).
- ✅ Log `modelSlug`, `historyAccess`, and prefetch query on each run.
- ✅ Map `emit({ type: 'tool_call', kind: 'history' })` to composer status (“is reviewing the change history…”).
- ❌ Letting the model answer “I’ve requested history…” without prefetch — users experience a stall.
- ❌ Duplicating flag parsing in events vs slash command handlers.
- ❌ Putting business logic in the Slack layer — flags only configure `runBotQuery` input.

Cross-surface detail: [data-chatbots](../data-chatbots/SKILL.md) § Slack inline flags.

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
- ❌ Sending `blocks` **and** `initial_comment` to `completeUploadExternal` and expecting your buttons to show — `blocks` is silently dropped. Pick one.
- ❌ Stuffing a whole payload into a button `value` (2000-char cap) instead of a key you re-hydrate server-side.
- ❌ Handling only `block_actions` in `/interactions` and 400-ing or dropping `view_submission` modal saves.
- ❌ Doing slow work before `views.open`, letting the `trigger_id` expire (~3s) so the modal never opens.
- ❌ Building a blob store just to "remember the last image" when re-reading the thread + re-downloading is enough.

## Graduate when…

A change is drafted, approved with a confirm dialog, applied through the canonical
audit path, and its button rewrites in place; ambiguous targets prompt a select
menu; the bot streams progress; and it stays quiet in threads unless addressed.
