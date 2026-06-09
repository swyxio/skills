# L5 — Hardened (won't page you at 2am)

**Goal:** the bot survives slow backends, Slack rate limits, malformed payloads,
stale config, and an audit. Everything degrades instead of breaking.

## Checklist

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

## Long-running work + signed callbacks

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

## Anti-patterns

- ❌ Empty/fake outage fallback you advertise but never built — use cached/break-glass config or a clear degraded response.
- ❌ Per-callsite rate-limit logic instead of one centralized wrapper.
- ❌ Processing a signed callback with the wrong shape.
- ❌ Trusting a stored preference without re-validating against the allowlist.
- ❌ Leaking raw backend/provider error text into the channel instead of a sanitized message + `trace_id`.
- ❌ Tracing only the text planner while image/audio/embedding/classifier model calls ship dark.
- ❌ Pricing image/audio tokens at text rates (or dropping `usage` because the call helper only returned the result, not the full payload).
- ❌ Putting base64 media into trace attributes.

## Graduate when…

A slow job acks instantly and completes via a signed callback; Slack `429`/`5xx`
are handled centrally; user-facing errors are sanitized with a trace id; the
security + testing checklists pass; and missing scopes degrade silently.
