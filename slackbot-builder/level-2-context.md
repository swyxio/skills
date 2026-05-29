# L2 — Context-aware (feels conversational)

**Goal:** the bot remembers the thread, uses surrounding context, works in DMs,
and feels alive while it works.

## Checklist

- [ ] **Threads as sessions** — key state by `channel` + `thread_ts`.
- [ ] **Session state** in a shared store with a TTL.
- [ ] **Bounded context** — last ~10 thread replies + channel topic, fed to the core as a fenced note.
- [ ] **DMs** supported (`message.im`).
- [ ] **Empty-mention nudge**.
- [ ] **Instant feedback** — 👀 reaction + `assistant.threads.setStatus` while working.

## Treat threads as sessions

```ts
const threadKey = e.thread_ts || e.ts;
const sessionKey = `thread:${e.channel}:${threadKey}`;
```

Store a compact mapping, with a TTL (OpenInspect uses 24h; longer only if threads
resume days later and your backend can continue the session):

```ts
type ThreadSession = { sessionId: string; targetId?: string; model?: string; createdAt: number };
await kv.put(sessionKey, JSON.stringify(session), { expirationTtl: 86400 });
```

## Include Slack context deliberately

Enrich the prompt with the channel name, channel topic/purpose, and the last few
thread replies (who was a user vs bot). **Keep it bounded** — ten messages is
usually enough; never dump whole channels.

Pass it to the core as a **clearly fenced note**, not as the user's request, so the
persisted request stays clean:

```ts
const note = [
  channelName && `Channel: #${channelName}${topic ? ` — ${topic}` : ""}`,
  prior.length && `Conversation so far:\n${prior.slice(-10).join("\n")}`,
].filter(Boolean).join("\n\n");

await runBotQuery({ message: text, contextNote: note, sessionKey });
```

Fetch context best-effort with `conversations.replies` and `conversations.info`;
return `[]`/`null` on failure rather than throwing.

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
| Thread session | `thread:${channel}:${threadTs}` | 24h or product-specific |

When a stale mapping fails, delete it and fall back to a fresh session.

## Anti-patterns

- ❌ Dumping entire channel history into the prompt.
- ❌ Mixing context into the user's request (pollutes saved/persisted message).
- ❌ Letting a failed reaction / `setStatus` / context fetch abort the answer.
- ❌ In-memory session maps in production (lost on redeploy/scale-out).
- ❌ Treating `setStatus` as guaranteed UI — degrade gracefully.

## Graduate when…

A thread follow-up resolves against earlier turns, DMs work, the user sees 👀 +
a live status within a second of mentioning the bot, and all of it degrades
silently when a scope or feature is missing.
