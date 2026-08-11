# Event and artifact contract

Use JSON Lines for the event journal. Each line is a complete JSON object and can be replayed independently. The exact fields may grow, but the envelope should remain stable.

## Event envelope

```json
{
  "seq": 42,
  "timestamp": "2026-08-11T18:32:10.123Z",
  "run_id": "run-2026-08-11-001",
  "type": "request_completed",
  "stage": "pass1.chunk_evidence",
  "item_id": "unit-0003/chunk-0007",
  "attempt": 1,
  "status": "complete",
  "artifact": "results/pass1-chunk-evidence/chunk-000007.json",
  "completed": 7,
  "total": 38,
  "elapsed_seconds": 4.82,
  "transport": "sync",
  "provider": "openai",
  "model": "configured-model",
  "schema_name": "chunk_observations",
  "schema_hash": "sha256:..."
}
```

Required envelope fields:

- `seq`: monotonically increasing cursor; gaps are safe after a crash;
- `timestamp`: UTC event time;
- `run_id`: stable run identity;
- `type`: lifecycle event name;
- `status`: event-specific state.

Recommended fields:

- `stage`, `item_id`, `attempt`;
- `artifact`, `input_hash`, `prompt_hash`, `schema_hash`;
- `completed`, `total`, `elapsed_seconds`;
- `transport`, `provider`, `model`, `generation_id`;
- `error_type`, `retryable`, `cache_hit`;
- `coverage`, `source_locator`, or `snapshot_id` where relevant.

Do not put raw prompts, model output, access tokens, cookies, or full source text in browser-visible events. Put sensitive details in protected local request logs and reference them by ID.

## Event types

### Run lifecycle

```text
run_started
run_paused
run_resumed
run_cancel_requested
run_finished
run_failed
```

### Stage lifecycle

```text
stage_started
stage_progress
stage_completed
stage_failed
```

### Item lifecycle

```text
request_started
request_delta
request_completed
request_failed
request_retried
artifact_published
```

Use `request_delta` only for safe activity metadata such as bytes received, elapsed time, or a redacted preview. Do not make the UI depend on every token delta.

### Batch lifecycle

```text
batch_submitted
batch_status
batch_completed
batch_failed
batch_output_recovered
```

`batch_status` should include provider status and request counts when available. `batch_output_recovered` should identify the individual item artifact after the batch output is collected.

### Projection lifecycle

```text
preview_updated
snapshot_render_started
snapshot_validated
snapshot_published
```

## Status snapshot

`status.json` is a replaceable materialized view for polling. It should contain enough information to render a dashboard without replaying the entire journal:

```json
{
  "run_id": "run-2026-08-11-001",
  "status": "running",
  "current_stage": "pass1.chunk_evidence",
  "updated_at": "2026-08-11T18:32:10.123Z",
  "last_event_seq": 42,
  "stages": {
    "pass1.chunk_evidence": {
      "status": "running",
      "completed": 7,
      "total": 38,
      "failed": 1,
      "cached": 4,
      "elapsed_seconds": 61.3
    }
  },
  "published": {
    "significant_entities": 8,
    "articles": 6,
    "snapshots": 2
  }
}
```

Write status to a temporary file and atomically rename it. The UI should treat status as a snapshot, not an event log.

## Artifact envelope

Every canonical result should carry enough provenance to be regenerated and compared:

```json
{
  "artifact_id": "artifact-pass1-unit0003-chunk0007-attempt1",
  "schema_name": "chunk_observations",
  "schema_version": "1",
  "schema_hash": "sha256:...",
  "run_id": "run-2026-08-11-001",
  "stage": "pass1.chunk_evidence",
  "item_id": "unit-0003/chunk-0007",
  "input_hash": "sha256:...",
  "prompt_hash": "sha256:...",
  "provider": "openai",
  "model_requested": "configured-model",
  "model_actual": "configured-model",
  "transport": "sync",
  "attempt": 1,
  "validation": "valid",
  "source_scope": ["unit-0003", "chunk-0007"],
  "created_at": "2026-08-11T18:32:10.123Z",
  "data": {}
}
```

Keep the envelope stable even when the data schema evolves. A schema migration should create a new schema name/version or a deterministic migration step; do not silently reinterpret old artifacts.

## Idempotency

A useful idempotency key is:

```text
run_scope + stage + item_id + input_hash + prompt_hash + schema_hash + provider + model
```

Attempts are separate records. A retry may produce a new artifact ID, but it must not create a second published entity or duplicate graph edge without an explicit merge decision.

## UI rules

- Use `seq` as the SSE `id` and reconnect cursor.
- On reconnect, request events after the last seen sequence, then refresh `/api/status`.
- Treat a missing sequence as a possible crash gap, not automatically as data loss.
- If an artifact is unavailable, show the event with a retry/open-details state.
- Render raw observations and candidate synthesis in separate visual regions.
- Only add canonical navigation links after an artifact is complete and published.
