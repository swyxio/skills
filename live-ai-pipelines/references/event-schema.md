# Event and artifact contract

Use this as an adaptable JSONL/event envelope for a workflow that needs progress or resume. Keep raw prompts, credentials, and sensitive source text out of browser-visible events.

## Event envelope

```json
{
  "seq": 42,
  "timestamp": "2026-08-11T18:32:10.123Z",
  "run_id": "run-001",
  "type": "request_completed",
  "status": "complete",
  "stage": "chunk_evidence",
  "item_id": "unit-0003/chunk-0007",
  "artifact": "results/chunk-0007.json"
}
```

For reconnectable event streams, keep `seq`, `timestamp`, `run_id`, `type`, and `status` stable. Add what the consumer needs: attempt number, input/prompt/schema hash, coverage, elapsed time, cache/fallback status, provider/model/route, or error class. Do not force every field into every event.

Useful event families include:

```text
run_started, run_paused, run_resumed, run_cancel_requested, run_finished, run_failed
stage_started, stage_progress, stage_completed, stage_failed
request_started, request_completed, request_failed, request_retried, artifact_published
batch_submitted, batch_status, batch_completed, batch_failed, batch_output_recovered
preview_updated, snapshot_render_started, snapshot_validated, snapshot_published
```

Use deltas for safe activity or a redacted preview only; do not make correctness depend on every token event.

## Status and canonical artifacts

`status.json` is a replaceable polling view. It normally contains current stage, completed/total counts, failures, cache/fallback counts, and last event sequence. Write it atomically.

A canonical artifact should preserve enough provenance to compare or regenerate it:

```json
{
  "artifact_id": "artifact-chunk-0007",
  "run_id": "run-001",
  "stage": "chunk_evidence",
  "item_id": "unit-0003/chunk-0007",
  "input_hash": "sha256:...",
  "prompt_hash": "sha256:...",
  "validation": "valid",
  "source_scope": ["unit-0003", "chunk-0007"],
  "data": {}
}
```

Add provider/model, schema version, effective request, parent attempt, or fallback status when they materially affect comparison or resume.

## Resume metadata

A useful idempotency key combines run scope, stage, item ID, input hash, prompt/schema hash, and material provider/model settings. If a run can be detached or resumed by another owner, maintain an item index and run lease with the latest item state, active owner, heartbeat, and cancellation/detach outcome. Small in-process jobs can derive state directly from validated artifacts.

## UI rules

- Use the event sequence as an SSE cursor and refresh status after reconnecting.
- Display canonical data, provisional/candidate data, and published snapshots separately.
- Add canonical navigation only after its referenced artifact is complete and published.
