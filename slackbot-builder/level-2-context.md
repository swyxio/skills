# L2 — Context-aware (feels conversational)

**Goal:** the bot remembers the thread, uses surrounding context, works in DMs,
and feels alive while it works.

## Checklist

- [ ] **Threads as shared sessions** — key state by workspace + channel + `thread_ts`.
- [ ] **Session state** in a shared store with a TTL.
- [ ] **Causal bounded context** — root + newest replies strictly before the trigger, paginated then token-budgeted.
- [ ] **Multimodal context integrity** — file/image-only messages survive rendering; supported media is forwarded separately from text.
- [ ] **Merged state** — live Slack words + persisted operational outcomes and active domain.
- [ ] **DMs** supported (`message.im`).
- [ ] **Empty-mention nudge**.
- [ ] **Instant feedback** — 👀 reaction + `assistant.threads.setStatus` while working.

## Treat threads as sessions

```ts
const threadKey = e.thread_ts || e.ts;
const sessionKey = `thread:${teamId}:${e.channel}:${threadKey}`;
```

Store a compact mapping, with a TTL (OpenInspect uses 24h; longer only if threads
resume days later and your backend can continue the session):

```ts
type ThreadSession = { sessionId: string; targetId?: string; model?: string; createdAt: number };
await kv.put(sessionKey, JSON.stringify(session), { expirationTtl: 86400 });
```

## Include Slack context deliberately

Enrich the prompt with the channel name/topic, the root, and the newest replies
strictly before the triggering message. `conversations.replies` is oldest-first
and paginated: fetch every needed cursor page before selecting the tail. A fixed
first page gives the model stale context on long threads.

Use Slack's `latest=<trigger_ts>&inclusive=false` and enforce `ts < trigger_ts`
again locally. Keep the root, then fill the remaining token/character budget
from newest to oldest. This excludes the trigger itself and later sibling
messages that arrived while the job was starting.

Pass it to the core as a **clearly fenced note**, not as the user's request, so the
persisted request stays clean:

```ts
const note = [
  channelName && `Channel: #${channelName}${topic ? ` — ${topic}` : ""}`,
  prior.length && `Conversation so far:\n${rootPlusNewestTail(prior).join("\n")}`,
].filter(Boolean).join("\n\n");

await runBotQuery({ message: text, contextNote: note, sessionKey });
```

Fetch context best-effort with `conversations.replies` and `conversations.info`;
return `[]`/`null` on failure rather than throwing. Merge this live note with
persisted operational state (proposal outcomes, target selection, active domain)
instead of choosing one source. Persisted APPLIED/REJECTED state is
authoritative over earlier optimistic prose.

Make the session shared so a teammate can continue the thread. If a result is
actor-private, store per-message visibility + viewer identity rather than
making the whole session actor-scoped. Persist only compact routing state for
transient search turns; do not retain raw requester-scoped results.

### Preserve multimodal messages

Slack threads are not text transcripts. A renderer like
`messages.map(message => message.text).filter(Boolean)` silently deletes files
and drops image-only messages completely. Render structured message parts:

- Keep a text annotation such as `[attached image: IMG_3596.jpg]` or
  `[attached file: brief.pdf]` so a text-only planner knows media exists.
- Pass supported attachments through a separate typed field
  (`attachedImages`, `files`, or content parts) to the vision-capable planner.
  Never accept a parameter that is not forwarded at the next seam.
- Download Slack `url_private` bytes server-side with the bot token and
  `files:read`, validate `Content-Type` (for example, require `image/*`), then
  inline bytes/data URLs for the model. HTTP 200 alone is not proof: an
  unauthenticated private-file request may return an HTML login page.
- Preserve the message author and timestamp beside each media reference so
  downstream routing can distinguish human inputs from the bot's own outputs.

Test the integration seam, not only extraction helpers: construct a handler
params object with an attachment, assert the downstream workflow receives it,
and include an image-only thread message in the context test.

## Instant feedback: make it feel alive

All best-effort, in parallel, never blocking the answer.

**1. Reaction** the moment work starts; flip when done:

```ts
await slack("reactions.add", { channel: e.channel, timestamp: e.ts, name: "eyes" }, env);
// on success → remove "eyes", add "white_check_mark"; on error → "warning"
```

**2. Composer status** via [`assistant.threads.setStatus`](https://docs.slack.dev/reference/methods/assistant.threads.setStatus)
with rotating `loading_messages` (max 10). It auto-clears when you post the reply;
pass an empty status to clear manually. As of 2026-03-05 it works with `chat:write`
in channels (no `assistant:write` needed); if the workspace hasn't enabled the
Agents feature it simply no-ops — the reaction still covers you. Slack prepends the
app name, so `status: "is reading the schedule…"` renders as `Bot is reading…`.

```ts
await slack("assistant.threads.setStatus", {
  channel_id: e.channel, thread_ts: threadKey,
  status: "is reading the schedule…",
  loading_messages: ["is checking the data…", "is drafting a reply…"],
}, env);
```

## Storage keys

| Data | Key shape | TTL |
|---|---|---|
| Event dedupe | `event:${eventId}` | 1 hour |
| Thread session | `thread:${team}:${channel}:${threadTs}` | 24h or product-specific |

When a stale mapping fails, delete it and fall back to a fresh session.

## Anti-patterns

- ❌ Dumping entire channel history into the prompt.
- ❌ Flattening a multimodal thread to `message.text` and filtering empty strings.
- ❌ Treating a private Slack file URL as model-readable or accepting HTTP 200
  without checking the response media type.
- ❌ Adding `attachedImages` to a type signature without asserting that the
  downstream workflow call receives it.
- ❌ Reading only the oldest reply page or including messages at/after the trigger.
- ❌ Letting live Slack context replace authoritative persisted outcomes (or vice versa).
- ❌ Keying a shared operational thread by actor so teammates lose continuity.
- ❌ Mixing context into the user's request. Keep `contextNote` a **separate field all the way down to the prompt builder** — don't concatenate it onto `message` inside the core. Doing so pollutes the persisted request *and* any downstream intent classifier/router (see L3 "Classifier input hygiene" — a channel-topic keyword silently rerouted every prompt in prod).
- ❌ Letting a failed reaction / `setStatus` / context fetch abort the answer.
- ❌ In-memory session maps in production (lost on redeploy/scale-out).
- ❌ Treating `setStatus` as guaranteed UI — degrade gracefully.

## Graduate when…

A thread follow-up resolves against earlier turns, DMs work, the user sees 👀 +
a live status within a second of mentioning the bot, and all of it degrades
silently when a scope or feature is missing.
