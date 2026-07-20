# L5 — Hardened (won't page you at 2am)

**Goal:** the bot survives slow backends, Slack rate limits, malformed payloads,
stale config, and an audit. Everything degrades instead of breaking.

## Checklist

- [ ] **Never run agent work inline** — the fast handler acks; slow work runs in **durable execution** (Workflow/Durable Object/queue), not a request-scoped promise (`waitUntil`) that's silently cancelled at the platform ceiling. (Image capability: [image-generation.md](image-generation.md).)
- [ ] **Every entry surface protected** — after fixing the execution model on one surface, audit *every* call site of the core (mention, DM, slash, button, modal, cron, inbound email). The **inbound-email surface** has the same ~30s handler ceiling (ack with `message.reply()`, run the agent loop in a Workflow) plus its own gating + deliverability traps — see [data-chatbots/email-surface.md](../data-chatbots/email-surface.md).
- [ ] **Guaranteed result-or-error** — every offloaded job posts a final message in a `finally`/error branch; the ack indicator never hangs forever.
- [ ] **Delivery branches by surface** — the completion step posts via the right mechanism (thread reply vs `response_url` vs SSE vs email).
- [ ] **Long-running work** → ack now, **signed internal callback** later, durable session URL.
- [ ] **App Home preferences** with server-side allowlist validation.
- [ ] **Slack API hardening** — `429`/`Retry-After`, `5xx` backoff, `ok:false` handling, centralized.
- [ ] **Storage keys** namespaced with explicit TTLs.
- [ ] **Service-user attribution** + audit trail for bot-initiated changes.
- [ ] **Full observability** fields.
- [ ] **Sanitized user-facing errors** — never echo raw backend/provider error text.
- [ ] **Scope degradation** — least privilege, graceful when missing.
- [ ] **Manifest-based setup**; secrets applied at deploy time.
- [ ] **Security + testing checklists** pass.

## Never run agent work inline (the silent timeout ceiling)

Every serverless handler has a **hard time limit that silently kills your work**.
When the ceiling is hit your callback is *cancelled* — no error thrown, no `catch`,
no cleanup. The user stares at a 👀 / "is thinking…" forever and never gets a
result *or* an error. This is the single worst Slack-agent failure mode, and it's
invisible in logs (no row is even written).

| Platform | Background mechanism | Typical ceiling |
|---|---|---|
| Cloudflare Pages / Workers | `waitUntil()` (request-scoped promise) | **~30s, silently cancelled** |
| Cloudflare Workers (paid) | CPU time | 30s CPU (wall-clock can be longer) |
| AWS Lambda behind API Gateway | synchronous invoke | 29s (API GW) — Lambda itself 15min |
| Vercel Functions | function duration | 10s hobby / 60s pro / 300s enterprise |

`waitUntil` (the L1 ack pattern) is fine for a **quick** reply — a sub-~20s model
call, or to *fire* a signed callback. It is **not** where agent loops, multi-turn
audit runs, or 30–90s media renders belong. Those exceed the budget and die
mid-flight. The fix is always the same three moves:

1. **Ack instantly** (return `200` within Slack's 3s; drop a 👀 / status).
2. **Offload slow work** to **durable execution** — Cloudflare Workflow / Durable
   Object / Queue; AWS Step Functions / SQS+Lambda; Vercel via Inngest/Trigger.dev
   or a long-running service. You get retries, a real timeout, and a *visible*
   failure path.
3. **Deliver asynchronously** via the Slack Web API (post / `response_url` /
   callback) — see *Deliver by surface* below.

```ts
// ❌ Silent death ~30s in — no catch runs, no log, 👀 hangs forever
ctx.waitUntil((async () => {
  const result = await runBotQuery(query);   // 45s+ for a compound/audit turn
  await postResult(result);                  // never reached
})());

// ✅ Durable: retries, real timeout, guaranteed error visibility
await triggerWorkflow(env, { query, channel, threadTs, responseUrl, traceId });
return ack200();
```

> **Audit prompt:** grep every deferred-execution call site —
> `rg "waitUntil|executionCtx|ctx\.waitUntil|schedule\(" --type ts` — and for each
> ask: *"if this takes 60s, does the user ever find out it failed?"* If no, it
> moves to durable execution.

The image-generation capability has the full Workflow pattern + war story →
[image-generation.md](image-generation.md).

## Fix one surface, audit all of them

The same core (`runBotQuery`, `generateImage`, `applyDraft`) is reachable from
**many entry points**, each with its own handler and ack mechanism:

- `@mention` in channels/threads
- DMs / assistant threads
- `/slash` commands (different handler, different ack)
- Button clicks + modal submissions (`/interactions`)
- Scheduled / cron triggers
- Inbound email, web API

When you fix a timeout (or any execution-model) bug on one surface, the *identical*
bug usually still lives on the others that call the same slow function. After every
such fix, grep the call sites and verify each is offloaded + delivers a guaranteed
result-or-error:

```bash
rg "runBotQuery|generateImage|applyDraft" --type ts -l
```

> **War story.** A scheduling bot moved its **@mention** path to a durable Workflow
> after silent ~30s deaths — but the **slash command** and the **"Approve all"
> button** still ran the same planner inline in `waitUntil`. They kept dying
> silently for weeks because the fix was scoped to one handler instead of the core.

## Three-phase guarantee: ack → progress → result-or-error

Every user-initiated action must hit all three phases. Phase 3 is the one teams
skip — and it's the one that turns a transient backend hiccup into a bot that
"just goes quiet".

| Phase | When | Slack mechanism |
|---|---|---|
| **1. Instant ack** | <1s | 👀 reaction + `assistant.threads.setStatus`; slash → ephemeral body; button → ephemeral via `response_url` |
| **2. Live progress** | every 3–10s for >5s work | `setStatus("is searching speakers…")`; slash → `response_url` + `replace_original`; button (bulk) → rewrite message in place |
| **3. Guaranteed result _or_ visible error** | always | final message — never a hung indicator |

Phase 3 must be **unconditional**. In a durable workflow, put delivery and error
reporting in steps that always run, even after retries are exhausted:

```ts
try {
  const result = await step.do("plan", { retries: { limit: 1 }, timeout: "5 minutes" },
    () => runBotQuery(query));
  await step.do("deliver", () => deliver(params, result));      // by surface, below
} catch (err) {
  // ALWAYS runs — the user gets an error, not silence
  await step.do("report-error", () => deliverError(params, `:warning: Couldn't finish that. (ref ${traceId})`));
}
```

On a request-scoped runner (no workflow), the equivalent is a `finally` that
resolves the ack surface to ✅ / ❌ / a reply — **the 👀 must never stay stuck.**

## Deliver by surface

A single core/workflow serves multiple surfaces, so the **delivery step must branch**
— a slash command has no thread to reply into and no message to react to; a button
came from `response_url`; a web request wants the SSE stream.

```ts
async function deliver(params: DeliveryCtx, result: Result) {
  if (params.responseUrl) {                               // slash command / button
    await postToResponseUrl(params.responseUrl, { response_type: "in_channel", text: result.text, blocks: result.blocks });
  } else if (params.channel) {                            // mention / DM
    await slack("chat.postMessage", { channel: params.channel, thread_ts: params.threadTs, text: result.text, blocks: result.blocks }, env);
  } else if (params.sse) {
    params.sse.send(result);                              // web chat
  }
}
```

Apply the same branching to **error reporting** and **reaction/status cleanup** —
don't call `reactions.remove`/`setStatus` for a slash command that never had a 👀.

## Long-running work + signed callbacks

When the durable backend is a *separate* service (not an inline workflow step):

1. Post an ack in the thread: `Working on …`.
2. Create/resume a backend session; store the Slack callback context (`channel`,
   `threadTs`, target, model) with the backend prompt.
3. Update the ack with a **View Session** button if a durable URL exists.
4. On completion, the backend calls an internal endpoint — **sign it** (internal
   shared secret), validate the payload shape before trusting it, propagate
   `trace_id` so callback logs join the original event trace.
5. Fetch final output from the backend; post a concise completion to the thread.

Never make Slack the only place the result exists — the backend retains the
canonical transcript, artifacts, and errors.

## App Home preferences

Use App Home for stable prefs instead of burying them in commands: default
model/effort, default target, notification verbosity, in-thread vs broadcast.
**Validate every selected value against a server-side allowlist** before saving;
normalize stale prefs to a fallback before rendering or acting. App Home is also
a natural **dashboard** — current state, recent bot-applied changes, quick links
into the durable web surface.

## Slack API hardening

Treat Slack calls as **two-layer** failures: HTTP can fail, and HTTP 200 can still
return `{ ok: false }`. Centralize so this is fixed once:

- Respect `429` + `Retry-After`.
- Retry transient `5xx` with capped exponential backoff.
- Surface permanent `ok:false` in logs and user-facing fallback copy.
- Wrap signed JSON/form parsing in `try/catch` → structured `400`, not an uncaught throw.

Minimum wrappers: `chat.postMessage`, `chat.update`, `chat.startStream`/`appendStream`/`stopStream`,
`conversations.info`, `conversations.replies`, `views.publish`, `views.open`,
`reactions.add/remove`, `assistant.threads.setStatus`/`setTitle`/`setSuggestedPrompts`.

## Sanitized user-facing errors

Log the full error (with `trace_id`); post a **sanitized** line to the channel —
never raw provider/backend text (e.g. `OpenAI API 500: {...stack...}`). Surface a
short message plus the `trace_id` so support can grep the rest. Internal error
detail in a channel is both noise and a small leak.

## Storage keys

| Data | Key shape | TTL |
|---|---|---|
| Event dedupe | `event:${eventId}` | 1 hour (purge/expire — don't grow forever) |
| Thread session | `thread:${channel}:${threadTs}` | 24h or product-specific |
| Pending clarification | `pending:${channel}:${threadTs}` | 1 hour |
| User preferences | `user_prefs:${userId}` | none / product-specific |
| Dynamic target cache | `targets:cache` | 1–5 minutes |

## Service-user attribution

Bot-initiated changes should be traceable — attribute them to a dedicated,
auto-provisioned service user (e.g. `bot@yourco.com`) so the audit log shows
who/what, through the same audit path as every other surface.

## Observability (full)

Every line: `service`, `component`, `level`, event/`msg`, `trace_id`,
`duration_ms`, `http_status`, `outcome: success|error|rejected`, `reject_reason`,
`slack_error`, plus `session_id`/`message_id`/`channel`/`thread_ts` when relevant.
`warn` for rejected/soft failures, `error` for failed operations. Guard the logger
against circular/bad data; convert `Error` → `error_message`/`error_type`/`error_stack`/`error_code`.
**Log every non-default path** (deterministic/canned answer, model skipped,
provider fallback) so silent degradation is greppable, not a mystery.

### Instrument *every* model call, not just the text one

If you ship LLM tracing (OpenInference/Arize, Langfuse, OTel spans), the text
planner is the obvious one to wire — and the easy one to **forget everywhere
else**: image generation, audio/TTS, embeddings, a re-rank, the "should I reply?"
classifier. Each is a billable model call your dashboards should see.

> **War story.** A bot had clean Arize spans on its text planner, then grew an
> image-generation feature — which shipped with **zero** telemetry. It only
> surfaced when someone asked "why don't image calls show up in Arize?" Fix +
> rules that prevent the next gap:
>
> - **Trace at the core function** (`generateImage`, `embed`, `transcribe`), not at
>   each Slack/web call site — then every adapter path (mention, button, slash,
>   cron) inherits the span for free. Wrap the provider call in `try/catch/finally`
>   so you `recordError` on failure and `flush` always.
> - **Capture usage tokens.** Return the *full* provider payload from your call
>   helper, not just the bytes/text you render — usage lives alongside `data`, and
>   you'll drop it if the helper's return type only exposes the result.
> - **Per-modality cost.** Image/audio tokens bill far above text rates (e.g. GPT
>   Image: ~$8 in / $30 out per 1M vs text's $2/$8). A single price table keyed on
>   *model* keeps `llm.cost.usd` honest.
> - **Never put binary in span attributes.** No base64 image/audio in `input`/
>   `output` — summarize (`"2 images · 1024x1536 · gpt-image-2"`) and let the
>   redactor strip any stray `data:` URLs.
> - **Reuse the request `trace_id`** so the media span correlates with the rest of
>   the turn. **Zero-overhead when disabled** (return a no-op tracer unless the
>   tracing env is fully set).

## Scopes: least privilege, graceful degradation

| Capability | Scope(s) |
|---|---|
| Post / update / threads / streaming | `chat:write` |
| Reactions | `reactions:write` |
| Thread context | `*:history` (`channels`/`groups`/`im`/`mpim`) |
| Channel topic | `channels:read` / `groups:read` |
| Composer status | `chat:write` (+ enable Agents & AI Apps) |
| Suggested prompts / thread titles (L4) | `assistant:write` (+ enable Agents & AI Apps) |
| Modals (edit-before-apply, settings) | interactivity enabled (no extra scope) |
| File / media uploads + reading attachments | `files:write` + `files:read` |
| App Home | `views.publish` (App Home tab enabled) |
| Mentions / DMs / monitored threads | `app_mentions:read`, `message.im`, `message.channels`/`groups`/`mpim` |

Missing scope ⇒ less context / fewer acks / message fallback, not a crash.

## Setup

Define the app from a **manifest** (scopes + event subscriptions + interactivity
URL + slash command) for reproducible setup. On serverless platforms, **secrets
apply at deploy time** — set signing secret / bot token, then redeploy; verify with
a signed `url_verification` request.

## Security checklist

- [ ] Verify signatures on every Slack-facing route; enforce the replay window; parse only after.
- [ ] Dedupe `event_id`; ignore bot messages.
- [ ] Never log tokens, signing/callback secrets, or raw Authorization headers.
- [ ] Never echo raw internal/provider error text to a channel — sanitize + include `trace_id`.
- [ ] Validate all Block Kit action / view-submission values against a server-side allowlist.
- [ ] Sign internal callbacks; validate shape before processing.
- [ ] Keep bot tokens server-side only; scope OAuth tightly.
- [ ] Treat Slack user/channel IDs as identifiers, not authorization — re-check access for sensitive actions.

## Testing checklist

- [ ] URL verification; valid signed event; invalid signature; stale timestamp.
- [ ] Retry dedupe with the same `event_id`; bot-message loop prevention.
- [ ] Fresh mention; thread follow-up; ambiguous request → clarification.
- [ ] Block Kit select + modal submission with valid and invalid option.
- [ ] App Home render + preference persistence.
- [ ] Completion callback signature validation.
- [ ] Slack `{ ok:false, error }` handling; `429` backoff.
- [ ] Native streaming start/append/stop; fallback when the Agents feature is disabled.
- [ ] File upload (single + multi-file in one message); buttons render via `blocks` (no `initial_comment`).
- [ ] Modal open within the `trigger_id` window; `view_submission` closes + persists; bad option rejected.
- [ ] Every model call (text + image/audio/embeddings/classifier) emits a trace span with usage + cost.
- [ ] Slow backend: Slack still gets the immediate ack.
- [ ] Slow job (>30s) completes via durable execution, not a cancelled `waitUntil`; on failure the message shows ⚠️ + trace id, never a stuck 👀.
- [ ] **Every** entry surface (mention, DM, slash, button, cron) routes slow work to durable execution — none left running the core inline.
- [ ] A job that throws *after* retries still posts a visible error to the correct surface (thread vs `response_url`); nothing hangs on 👀.
- [ ] Same workflow invoked from a slash command delivers via `response_url`; from a mention, via a thread reply — no path assumes a thread that isn't there.

## Anti-patterns

- ❌ Empty/fake outage fallback you advertise but never built — use cached/break-glass config or a clear degraded response.
- ❌ Per-callsite rate-limit logic instead of one centralized wrapper.
- ❌ Processing a signed callback with the wrong shape.
- ❌ Trusting a stored preference without re-validating against the allowlist.
- ❌ Leaking raw backend/provider error text into the channel instead of a sanitized message + `trace_id`.
- ❌ Tracing only the text planner while image/audio/embedding/classifier model calls ship dark.
- ❌ Pricing image/audio tokens at text rates (or dropping `usage` because the call helper only returned the result, not the full payload).
- ❌ Putting base64 media into trace attributes.
- ❌ Running slow work (a 30–90s render) inside `waitUntil` / a request-scoped promise — it's cancelled mid-flight and the bot goes silent after the ack.
- ❌ Fixing the timeout on one surface (@mention) while a sibling surface (slash command, button) still runs the same core inline.
- ❌ A durable job whose only failure path is a log line — the user's 👀 / "working…" hangs forever with no result and no error.
- ❌ A single delivery path that assumes a thread to reply into (slash commands have none) or reacts to a message that doesn't exist.

## Graduate when…

A slow job acks instantly and completes via durable execution (no surface still
runs the core inline); every job ends in a guaranteed result *or* a visible error,
delivered by the right surface mechanism; Slack `429`/`5xx` are handled centrally;
user-facing errors are sanitized with a trace id; the security + testing checklists
pass; and missing scopes degrade silently.
