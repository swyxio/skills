---
name: live-ai-pipelines
description: Build or refactor a long-running AI workflow that needs visible progress, durable partial results, resume after interruption, or atomic publication. Use for multi-stage extraction, indexing, batch analysis, evaluation, or report workflows. Do not use for a short synchronous model call or a UI-only streaming feature.
---

# Live AI Pipelines

Use this skill when people need to inspect useful work while later work is still running, or reopen a run after interruption. It owns logical stages, artifacts, progress, recovery, and publication—not a particular queue, database, or provider SDK.

Pair with `ai-engineering` when model request/retry/rate-limit behavior is itself the problem. Pair with a provider/runtime skill only for that platform’s current API behavior.

## Useful defaults

- Keep canonical complete artifacts separate from provisional previews.
- Give artifacts and independently resumable items stable IDs.
- Make the UI a projection of stored results and events, not the source of workflow truth.
- Publish a complete new snapshot rather than exposing a half-rendered site.
- Let core output publish with optional enrichment visibly pending unless the user makes that enrichment a completion requirement.

## Workflow

### 1. Choose the level of machinery

Identify deterministic preparation, independent fan-out, fan-in synthesis, projection, and audit/publication. A local runner with atomic files, JSONL events, and polling/SSE is often enough. Add a queue, database, ownership lease, or process supervision only when multiple workers, long detachment, or safe handoff actually needs it.

For each stage, choose its item key, input/output contract, retry behavior, and whether a partial result is safe to show. Feed fan-in synthesis a bounded normalized projection of completed artifacts, not the raw corpus and every intermediate response.

### 2. Define complete versus preview data

Validate a response before writing a canonical artifact. Write it atomically, then emit a completion/failure event and update a replaceable status snapshot. Streamed token fragments and drafts may support a preview, but do not give them canonical links or present them as complete facts.

For a costly broad run, a small representative calibration and per-request-class budget notes can prevent systematic truncation. They are planning aids, not a prerequisite for an exploratory pilot.

### 3. Make resume proportional to the risk

For a simple local job, derive completion from validated result artifacts and idempotency keys. For a job that can outlive its caller or be resumed by another process, also maintain an item index, owner/lease, heartbeat, and explicit cancellation/detach policy. On cancellation, stop new admission, preserve valid work, and classify unfinished items so a later run can decide whether to retry them.

### 4. Use one provider boundary

Keep provider-specific streaming and request behavior inside an adapter that returns a validated result or an explicit failure. Record requested/actual provider/model and route when that information changes debugging, cost, privacy, or behavior.

- For OpenAI, use Structured Outputs and capture request/rate-limit identifiers when operating or debugging at scale.
- For Anthropic streaming, use the terminal stop reason to decide whether a response completed, hit a limit, paused, used tools, or refused.
- For OpenRouter, verify structured-output support per endpoint and record actual routing when it matters; router metadata is useful for diagnostic runs.

### 5. Expose useful progress

Provide a status snapshot and a reconnectable event path when a UI needs live updates. Show source coverage, completed artifacts, candidates/provisional work, and published output separately. Rebuild previews from canonical artifacts and events when practical.

### 6. Publish and verify

Render to a new snapshot, check the links and required artifacts, then switch the current pointer atomically. Test the failure paths that matter to the promised experience: interruption/restart, malformed model output, duplicate delivery, provider failure, and browser reconnect. Report coverage, elapsed time, retries/fallbacks, and artifact locations when the run is significant.

## References and scripts

- [Architecture patterns](references/architecture.md) — optional local-first layout, stages, recovery, and provider notes.
- [Event and artifact contract](references/event-schema.md) — adaptable event envelopes and resume metadata.
- `scripts/event_journal.py`, `scripts/incremental_json.py`, `scripts/serve_progress.py`, and `scripts/publish_snapshot.py` are small local reference implementations; read and adapt them rather than copying their assumptions.
