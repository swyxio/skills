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
 version: "2.5"
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
always-on rungs):

- **Slack search and retrieval** →
  [search-and-retrieval.md](search-and-retrieval.md) (query construction, file/PDF
  search, causal follow-ups, requester-scoped access, evidence-backed claims, and
  retrieval regression tests);
- **analytical visualizations** →
  [analytical-visualizations.md](analytical-visualizations.md) (L3 native charts,
  interactive tables, deterministic PNG/SVG rendering, hosted HTML, accessibility,
  limits, and live visual QA);
- **image generation** → [image-generation.md](image-generation.md) (multimodal
  thread context, sticky routing, reference selection, durable renders,
  model-param gating, iterate buttons).

**Cross-cutting operational reference:** read
[stateful-agent-workflows.md](stateful-agent-workflows.md). It covers causal
Slack pagination/cutoffs, shared thread sessions, per-thread serialization,
stateful routing, owned-resource catalogs, independently grounded writes,
remaining-draft bulk approvals, and ephemeral-result publication. Load it only
when the task changes thread/session state, named-resource routing, ordering, or
external mutations. A bounded retrieval fix may rely on existing causal context
without loading this whole reference.

**Cloudflare implementation reference:** read
[cloudflare-durable-ingress.md](cloudflare-durable-ingress.md). It gives the
concrete signed-ingress → durable-acceptance → fast-ack state machine, including
the important distinction between an event being seen and its work being
durably dispatched. Load it only when the task changes ingress, acknowledgement,
deduplication, dispatch, retries, serialization, or durable delivery. Merely
running on Cloudflare is not sufficient reason to load it.

## Route before loading references

Classify the requested change first, then load the smallest matching set:

| Task shape | Load | Do not load unless the task expands |
|---|---|---|
| New bot or broad maturity audit | Target ladder level; lower levels only to verify missing prerequisites | Unrelated optional capabilities |
| Slack search, files, PDFs, citations, or false retrieval claims | [search-and-retrieval.md](search-and-retrieval.md) | L4/L5, durable ingress, mutation workflows |
| Thread history, follow-up continuity, or shared session state | L2; add [stateful-agent-workflows.md](stateful-agent-workflows.md) only for persistence, routing, or ordering changes | L3–L6 |
| Block Kit actions, approvals, or provider writes | L3 + [stateful-agent-workflows.md](stateful-agent-workflows.md) | L4–L6 unless their behavior changes |
| Native assistant container or streaming | L4 | L5/L6 |
| Timeouts, retries, durable execution, rate limits, or security hardening | L5; add [cloudflare-durable-ingress.md](cloudflare-durable-ingress.md) only for Cloudflare ingress/dispatch changes | L6 |
| Multi-workspace, multi-surface, queues, or backpressure | L6 plus the directly affected lower-level contracts | Optional capabilities not involved |

When diagnosing an existing bot, inspect its current code and tests before
choosing a level. A production bot can have an L2 retrieval defect without the
task becoming an L5 hardening project.

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
- **Context must stay multimodal.** Preserve image/file-only messages, pass
  attachments through every seam, and let thread text select the relevant visual
  reference instead of blindly blending every image.
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
context, interactive actions ack the click *instantly* + batch ops show a started
state and terminal summary (plus incremental progress when practical), artifacts
get iterate-button + settings-modal affordances → [L3](level-3-interactive.md);
instrument *every* model call (not just text), slow work runs in durable execution not a
background promise, every entry surface protected equally, every job ends in a guaranteed
result-or-error delivered by the right surface mechanism → [L5](level-5-hardened.md);
image-gen specifics → [image-generation.md](image-generation.md).

## How to use this skill

1. Decide whether the request is lifecycle work or bounded capability work.
2. Use the routing table to open only the directly relevant references.
3. Expand to another reference only when code inspection proves that its contract
   will change; state that reason before loading it.
4. For lifecycle work, build the checklist bottom-up and use each "Graduate
   when…" gate. For bounded work, preserve existing lower-level invariants and
   validate the changed behavior end to end.

## Implementation bias: start boring

TypeScript; a small HTTP framework (Hono, Fastify, Express, or native route
handlers); shared KV/Redis/Postgres for state; raw Slack Web API `fetch` wrappers
unless an SDK is already established; a queue or platform-native background
execution for work over 1–2s; a web page for long output. Add slash commands,
modals, Socket Mode, or workflow steps only when the product need is clear.
