---
name: slackbot-builder
description: >
 Build production Slack bots with strong opinions, organized as a simple-to-polished
 progression: signature verification, 3-second acknowledgements, event idempotency,
 thread-to-session state, responsive feedback (reactions + assistant.threads.setStatus +
 live streaming), Block Kit interactions that resolve in place, human-in-the-loop
 approvals with dry-run validation, routing/clarification ladders, the native Agents &
 AI Apps surface (assistant container, suggested prompts, thread titles, native text
 streaming with a tool-call timeline), App Home preferences, long-running signed
 callbacks, rate-limit hardening, structured logging, and multi-surface/multi-tenant scale.
license: MIT
metadata:
 author: swyx
 version: "2.0"
 category: "slack"
 compatibility: Slack Events API, Slack Web API, serverless or long-running workers
 tags: "slack, bot, events-api, block-kit, cloudflare-workers, hono, kv, observability, agents"
---
# Slackbot Builder

Use this skill when creating or hardening Slack apps, Slack bots, agent-in-Slack
workflows, or production Slack integrations.

This skill is organized as a **maturity ladder (L0 → L6)**. Find the level you're
targeting, build everything at and below it, then graduate. Each level has a full
reference file with prose, code, and anti-patterns — read the file for the level
you're working on; don't load all of them at once.

Patterns distill source-level lessons from AppSumo OpenInspect's Slack bot at
[packages/slack-bot/src](https://github.com/appsumo/openinspect/tree/main/packages/slack-bot/src)
(inspected at commit `bd76f8d`) plus a production aiebot scheduling assistant
(web + Slack sharing one core). Treat both as pragmatic references, not dependencies.

## The one rule that survives every level

**Slack is a thin adapter; all intelligence lives in a channel-agnostic core.**
The Slack layer only verifies signatures, calls the Slack Web API, renders Block
Kit, and delegates to a single core entrypoint (e.g. `runBotQuery(input, {emit})`).
The same core serves web, cron, and future bots. If your Slack handler contains
business logic, that's the bug.

## The ladder

| Level | Theme | What you add | Reference |
|---|---|---|---|
| **L0** | Skeleton — *it responds* | `/health`, `/events`, signature verify, `url_verification`, fast `200` | [level-0-skeleton.md](level-0-skeleton.md) |
| **L1** | Responsive Q&A (MVP) — *a working bot* | 3s ack + async work, `event_id` dedupe, ignore bots, strip mentions, threaded `chat.postMessage`, thin `fetch` wrappers, JSON logs + trace id | [level-1-mvp.md](level-1-mvp.md) |
| **L2** | Context-aware — *feels conversational* | threads-as-sessions + TTL store, bounded thread/channel context, DMs, empty-mention nudge, 👀 reaction + `assistant.threads.setStatus` | [level-2-context.md](level-2-context.md) |
| **L3** | Interactive / agentic — *acts, human in the loop* | `/interactions` (signed), Block Kit approvals that resolve in place, dry-run validation, slash commands, routing/clarification ladder, rich/actionable drafts (evidence + artifacts, bulk + edit-before-apply, deep links), live status streaming, monitored-thread "should I reply?" | [level-3-interactive.md](level-3-interactive.md) |
| **L4** | Native agent surface — *first-class agent UX* | Agents & AI Apps container, `assistant_thread_started` greeting + suggested prompts, thread titles, native text streaming (`chat.startStream`/`appendStream`/`stopStream`) mapping your `emit` stream to a typed answer + tool-call timeline, graceful fallback to the message flow | [level-4-native-agent.md](level-4-native-agent.md) |
| **L5** | Hardened — *won't page you at 2am* | long-running signed callbacks + durable URL, App Home prefs/dashboard (allowlisted), rate-limit backoff + `ok:false` handling, sanitized user-facing errors, storage TTL table, service-user attribution + audit, full observability, security/testing checklists, scope degradation, manifest setup | [level-5-hardened.md](level-5-hardened.md) |
| **L6** | Multi-surface / scale — *polished platform* | one core across web/Slack/cron, multi-workspace/tenancy, queues + backpressure for heavy work, target caching, usage analytics + answer-quality feedback, break-glass/degraded config | [level-6-scale.md](level-6-scale.md) |

## Strong opinions (apply at every level)

- Prefer the **Events API over Socket Mode** for production web services unless inbound HTTP is impossible.
- **Verify every request from the raw body before parsing.** No exceptions, including the `url_verification` handshake.
- **Return fast.** Authenticate, dedupe, background the work, log, and `200` within Slack's 3-second window.
- **Threads are the session boundary.** Key state by `channel` + `thread_ts`.
- **Never answer yourself.** Drop `bot_id` / `bot_message` and message subtypes before expensive work.
- **Real shared store for state** (idempotency, sessions, pending clarifications, prefs). In-memory maps are dev-only.
- **Slack is a status surface, not the product.** Link to a durable web/session URL for long output, logs, PRs, artifacts.
- **Keep Block Kit terse**; canonical state lives in your backend.
- **Every enriching call is best-effort** — a failed reaction, status update, or context fetch must never abort the real answer.
- **Mutations require a human.** A query never changes state; it drafts, and a human approves.
- **Slack flags configure the core; they are not a second product.** `!help` (static guide, no model), `!model <slug>` (planner tier), `!audit` (opt-in history + stronger default model + server prefetch). Parse once, strip before planning, document slugs in help. See [L3 § inline flags](level-3-interactive.md#inline-message-flags-help-model-audit).
- **Route on the raw request, never the context.** Any intent classifier / keyword router / fast-path heuristic must inspect **only** the user's actual message — never the channel topic, thread history, or session memory you prepend for grounding. Context is for grounding the model, not for deciding *how* to handle the request. (See the war story in [level-3-interactive.md](level-3-interactive.md).)
- **Don't degrade silently.** When a request takes a non-default path (canned/deterministic answer, model skipped, provider fell back), **log it**. A bot that silently returns the same answer to every prompt is the worst kind of bug to debug.
- **Flat JSON logs with trace ids everywhere.** Slack bots are otherwise painful to debug.

## How to use this skill

1. Identify your target level from the table.
2. Open the reference file for that level (and skim the one below it).
3. Build the checklist for each level bottom-up; don't skip L0/L1 hardening to chase L3 features.
4. Use the "Graduate when…" gate at the end of each file before moving up.

## Implementation bias: start boring

TypeScript; a small HTTP framework (Hono, Fastify, Express, or native route
handlers); shared KV/Redis/Postgres for state; raw Slack Web API `fetch` wrappers
unless an SDK is already established; a queue or platform-native background
execution for work over 1–2s; a web page for long output. Add slash commands,
modals, Socket Mode, or workflow steps only when the product need is clear.
