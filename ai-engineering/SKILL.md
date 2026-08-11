---
name: ai-engineering
description: Engineer, debug, or review AI and LLM-backed software for reliability. Use when structured model output, retries, concurrency, rate limits, caching, telemetry, evaluation, cancellation, or long-running fan-out can affect correctness, cost, or completion; especially after malformed JSON, truncation, 429s, opaque stalls, duplicated work, or missing run metrics.
---

# AI Engineering

Build the LLM boundary as a measured, versioned subsystem. A response is not a successful result until it validates against the intended contract; a retry is not safe unless it addresses the failure class; a completed-looking run is not operable unless its telemetry survives failure.

Use this skill with a runtime/provider skill when an external API is in scope. For current OpenAI request shapes, limits, or Structured Outputs behavior, also load `openai-docs`. For a multi-minute workflow with UI/event/snapshot requirements, also load `live-ai-pipelines`; this skill owns the request, retry, cache, and measurement discipline rather than a job-state UI.

## Reliability contract

Before coding, define for every model request:

- **logical item:** stable item ID and source/input scope;
- **effective request:** model, provider, transport, messages, decoding settings, output cap, schema, and fallback policy;
- **success:** provider response plus schema validation plus domain invariants;
- **attempt:** one actual HTTP call, with a separate ID and outcome;
- **cache identity:** hash of the effective request and input, not merely the logical item;
- **terminal states:** completed, completed-with-fallback, blocked-for-review, failed, cancelled.

Keep observed source data, generated prose, inferred claims, and repair output distinct. Do not silently turn a degraded fallback into an equivalent canonical result.

## Workflow

### 1. Inspect the real boundary

Find the client wrapper, schema/parser, fan-out executor, rate limiting, cache, retry loop, error handling, and telemetry sink before changing behavior. Establish the current definitions of “call,” “attempt,” “cache hit,” and “complete.” Preserve valid cached artifacts and do not expose credentials or raw sensitive inputs in logs.

### 2. Make structured output bounded and verifiable

Prefer provider-native strict structured output where it supports the required schema. Design schemas to fit a known response budget:

- cap array lengths, quote lengths, prose section counts, and nesting depth;
- split independent observations into separate source-scoped requests rather than one giant object;
- validate syntax, schema, evidence/ID references, and domain invariants before publishing;
- treat streamed deltas as provisional until a complete validated item exists.

Use a calibration cohort before full fan-out. Include typical, sparse, and dense inputs. Measure valid output-token distribution, `finish_reason`, validation failures, and latency. Set output caps per request class—compact extraction, long-form generation, and global synthesis should not share one arbitrary global cap.

### 3. Separate concurrency from rate control

Treat workers as an **in-flight** limit only. Put every attempt, including retries, through a shared admission controller with:

1. maximum in-flight requests;
2. request-rate pacing;
3. token-rate pacing using `max(estimated_input_tokens, requested_output_cap)`;
4. dynamic provider-header updates and `Retry-After` cooldown.

Start conservatively, then change one material variable at a time. Use observed completed items/minute, token throughput, p50/p95 latency, 429 rate, retries, and remaining capacity to decide whether to raise in-flight capacity. Do not interpret a faster warm-cache rerun as a concurrency win.

### 4. Classify failures before retrying

Use the decision table in [references/failure-matrix.md](references/failure-matrix.md). The critical rule is: **do not replay an identical request after a contract failure.** `finish_reason=length`, HTTP 200 with invalid JSON, or schema-invalid output requires a bounded remediation—split the input, reduce explicitly allowed row/prose budgets, make a permitted repair/continuation request, or route the item to review.

When remediation changes prompt, schema, chunk boundary, model, token cap, or decoding mode, generate a new effective request hash and link it to the parent item. Record coverage degradation or fallback status so downstream consumers can decide whether it is acceptable.

### 5. Persist attempts and results independently

Write valid canonical artifacts atomically. Keep protected failure diagnostics separate. Persist an attempt record before starting a retry and a status/summary snapshot on every terminal path, including exceptions and cancellation.

Record, at minimum:

- logical items requested, complete, blocked, failed, cancelled, and completed with fallback;
- HTTP attempts, cache hits, retries, status/error class, finish reason, validation result, and fallback policy;
- input/output/reasoning/total tokens when available;
- request latency excluding retry sleep, admission wait, stage elapsed, and queue time;
- sanitized request IDs, rate-limit limits/remaining/reset values, and `Retry-After`;
- requested/actual model/provider/transport and effective request hash.

Do not wait until a pass succeeds to write metrics. A failed run must answer what was attempted, what completed, why it stopped, and how to resume.

### 6. Make cancellation and fan-out failure deliberate

On cancellation or an unrecoverable item failure, stop admitting new work, emit a terminal stage/run event, cancel unstarted work where supported, give in-flight work a bounded grace period, and flush artifacts plus telemetry. Do not let executor shutdown silently wait forever for sibling futures after the first error. Preserve valid sibling results and classify unresolved items as retryable or blocked.

### 7. Verify the unhappy paths

Test a real or mocked instance of each relevant class: 429 with `Retry-After`, timeout/5xx, malformed JSON, `finish_reason=length`, schema-invalid 200, refusal/content filter, mid-stream failure, duplicate delivery, cancellation, restart, and cache reuse. Assert both behavior and durable artifacts/metrics.

## Completion standard

Hand off a measured report, not just a green terminal message: scope, valid/cache/fallback/failed counts, stage timings, p50/p95/max request latency, admission waits, logical calls versus HTTP attempts, retries/429s, token usage/cost estimate, observed limits, and exact output/telemetry locations. Keep the configuration manifest so the next experiment can change one variable deliberately.

Read [references/failure-matrix.md](references/failure-matrix.md) for the error-to-action table, cache identity rules, and a compact attempt record.
