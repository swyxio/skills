# Skill routing and handoffs

This reference prevents `live-ai-pipelines` from duplicating the existing AI, runtime, operations, and domain skills in `/Users/swyx/Work/skills`.

## Contents

- [Ownership rule](#ownership-rule)
- [Routing matrix](#routing-matrix)
- [Recommended compositions](#recommended-compositions)
- [Control-plane rule](#control-plane-rule)
- [Selection sequence](#selection-sequence)

## Ownership rule

Use `live-ai-pipelines` when the central problem is a long-running AI workflow that must produce inspectable structured work while it runs: resumable stages, per-item completion, partial projections, provenance, and atomic final artifacts.

Add a companion skill when another concern is primary. The companion owns its specialized contract; `live-ai-pipelines` owns the seam between that concern and the run: stable IDs, input/output hashes, stage events, complete-artifact boundaries, retries, and publication state.

Do not make two skills define competing job state machines. Pick one control-plane owner and map the other system into it.

## Routing matrix

| Primary concern | Add this skill | Companion owns | `live-ai-pipelines` owns |
| --- | --- | --- | --- |
| Current OpenAI API or Structured Outputs behavior | [`openai-docs`](../../openai-docs/SKILL.md) | Current product/API guidance and supported request shapes | Provider-neutral adapter boundary, validation, events, and recovery |
| Cloudflare `agents` package, Agent routing, synchronized state, or resumable streams | [`agents-sdk`](../../agents-sdk/SKILL.md) | Agent classes, RPC, connections, persisted Agent state, and SDK-specific workflows | Run schema, item identity, artifact publication, and progress projection |
| Cloudflare production architecture or primitive selection | [`cloudflare-production-builder`](../../cloudflare-production-builder/SKILL.md) | Workflows, Queues, Durable Objects, R2, rollout, rollback, and live verification | Logical stages, data contracts, event semantics, and resumable application state |
| Per-key coordination, serialization, alarms, or WebSockets | [`durable-objects`](../../durable-objects/SKILL.md) | Durable Object boundaries and consistency model | What coordinated work means in the run and how it becomes an event/artifact |
| Isolated code execution or preview sessions | [`sandbox-sdk`](../../sandbox-sdk/SKILL.md) | Cloudflare Sandbox lifecycle, isolation, processes, files, and sessions | Job/item lifecycle around sandbox work and durable result capture |
| Telemetry, instrumentation, dashboards, or alerts | [`observability-hardening`](../../observability-hardening/SKILL.md) | Named operator questions, signal budget, redaction, retention, and actionable monitoring | Minimum run telemetry needed for progress, timing, retries, and auditability |
| A command-line interface for starting, inspecting, or resuming runs | [`cli-ux`](../../cli-ux/SKILL.md) | Flags, help, noninteractive mode, NDJSON/stdout, stderr, exit codes, and cancellation UX | Backend run/event/artifact semantics exposed by the CLI |
| Recursive summarization of a very large text corpus | [`summarize-anything`](../../summarize-anything/SKILL.md) | Map/reduce strategy, chunking, backend choice, and summary quality | Durable fan-out/fan-in orchestration, provenance, partial results, and live status |
| Alias/duplicate/entity resolution | [`smart-entity-resolution`](../../smart-entity-resolution/SKILL.md) | Candidate search, matching, merge/reject decisions, and entity-resolution quality | Stage boundaries, evidence persistence, retry/resume, and downstream projections |
| User-facing proposals, approval, or state-changing copilot actions | [`data-chatbots`](../../data-chatbots/SKILL.md) | Draft/apply workflow, version checks, approval, immutable change history, and copilot UX | Background extraction/analysis run and the artifacts supplied to the copilot |
| Test-suite architecture, concurrency, restart, or nondeterminism | [`test-strategy-hardening`](../../test-strategy-hardening/SKILL.md) | Test boundary selection, suite health, determinism, and regression strategy | Pipeline-specific failure modes and the contracts tests must exercise |
| Deployment gates, rollback, or post-deploy verification | [`release-readiness-hardening`](../../release-readiness-hardening/SKILL.md) | Release checklist, production-shaped smoke, rollback, and verification evidence | Local or application-level run correctness before/within release checks |
| Permissions, APIs, admin operations, or broad productization | [`productionize-app-with-services`](../../productionize-app-with-services/SKILL.md) | Product surface, auth, service boundaries, admin UX, and operational readiness | Long-running job semantics and the state exposed to those surfaces |
| Repository documentation after implementation | [`ai-readme`](../../ai-readme/SKILL.md) or [`ai-devblog`](../../ai-devblog/SKILL.md) | README quality or technical narrative | Source-of-truth pipeline behavior to document |

## Recommended compositions

Use only the combinations the task needs:

- **Generic local extraction:** `live-ai-pipelines` plus `summarize-anything` for recursive text reduction and/or `smart-entity-resolution` for canonical entities.
- **OpenAI-backed implementation:** `live-ai-pipelines` plus `openai-docs`; keep provider details inside the adapter and record requested versus actual model behavior.
- **Cloudflare long-running service:** `live-ai-pipelines` plus `cloudflare-production-builder`; add `agents-sdk` when the implementation uses the Cloudflare `agents` package, and add `durable-objects` only when a natural coordination key requires it.
- **Cloudflare fan-out:** let one Workflow or equivalent control plane own the job lifecycle; use Queues for independent work items and map item completion back into the run event journal.
- **Interactive research or knowledge tool:** `live-ai-pipelines` plus `data-chatbots` when a user reviews/applies model proposals; add `observability-hardening` when the telemetry itself needs a named audit.
- **Operator-facing tool:** add `cli-ux` for the CLI and `observability-hardening` for operational monitoring; neither should invent a second progress model.

For a story, document, or knowledge-graph pipeline, the usual order is: deterministic ingestion and locators; `summarize-anything`-style reduction if needed; live extraction and evidence artifacts; `smart-entity-resolution`; global synthesis; renderer; then `ai-readme` for usage documentation. The domain skill should define what a useful page or claim means; this skill defines how work remains observable and recoverable.

## Control-plane rule

On Cloudflare, the preferred mapping for a single observable long-running job is:

```text
Workflow or application runner  -> run/stage lifecycle and checkpoints
Queue workers                   -> independent fan-out items
Durable Object                  -> natural-key coordination or live connections
R2/filesystem                   -> immutable artifacts and snapshots
live-ai-pipelines               -> IDs, schemas, event envelope, previews, and publication contract
```

Do not let both a Workflow and an application-level event loop decide whether a run is complete. Define one terminal transition, make item writes idempotent, and derive counters from durable results where possible. `waitUntil` is suitable for short best-effort work, not for durable checkpoints or resumable multi-minute jobs.

For a local process, the same contract can be implemented with a run directory, atomic files, JSONL events, and SSE/polling; a database or hosted queue is optional rather than implied by the skill.

## Selection sequence

When several skills appear relevant:

1. Start with `live-ai-pipelines` if the work must keep running, expose partial structured results, or resume after interruption.
2. Add the provider/runtime skill (`openai-docs`, `agents-sdk`, `cloudflare-production-builder`, `durable-objects`, or `sandbox-sdk`) only for the actual platform boundary in scope.
3. Add the domain skill (`summarize-anything`, `smart-entity-resolution`, or `data-chatbots`) for the substantive transformation or approval semantics.
4. Add `cli-ux`, `observability-hardening`, or `test-strategy-hardening` when that surface is independently a deliverable.
5. Add `release-readiness-hardening` only when deployment/release verification is part of the request.

Load only the relevant companion references. Keep the final implementation's ownership visible in code: provider adapter, run store, event journal, renderer, and operational surface should not each maintain their own incompatible status vocabulary.
