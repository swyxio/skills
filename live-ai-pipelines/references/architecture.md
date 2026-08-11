# Live pipeline architecture

This reference describes the default architecture for a long-running AI workflow that must remain inspectable while it executes. It is intentionally local-first and can be replaced with a queue, database, or hosted event system when scale requires it.

## Two planes

| Plane | Durable artifacts | Consumers |
| --- | --- | --- |
| Control | `run.json`, `status.json`, `events.jsonl`, stage checkpoints, timings, retry metadata | CLI, dashboard, monitors, resumable runner |
| Data | immutable inputs, prompts, complete model results, evidence, projections, audits, snapshots | renderer, search, downstream stages, reviewer |

The control plane tells the UI what is happening. The data plane tells the UI what is available to inspect. Neither should require the browser to understand the model provider’s wire protocol.

## Suggested run tree

```text
run-2026-08-11-001/
  input/
    source.epub
    input-manifest.json
  extracted/
    units.jsonl
    chunks.jsonl
  prompts/
    pass1-chunk-evidence.prompt.md
    pass1-chunk-evidence.schema.json
  results/
    pass1-chunk-evidence/
      chunk-000001.json
      chunk-000002.json
    pass5-dossiers/
      entity-00017.json
  previews/
    incoming.jsonl
    partial-dossiers/
  telemetry/
    run.json
    status.json
    events.jsonl
    events.seq
    item-index.jsonl
    lease.json
    stage-state/
      pass1.json
      pass5.json
    requests/
      req-000001.json
  snapshots/
    site-0001/
    site-0002/
    current -> site-0002
```

Keep complete canonical results separate from previews. A preview may be deleted and rebuilt from events/results; a canonical result should be immutable once published.

## Stage classes

### Deterministic stages

Examples: EPUB/PDF extraction, chunking, hashing, chapter detection, manifest creation, schema validation, link checks, and graph invariants.

Display these immediately and with high confidence. Include source locators, input hashes, counts, warnings, and coverage. Do not spend model calls to report deterministic facts.

### Fan-out stages

Examples: chunk observations, unit summaries, entity dossiers, location dossiers, illustration prompts, and relationship pages.

Every item should have a stable `item_id`, input hash, prompt/schema hash, attempt, transport, and result artifact. Emit `request_started`, `request_completed`, or `request_failed` per item. Completion order need not match source order; the UI can sort by source order after receiving the events.

### Fan-in stages

Examples: global taxonomy, canonical entity registry, plot synthesis, timeline ordering, graph publication policy, and full audit.

These stages depend on a larger completed set. Build their input from a bounded normalized projection: stable IDs, accepted claims/events, evidence references, contradictions, and compact trajectories. Do not concatenate raw source text, every chunk observation, or prior display prose. Show a draft or progress shell, but do not merge partial global conclusions into the canonical graph unless the stage explicitly defines a commutative/incremental algorithm.

### Projection stages

Examples: static HTML, search indexes, graph views, API payloads, and dashboard summaries.

Projection stages must be reproducible from canonical results. Render to a new directory and atomically advance the current pointer.

## Streamable schema design

Prefer this shape:

```json
{
  "observations": [
    {
      "observation_id": "obs-0001",
      "kind": "entity_mention",
      "surface_form": "Example",
      "evidence_ids": ["ev-0001"],
      "status": "observed",
      "confidence": 0.84
    }
  ],
  "claims": [],
  "events": [],
  "relationships": [],
  "uncertainties": [],
  "prose_sections": []
}
```

Design rules:

- Put appendable arrays first and long strings later.
- Make each array item independently useful and bounded in size.
- Give every item a stable ID and evidence/source references.
- Include `status`, `confidence`, `polarity`, and `uncertainty` where interpretation is possible.
- Prefer references to prior IDs over embedding a second copy of a large object.
- Avoid relying on array order for identity; include an explicit ordinal if display order matters.
- Keep giant aggregate objects, global graph rewrites, and unbounded prose out of the first streaming response.
- Validate the final object against the full schema even if individual preview items were parsed earlier.

For long-form articles, either stream `prose_sections` as complete section objects or make a separate section-level text request. A partially generated paragraph can be shown as a draft, but it must not be mistaken for a completed sourced section.

## Provider routing

Direct OpenAI Structured Outputs are the baseline when schema behavior and parsed streaming matter. Use the official SDK stream helpers where available; persist request IDs and rate-limit headers for every attempt.

For Anthropic, treat request, input-token, and output-token limits as separate controller dimensions. Prompt caching can materially change input-rate headroom, so persist the usage breakdown rather than only total input. In streaming Messages, use the terminal `message_delta` stop reason to decide whether the response completed, exhausted `max_tokens`, paused, requires tool handling, or refused.

OpenRouter is useful for model/provider comparisons. Require structured-output parameters during routing, verify support per endpoint rather than per model, and record requested models/provider policy plus the actual provider/model and generation ID. Opt in to router metadata for diagnostic runs; its fields are additive. Treat an in-progress stream as non-retryable after content has reached the client unless the application can tolerate duplicate work.

Batch APIs provide coarse progress. Poll the batch, record status transitions, and emit one completion event for each recovered output. Split a large batch into smaller slices only when the additional checkpoints justify extra submission and polling overhead.

## UI fidelity levels

Use visible state labels rather than hiding incompleteness:

| State | UI content | Meaning |
| --- | --- | --- |
| `deterministic` | source inventory, locators, counts | computed without model judgment |
| `observed` | chunk evidence and local mentions | extracted from a completed source scope |
| `summarized` | unit summary and local beats | synthesized within one source unit |
| `resolved` | canonical entity/alias mapping | registry pass has accepted the mapping |
| `candidate` | themes, plotlines, inferred relationships | useful hypothesis, not established fact |
| `published` | significant article/projection | passed the publication policy |
| `complete` | run/stage/audit complete | expected work and validation have finished |

Always show coverage, last update time, source scope, and whether later work can change the displayed interpretation.

## Recovery algorithm

On startup:

1. read `run.json`, `lease.json`, the latest status, and item index;
2. verify whether the previous owner is alive before reclaiming an expired lease;
3. enumerate complete result artifacts;
4. validate artifact envelopes and schema hashes;
5. rebuild or verify stage checkpoints from index entries and results;
6. mark abandoned requests as retryable, cancelled, or failed;
7. resume only missing idempotency keys;
8. republish previews and snapshots from canonical artifacts.

Do not infer completion from a worker process that is no longer alive. Do not delete old snapshots as part of recovery.

## Operational defaults

- One writer for an event journal unless a real multi-writer design exists.
- Monotonic event sequence numbers; gaps are acceptable, duplicate IDs are not.
- Atomic writes for status, result, manifest, and snapshot pointers.
- Immediate event append; debounced expensive projection rendering.
- SSE for one-way UI updates; polling with `after=<seq>` for reconnect and fallback.
- Keep the last complete snapshot available until the next one passes validation.
- Capture elapsed time for extraction, each stage, each batch slice, and each model request.
