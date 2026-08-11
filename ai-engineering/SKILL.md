---
name: ai-engineering
description: Engineer, debug, or review AI and LLM-backed software for reliability. Use when structured model output, retries, concurrency, rate limits, caching, telemetry, evaluation, cancellation, or long-running fan-out can affect correctness, cost, or completion; especially after malformed JSON, truncation, 429s, opaque stalls, duplicated work, or missing run metrics.
---

# AI Engineering

Build the LLM boundary as a measured, versioned subsystem. A response is not a successful result until it validates against the intended contract; a retry is not safe unless it addresses the failure class; a completed-looking run is not operable unless its telemetry survives failure.

Use this skill with a runtime/provider skill when an external API is in scope. For current OpenAI request shapes, limits, or Structured Outputs behavior, also load `openai-docs`. For a multi-minute workflow with UI/event/snapshot requirements, also load `live-ai-pipelines`; this skill owns the request, retry, cache, and measurement discipline rather than a job-state UI. Read [provider operation notes](references/provider-operation-notes.md) whenever the adapter is OpenAI, Anthropic, or OpenRouter; verify volatile API details against the provider's current documentation before implementation.

## Reliability contract

Define a **run-level contract** before remote work begins. It is a hard requirement for a costly, externally billed, broad fan-out—not a replacement for a small, clearly bounded pilot. Declare the run owner/lease, stage graph, cancellation behavior, publication policy, telemetry locations, and the calibrated request profiles it may admit. A core artifact may publish with optional enrichments visibly pending or failed unless the user explicitly requires enrichment for completion.

Before coding, define for every model request:

- **logical item:** stable item ID and source/input scope;
- **effective request:** model, provider, transport, messages, decoding settings, output cap, schema, and fallback policy;
- **success:** provider response plus schema validation plus domain invariants;
- **attempt:** one actual HTTP call, with a separate ID and outcome;
- **cache identity:** hash of the effective request and input, not merely the logical item;
- **terminal states:** completed, completed-with-fallback, blocked-for-review, failed, cancelled.

Keep observed source data, generated prose, inferred claims, and repair output distinct. Do not silently turn a degraded fallback into an equivalent canonical result.

Maintain a required profile matrix, one row per request class, before broad fan-out:

| Request class | Input budget | Output cap | Source/packet rule | Success invariants | Remediation ladder | Timeout/retry policy | Criticality |
| --- | --- | --- | --- | --- | --- | --- | --- |
| compact extraction | bounded source span | bounded rows/quotes | raw source only | schema + locators | reduce rows → split | transient only | core |
| unit synthesis | bounded local observations | bounded beats | local normalized packet | coverage + schema | split unit | transient only | core |
| long-form projection | bounded evidence packet | bounded sections | ranked evidence + trajectory | citations + prose contract | reduce sections → packet split | transient only | optional/core |
| global synthesis | bounded graph projection | bounded decisions | normalized IDs/summaries, never raw corpus | referential invariants | partition/reduce | transient only | core |

Use explicit values, not these illustrative defaults. A generic “compact retry” is invalid unless the recorded profile difference actually changes the prompt, schema, source boundary, or allowed budget.

## Workflow

### 1. Inspect the real boundary

Find the client wrapper, schema/parser, fan-out executor, rate limiting, cache, retry loop, error handling, and telemetry sink before changing behavior. Establish the current definitions of “call,” “attempt,” “cache hit,” and “complete.” Preserve valid cached artifacts and do not expose credentials or raw sensitive inputs in logs.

### 2. Make structured output bounded and verifiable

Prefer provider-native strict structured output where it supports the required schema. Design schemas to fit a known response budget:

- cap array lengths, quote lengths, prose section counts, and nesting depth;
- split independent observations into separate source-scoped requests rather than one giant object;
- validate syntax, schema, evidence/ID references, and domain invariants before publishing;
- treat streamed deltas as provisional until a complete validated item exists.

Use a calibration cohort before costly, irreversible, or broad fan-out. Include typical, sparse, and dense inputs. Measure valid output-token distribution, `finish_reason`, validation failures, and latency. Set output caps per request class—compact extraction, long-form generation, and global synthesis should not share one arbitrary global cap. For a small bounded pilot, record the same signals and warn on cap pressure; do not block progress merely because the pilot is exploratory.

Treat **input context** as an equally explicit budget. Large-context long-form requests often become the dominant cost and latency even when their outputs validate. Define a request profile for each class with an input target, output target, and allowed source coverage:

- compact source observations: narrow source span, evidence-bearing rows, small arrays;
- unit/chapter synthesis: compact prior observations, not the complete raw document;
- entity or relationship dossier: deduplicated, ranked evidence plus a compact trajectory over units;
- global synthesis: normalized IDs and summaries, not every raw quote.

Before a long-form fan-out, build a deterministic evidence packet: deduplicate near-identical observations, rank by recurrence/story pressure/source coverage, preserve conflicting evidence, and retain stable evidence IDs/locators. Include a bounded representative set rather than passing every matching fact to every dossier. Record the packet hash, evidence count, source-unit coverage, estimated input tokens, and the declared input budget. A well-supported long article should be evidence-selective, not context-unbounded. Global synthesis must consume a normalized graph projection (stable entities, claims, events, contradictions, compact trajectories), not raw chunk responses, display strings, or an unbounded pile of prose.

Use calibration as a gate, not merely a report. If dense valid outputs approach the cap, or if any calibration item ends with `finish_reason=length`, shrink/split the request contract before launching the broad fan-out. Do not discover a systematic schema-size mismatch halfway through hundreds of expensive calls.

### 3. Separate concurrency from rate control

Treat workers as an **in-flight** limit only. Put every attempt, including retries, through a shared admission controller with:

1. maximum in-flight requests;
2. request-rate pacing;
3. token-rate pacing using `max(estimated_input_tokens, requested_output_cap)`;
4. dynamic provider-header updates and `Retry-After` cooldown.

Start conservatively, then change one material variable at a time. Use observed completed items/minute, token throughput, p50/p95 latency, 429 rate, retries, and remaining capacity to decide whether to raise in-flight capacity. Do not interpret a faster warm-cache rerun as a concurrency win.

### 4. Classify failures before retrying

Use the decision table in [references/failure-matrix.md](references/failure-matrix.md). The critical rule is: **do not replay an identical request after a contract failure.** `finish_reason=length`, HTTP 200 with invalid JSON, or schema-invalid output requires a bounded remediation—split the input, reduce explicitly allowed row/prose budgets, make a permitted repair/continuation request, or route the item to review.

When remediation changes prompt, schema, chunk boundary, model, token cap, or decoding mode, generate a new effective request hash and link it to the parent item. Record the before/after contract delta, coverage degradation, and fallback status so downstream consumers can decide whether it is acceptable. `completed_with_fallback` is a separate terminal lineage, never a cache hit for the original rich contract.

Make the remediation ladder finite and visible. For example: rich extraction → smaller declared row budget → deterministic chunk split → `blocked_for_review`. If a class repeatedly reaches the output cap, stop treating each item as an isolated bad response: pause that fan-out, surface an output-budget incident, and revise the request profile. A compact fallback may be useful for progress, but it is a lower-coverage result—not proof that the original contract succeeded.

### 5. Persist attempts and results independently

Write valid canonical artifacts atomically. Keep protected failure diagnostics separate. Persist an attempt record before starting a retry and a status/summary snapshot on every terminal path, including exceptions and cancellation. Maintain an authoritative item index keyed by logical item and effective request hash; cache directories alone are not a progress tracker. Each item needs a durable latest state, last attempt, result reference, effective contract, and heartbeat/lease linkage.

Record, at minimum:

- logical items requested, complete, blocked, failed, cancelled, and completed with fallback;
- HTTP attempts, cache hits, retries, status/error class, finish reason, validation result, and fallback policy;
- input/output/reasoning/total tokens when available;
- request latency excluding retry sleep, admission wait, stage elapsed, and queue time;
- sanitized request IDs, rate-limit limits/remaining/reset values, and `Retry-After`;
- requested/actual model/provider/transport and effective request hash.

Do not wait until a pass succeeds to write metrics. A failed run must answer what was attempted, what completed, why it stopped, and how to resume.

A success cache is a data-plane artifact, not complete telemetry. It cannot reveal failed attempts, malformed HTTP-200 responses, rate-limit headers, queue/admission wait, or work that was still in flight at interruption. Write an append-only attempt/event journal and an atomically replaced status snapshot throughout execution. Use the cache to resume canonical data; use telemetry to explain the run.

### 6. Make cancellation and fan-out failure deliberate

On cancellation or an unrecoverable item failure, stop admitting new work, emit a terminal stage/run event, cancel unstarted work where supported, give in-flight work a bounded grace period, and flush artifacts plus telemetry. Do not let executor shutdown silently wait forever for sibling futures after the first error. Preserve valid sibling results and classify unresolved items as retryable or blocked.

Treat loss of the controlling terminal, parent task, or UI connection as a lifecycle event too. Decide explicitly whether the worker is detached-and-continuing or cancelling; never leave this to accidental process behavior. Persist `run_state`, `owner`, `owner_pid`, `process_group`, `lease_id`, `lease_expires_at`, `started_at`, `last_heartbeat`, and `cancellation_requested_at`, and make restart/re-attachment safe. A detached run should keep publishing status; a cancelled run should not keep admitting work after its caller believes it stopped. The cancelling owner must signal and reap its owned worker process group, or transfer the lease to a documented detached supervisor; a new runner may reclaim an expired lease only after checking that the old owner is gone.

### 7. Verify the unhappy paths

Test a real or mocked instance of each relevant class: 429 with `Retry-After`, timeout/5xx, malformed JSON, `finish_reason=length`, schema-invalid 200, refusal/content filter, mid-stream failure, duplicate delivery, cancellation, restart, and cache reuse. Assert both behavior and durable artifacts/metrics.

## Completion standard

Hand off a measured report, not just a green terminal message: scope, valid/cache/fallback/failed counts, stage timings, p50/p95/max request latency, admission waits, logical calls versus HTTP attempts, retries/429s, token usage/cost estimate, observed limits, and exact output/telemetry locations. Include input/output-token distributions by request class, cap-pressure (`finish_reason=length`/validation-failure) counts, input-packet sizes/source coverage, and whether any results were generated under a reduced fallback contract. Keep the configuration manifest so the next experiment can change one variable deliberately.

Read [references/failure-matrix.md](references/failure-matrix.md) for the error-to-action table, cache identity rules, and a compact attempt record.
