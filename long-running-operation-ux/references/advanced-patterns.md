# Advanced Long-Running Workflow Patterns

Read this reference only after selecting L3, L4, or L5 in the parent skill.
These preserved implementation lessons are optional, task-specific patterns,
not mandatory architecture for a simple asynchronous interaction.

## Implementation Pattern

Create a small reusable module. Adapt names to the repo’s language and framework.

```js
export const OPERATION_PROFILES = {
  "character-draft": {
    label: "Filling character fields",
    estimateMs: 55000,
    stalledMs: 110000,
    phases: ["Searching for inspiration", "Building the card", "Seeding memory", "Filling the form"]
  },
  retry: {
    label: "Regenerating reply",
    estimateMs: 42000,
    stalledMs: 80000,
    phases: ["Rebuilding context", "Trying a fresh angle", "Streaming variant", "Saving variation"]
  }
};

export function operationProgress({ startedAt, now = Date.now(), estimateMs, phases }) {
  const elapsedMs = Math.max(0, now - (startedAt ?? now));
  const ratio = elapsedMs / Math.max(1000, estimateMs || 30000);
  return {
    elapsedMs,
    percent: Math.max(4, Math.min(96, Math.round((1 - Math.exp(-ratio * 1.65)) * 100))),
    phase: phases?.[Math.min((phases.length || 1) - 1, Math.floor(Math.min(ratio, 0.999) * (phases.length || 1)))] || "Working",
    overEstimate: ratio > 1
  };
}
```

In UI code, prefer a single operation object over several local booleans:

```js
const operation = {
  id: makeId(),
  kind: "character-draft",
  startedAt: Date.now(),
  route: "/api/character-draft",
  detail: characterName,
  cancellable: true,
  stages: [
    { label: "Planning searches", atMs: 0, preview: "3 queries" },
    { label: "Running web search", atMs: 2200, preview: "8 results" }
  ]
};
```

Render a progress component from the snapshot. It should include:

- A clear verb phrase: `Generating avatar`, `Regenerating reply`, `Filling character fields`.
- Elapsed and rough estimate: `22s / ~55s`.
- A bounded progress meter that never reaches 100% until completion.
- A phase line and a stale line when `elapsedMs > stalledMs`.
- A cancel button for foreground tasks that can be aborted without corrupting state.
- The latest operation stage inline.
- A clickable stage history with elapsed timestamps and preview snippets.

## UX Rules

Keep the app responsive while work runs. Disable only the controls that would create duplicate or conflicting work. Let unrelated navigation, inspection, cancel/close affordances, and debug tools remain usable when practical.

Cancel should feel like a first-class outcome. On cancel, abort the network request or provider job when possible, remove pending assistant/media/form placeholders or restore the previous version, clear busy flags, and leave the user in the same flow. Do not show cancellation as an error banner unless the user needs to know cleanup failed.

Use honest estimates. Do not imply exact provider progress unless the provider exposes real job status. For LLM streams, switch phase on first token or reasoning delta when available. For queue-based media, phase labels should say that the provider queue is being waited on.

Keep placeholders alive. Assistant messages, generated media blocks, import rows, and form panels should show the same operation status instead of empty disabled states.

For background preloads, show compact state without blocking foreground input. A tiny `warming` indicator with elapsed estimate is better than hiding the work or showing only a plus sign.

For agentic work, prefer real stage updates over synthetic timers. Examples: `Planning searches`, `Searching web`, `Reading result snippets`, `Calling model`, `Receiving first token`, `Synthesizing answer`, `Saving result`. If a tool loop has multiple iterations, append each iteration as a separate stage with the loop number and a safe preview such as `loop 2, 5 results`.

For fanout work, show the structure instead of flattening it into a long list. After a planning or expansion step, render sibling branches under their parent stage using `parentId`, `depth`, `lane`, and branch labels. Good branch labels are entity names, tool names, source domains, shard ranges, or agent roles. The latest-stage line should still show the most recent active branch, while the expanded history should make parallel work visually obvious with indentation and lane color.

Do not let parallel branches mutate shared workflow state directly. Each branch should use local scratch state, then the parent should merge results in a deterministic serial pass. This matters for dedupe sets, result caps, selected winners, database writes, prompt/context budgets, and stage ids. If two branches find the same result, commit one according to a stable rule and emit a structural stage such as `Skipped duplicate result` rather than letting completion order decide.

## Logging And Fanout Learnings

Log the workflow you actually ran, not just the request that triggered it. A generic wrapper payload such as `{ route, method, body }` is useful in a developer log, but it does not explain a long wait. Put prompt/params disclosures on the actual LLM stages that used them, such as `Running LLM expansion` or `Running profile rerank`, and keep non-LLM tool stages focused on structural previews.

Stage history should be both a live status surface and a postmortem trace. Every stage should carry enough context to answer: what branch was this, what tool/provider was called, when did it start, did it retry, did it time out, what small result came back, and what parent stage owns it. Useful stage metadata includes `id`, `parentId`, `depth`, `lane`, `tool`, `provider`, `model`, `loopIndex`, `attempt`, `resultCount`, `queryCount`, and a sanitized `preview`.

For fanout, log the shape of the work before the branch storm starts: `4 groups - 36 query variants - 4 parallel branches` is more useful than a vague `Running search`. Include the total branch count, active concurrency cap, queued count when available, and rate-limit policy when it affects speed. Then emit child stages as each branch is queued, starts, retries, completes, skips a duplicate, times out, cancels, or fails. In the UI, indentation and lane color should make parallel sibling branches visible instead of forcing users to infer structure from a linear timestamp list.

Retries must be visible when they affect latency. Emit stages like `Retrying Listal alias`, `Retrying LLM rerank`, or `Retrying provider call` with `attempt 2/3 in 2s`. Do not log a retry for every hidden low-level socket detail, but do expose retries that explain user-visible waiting. Do not retry cancellation, auth/validation errors, content-policy denials, or ordinary 404/no-result misses.

Timeouts should name the timed-out step. A branch timeout should produce a stage like `Entity branch timed out` or `Alias search timed out`, not just a generic final error. Low-value branches can fail soft and let the workflow continue; core synthesis/provider calls may fail the whole operation. Track those choices explicitly in stage status: `timeout`, `error`, `completed`, or `skipped`.

Visibility updates are a contract, not decoration. The UI should always be able to answer four questions from the latest operation snapshot: what is running now, what branch or provider owns it, how long has it been running, and what can the user do next. The collapsed view should show the latest meaningful stage; the expanded view should show prior stages with elapsed time, branch nesting, retry attempts, timeout/cancel states, and sanitized preview results. Avoid progress bars that advance only by timer when real tool/provider/branch events exist.

Subagent fanout should behave like a small observable task graph. Emit a parent planning stage, branch-queued stages for work that cannot start immediately under the concurrency cap, branch-started stages for active children, nested tool/provider stages inside each branch, then branch-completed, branch-skipped, branch-timed-out, branch-cancelled, or branch-failed stages. Use stable `parentId`, `depth`, `lane`, and branch labels so the frontend can render structure rather than a flat log. Do not let completion order decide final state; branches should collect local scratch data and the parent should merge results deterministically.

Cancellation must travel down the same graph. A user cancel, request abort, closed SSE connection, or workflow cancel endpoint should interrupt queued branches, pass an abort signal to in-flight provider/tool calls where possible, stop retries that have not yet started, and emit `cancelled` stages rather than `error` stages. If the backend cannot cancel a provider job, say so structurally with a stage such as `Cancel requested; provider job may finish remotely`, then keep local UI cleanup responsive.

Coverage is part of progress for multi-entity, multi-source, or multi-output work. Track expected units separately from returned items: `expectedCount`, `resolvedCount`, `unresolvedLabels`, `ambiguousLabels`, or equivalent fields. A request can return HTTP 200 and still be semantically partial. The final stage should make partial coverage visible, such as `4/5 entities resolved`, instead of only saying how many raw images, rows, tokens, or candidates were produced.

Keep prompt-bearing data local or intentionally scoped. It is okay for a local developer view or in-app lab to show the exact LLM prompt and params sent during a stage. Do not send those raw prompts to server logs, global telemetry, or shared timing aggregates. Server/external logs should stay structural: operation id, route, stage label, provider, model, duration, attempt, counts, and sanitized error class/message.

For hosted LLM calls, add a provider-event bridge. The bridge should translate raw stream events into plain operation stages and hide provider quirks from the frontend:

- OpenAI Responses: map `response.created`, `response.in_progress`, `response.web_search_call.in_progress`, `response.web_search_call.searching`, `response.web_search_call.completed`, `response.output_item.added/done`, `response.output_text.delta`, reasoning deltas, annotations, and `response.completed`.
- Gemini: map stream connection, thought parts (`part.thought`), first visible text part, usage metadata, grounding/search metadata if enabled, and terminal errors.
- xAI/Grok: prefer `/v1/responses` for new work because xAI documents Responses as the preferred API and Chat Completions as legacy for new features. Map Responses events like OpenAI-style lifecycle, reasoning, output text, and hosted tool/search items. When still on Chat Completions, map stream connection, first `reasoning_content` or `reasoning` delta, first visible `content` delta, usage chunks when `stream_options.include_usage` is supported, and terminal errors.
- Featherless: map stream connection, explicit reasoning fields, inline `<think>`/`<thinking>` blocks, first visible content delta, usage chunks when present, and terminal errors. Featherless usually does not expose hosted search/tool stages.

Keep provider bridges conservative. Do not show a stage for every token. Emit a stage for first reasoning, first visible token, tool/search state changes, usage arrival, retry/fallback, and completion. Use a heartbeat only when no provider event has arrived for a configured quiet interval.

## Effect.ts Guidance

Use Effect for workflow internals, not for every UI interaction. It is a good fit when the backend operation is more like a small workflow than a single request: character autofill with web search, Listal/reference expansion, media/video queue polling, Story Bible maintenance, model fallback chains, or any agentic tool loop. It is usually not worth it for simple `GET`/`POST` handlers, presentational React components, local form state, or one-shot helper calls with no retry/cancel/fallback policy.

The concrete wins that matter for this UX:

- Timeouts: use `Effect.timeout` or `Effect.timeoutFail` to make operation caps explicit and typed. Map timeout failures to a user-facing stage such as `Provider timed out` and a server log status of `timeout`, not a generic provider crash.
- Cancels: use Effect interruption for server workflow cancellation and wire it to request aborts/provider aborts where possible. Effect's docs call out that Promises do not compose interruption automatically, while Effects do; this is the main reason Effect can be cleaner than hand-managed nested `AbortController`s for multi-step workflows.
- Retries: use `Effect.retry` with `Schedule` policies for transient network/provider errors. Prefer capped exponential backoff with jitter when available, emit an `operation:stage` event before each retry, and never retry user cancellations, validation errors, auth errors, or content-policy denials.
- Cleanup: use scoped resource/finalizer patterns for pending provider jobs, temporary files, uploads, or staged DB rows so cancellation, timeout, and errors all clean up the same way.
- Observability: use `Effect.withSpan` or equivalent stage wrappers around each tool call, provider call, queue poll, retry, and synthesis step. Convert spans/stage events into the app's `operation.stages` shape for the UI.
- Streams: when the backend can stream events, model stage updates as a stream of operation events (`stage`, `partial`, `done`, `error`) rather than making the frontend infer progress from one final response.
- Fanout: use Effect concurrency controls for branch work when you need retries/timeouts/cancels per branch. The frontend should not implement this fanout; it should only observe streamed stages. Keep branch concurrency capped based on provider limits and target-site politeness.

Recommended Effect workflow wrapper shape:

```ts
type OperationStage = {
  label: string
  atMs?: number
  preview?: string
  tool?: string
  loopIndex?: number
  status?: "active" | "done" | "retrying" | "error"
}

type WorkflowPolicy = {
  timeoutMs: number
  retry: {
    maxRetries: number
    baseDelayMs: number
    maxDelayMs: number
    retryableTags: string[]
  }
}

type StageReporter = (stage: OperationStage) => void | Promise<void>
```

Recommended Effect composition:

```ts
const runWorkflow = (report: StageReporter) =>
  Effect.gen(function* () {
    yield* emitStage(report, "Planning searches", { preview: "3 queries" })
    const sources = yield* searchSources.pipe(
      Effect.withSpan("character-draft.search"),
      Effect.retry(retrySchedule),
      Effect.timeoutFail({
        duration: "35 seconds",
        onTimeout: () => new WorkflowTimeout("search")
      })
    )
    yield* emitStage(report, "Synthesizing character", { preview: `${sources.length} sources` })
    return yield* synthesizeDraft(sources)
  }).pipe(
    Effect.withSpan("character-draft.workflow"),
    Effect.timeoutFail({
      duration: "120 seconds",
      onTimeout: () => new WorkflowTimeout("character-draft")
    })
  )
```

Keep this pattern as an optional backend implementation detail. The public frontend contract should remain plain JSON or SSE events, not Effect-specific types.

### Fanout / Subagent Pattern

Use this pattern when an initial model/tool step creates independent child tasks, such as resolving multiple entities from a search query, reading several sources, scoring candidates, polling multiple provider jobs, or running several tool shards. The branch work belongs on the server because it needs shared credentials, cancellation, retries, and rate limiting. The client should only receive normalized stage events and final merged results.

Backend shape:

- Emit a parent stage such as `Resolving expanded entities`, with a preview like `7 groups - 4 parallel branches`.
- Run child branches with bounded concurrency, usually 2-5 for external sites and 3-8 for internal tools. Do not use unbounded `Promise.all` against provider APIs or scraped sites.
- Show queue pressure when branches exceed the cap. A good L4 summary says `12 branches - 4 active - 8 queued`, then updates as queued branches start. Users should understand that waiting is deliberate backpressure, not a stuck workflow.
- Give each branch stable stage metadata: `id`, `parentId`, `depth`, `lane`, and a human branch label. Use nested children for sub-steps such as alias search, gallery fetch, rerank, synthesis, or save.
- Keep branch-local state local. Branches may collect candidates, tool traces, prompt snapshots, and warnings, but should not directly mutate global dedupe sets, selected winners, row writes, or final arrays.
- Merge branch results serially in input order or by an explicit ranking rule. Emit stages for accepted, skipped duplicate, timed out, or failed branches.
- Make retry and timeout policy branch-specific. A flaky source read can retry more aggressively than an LLM rerank; a low-value branch can time out without failing the whole workflow.
- Thread cancellation from the request or workflow id into the branch runner. Closing an SSE connection should stop wasting work when there is no persisted workflow to resume.

Effect-style fanout sketch:

```ts
const branch = (item: EntityGroup) =>
  Effect.gen(function* () {
    yield* emitStage(report, "Resolving entity group", {
      id: item.stageId,
      parentId: expansionStageId,
      lane: "entity",
      preview: item.label
    })
    const candidates = yield* searchAliases(item).pipe(
      Effect.retry(aliasRetrySchedule),
      Effect.timeoutFail({
        duration: "20 seconds",
        onTimeout: () => new WorkflowTimeout("alias-search")
      })
    )
    return { item, candidates }
  })

const branchResults = yield* Effect.forEach(groups, branch, {
  concurrency: 4
})

for (const result of branchResults) {
  commitResultSerially(result)
}
```

Plain Promise helpers are acceptable for simple fanout, but once you add retries, branch timeouts, cancellation, and cleanup, prefer Effect or a reusable workflow helper so the semantics stay explicit.

### Case Study: Character Creation Generation

When a create-chatbot form has a `Generate all fields` button that calls an LLM with hosted search, treat it as a request-bound workflow with streamed stages instead of one opaque `POST`.

Backend shape:

- Add a small workflow helper instead of scattering retry/timeout/cancel code through the route.
- Use `Effect.gen` for the operation sequence: plan, call model/search, parse structured fields, collect citations, optionally seed memory/story state, return form payload.
- Wrap provider calls with `Effect.tryPromise({ try: (signal) => providerCall({ signal }), catch })`, `Effect.retry`, `Schedule` backoff, `Effect.timeoutFail`, and `Effect.withSpan`.
- Run the effect with `Effect.runPromise(..., { signal })` or an equivalent wrapper so frontend aborts and request disconnects can interrupt the workflow.
- Emit sanitized SSE `stage` events as each step starts or retries. Good labels are `Preparing character request`, `Submitted model and hosted search`, `Still waiting on model/search`, `Web search unavailable`, `Retrying character generation`, `Parsing structured fields`, `Collecting search citations`, `Using local Story Bible seed`, and `Filling form`.
- For hosted tools such as provider-managed web search, first use real provider stream events if available. For OpenAI Responses, `response.web_search_call.in_progress`, `response.web_search_call.searching`, `response.web_search_call.completed`, and `response.output_item.done` with `type: "web_search_call"` can drive visible stages like `Hosted web search started`, `Searching the web`, and `Search results ready`. Emit honest heartbeat stages such as `Still waiting on model/search` only when the provider is silent for 8-15s, then switch to real local stages such as parsing, citation extraction, and form fill.
- Keep response schemas backward-compatible by making `operationStages` optional in the final JSON payload.

### Case Study: Hosted Chat Provider Streams

For chat send, retry, continue, and regeneration, use the same stage contract even when there is no tool loop. The frontend should not have to know whether a reply came from OpenAI Responses, xAI Responses, Gemini SSE, OpenAI-compatible Chat Completions, Featherless Chat Completions, or Ollama.

Backend shape:

- Create one provider-stage helper that accepts `{ provider, model, startedAt }` and returns normalized `stage` objects.
- Emit `Submitted <provider> request` before the outbound provider call.
- Emit `<provider> stream connected` once the HTTP/SSE stream is open.
- Emit `<provider> reasoning started` once, on the first reasoning/thought delta.
- Emit `First response token received` once, on the first visible output delta.
- Emit provider-specific tool/search stages only when the provider really exposes them.
- Emit `Usage metrics received` when provider usage arrives, and `<provider> response complete` just before final `done`.
- Forward stages through the route as SSE `event: stage` and server-side sanitized `chat.stage` telemetry.

Frontend shape:

- Reuse the active operation object for `send`, `retry`, `continue`, and `preload` where visible.
- Append streamed `stage` events into `operation.stages` and log `operation:stage` locally.
- Keep the latest stage visible beside elapsed/estimate, and keep the expandable stage history available while the reply streams.
- Do not block browsing previous variants just because a new variant is streaming.

Frontend shape:

- Switch the form action from plain JSON `apiPost` to stream-capable `apiPostStream` when the backend supports stage events.
- Start one `character-draft` operation object with `{ route, detail, cancellable: true }`.
- Append each streamed stage into `operation.stages` and emit client-local `operation:stage` logs for Developer View.
- Keep the disabled submit/generate button paired with a visible operation panel, elapsed estimate, latest stage, expandable history, and cancel button.
- On cancel, abort the stream, clear the operation panel, do not fill partial fields, and log `operation:cancel` rather than `operation:error`.

Tests to copy:

- Retry policy: transient statuses such as 429/502/503 retry, validation/auth/content-policy/cancel/timeout do not.
- Backoff: delays are capped and predictable.
- Workflow: transient provider failures emit retry stages and eventually succeed.
- Timeout: slow provider calls map to a typed 504 timeout error.
- UI smoke: pressing Generate all fields shows real streamed stages within a few seconds and Cancel removes the operation status.

## Logging Rules

Client logs can be richer when they stay local to the browser or app-owned debug view. Server logs and external telemetry must be sanitized. Avoid keys and values likely to contain private content, including `prompt`, `message`, `input`, `output`, `reply`, `content`, `attachment`, `image`, and `memory`.

Correlate client and server logs with route, operation kind, request id when available, duration, stage label, loop index, tool name, result count, and provider job id. This makes timeout and provider-latency debugging possible without storing sensitive content.

For global estimates, do not store raw samples unless there is a short retention reason. Use online aggregation such as Welford's algorithm so all users benefit from timing distributions without keeping per-run detail. Track errors separately from successful duration samples so provider outages do not distort the estimate.

Track cancellations separately from errors. A user pressing cancel is useful UX telemetry, but it should not increase provider error counts or update latency distributions.

## Frontend / Serverless Workflow Design

Design the frontend as a thin observer/controller for long-running workflows:

- Start request: `POST /api/workflows/<kind>` creates or runs the workflow and returns either a final result for short jobs or `{ operationId, statusUrl, eventsUrl }` for long/persistent jobs.
- Event stream: `GET /api/workflows/<id>/events` streams sanitized events: `stage`, `partial`, `retry`, `timeout-warning`, `done`, `error`, `cancelled`. Use SSE when the serverless platform can keep the connection open; otherwise poll `statusUrl`.
- Status state: persist the latest operation state server-side for workflows that can outlive the request, including `operationId`, status, startedAt, latest stage, stage history, retry count, timeoutAt, cancelRequestedAt, and result pointer. Do not persist prompts/replies unless the product explicitly wants that.
- Cancel flow: frontend cancel button calls `POST /api/workflows/<id>/cancel`, immediately marks the UI as cancelling, disables duplicate cancel clicks, and keeps showing the stage history until the backend confirms cancellation or cleanup failure.
- Retry flow: backend retries transient failures according to policy and emits visible retry stages such as `Retrying provider call · attempt 2/3 in 4s`; frontend does not run hidden duplicate requests unless the backend says the workflow is terminal.
- Resume flow: on reload or route return, frontend fetches `statusUrl` by `operationId`, hydrates the same `operation.stages`, and either reattaches to `eventsUrl` or shows the terminal result/error.
- Serverless split: keep request-bound workflows for short LLM calls under the function cap; move queue/polling/video/multi-tool work to persisted workflow state with resumable status to avoid lying progress bars during cold starts, browser disconnects, or platform timeouts.

For React, keep Effect out of component state. Components should consume a plain operation view model:

```ts
type OperationView = {
  id: string
  kind: string
  label: string
  status: "running" | "cancelling" | "done" | "error" | "cancelled" | "timeout"
  startedAt: number
  estimateMs: number
  cancellable: boolean
  stages: OperationStage[]
  latestStage?: OperationStage
  retryCount?: number
  resultPreview?: string
}
```

## Timeout Rules

Check platform-specific limits before choosing numbers. In Vercel-style apps, explicitly configure `maxDuration` for slow endpoints instead of relying on defaults. A useful starting point:

- Text LLM endpoints: 120s when the previous/default was around 60s.
- Web-search or multi-step form autofill: 120s.
- Memory/story maintenance helpers: 120s.
- Image generation: 180-300s.
- Video generation or provider queues: 240-300s or the platform max.

Also check any internal `AbortController`, SDK timeout, queue polling timeout, and smoke-test timeout so the UI estimate, backend cap, and provider polling are not fighting each other.

When a frontend aborts a serverless request, remember that the server/provider call may continue unless the backend also observes the abort signal or has its own cancellation API. Still add client cancellation for responsiveness, and add provider-side cancellation where the platform exposes it.

## Test Checklist

Add fast unit tests for:

- Unknown operation fallback.
- Negative or tiny estimate overrides clamped to safe minimums.
- Progress percent bounded below 100%.
- Phase advancement at early/mid/late elapsed times.
- Stale detection after `stalledMs`.
- Duration labels such as `9s`, `1m`, and `2m 5s`.
- Latest-stage and stage-history generation from synthetic phases.
- Explicit stage ordering with elapsed labels and preview text.
- Fanout ordering, branch-local state isolation, deterministic merge behavior, and nested `parentId`/`depth` rendering.
- Retry visibility: transient branch/provider failures emit retry stages with attempt counts and then either complete, timeout, or fail visibly.
- Timeout visibility: branch-level timeouts can fail soft without failing the whole workflow, while required root steps fail the operation with a typed timeout.
- Cancellation propagation: cancel interrupts queued branches, aborts in-flight calls where possible, stops hidden retries, and emits `cancelled` rather than provider-error telemetry.
- Coverage reporting: successful responses with missing expected units surface partial coverage and do not count as fully complete in debug summaries.
- Abort errors recognized as cancellations instead of provider failures.
- Canceled operations emit `operation:cancel` and do not update learned estimates.
- Pending UI state is cleaned up after cancellation.

Then run the repo’s normal validation. For frontend apps, include at least one browser smoke that opens the relevant surface and confirms the operation status renders without overlapping nearby controls.

For touch-targeted surfaces, include an input-focus stability smoke for any controlled `input`, `textarea`, combobox, or editor used inside modals, drawers, sticky composers, or operation panels. Device priority is iPhone first, Android phone second, ordinary desktop third, then edge formats such as ultrawide monitors and iPad last. Type at least 3 individual characters into the field and assert after each character that `document.activeElement` is still the same editable control and that the typed value accumulated. This catches remount/focus-trap bugs that dismiss mobile soft keyboards on every keypress, including iPadOS/Safari even though iPad is a lower-priority edge check. Inspect `activeElement`, not just the final value, because desktop browsers can hide keyboard dismissal bugs while still accepting text.
