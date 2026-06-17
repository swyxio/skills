# L1 — Responsive Q&A (MVP)

**Goal:** a working bot. It answers an `@mention` in a thread, fast and exactly
once, and you can debug it from logs.

## Checklist

- [ ] **3-second ack + async work** — never run the LLM/DB/slow fetch in the request handler.
- [ ] **Dedupe** Slack retries by `event_id` (+ ignore `x-slack-retry-num`).
- [ ] **Ignore the bot's own messages** (`bot_id`, `subtype === 'bot_message'`, any `subtype`).
- [ ] **Strip mentions** (`<@BOTID>`); if empty, nudge for input.
- [ ] **Reply in a thread** via `chat.postMessage` (`thread_ts`).
- [ ] **Thin `fetch` wrappers** returning Slack's `{ ok, error }`.
- [ ] **Flat JSON logs** with a `trace_id` per request.
- [ ] All planning delegated to the **channel-agnostic core**.

## Acknowledge fast, work in the background

```ts
app.post("/events", async (c) => {
  const traceId = crypto.randomUUID();
  const body = await c.req.text();
  if (!(await verifySlackSignature(c.req, body, c.env.SLACK_SIGNING_SECRET)))
    return c.json({ error: "invalid signature" }, 401);

  const payload = JSON.parse(body);
  if (payload.type === "url_verification") return c.json({ challenge: payload.challenge });

  if (c.req.header("x-slack-retry-num")) return c.json({ ok: true });   // Slack retry
  if (!(await recordEventOnce(payload.event_id))) return c.json({ ok: true }); // dedupe

  const e = payload.event;
  const isBot = e?.bot_id || e?.subtype === "bot_message";
  if (!e || isBot) return c.json({ ok: true });

  c.executionCtx.waitUntil(handleEvent(e, c.env, traceId));  // queue/background on other platforms
  return c.json({ ok: true });
});
```

On non-Worker platforms, replace `waitUntil` with a job queue, durable workflow,
or immediate handoff to a worker.

> ⚠️ `waitUntil` is fine for a **quick** reply (a sub-~20s model call), but it is
> itself **silently cancelled** at a platform ceiling (~30s on Cloudflare). Agent
> loops, audit runs, and media renders exceed it and die mid-flight with no error —
> they graduate to **durable execution** at [L5](level-5-hardened.md).

## Dedupe Slack retries

Slack retries on timeout/error. Store `event_id` with a short TTL (~1h); skip if
present. **Fail open** — if the store is down, process anyway (the retry-num check
still covers the common case). Never dedupe by user text or timestamp.

```ts
async function recordEventOnce(eventId?: string): Promise<boolean> {
  if (!eventId) return true;
  try {
    const res = await kv.put(`event:${eventId}`, "1", { expirationTtl: 3600, mode: "if-absent" });
    return res.created;                       // false ⇒ duplicate
  } catch { return true; }                    // fail open
}
```

## Strip mentions; nudge on empty

```ts
const text = String(e.text ?? "").replace(/<@[^>]+>/g, " ").trim();
if (!text) {
  await postMessage({ channel: e.channel, thread_ts: e.thread_ts ?? e.ts,
    text: ":wave: Ask me something — e.g. \"what's on the schedule today?\"" });
  return;
}
```

## Reply in a thread

Default every reply to a thread; a top-level mention starts one (`thread_ts = ts`).
Always set fallback `text` (notifications, search, mobile, accessibility use it).

```ts
await postMessage({ channel: e.channel, thread_ts: e.thread_ts ?? e.ts, text: answer });
```

## Thin Slack client

You don't need a heavy SDK. Wrap `fetch`, return Slack's `{ ok, error }`, and log
`slack_error` when `ok` is false — **HTTP 200 does not mean the op succeeded.**

```ts
async function slack(method: string, body: object, env): Promise<{ ok: boolean; error?: string }> {
  const r = await fetch(`https://slack.com/api/${method}`, {
    method: "POST",
    headers: { authorization: `Bearer ${env.SLACK_BOT_TOKEN}`, "content-type": "application/json; charset=utf-8" },
    body: JSON.stringify(body),
  });
  const json = await r.json().catch(() => ({ ok: false, error: "bad_json" }));
  if (!json.ok) log.warn("slack_error", { method, error: json.error, http: r.status });
  return json;
}
```
(Centralized backoff/retry comes at L5 — keep one wrapper so you fix it once.)

## Baseline observability

One flat JSON line per step: `service`, `component`, `level`, event/`msg`,
`trace_id`, `outcome: success|error|rejected`, `duration_ms`. Guard the logger so
bad/circular data can't crash the request; convert `Error` to
`error_message`/`error_type`/`error_stack`.

## Anti-patterns

- ❌ Running the agent/LLM in the request handler → Slack retries → duplicate answers.
- ❌ No dedupe → double answers on every Slack retry.
- ❌ Forgetting bot-message filtering → infinite self-reply loops.
- ❌ Replying top-level instead of in-thread → channel noise → muted bot.
- ❌ Assuming HTTP 200 == Slack success.
- ❌ Business logic in the handler instead of the shared core.

## Graduate when…

A fresh mention gets a threaded answer in <3s of ack, the same `event_id`
delivered twice answers once, the bot never replies to itself, and every request
has a greppable `trace_id` log line.
