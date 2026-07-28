---
name: slackbot-builder
description: >
 Build production Slack bots as a maturity ladder (L0–L6): signature verification,
 fast acks + event idempotency, causal shared-thread sessions, responsive feedback
 (reactions, status, live streaming), stateful routing, Block Kit interactions +
 human-in-the-loop approvals, the
 native Agents & AI Apps surface, file/media outputs + settings modals, durable
 long-running work, rate-limit + security hardening, model-call tracing, and
 multi-surface/multi-tenant scale. Use when building or hardening any Slack app, bot,
 agent-in-Slack workflow, or Slack Events API / Block Kit / slash-command integration.
license: MIT
metadata:
 author: swyx
 version: "2.3"
 category: "slack"
 compatibility: Slack Events API, Slack Web API, serverless or long-running workers
 tags: "slack, bot, events-api, block-kit, modals, file-uploads, image-generation, durable-execution, workflows, cloudflare-workers, hono, kv, observability, tracing, agents"
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
| **L2** | Context-aware — *feels conversational* | shared thread sessions, root + newest causally-prior tail, merged persisted state, DMs, empty-mention nudge, 👀 reaction + `assistant.threads.setStatus` | [level-2-context.md](level-2-context.md) |
| **L3** | Interactive / agentic — *acts, human in the loop* | `/interactions` (signed), state-aware approvals that resolve in place, remaining-draft bulk actions, dry-run validation, stateful routing + owned-resource resolution, rich/actionable drafts, file/media controls + settings modal, live status streaming | [level-3-interactive.md](level-3-interactive.md) |
| **L4** | Native agent surface — *first-class agent UX* | Agents & AI Apps container, `assistant_thread_started` greeting + suggested prompts, thread titles, native text streaming (`chat.startStream`/`appendStream`/`stopStream`) mapping your `emit` stream to a typed answer + tool-call timeline, graceful fallback to the message flow | [level-4-native-agent.md](level-4-native-agent.md) |
| **L5** | Hardened — *won't page you at 2am* | per-thread durable serialization, long-running signed callbacks + durable URL, App Home prefs/dashboard, rate-limit backoff + `ok:false` handling, sanitized errors, storage TTLs, service-user attribution + audit, full observability, security/testing checklists | [level-5-hardened.md](level-5-hardened.md) |
| **L6** | Multi-surface / scale — *polished platform* | one core across web/Slack/cron, multi-workspace/tenancy, queues + backpressure for heavy work, target caching, usage analytics + answer-quality feedback, break-glass/degraded config | [level-6-scale.md](level-6-scale.md) |

**Optional capability references** (load only if you ship the feature — they're not
always-on rungs): **image generation** → [image-generation.md](image-generation.md)
(durable renders, model-param gating, iterate buttons).

**Cross-cutting operational reference:** for multi-turn agents, named-resource
resolution, or external mutations, also read
[stateful-agent-workflows.md](stateful-agent-workflows.md). It covers causal
Slack pagination/cutoffs, shared thread sessions, per-thread serialization,
stateful routing, owned-resource catalogs, independently grounded writes,
remaining-draft bulk approvals, and ephemeral-result publication.

## Strong opinions

**Universal invariants — true at every level** (the level-specific opinions live in
their level files so they load only when you're there):

- Prefer the **Events API over Socket Mode** for production web services unless inbound HTTP is impossible.
- **Verify every request from the raw body before parsing.** No exceptions, including the `url_verification` handshake.
- **Return fast.** Authenticate, dedupe, background the work, log, and `200` within Slack's 3-second window.
- **Never run agent work inline.** Every serverless handler has a silent timeout ceiling (~30s on Cloudflare `waitUntil`) that *cancels* slow work with no error — the bot just goes quiet. Ack instantly, run agent loops / renders / audit turns in **durable execution**, and guarantee a final result-or-error. Fix the execution model on one surface, then **audit every entry point** (mention, DM, slash, button, cron) that calls the same core. → [L5](level-5-hardened.md)
- **Threads are the shared session boundary.** Key state by workspace + channel
  + `thread_ts`; merge live Slack context with persisted operational outcomes.
- **Context must be causal.** Read the root plus the newest replies strictly
  before the trigger; paginate before trimming to a token budget.
- **Serialize operational turns per thread.** Enqueue before loading context so
  rapid sibling mentions cannot race on stale state.
- **Never answer yourself.** Drop `bot_id` / `bot_message` and message subtypes before expensive work.
- **Real shared store for state** (idempotency, sessions, pending clarifications, prefs). In-memory maps are dev-only.
- **Slack is a status surface, not the product.** Link to a durable web/session URL for long output, logs, PRs, artifacts.
- **Keep Block Kit terse**; canonical state lives in your backend.
- **Render real tables with Block Kit, not Markdown pipes.** Slack `mrkdwn` does not render GitHub-style tables. For genuinely tabular results, use a native `table` block, keep the complete answer in top-level `text` as the accessibility/notification fallback, wrap descriptive columns, right-align metrics, and compact overly wide data to the columns people scan.
- **Disable both kinds of automatic unfurls on bot replies.** Set `unfurl_links: false` and `unfurl_media: false` on `chat.postMessage`, `chat.postEphemeral`, and response-URL payloads. `unfurl_links: false` alone does not suppress media previews such as YouTube cards.
- **Every enriching call is best-effort** — a failed reaction, status update, or context fetch must never abort the real answer.
- **Don't degrade silently.** Log every non-default path (canned/deterministic answer, model skipped, provider fallback) — a bot that silently returns the same answer to every prompt is the worst kind of bug to debug.
- **Flat JSON logs with trace ids everywhere.** Slack bots are otherwise painful to debug.

**Level-specific opinions** (full rationale + war stories in the linked file): mutations
require a human, inline flags configure the core, route on the raw request not the
context, interactive actions ack the click *instantly* + batch ops show *incremental*
progress, artifacts get iterate-button + settings-modal affordances → [L3](level-3-interactive.md);
instrument *every* model call (not just text), slow work runs in durable execution not a
background promise, every entry surface protected equally, every job ends in a guaranteed
result-or-error delivered by the right surface mechanism → [L5](level-5-hardened.md);
image-gen specifics → [image-generation.md](image-generation.md).

## How to use this skill

1. Identify your target level from the table.
2. Open the reference file for that level (and skim the one below it).
3. If the bot is multi-turn or mutates external systems, read
   [stateful-agent-workflows.md](stateful-agent-workflows.md).
4. Build the checklist for each level bottom-up; don't skip L0/L1 hardening to chase L3 features.
5. Use the "Graduate when…" gate at the end of each file before moving up.

## Implementation bias: start boring

TypeScript; a small HTTP framework (Hono, Fastify, Express, or native route
handlers); shared KV/Redis/Postgres for state; raw Slack Web API `fetch` wrappers
unless an SDK is already established; a queue or platform-native background
execution for work over 1–2s; a web page for long output. Add slash commands,
modals, Socket Mode, or workflow steps only when the product need is clear.
