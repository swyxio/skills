---
name: ai-engineering
description: Diagnose or improve reliability of a structured, multi-request, rate-limited, or cost-sensitive AI workflow. Use for malformed or truncated outputs, retry/rate-limit failures, unreliable fan-out, cache/resume bugs, or missing run telemetry. Do not use for ordinary prompt edits or simple one-shot model calls.
---

# AI Engineering

Use enough structure to make a model workflow explainable and recoverable without
turning every prototype into an operations project. This skill owns request
validation, retry/cache behavior, rate-aware fan-out, and measurement. Pair it
with `live-ai-pipelines` only when a run needs live progress or durable resume.

For provider-specific API behavior, read [provider operation notes](references/provider-operation-notes.md) when the adapter is OpenAI, Anthropic, or OpenRouter, then verify volatile details in current provider docs. For image/video generation or FAL model fan-outs, read [image, video, and FAL operation notes](references/image-video-fal.md).

## Useful defaults

- Do not publish a malformed, partial, or schema-invalid result as complete.
- For a machine-consumed structured artifact, use the selected model provider's documented native structured-output API with an explicit schema. Do **not** treat a free-form completion prompted with “return JSON” plus local `JSON.parse` as structured output.
- Prefer the official provider API for schema-critical work. A router is acceptable only when its exact pinned endpoint advertises native structured-output support and a canary has verified the complete request/stream/validation path; otherwise call the provider directly.
- Prompted JSON is acceptable only as a human-readable/debug artifact. It is not an input contract for a canonical graph, database write, workflow transition, or published page.
- Keep observed source data, generated prose, inferred claims, and repair output distinct when downstream consumers need that distinction.
- Treat workers as an in-flight limit, not as a request-rate setting.
- When a fallback changes coverage or semantics, record that difference rather than silently treating it as the richer result.
- Keep provider delivery separate from domain or human acceptance; a valid artifact URL does not establish that an image, video, or other subjective output is usable.
- Keep enough redacted telemetry to answer what happened, what it cost, and what may safely resume.

## Workflow

### 1. Inspect the boundary

Find the client wrapper, parser/schema, fan-out helper, cache, retry loop, and telemetry sink before changing behavior. Establish what the code currently calls a request, attempt, cache hit, and completed item. Preserve valid artifacts and keep credentials or sensitive source text out of logs.

### 2. Shape the request before scaling it

Bound arrays, quotes, prose sections, and nesting to a response size the model can finish. Validate syntax, schema, source references, and any domain invariants that make the result usable.

**Do not use “please return JSON” + a local parser as the primary structured-output mechanism.** In a dense long-form extraction workload, that pattern produced roughly 47–52% retries despite HTTP 200 responses: it conflated malformed text, empty final content, mid-stream errors, and `finish_reason=length` with ordinary JSON parsing. Treat that as an unacceptable calibration result, not a universal percentage. Use native schema-constrained output first; still validate the completed object locally, because syntax/schema conformance does not establish source grounding or semantic correctness.

For an expensive or broad fan-out, run a small sparse/typical/dense sample first. Use the result to tune per-class input and output budgets. Long-form requests benefit from a bounded evidence packet: deduplicate, rank representative support, preserve conflicts, and keep stable locators. Global synthesis should receive normalized IDs and compact summaries rather than the raw corpus plus every intermediate artifact.

For heterogeneous model fan-outs, define endpoint-specific capability and payload profiles. Include reference topology and ordering, supported parameters, safety-control fields, output schema, and fallback policy in the effective request. Do not send a universal parameter bundle or guessed provider controls.

### 3. Scale deliberately

Start with modest in-flight concurrency. Pace requests and tokens separately, honor `Retry-After`, and use provider headers when available. Raise concurrency only after measuring throughput, latency, retries, 429s, context size, and remaining headroom; high latency can be a context or generation bottleneck rather than a rate-limit problem.

### 4. Repair by failure class

Retry transient network failures through the same limiter. When a structured response is truncated or invalid, change something relevant—split the source, reduce the declared response shape, or make an allowed repair/continuation request—instead of replaying the same contract. For a changed fallback, link the new request to the parent and expose any coverage loss.

See [failure matrix](references/failure-matrix.md) for practical actions and lightweight attempt fields.

### 5. Persist proportionately

For a significant run, write complete artifacts atomically and maintain a status snapshot plus attempt history. A success cache can resume results but cannot explain failed attempts, waits, headers, or interruption. Record the logical item, effective request, outcome, latency, usage/cost when available, and redacted provider identifiers.

For subjective artifacts, persist provider completion and human adjudication independently. Support blind evaluation when requested: store artifact references and operational metadata without fetching, opening, classifying, or scoring the artifact, and leave acceptance to the named reviewer.

If workers can outlive their caller or another runner may resume work, add explicit ownership, heartbeats, and cancellation behavior. A simple in-process job does not need a lease protocol.

### 6. Verify the relevant unhappy paths

Exercise the failures that the chosen provider and artifact contract make material: rate limits, timeouts, malformed/length-limited output, duplicate delivery, cancellation, restart, and cache reuse. Hand off the result coverage, notable fallbacks, cost/latency, and output/telemetry locations for significant runs.

## References

- [Failure matrix and attempt record](references/failure-matrix.md) — choose a failure response, cache identity, and minimal telemetry.
- [Provider operation notes](references/provider-operation-notes.md) — conditional OpenAI, Anthropic, and OpenRouter quirks.
- [Image, video, and FAL operation notes](references/image-video-fal.md) — artifact-generation contracts, blind evaluation, reference topology, asynchronous queues, and exact-model comparisons.
