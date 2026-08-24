# Foundational UX And Failure Lessons

Read this reference only when a task needs the older maturity rationale,
failure-mode inventory, duplicate/idempotency details, exploit-aware rendering,
timing estimates, lifecycle telemetry, or historical implementation heuristics.

The current SKILL.md maturity profile, user request, and explicit risk gates
always control. Historical minimum bars, blanket workflow inventories,
mandatory cancellation, stage histories, telemetry, and broad test matrices
below are preserved as optional guidance, not automatic acceptance criteria.
Do not escalate a simple L1/L2 fix because this archive mentions L3-L5 work.

## Long Running Operation UX

Use this skill to make slow asynchronous work feel alive, observable, cancellable, and recoverable. The goal is not fake precision; it is honest progress: what is happening, how long it has taken, the rough expected range, when it is unusually slow, whether the user can stop it, and what logs can explain it later.

Effect.ts is recommended, not required, for the backend orchestration layer when a slow operation has enough branching to justify it: explicit timeouts, cancellation/interruption, retries with backoff, tool loops, provider queues, fallback models, state persistence, or stage telemetry. Do not use Effect just to render a progress component or replace ordinary React state.

### AI UX Levels

Use this shorthand to classify the current and target experience for any AI workflow. The practical rubric is `Wait, Trace, Graph, Console`.

#### L0: Blind Button

The user clicks, the UI freezes or disables controls, and there is no useful status. This is acceptable only for sub-1s toy actions. For real AI work, treat L0 as a bug.

#### L1: Busy State

The UI shows `Loading`, a spinner, or a disabled submit state, but no estimate, cancel action, or latest stage. This is acceptable for short deterministic calls under roughly 3s.

#### L2: Honest Wait

The UI shows elapsed time, rough estimate, latest human-readable status, and cancel. It prevents duplicate submits while keeping unrelated browsing and navigation usable. It handles rage clicks with idempotency keys, duplicate-action suppression, and a clear `already running` state.

#### L3: Stage Trace

The UI shows the latest stage inline plus expandable history with elapsed timestamps. Stages are real provider/tool/workflow events such as provider connected, search started, first token, retry, timeout, fallback, and save complete. This is the default target for long LLM calls, autofill, regenerate, image/video generation, imports, and exports.

#### L4: Agent Graph

The UI shows parent/child structure for tool loops, bounded fanout, branch work, and subagents. Branches have `parentId`, lane/color, queued/running/done state, retry/timeout/cancel status, and deterministic merge behavior. This is the default target for search, entity resolution, multi-source research, multi-agent work, and queued media workflows. L4 is not "spawn everything"; it is controlled parallelism with visible scheduling pressure and a clear concurrency cap.

#### L5: Operator Console

Power users and developers can inspect sanitized request params, prompt snapshots where safe, provider events, retries, timings, coverage, raw-ish JSON, and copyable traces. Prompt-bearing data should be local/client-scoped by default. Server and global telemetry remain structural only.

#### Minimum Bar

- Short calls should reach L2 unless they are truly sub-3s and deterministic.
- Long LLM/media calls should reach L3.
- Tool loops, search, fanout, and agentic workflows should reach L4.
- Developer/debug views can expose L5.

#### Non-Negotiables

- No silent waiting: any disabled input or submit must have visible status nearby.
- Cancel exists: foreground long tasks need cancel, cleanup, and non-error cancellation logs.
- No fake progress: use real provider/tool/stage events; heartbeats only fill quiet gaps.
- Rage-click safe: use idempotency keys, duplicate suppression, and no double charges, jobs, messages, or writes.
- Bad-network safe: use timeout, retry with backoff, reconnect/resume where possible, and clear stale state.
- Secure logs: never send secrets, raw prompts, replies, attachments, memory, or private user content to shared telemetry unless explicitly intended.
- Exploit-aware rendering: escape streamed/model/tool output, avoid HTML injection, validate URLs, block SSRF-shaped fetches, and preserve authorization per operation.
- Coverage-aware completion: for multi-entity or multi-output tasks, report expected vs resolved units, not just `200 OK`.
- Bounded fanout: subagents/branches must run with an explicit concurrency cap, queue visibility, cancellation propagation, and provider/site rate-limit awareness.
- Deterministic fanout: branches use local scratch state; the parent merges serially by a stable rule.
- Visible failure modes: retries, timeouts, partial results, cancelled branches, and fallback paths are stage-visible.

### Workflow

1. Inventory every slow operation before editing. Search for `fetch`, mutation hooks, `disabled`, `busy`, `loading`, `pending`, `stream`, `regenerate`, `generate`, `submit`, `timeout`, `maxDuration`, and provider SDK calls. Include background work such as preloads, auto-regeneration, memory compaction, and post-submit maintenance.
2. Classify each operation's current and target AI UX level. Use L2 as the minimum for visible long tasks, L3 for long model/provider calls, L4 for agentic fanout/tool loops, and L5 only for developer/operator surfaces.
3. Define a shared operation profile registry. Each operation kind needs a human label, `estimateMs`, `stalledMs`, and 3-5 phase labels. Keep estimates conservative and domain-specific: suggestions may be 10-25s, text generation 30-60s, web-search form autofill 45-90s, image generation 60-120s, and video/provider-queue jobs 2-5m.
4. Drive UI from operation snapshots, not scattered booleans. A snapshot should derive `elapsedMs`, bounded percent, current phase, `stale`, formatted elapsed time, formatted estimate, latest stage, and stage history from `{ kind, startedAt, detail, stages }`.
5. Show progress anywhere input is disabled or a result placeholder exists. Put status near the disabled control and in the content area if the operation produces an in-flow result. The default collapsed view must show the latest stage, not merely a generic "running tool" label. Use compact status for background work such as warmed variants.
6. Add explicit cancel affordances for foreground in-flight operations. Use `AbortController` or the framework's native cancellation primitive, keep cancel buttons available even when submit/input controls are disabled, and restore or remove pending placeholders cleanly after cancellation. Background preloads may be non-cancellable if canceling them has no user-visible value.
7. Add an expandable stage history. Users should be able to click into the operation panel and see prior stages with elapsed timestamps and short preview results such as query count, result count, selected tool, provider job id, first-token received, candidate count, or compact sanitized snippets.
8. For agentic search, tool-calling, polling, or loop-based operations, emit explicit stage updates whenever the backend plans, invokes a tool, receives tool results, retries/falls back, starts synthesis, receives first output, and saves/applies the result. Avoid hiding multi-step work behind a single "Running function search" label.
9. For agentic workflows with independent branches after an initial planning step, fan out server-side with a bounded concurrency cap. Treat each branch like a subagent: give it a stable parent stage id, lane/color, queued/running/completed/cancelled state, local scratch state, retry/timeout/cancel policy, and short progress previews. Merge accepted results serially in deterministic input order so shared state such as selected profiles, dedupe sets, saved rows, or result caps cannot race.
10. For hosted provider streams, inspect the provider's semantic stream before inventing phases. OpenAI Responses can expose `response.web_search_call.*`, output-item, reasoning, annotation, and text events; Gemini streams content parts and may mark thought parts; OpenAI-compatible Chat Completions providers such as xAI and Featherless usually expose deltas, usage chunks, and sometimes reasoning fields or inline `<think>` blocks. Convert those provider events into the same `operation.stages` contract, and use heartbeats only after a quiet gap.
11. Log operation lifecycle events on the client: `operation:start`, `operation:stage`, `operation:done`, `operation:error`, and `operation:cancel`. Include operation id, kind, route, duration, label, estimate, detail, latest stage, and sanitized error metadata. Canceled operations should not be counted as provider failures.
12. Persist shared timing aggregates when the app has a safe global store. Send only sanitized operation kind, route, status, duration, label, and coarse estimate fields. Store count, mean, sample standard deviation, min/max, last duration, and error count by operation key. Prefer mean plus one standard deviation as a conservative live estimate, and show the mean +/- 1sd interval in the debug view. Exclude canceled operations from timing aggregates.
13. Add server-side start/done/error/stage telemetry for slow endpoints. Log structural fields only: route, provider, model, operation mode, stream flag, duration, stage label, token counts, candidate counts, result counts, status, request id, and sanitized errors. Do not log prompts, replies, images, attachments, memory text, or raw request bodies unless the app intentionally keeps them client-local.
14. Raise backend invocation limits where needed. For serverless apps, double the default for slow LLM endpoints when platform limits allow it. Media/video queue endpoints often need a larger cap than text endpoints. Keep endpoint-level configs explicit.
15. Consider Effect.ts for backend workflows when the operation has 3+ async steps, retry/fallback policy, provider queue polling, user cancellation, branch fanout, or stage telemetry. Keep adoption incremental: wrap one high-complexity server workflow first and expose the same operation-stage contract to the frontend.
16. Add tests for the standard. Unit-test profile lookup, progress bounds, phase advancement, stale detection, duration formatting, stage timeline ordering, latest-stage selection, explicit stage previews, rolling local estimates, global mean/stddev aggregation, abort-error detection, cancel event mapping, retry policy, timeout mapping, fanout ordering, branch-local state isolation, provider-event-to-stage mapping, heartbeat suppression when real provider events are fresh, and placeholder cleanup on cancel. Add UI or integration smoke checks when the app has a visual surface.
17. Verify with the repo’s normal checks and at least one visual smoke. If the full API stack cannot run locally, say so and use the closest frontend smoke plus syntax/build tests.
