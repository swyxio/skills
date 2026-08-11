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
| Dense valid output repeatedly near its cap | Output-budget pressure | Pause broad fan-out; recalibrate output budget/schema or split the request class before spending more calls. | New effective request if changed. |
| High p95 latency with no rate-limit pressure | Generation/context bottleneck | Measure in-flight utilization and input packet size; reduce/pack context before raising workers. | Same request for measurement; new effective request if context changes. |
| Valid schema but unsupported facts/claims | Semantic quality | Run evaluator/targeted re-extraction with source evidence. | New evaluation or source-scoped request. |
| Fallback validates but has lower coverage | Degraded canonical result | Store under its changed effective request hash; mark `completed_with_fallback`, expose the contract delta, and do not satisfy a rich-contract cache lookup. | New effective request. |
| User cancellation, process termination, or lost controller | Lifecycle interruption | Explicitly cancel or detach; stop admission if cancelling, flush status, classify in-flight work. | Resume only missing valid results. |

An HTTP 200 is an **attempt-level** success, not an item-level success. A canonical item requires all declared validation checks.

## Remediation menu for oversized structured output

Choose one bounded intervention and record it:

1. Split the input at a deterministic source boundary.
2. Lower a declared row, quote, field-length, or prose-section budget.
3. Separate compact facts/evidence extraction from long-form synthesis.
4. Send a permitted repair or continuation request with an explicit partial-output policy.
5. Mark the item `blocked_for_review` when any smaller contract would compromise required coverage.

Never repeat an unchanged oversized request several times and call it resilience. It only adds cost and consumes rate-limit capacity.

## Input-packet discipline for long-form work

An output that fits the schema can still be an operational failure when every
long-form item receives an unbounded evidence bundle. Build a request packet
before asking for a dossier or other prose projection:

1. Deduplicate equivalent observations and quotes.
2. Rank evidence by source-unit coverage, recurrence, causal/event pressure,
   relationship impact, and contradiction value.
3. Preserve a compact chronological trajectory and all conflicting evidence.
4. Keep stable evidence IDs and source locators for every included claim.
5. Enforce a per-class input-token budget and record omitted-but-available
   evidence counts.

Do not substitute raw-context volume for quality. A dossier needs enough
representative evidence to write grounded prose, not every observation that
mentions its subject.

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

## Run and item ownership

Use a durable item index in addition to result files and caches. Each row must identify the logical item, latest effective request hash, terminal/non-terminal state, last attempt, canonical artifact (if any), and active run lease. A directory that happens to contain cached files cannot establish whether other items failed, were retried, or are still running.

For a run that can outlive its terminal or UI owner, persist `owner_pid`, `process_group`, `lease_id`, `lease_expires_at`, and `last_heartbeat`. On cancellation, stop admissions and signal the owned process group. On a lease-expiry recovery, verify the prior owner is no longer active before reclaiming work. A detached supervisor must keep status and heartbeat publication alive.

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
  "request_class": "compact_extraction",
  "input_budget_tokens": 8000,
  "estimated_input_tokens": 2400,
  "output_budget_tokens": 5200,
  "evidence_packet": {"included": 18, "available": 44, "source_units": 3},
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
| Cap pressure | Near-cap valid outputs, `finish_reason=length`, and validation failures by request class. |
| Context pressure | Input-packet token distribution, evidence included/available, and source-unit coverage. |

Calculate percentiles from actual completed attempt durations. Retain the run configuration and cache state with each report; otherwise throughput and cost comparisons are not interpretable.

Do not infer HTTP-attempt count, rate-limit behavior, or latency percentiles
from successful cache records alone. The cache is necessary for resume but it
omits failed/retried/in-flight attempts unless those are persisted separately.

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
