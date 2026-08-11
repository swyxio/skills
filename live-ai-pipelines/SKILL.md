---
name: live-ai-pipelines
description: Build or refactor long-running AI workflows that produce structured artifacts, live progress, partial previews, and resumable final outputs. Use when an extraction, analysis, ETL, indexing, evaluation, report, or agent workflow must run for minutes or hours and remain inspectable while it runs.
---

# Live AI Pipelines

## Purpose

Use this skill when a long-running AI workflow needs all of the following:

- structured, machine-readable results;
- per-stage and per-item progress;
- partial previews while work is still running;
- crash recovery, retries, and resume without duplicating work;
- a local or web UI that can reconnect and catch up;
- final artifacts that are published atomically and can be audited later.

It applies to document extraction, knowledge graphs, story bibles, batch analysis, ETL, report generation, indexing, evals, and agent workflows. It is provider-neutral, with adapter rules for OpenAI, Anthropic, and OpenRouter.

## Non-negotiable contract

Treat the workflow as two related planes:

1. **Control plane:** run state, stage state, event journal, timings, retries, transport, and UI progress.
2. **Data plane:** inputs, prompts, structured model results, materialized previews, projections, audits, and final snapshots.

Keep these rules:

- Use strict JSON Schema for canonical model artifacts. Use YAML/TOML for human-edited configuration and prompts, not as the machine contract.
- Treat streamed output as provisional until a complete item or final response validates against the schema.
- Never overwrite the authoritative result with a partial response. Store partial previews separately.
- Give every run, stage, item, artifact, event, and snapshot a stable ID.
- Give every long-running remote run an owner/lease, heartbeat, explicit cancellation mode, and authoritative item index; a cache tree is not a progress system.
- Emit one durable completion event per item or batch, not only one message at the end of a pass.
- Make retries idempotent using input hash, prompt/schema hash, provider/model, and attempt metadata.
- Treat a changed fallback contract as a new request lineage and expose `completed_with_fallback`; never let it masquerade as a cache hit for the richer request.
- Publish static or materialized views by writing a new snapshot and atomically switching the current pointer.
- Let a core snapshot publish with optional enrichment visibly pending or failed unless the user explicitly makes that enrichment a completion requirement.
- Keep model prose, observed facts, inferred claims, and speculative synthesis visibly distinct.
- Do not put credentials, raw authorization headers, or sensitive prompt material into browser-visible telemetry.

See [references/architecture.md](references/architecture.md) for the full layout and stage patterns. See [references/event-schema.md](references/event-schema.md) for the event and artifact contract.

## Related skills and handoffs

This skill owns the logical run contract: stages, item identity, structured artifacts, progress events, previews, recovery, and atomic publication. It does not replace a runtime, provider, CLI, observability, testing, deployment, or domain skill. Load the narrowest companion skill for those concerns and keep one owner for job lifecycle/state. See [references/skill-routing.md](references/skill-routing.md) for the routing matrix and composition examples.

The most common pairings are:

- `openai-docs` for current OpenAI API behavior; `agents-sdk` for Cloudflare Agents SDK runtime behavior;
- `cloudflare-production-builder` for Workflows, Queues, Durable Objects, R2, deployment, and live verification;
- `observability-hardening` when telemetry is the primary work, and `cli-ux` when the command-line contract is primary;
- `summarize-anything`, `smart-entity-resolution`, or `data-chatbots` when summarization, entity resolution, or human-approved proposals are the domain problem;
- `test-strategy-hardening` and `release-readiness-hardening` when test architecture or release gates—not merely pipeline implementation—are the task.

## Workflow

### 1. Inspect before changing

Find the existing runner, model client, cache, fan-out helper, result directories, renderer/UI, and test commands. Preserve existing artifacts and conventions where possible. Identify whether the current system is:

- synchronous fan-out;
- provider Batch-based;
- a queue/worker system;
- a static renderer;
- already exposing an API or event stream.

Do not introduce WebSockets, a database, or a hosted queue merely because the workflow is long-running. A single local writer, JSONL event log, atomic files, and a small SSE server are usually enough for the first useful version.

### 2. Divide the work into observable stages

Name stages explicitly and classify each one:

- deterministic preparation;
- independent fan-out items;
- fan-in or global synthesis;
- projection/rendering;
- audit and publication.

For each stage define its input hash, output schema, item key, expected count, request profile, retry/remediation policy, criticality, and what may be shown before the stage completes. Fan-out stages should emit progress per item; global synthesis stages should expose a provisional draft but publish only after validation. Feed global synthesis a bounded normalized projection of canonical IDs, claims/events, contradictions, and compact trajectories—not every raw observation, display label, and prose artifact.

### 3. Define the run contract

For a costly, externally billed, or broad remote fan-out, declare the request-class profile matrix before admission. Include input/output budgets, source-packet rule, schema/success invariants, finite remediation ladder, timeout/retry policy, and core-versus-optional criticality. A small bounded pilot may proceed with warnings, but must still record cap pressure and packet sizes; it must not be relabeled as a calibrated broad run.

Create a run directory with at least:

```text
<run>/
  input/
  prompts/
  results/                 # complete canonical artifacts only
  previews/                # disposable partial projections
  telemetry/
    run.json
    status.json
    events.jsonl
    item-index.jsonl
    lease.json
    stage-state/
  snapshots/
    site-0001/
    current -> site-0001
```

The status snapshot is replaceable and convenient for polling. The event journal is append-only and replayable. The item index is the authoritative answer to which logical work has been admitted, completed, degraded, failed, or is active. The result/cache layer is the source of completed canonical data; the UI is a projection, not the source of truth.

### 4. Choose the output mode per stage

Use the smallest mode that gives the required fidelity:

- deterministic JSON for ingestion, normalization, hashes, and locators;
- streamed Structured Outputs for arrays of observations, claims, entities, events, and relationship facets;
- streamed text or section-level structured prose for long-form drafts;
- non-streaming validated output for global synthesis and final dossiers when partial interpretation would mislead;
- provider Batch for throughput-oriented fan-out when coarse progress is acceptable.

For a streamed structured response, design the schema as appendable arrays of self-contained records. Put cheap, observable arrays before large prose fields. Give each record an ID, source/evidence IDs, status, and uncertainty fields. Do not ask a single giant graph object to be incrementally mutated.

### 5. Implement one provider-neutral client boundary

Prefer an interface shaped like:

```python
result = client.ask_structured(
    schema=schema,
    prompt=prompt,
    on_delta=handle_debug_delta,
    on_item=publish_complete_item,
)
```

The adapter may emit raw deltas and parsed snapshots to the preview layer, but it must return one final validated result or an explicit failure. Never let provider-specific streaming behavior leak into the graph or renderer.

For OpenAI, use Structured Outputs with the official SDK streaming helpers when available; the SDK can expose progressive snapshots/parsed content. Capture request/rate-limit headers and use a unique client request ID when the transport supports it. For Anthropic Messages, treat the terminal streaming `message_delta` stop reason as the completion signal; pace separately for requests, input tokens, and output tokens, and capture the `anthropic-ratelimit-*` headers. For OpenRouter, use `response_format.type = "json_schema"`, `strict: true`, and `stream: true` only with models/providers that support the parameter. Require the parameter during routing when the provider offers that control, opt in to routing metadata for diagnostic runs, and record requested and actual provider/model, generation ID, route/fallback data, schema hash, finish reason, and validation status.

OpenAI reference: [Structured Outputs and streaming](https://developers.openai.com/api/docs/guides/structured-outputs). OpenRouter references: [Structured Outputs](https://openrouter.ai/docs/guides/features/structured-outputs) and [Streaming](https://openrouter.ai/docs/api/reference/streaming).

Do not assume Batch has token-level streaming. Expose Batch submission, queue, running, completed, failed, and recovered-output counts instead. Split large batches when more frequent checkpoints are worth the submission overhead.

### 6. Make execution resumable

After every completed item or batch:

1. validate the response;
2. write the complete artifact with a temporary filename and atomic rename;
3. update stage counters and the status snapshot;
4. append a completion or failure event;
5. update the materialized preview, debounced if needed;
6. persist the checkpoint before starting more work.

Write an attempt-start event and item-index state before calling the provider. On a changed fallback, update the item index with the parent attempt, the changed contract, coverage impact, and `completed_with_fallback`; do not overwrite the original request identity.

On restart, recover from the item index plus validated canonical artifacts and idempotency keys. Do not trust a progress counter, a live process, or a cache directory by itself. Handle duplicate delivery, missing outputs, malformed streams, cancellation, and provider failures explicitly.

On cancellation, stop new admission, persist `run_cancel_requested`, signal/reap the owned worker process group, classify in-flight work after a bounded grace period, and either mark the lease cancelled or transfer it to a named detached supervisor. Reclaim an expired lease only after checking that the former owner is gone.

### 7. Expose progress to the UI

Provide a read-only local API with:

```text
GET /api/status
GET /api/events?after=<sequence>
GET /api/artifacts/<id>
```

Use SSE for one-way live updates and polling as the reconnect/fallback path. The browser should remember the last event sequence, reconnect with `after`, and tolerate a full status refresh. Do not make a browser consume a raw JSONL file directly when a local HTTP endpoint can provide cursoring and correct content types.

Display separate states for:

- deterministic source coverage;
- raw observations;
- resolved entities;
- candidate synthesis;
- published significant pages;
- complete/audited output.

Show the current request’s token stream only in a debug/activity panel. Publish complete observations, sections, or articles into the preview feed; do not present partial global synthesis as fact.

### 8. Publish atomic snapshots

Render into a new versioned directory. Validate required links, indexes, manifests, and artifact references. Then atomically replace a `current` symlink or manifest pointer. A browser should see either the old complete snapshot or the new complete snapshot, never a half-written tree.

Regenerate expensive projections on meaningful boundaries, not every token. A good default is immediate telemetry, per-item preview updates, and debounced rendering every 1–5 seconds or after a small number of completed items.

Use `scripts/publish_snapshot.py` for a dependency-free local implementation.

### 9. Verify the failure paths

Before calling the workflow complete, test:

- process termination during an item, batch, and snapshot publish, including the parent/worker-process-group boundary;
- restart and resume with no duplicate canonical artifacts;
- browser disconnect/reconnect with event cursor catch-up;
- malformed or truncated streamed JSON;
- model refusal, content filter, timeout, and mid-stream provider error;
- a provider that ignores structured-output parameters or routes to an endpoint that lacks the required feature;
- duplicate events and out-of-order fan-out completion;
- stale or missing source locators;
- atomic snapshot switching while a browser is reading the site;
- telemetry that contains no secrets.

Measure stage latency, queue time, first-byte time, item completion time, total tokens, retries, cache hits, validation failures, provider/model/route, and cost where available. Break down input/output and near-cap/length outcomes by request profile; report elapsed times for major stages and batches.

## Use the bundled scripts

The scripts are small, dependency-free reference implementations. Read and adapt them rather than copying their assumptions blindly.

```bash
python3 scripts/event_journal.py /path/to/events.jsonl stage_started \
  --field stage=pass1 --field total=38

printf '%s' '{"observations":[{"id":"o1"}]}' \
  | python3 scripts/incremental_json.py --array observations

python3 scripts/serve_progress.py \
  --root /path/to/site \
  --run-dir /path/to/run \
  --port 8765

python3 scripts/publish_snapshot.py \
  --source /path/to/rendered-site \
  --snapshots /path/to/run/snapshots \
  --current /path/to/run/snapshots/current \
  --label site-0002
```

- `event_journal.py` appends ordered, fsynced JSONL events.
- `incremental_json.py` yields complete items from a named top-level JSON array as chunks arrive; it never treats arbitrary network chunks as complete JSON documents.
- `serve_progress.py` serves static files plus status, artifact, and cursorable SSE endpoints.
- `publish_snapshot.py` copies a completed render and atomically advances the current snapshot pointer.

## Completion criteria

A live AI pipeline is ready when a user can see what is happening, inspect completed work while later work runs, disconnect and reconnect without losing progress, resume after termination, distinguish provisional from final content, and open one complete immutable snapshot at any time.

Do not optimize for the appearance of activity. Optimize for recoverable state, useful intermediate artifacts, clear provenance, and a final output that can be regenerated from recorded inputs and completed results.
