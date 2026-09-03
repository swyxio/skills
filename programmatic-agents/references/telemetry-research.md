# Telemetry sources and evidence (2026-09-03)

Prefer supported event streams, then native offline exports, then session-scoped local-store inspection. Local evidence is supplemental and must not overwrite primary results without explicit reconciliation. Do not scan credentials, global settings, all chat history, or unrelated session contents.

## Cursor

[Official output-format reference](https://cursor.com/docs/cli/reference/output-format) documents streaming messages, tool call IDs, and partial output. Partial assistant records with timestamp_ms and no model_call_id are deltas; buffered/final flushes can duplicate text. The terminal result remains authoritative. System-init model is a display label, not proof of a served model slug. The adapter now handles this distinction and records tool correlation IDs.

Local observation with CLI 2026.09.02-c22c1a3: the new smoke run emitted system/user/assistant/result plus five thinking events, despite the documentation's suppression statement. Treat this as version-specific output; do not require or reconstruct reasoning. ~/.cursor/chats/<workspace-hash>/<session-UUID>/store.db contains SQLite blobs/meta tables. Their payload encoding has not been validated. The reader inventories tables/counts only when read-only SQLite succeeds. No speculative blob decoding.

## Antigravity

[Official headless reference](https://www.antigravity.google/docs/cli/headless/) documents init, step_update and nested result envelopes. Step events expose state, index, duration, usage, tools, and child-session links. Session aggregates are cumulative; summing repeated snapshots overcounts. The adapter retains latest state per step separately from terminal aggregate usage. Short answers can arrive as one completed step, so first output is not automatically first-token latency.

Local observation: ~/.gemini/antigravity-cli/conversations/<UUID>.db includes steps, gen_metadata, executor_metadata, parent_references and trajectory metadata. Several fields are binary blobs; no stable decoder established. Read-only access succeeded during discovery but failed on later attempts. Record that as unavailable, not an empty trajectory. Global cli.log and log/ may mix runs; the reader does not ingest them. CLI --log-file offers a better per-process diagnostic destination for future explicit content capture.

## Muse

[Meta's launch description](https://research.meta.ai/blog/introducing-muse-code-and-muse-spark-1-2) describes a replayable local event log. Installed Muse 1.0.2 provides stronger practical documentation through `muse export --help`, `muse trace inspect --help`, and `muse schema --help`. Public developer pages were not readable through the research browser; these capabilities were verified directly with the installed CLI.

`muse export --session UUID --redacted --out FILE` is offline. Explicitly name the session; never use --last for concurrent studies. Export schema version 1 contains sessions, events, diagnostics and build metadata. Diagnostics report gaps, duplicates and parse failures. Exports can retain opaque encrypted reasoning blobs; do not decode them or treat redaction as complete anonymization.

Local ~/.local/share/muse/sessions/YYYY/MM/DD/<UUID>/session.jsonl differs from stdout: runtime.session wraps additional events. Our billing-blocked test contained context-block byte counts, model/tool configuration, provider-option/cache-key provenance, and resource usage (RSS, CPU, file descriptors, live processes). The metadata reader now extracts numeric resource samples/context sizes and event counts without copying prompt bodies. Rich lineage/approvals/tool data can be obtained with the native export when explicitly capturing content.

## Codex

[Official observability configuration](https://learn.chatgpt.com/docs/config-file/config-advanced#observability-and-telemetry) documents OTel request/stream/tool events: attempts, HTTP status, duration, approvals and tool results. This is a better route for detailed transport timing than inferred stdout latency. No OTel exporter or global setting has been enabled by this change. A future local-only collector should scope its lifecycle to the test and preserve prompt redaction.

Session rollout JSONL can supplement exec output only when persistence is enabled. The reader takes the latest cumulative token snapshot rather than summing repeated records; rate-limit fields may be unavailable. The shared runner remains ephemeral unless retainLocalSession is explicitly true. Special preview identifiers must come from the user for the current task and are never embedded in this reference.

## Usage

Set `localEvidence: true` to append a metadata-only, session-ID-matched local-store inspection to result.json after a run. Set `retainLocalSession: true` when intentionally retaining Codex/Muse session logs; otherwise their defaults may leave nothing to collect. This changes local retention, not authentication or sandbox policy.

For snapshots while a known session is running, invoke:

```sh
python3 /Users/swyx/Work/skills/programmatic-agents/scripts/local-evidence.py \
  --cli muse --session "$SESSION_ID"
```

Record snapshots in the run's artifact directory. The reader reports file size/mtime and whether JSONL changed during inspection. It does not claim an atomic live JSONL snapshot. SQLite uses a read-only transaction including committed WAL data, never immutable mode on a live store; locked/unreadable databases produce explicit readError. It does not copy databases or replay logs. No background watcher is installed.

## Verified and deferred

Verified: two live streaming smoke runs (Cursor 13.1s, Antigravity 7.1s); local Muse export and event structure; 38 Node tests and 3 Python tests. Live Muse inference remains billing-blocked. Codex OTel ingestion, opaque SQLite payload decoding, cross-vendor billing reconciliation, and automatic native-export capture are researched possibilities, not implemented capabilities.
