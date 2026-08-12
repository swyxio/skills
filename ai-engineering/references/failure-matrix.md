# Failure matrix and attempt record

Use this as a menu, not a universal compliance checklist. Keep provider-specific details in the adapter.

## Error-to-action matrix

| Signal | Usually means | Useful response |
| --- | --- | --- |
| Timeout, connection reset, transient 5xx | Transport failure | Back off with jitter and retry through normal admission. |
| 429 with `Retry-After` | Rate pressure | Pause admission for at least that interval, then retry with jitter. |
| 400/401/403 or invalid request shape | Configuration, auth, or policy | Stop and retain a redacted diagnostic; retry only after something changes. |
| Refusal/content filter | Policy outcome | Record it explicitly; change scope only if the new task is permitted. |
| `finish_reason=length` | Response contract too large | Split the input, lower declared rows/sections, or use an allowed continuation. |
| HTTP 200 but invalid JSON/schema | Output contract failure, including a stream that began successfully but did not finish validly | Preserve the partial diagnostic and terminal event; use native structured output rather than prompt-only JSON, then change schema/input scope before retrying. |
| High p95 without rate pressure | Context or generation bottleneck | Pack/reduce input before adding workers. |
| Valid but unsupported claims | Semantic quality issue | Evaluate against source evidence or re-extract a narrower scope. |
| Cancellation/lost controller | Lifecycle interruption | Stop admission or explicitly detach; preserve completed work and classify the rest. |

An HTTP 200 only establishes that an attempt reached the provider. Decide separately whether the returned artifact is usable.

## Compact response-shape and context guidance

For structured extraction, call the official provider's documented native structured-output API with an explicit schema, then apply local schema and domain validation. Do not substitute a prompt such as “return JSON” followed by `JSON.parse`; that is ordinary free-form generation with a fragile parser. Cap rows, quote length, and nesting. For long-form work, build a bounded packet of deduplicated, ranked evidence with locators and conflicts. If a dense calibration sample repeatedly reaches the cap, consider changing the request shape before spending on a broad fan-out.

## Cache and fallback identity

A useful cache key includes the logical scope, input hash, prompt/schema hash, provider/model, transport, and material generation settings. When a fallback changes coverage, source scope, prompt, schema, model, or decoding behavior, give it a new effective request identity and retain its parent link. Equivalent retries do not need invented lineage.

## Minimal attempt record

Persist only the fields needed to debug or resume the run:

```json
{
  "logical_item_id": "unit-0003/chunk-0007",
  "stage": "chunk_evidence",
  "outcome": "validation_failed",
  "error_class": "output_contract",
  "effective_request_hash": "sha256:...",
  "parent_attempt_id": "attempt-000041",
  "finish_reason": "length",
  "input_tokens": 2400,
  "output_tokens": 5200,
  "latency_seconds": 37.8,
  "provider_request_id": "req_..."
}
```

Add rate-limit headers, packet coverage, and cost estimates when they will affect a scaling or provider decision. Keep raw prompts and credentials out of UI-visible records.

## Admission sketch

Before each attempt, reserve an in-flight slot and any known request/token capacity; honor a global cooldown. Record response headers and outcome, then release the in-flight slot before retry sleep. Use this only when concurrency or provider limits make it worthwhile.
