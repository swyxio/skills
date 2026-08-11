# Failure matrix and attempt record

Use this reference when implementing or reviewing a request client. Preserve provider-specific details in the provider adapter; apply these categories at the client boundary.

## Error-to-action matrix

| Signal | Classification | Action | Retry identity |
| --- | --- | --- | --- |
| DNS/connection reset, timeout, transient 5xx | Transient transport | Back off with jitter; re-admit through shared limiter. | Same effective request. |
| 429 with `Retry-After` | Rate limited | Pause future admissions for at least `Retry-After`; then retry with jitter. | Same effective request. |
| 400/401/403 or provider request-shape error | Configuration/auth | Fail fast with a redacted diagnostic. | No retry until configuration changes. |
| Refusal/content filter | Policy outcome | Record explicitly; route to review or permitted alternative. | New request only if the policy-compliant task changes. |
| `finish_reason=length` | Output contract exceeded | Split input, reduce declared response budget, or use allowed continuation/repair. | New effective request. |
| HTTP 200 but invalid JSON/schema | Decoding/output contract | Preserve a protected diagnostic; change request shape or mark review. | New effective request if changed. |
| Valid schema but unsupported facts/claims | Semantic quality | Run evaluator/targeted re-extraction with source evidence. | New evaluation or source-scoped request. |
| User cancellation/process termination | Lifecycle interruption | Stop admission, flush status, classify in-flight work. | Resume only missing valid results. |

An HTTP 200 is an **attempt-level** success, not an item-level success. A canonical item requires all declared validation checks.

## Remediation menu for oversized structured output

Choose one bounded intervention and record it:

1. Split the input at a deterministic source boundary.
2. Lower a declared row, quote, field-length, or prose-section budget.
3. Separate compact facts/evidence extraction from long-form synthesis.
4. Send a permitted repair or continuation request with an explicit partial-output policy.
5. Mark the item `blocked_for_review` when any smaller contract would compromise required coverage.

Never repeat an unchanged oversized request several times and call it resilience. It only adds cost and consumes rate-limit capacity.

## Cache identity

Construct a success cache key from all semantic inputs:

```text
logical scope + stage + item ID + source/input hash + effective prompt hash
+ schema hash + provider + model + transport + generation settings
+ fallback policy + decoding mode
```

Store an attempt separately from a successful canonical artifact. If a fallback produces a valid but reduced result, either:

- give it its own cache key and mark it `completed_with_fallback`; or
- promote it only through an explicit policy that records lower coverage.

Never place a result generated with a smaller row/prose budget under the cache identity for the richer request without recording the changed effective contract.

## Minimal attempt record

Keep this record server-side or in a protected local run directory. Copy only redacted operational fields to UI-facing telemetry.

```json
{
  "attempt_id": "attempt-000042",
  "logical_item_id": "unit-0003/chunk-0007",
  "parent_attempt_id": "attempt-000041",
  "stage": "chunk_evidence",
  "outcome": "validation_failed",
  "error_class": "output_contract",
  "http_status": 200,
  "finish_reason": "length",
  "validation": {"syntax": "invalid", "schema": "not_run"},
  "effective_request_hash": "sha256:...",
  "fallback_policy": "row_budget:12",
  "input_tokens": 2400,
  "output_tokens": 5200,
  "latency_seconds": 37.8,
  "admission_wait_seconds": 1.2,
  "provider_request_id": "req_...",
  "created_at": "2026-08-11T18:32:10.123Z"
}
```

For a remediated retry, set `parent_attempt_id`, change `effective_request_hash`, and record the new fallback policy (for example, `row_budget:6` or `chunk_split:v1`).

## Metrics that explain a run

Keep these categories separate:

| Measure | Meaning |
| --- | --- |
| Logical item calls | Work requested by the pipeline, excluding valid cache reuse. |
| HTTP attempts | Actual provider calls, including retries and repair requests. |
| Cache hits | Valid completed artifacts reused. |
| Request latency | Provider/network elapsed time; exclude later backoff sleep. |
| Admission wait | Time spent waiting for in-flight/RPM/TPM/cooldown capacity. |
| Stage elapsed | End-to-end wall time, including scheduling and retry. |
| Completion coverage | Completed, fallback, blocked, failed, cancelled, and missing items. |

Calculate percentiles from actual completed attempt durations. Retain the run configuration and cache state with each report; otherwise throughput and cost comparisons are not interpretable.

## Rate-aware admission pseudocode

```text
before every HTTP attempt:
  reserve in-flight slot
  reserve request-rate capacity
  reserve token-rate capacity for max(estimated input, requested output cap)
  honor any global Retry-After cooldown

after response:
  record sanitized rate-limit headers
  update shared controller from authoritative limits when present
  classify and persist outcome
  release in-flight slot before any retry sleep
```

Run retries through the same controller. Unsuccessful calls often count against provider limits, so bypassing admission during a retry can turn a single transient failure into a 429 storm.
