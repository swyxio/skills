---
name: slackbot-builder
description: >
  Build production Slack bots with strong opinions on Events API handling,
  signature verification, 3-second acknowledgements, thread-to-session state,
  Block Kit interactions, app home preferences, routing, callbacks, logging,
  retries, and operational hardening.
license: MIT
metadata:
  author: swyx
  version: "1.0"
  category: "slack"
  compatibility: Slack Events API, Slack Web API, serverless or long-running workers
  tags: "slack, bot, events-api, block-kit, cloudflare-workers, hono, kv, observability"
---
# Slackbot Builder

Use this skill when creating or hardening Slack apps, Slack bots, agent-in-Slack workflows, or production Slack integrations.

This skill distills source-level lessons from AppSumo OpenInspect's Slack bot at
[packages/slack-bot/src](https://github.com/appsumo/openinspect/tree/main/packages/slack-bot/src),
inspected at commit `bd76f8d`. Treat those patterns as a pragmatic reference, not a dependency.

## Strong Opinions

- Prefer Slack Events API over Socket Mode for production web services unless inbound HTTP is impossible.
- Verify every Slack request from the raw body before parsing JSON or form payloads.
- Return to Slack fast. The request handler should authenticate, dedupe, enqueue/background the work, log, and return within Slack's 3-second window.
- Make Slack threads the default conversation/session boundary. Key state by `channel` plus `thread_ts`.
- Never let the bot answer itself. Drop events with `bot_id` before any expensive work.
- Store idempotency, pending clarifications, user preferences, and thread-session mappings in a real shared store. In-memory maps are dev-only.
- Route ambiguous user intent with a deterministic shortcut first, an LLM classifier second, and a Slack select menu when confidence is low.
- Design the Slack message as a status surface, not the whole product. Link to a durable web/session URL for long output, logs, PRs, and artifacts.
- Keep Block Kit terse. Slack is a command surface; the canonical state should live in your backend.
- Log flat JSON with request IDs/trace IDs everywhere. Slack bots are otherwise painful to debug.

## Recommended Architecture

Build the bot as a small HTTP service with these routes:

| Route | Purpose |
|---|---|
| `GET /health` | Verifies deploy and dependency reachability. Include lightweight counts, not secrets. |
| `POST /events` | Slack Events API endpoint for URL verification and `event_callback` handling. |
| `POST /interactions` | Block Kit actions, select menus, buttons, modal submissions. |
| `POST /callbacks/...` | Internal-only callbacks from long-running workers, agents, or control-plane services. |

OpenInspect uses Hono on Cloudflare Workers, KV for bot state, service bindings for the control plane, and Slack Web API calls via `fetch`. The pattern ports cleanly to Express/Fastify, Next.js route handlers, AWS Lambda, Fly.io, or a persistent Node service.

## Request Handling

### Verify Slack Signatures

Slack signs the exact raw request body. Do not parse or mutate the body before verification.

Required checks:

- Read `X-Slack-Signature` and `X-Slack-Request-Timestamp`.
- Reject missing headers.
- Reject timestamps outside a 5-minute replay window.
- Compute `v0:${timestamp}:${rawBody}` with HMAC-SHA256 and the Slack signing secret.
- Compare with a timing-safe comparison.

Do the same verification for `/events` and `/interactions`. Interaction payloads arrive as form data with a `payload=` field, but the signature still covers the original raw form body.

### Acknowledge Fast

The route handler should not run the agent, call a slow LLM, clone a repo, generate a report, or wait for a long Slack API sequence.

Good route handler shape:

```ts
app.post("/events", async (c) => {
  const traceId = crypto.randomUUID();
  const body = await c.req.text();
  if (!(await verifySlackSignature(c.req, body, c.env.SLACK_SIGNING_SECRET))) {
    return c.json({ error: "Invalid signature" }, 401);
  }

  const payload = JSON.parse(body);
  if (payload.type === "url_verification") {
    return c.json({ challenge: payload.challenge });
  }

  if (await alreadySeen(payload.event_id)) {
    return c.json({ ok: true });
  }

  c.executionCtx.waitUntil(handleSlackEvent(payload, c.env, traceId));
  return c.json({ ok: true });
});
```

For non-Worker platforms, replace `waitUntil` with a job queue, background task, durable workflow, or immediate handoff to a worker service.

### Dedupe Slack Retries

Slack retries when your endpoint times out or returns certain errors. Store `event_id` in shared storage with a short TTL, such as 1 hour. If the key exists, return `{ ok: true }` without doing the work again.

Do not dedupe by user text or timestamp alone. `event_id` is the right key for Events API callbacks.

## Conversation State

### Treat Threads As Sessions

Use the root Slack thread timestamp as the session identifier:

```ts
const threadKey = event.thread_ts || event.ts;
const kvKey = `thread:${channel}:${threadKey}`;
```

Store a compact mapping:

```ts
type ThreadSession = {
  sessionId: string;
  targetId: string;
  targetLabel: string;
  model?: string;
  createdAt: number;
};
```

Use a TTL for transient sessions. OpenInspect uses 24 hours for thread-session mappings. Use longer only when Slack threads are expected to resume days later and your backend can still continue the session.

### Include Slack Context Deliberately

When starting or continuing a session, enrich the prompt with:

- The current channel name.
- The channel topic or purpose when available.
- The last few thread replies.
- Whether prior messages were from users or bots.

Keep the context bounded. Ten recent thread messages is usually enough. Do not dump entire channels into prompts.

### Strip Bot Mentions

For `app_mention`, remove `<@BOTID>` from the message before routing. If no user text remains, reply with a short prompt asking for the request.

## Routing And Clarification

For bots that can act on multiple repos, tools, customers, projects, or environments, do not guess recklessly.

Routing ladder:

1. If only one target exists, use it.
2. If the channel is explicitly associated with one target, use it.
3. Try deterministic matching on names, aliases, keywords, and paths.
4. Use an LLM classifier with the bounded target list and Slack context.
5. If confidence is low or there are plausible alternatives, ask the user with a Block Kit `static_select`.

Persist pending clarification data in shared storage with a short TTL:

```ts
const pendingKey = `pending:${channel}:${threadKey}`;
await kv.put(pendingKey, JSON.stringify({
  message,
  userId,
  channelName,
  channelDescription,
  previousMessages,
}), { expirationTtl: 3600 });
```

When the user selects an option, retrieve the pending request, validate the selected target still exists, start the session, then delete the pending key.

## App Home And Preferences

Use Slack App Home for stable user preferences instead of burying settings in commands.

Good preferences for AI/agent Slack bots:

- Default model or effort level.
- Default repo/project/environment.
- Notification verbosity.
- Whether completions should broadcast to channel or stay in-thread.

Validate every selected value against a server-side allowlist before saving. If a stored preference is no longer valid, normalize it to a fallback before rendering App Home or starting work.

## Long-Running Work

Slack should show progress quickly, then receive completion later.

Recommended flow:

1. Post an acknowledgement in the target thread: `Working on project...`.
2. Create or resume a backend session.
3. Store the Slack callback context with the backend prompt: `channel`, `threadTs`, target label, model.
4. Update the acknowledgement with a `View Session` button if a durable web URL exists.
5. On completion, receive an internal signed callback.
6. Fetch the final events/output from the backend.
7. Post a concise completion message to the thread.

Never rely on Slack as the only place where the result exists. The backend should retain the canonical session transcript, events, artifacts, and errors.

### Verify Internal Callbacks

If your control plane, queue worker, or agent service calls back into the Slack bot, sign that callback too. Use an internal shared secret, validate payload shape before trusting it, and include `trace_id` headers so callback logs join the original Slack event trace.

## Message Design

### Keep Blocks Compact

Completion messages should include:

- A short final answer, truncated for Slack.
- Created artifacts such as PRs, branches, documents, dashboards, or reports.
- A compact tool/action summary when useful.
- Status footer with success/warning state, target, and model.
- A durable `View Session` button.

Set fallback `text` for every message. Slack notifications, search, mobile previews, and accessibility surfaces use it.

### Truncate On Purpose

Slack messages have practical and API limits. Pick explicit caps:

- Fallback text: around 150 characters.
- Main response block: around 2,000 characters.
- Tool summaries: top 3-5 important actions.

Prefer sentence-boundary truncation when possible and append a visible `_...truncated_` marker. Long logs belong behind the `View Session` link.

### Use Threads By Default

Default every reply to `thread_ts`. Broadcast only for intentionally public milestones. A bot that floods channels will be muted.

## Slack API Client Rules

You do not need a heavy Slack SDK for simple bots. A thin `fetch` wrapper is often easier to audit and deploy.

Minimum wrappers:

- `chat.postMessage`
- `chat.update`
- `conversations.info`
- `conversations.replies`
- `views.publish`

Each wrapper should return Slack's `{ ok, error }` shape and callers should log `slack_error` when `ok` is false. Do not assume HTTP 200 means the Slack operation succeeded.

Also handle HTTP failures around the Slack JSON body:

- Respect `429` and `Retry-After`.
- Retry transient `5xx` failures with capped exponential backoff.
- Surface permanent `ok: false` errors in logs and user-visible fallback copy when the operation was user-facing.
- Keep Slack API wrappers centralized so rate-limit behavior is fixed once, not per callsite.

## Storage Keys

Use namespaced keys with stable components:

| Data | Key shape | TTL |
|---|---|---|
| Event dedupe | `event:${eventId}` | 1 hour |
| Thread session | `thread:${channel}:${threadTs}` | 24 hours or product-specific |
| Pending clarification | `pending:${channel}:${threadTs}` | 1 hour |
| User preferences | `user_prefs:${userId}` | No TTL or product-specific |
| Dynamic target cache | `targets:cache` | 1-5 minutes |

When a stale mapping fails, delete it and fall back to creating a new session or asking for clarification.

## Observability

Emit flat structured JSON logs. Every log line should include:

- `service`
- `component`
- `level`
- `msg` or event name
- `trace_id`
- `duration_ms` for operations
- `http_status` for HTTP calls
- `outcome: success | error | rejected`
- `reject_reason` when rejecting a request
- `slack_error` for Slack API failures
- `session_id`, `message_id`, `channel`, `thread_ts` when relevant

Use severity-appropriate console methods (`warn` for rejected/soft failures, `error` for failed operations) while keeping a structured `level` field.

Guard the logger so bad data, circular objects, or unusual errors cannot crash the request. Convert `Error` objects into `error_message`, `error_type`, `error_stack`, and optional `error_code`.

## Security Checklist

- Verify Slack signatures on every Slack-facing route.
- Enforce the timestamp replay window.
- Parse only after verification.
- Deduplicate `event_id`.
- Ignore bot messages.
- Do not log bot tokens, signing secrets, callback secrets, app tokens, or raw Authorization headers.
- Validate all Block Kit action values against a server-side allowlist.
- Sign internal callbacks.
- Keep Slack bot tokens server-side only.
- Scope Slack OAuth permissions tightly to the surfaces you use.
- Treat Slack user/channel IDs as identifiers, not authorization proof. Re-check access for sensitive actions.

## Testing Checklist

Before shipping:

- Test Slack URL verification.
- Test a valid signed event and an invalid signature.
- Test a stale timestamp rejection.
- Test Slack retry dedupe with the same `event_id`.
- Test bot-message loop prevention.
- Test a fresh mention, a thread follow-up, and an ambiguous request requiring clarification.
- Test Block Kit select handling with a valid and invalid option.
- Test App Home rendering and preference persistence.
- Test completion callback signature validation.
- Test Slack API `{ ok: false, error }` handling.
- Test slow backend behavior: Slack should still receive the immediate acknowledgement.

## OpenInspect Lessons To Improve On

When borrowing from the OpenInspect Slack bot pattern, keep the good architecture but tighten these production edges:

- Wrap signed JSON/form parsing in `try/catch`. Signature verification happens first, but malformed signed payloads should still produce structured `400` logs instead of uncaught handler errors.
- Treat Slack Web API calls as two-layer failures: HTTP can fail, and HTTP 200 can still return `{ ok: false }`.
- Implement Slack rate-limit backoff centrally before the bot grows more Slack API callsites.
- If you advertise outage fallback, make it real. An empty fallback list is acceptable during early development, but production bots need cached config, static break-glass config, or a clear degraded response.
- Keep callback payload validation narrow and explicit. A signed callback with the wrong shape should not be processed.

## Implementation Bias

Start boring:

- TypeScript.
- Small HTTP framework such as Hono, Fastify, Express, or native route handlers.
- Shared KV/Redis/Postgres for bot state.
- Raw Slack Web API wrappers unless the SDK is already established in the repo.
- A job queue or platform-native background execution for work that may exceed 1-2 seconds.
- A web dashboard/session page for long outputs.

Only add slash commands, modals, Socket Mode, workflow steps, or multi-surface Slack app complexity when the product need is clear.
