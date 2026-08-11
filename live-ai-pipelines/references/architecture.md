# Architecture patterns for live AI pipelines

Use the smallest durable design that supports the promised resume and preview experience. These are options, not a required platform.

## Separate control from data

| Plane | Typical contents | Purpose |
| --- | --- | --- |
| Control | run/status records, event journal, stage state, timings | explain and resume execution |
| Data | inputs, prompts, complete artifacts, projections, snapshots | inspect and regenerate output |

The browser should consume a projection of these records rather than provider wire events.

## Local-first layout

For a single-machine workflow, this is a useful starting shape:

```text
run-001/
  input/           # immutable source and manifest
  prompts/         # prompt/schema versions
  results/         # complete canonical artifacts
  previews/        # disposable drafts
  telemetry/       # status.json, events.jsonl, optional requests/item-index/lease
  snapshots/       # complete rendered versions and current pointer
```

Use only the pieces the run needs. A database, queue, or hosted event system can replace the files without changing the logical boundary.

## Stage patterns

- **Deterministic:** extract, chunk, hash, validate, and link-check without model calls.
- **Fan-out:** use stable item IDs; emit completed/failed artifacts independently of completion order.
- **Fan-in:** synthesize from bounded normalized IDs, claims/events, evidence references, conflicts, and compact trajectories—not raw text and every earlier display artifact.
- **Projection:** regenerate from canonical results and publish into a new snapshot.

For long-form articles, stream complete section objects or make section-level requests. Treat a partially generated paragraph as a draft rather than a completed sourced section.

## Provider choices

- **OpenAI:** Structured Outputs are useful when parsed schema behavior matters. Capture request/rate-limit identifiers for debugging or scaling.
- **Anthropic:** request, input-token, and output-token limits are distinct. Prompt-cache usage can matter to throughput. For Messages streams, interpret the terminal stop reason.
- **OpenRouter:** the actual route can vary. For schema-critical work, verify support per endpoint and record route metadata when troubleshooting or comparing providers.
- **Batch:** exposes coarse status rather than token-level progress. Split batches only when extra checkpoints justify their overhead.

## Recovery and publication

On restart, enumerate validated canonical results and resume missing idempotency keys. Add an item index, owner lease, and heartbeat only when ownership can be ambiguous or a worker can survive the caller. Do not infer success from a process that happens to be alive.

Render to a new directory, validate the artifact references and links, then atomically advance a current pointer. Keep the previous complete snapshot until the next one is ready.
