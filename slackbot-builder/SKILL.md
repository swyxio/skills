---
name: slackbot-builder
description: >
 Design or harden Slack bot transport and interaction architecture: signed Events
 API ingress, fast acknowledgement, idempotency, causal thread context, Block Kit
 actions, durable agent execution, or multi-workspace operation. Use for new Slack
 bots, broad Slack architecture audits, or changes to these contracts. Do not use
 for deploying or visually testing an existing bot, editing Slack copy/layout,
 changing channel-agnostic application logic, or merely operating Slack.
license: MIT
metadata:
 author: swyx
 version: "2.8"
 category: "slack"
 compatibility: Slack Events API, Slack Web API, serverless or long-running workers
 tags: "slack, bot, events-api, block-kit, modals, file-uploads, image-generation, durable-execution, workflows, cloudflare-workers, hono, kv, observability, tracing, agents"
---
# Slackbot Builder

Use this skill when creating or hardening Slack apps, Slack bots, agent-in-Slack
workflows, or production Slack integrations.

This skill has two routing modes:

- **Lifecycle work:** use the maturity ladder for greenfield builds, broad audits,
  or upgrades that change the bot's operating level.
- **Bounded capability work:** load only the reference for the named behavior and
  any lower-level contract the change actually touches. Do not read the whole
  maturity ladder for a search bug, rendering fix, or isolated tool integration.

## The one rule that survives every level

Keep Slack as a thin adapter: verify and acknowledge requests, acquire
Slack-scoped context, call the Slack Web API, render bounded Slack UI, and
delegate application behavior to a channel-agnostic core.

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

| Specialized contract | Reference |
|---|---|
| Slack search, files, PDFs, or requester-scoped retrieval | [search-and-retrieval.md](search-and-retrieval.md) |
| Native charts/tables or hosted analytical artifacts | [analytical-visualizations.md](analytical-visualizations.md) |
| Mixed Slack evidence plus deterministic application/provider data | Read both [search-and-retrieval.md](search-and-retrieval.md) and [analytical-visualizations.md](analytical-visualizations.md) |
| Generated images and iteration controls | [image-generation.md](image-generation.md) |
| Thread persistence, ordering, resource routing, or mutations | [stateful-agent-workflows.md](stateful-agent-workflows.md) |
| Cloudflare ingress, dispatch, dedupe, or durable acceptance | [cloudflare-durable-ingress.md](cloudflare-durable-ingress.md) |

When diagnosing an existing bot, inspect its current code and tests before
choosing a level. A production bot can have an L2 retrieval defect without the
task becoming an L5 hardening project.

## Strong opinions

**Universal invariants — true at every level** (the level-specific opinions live in
their level files so they load only when needed):

- Verify every request from the raw body before parsing, including URL
  verification and interactive requests.
- Acknowledge within Slack's deadline. Authenticate, deduplicate, durably
  dispatch slow work, and guarantee a terminal answer or sanitized error.
- Ignore bot-authored events and preserve event/message idempotency.
- Treat workspace + channel + `thread_ts` as the conversation boundary. Load
  only causally prior messages, paginate before trimming, and preserve
  file/image-only context when the feature is multimodal.
- Serialize stateful or mutating turns per thread through shared storage.
- Keep application behavior and canonical state outside the Slack adapter;
  cards and reactions are presentation, not authority.
- Construct Block Kit from validated typed data. Keep top-level message text
  useful for notifications and accessibility; use native table blocks rather
  than Markdown tables.
- Disable both link and media unfurls when replies should not generate previews.
- Treat cosmetic enrichment such as reactions and status updates as best
  effort. Fail closed when identity, authorization, or required evidence cannot
  be established.
- Record structured safe telemetry for ingress, provider calls, fallbacks, and
  terminal delivery. Never silently substitute a fallback.

**Level-specific opinions** (full rationale + war stories in the linked file): mutations
require a human, inline flags configure the core, route on the raw request not the
context, interactive actions ack the click *instantly* + batch ops show a started
state and terminal summary (plus incremental progress when practical), artifacts
get iterate-button + settings-modal affordances → [L3](level-3-interactive.md);
instrument *every* model call (not just text), slow work runs in durable execution not a
background promise, every entry surface protected equally, every job ends in a guaranteed
result-or-error delivered by the right surface mechanism → [L5](level-5-hardened.md);
image-gen specifics → [image-generation.md](image-generation.md).

## Implementation bias: start boring

TypeScript; a small HTTP framework (Hono, Fastify, Express, or native route
handlers); shared KV/Redis/Postgres for state; raw Slack Web API `fetch` wrappers
unless an SDK is already established; a queue or platform-native background
execution for work over 1–2s; a web page for long output. Add slash commands,
modals, Socket Mode, or workflow steps only when the product need is clear.
