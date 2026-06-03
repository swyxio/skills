# L4 — Native agent surface (first-class agent UX)

**Goal:** graduate from a mention/DM bot to Slack's native **Agents & AI Apps**
experience — a dedicated assistant container, suggested prompts, a readable
thread title, a streamed answer, and a live tool-call timeline. This builds
directly on the agent loop + `emit` seam from L3; you're mostly re-wiring events
you already produce into native surfaces.

**Prereqs:** enable **Agents & AI Apps** in app settings, add the `assistant:write`
scope, and subscribe to `assistant_thread_started` (+ optionally
`assistant_thread_context_changed`). Everything here is **best-effort** — if the
feature/scope is missing, fall back to the L1–L3 message flow.

## Checklist

- [ ] **Enable Agents & AI Apps** + `assistant:write`; subscribe `assistant_thread_started` / `assistant_thread_context_changed`.
- [ ] **Greeting + suggested prompts** on `assistant_thread_started` (≤4, each `{title, message}`).
- [ ] **Thread titles** via `assistant.threads.setTitle` once intent is known.
- [ ] **Native text streaming** — `chat.startStream` → `chat.appendStream` → `chat.stopStream`.
- [ ] **Map your `emit` stream → chunks** (answer `markdown_text` + tool-call `task_update` timeline + final `blocks`).
- [ ] **Dynamic prompts** from live data when it makes them actionable.

## Greeting + suggested prompts

On `assistant_thread_started`, post a one-line greeting and set up to four
suggested prompts. This is the **native, tappable form of your `/help`** — reuse
the same content, but prefer prompts grounded in live state over static text.

```ts
await slack("assistant.threads.setSuggestedPrompts", {
  channel_id, thread_ts,
  title: "Try one of these",
  prompts: [
    { title: "What's open today?", message: "List open slots for today by room" },
    { title: "Any conflicts?",     message: "Which speakers are double-booked?" },
  ],
}, env);
```

Generate prompts off your own metrics when you can ("3 open slots in Track 2
today — fill one?") so the first tap already does useful work.

## Thread titles

Once you know what the thread is about, call `assistant.threads.setTitle` so the
user's DM history with your app is scannable ("Reserve slot for Anthropic talk")
instead of a list of timestamps.

## Native text streaming (the headline upgrade)

Replace the post-hoc `chat.postMessage` with a stream:
`chat.startStream` → one-or-more `chat.appendStream` → `chat.stopStream`
(just `chat:write`). Your L3 `emit` seam already produces exactly the right
events — map them to **chunks**:

| `emit` event | stream chunk |
|---|---|
| `answer_delta` | `{ type: "markdown_text", text }` |
| `tool_call` | `{ type: "task_update", id, title, status }` (live tool timeline) |
| final proposals/answer | `{ type: "blocks", blocks }` (your `buildResultBlocks`) |

```ts
const { ts } = await slack("chat.startStream",
  { channel, thread_ts, recipient_user_id: userId }, env);     // recipient_* required in channels
await runBotQuery({ message, contextNote, sessionKey }, { emit: (ev) => enqueue(toChunk(ev)) });
// flush batched chunks on a short timer: chat.appendStream({ channel, ts, chunks })
await slack("chat.stopStream", { channel, ts }, env);          // finalize; attach result blocks here
```

- `task_display_mode: timeline | plan | dense` controls how tool-call cards render.
- **Debounce `appendStream`** — `startStream` is Tier-2 (~20/min); batch deltas, never append per token.
- If streaming scopes/feature are missing, keep the L1–L3 `postMessage` path — same `emit`, different sink (the L5/L6 "one core, many surfaces" rule).

## Anti-patterns

- ❌ `appendStream` on every token → rate-limit churn (batch + debounce).
- ❌ Adopting the native surface but discarding the tool-call/answer events you already `emit`.
- ❌ Treating `assistant.*` / streaming as required — they're best-effort; degrade to plain threads when the feature/scope is absent.
- ❌ Static suggested prompts when live data would make them actionable.
- ❌ Re-implementing planning here — this level only changes the *surface*, not the core.

## Graduate when…

A new thread greets the user with tappable, live-data-aware prompts; answers
stream token-by-token with a visible tool-call timeline; threads get readable
titles; and the whole thing degrades cleanly to the L3 message flow when the
feature or scopes are missing.
