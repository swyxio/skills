---
name: babysit-runs
description: Babysit an unattended, long-running or parallel job through completion using existing runners and temporary monitoring. Use when asked to keep a run progressing overnight, saturate available slots, recover failures, and maintain progress reports and ETAs. Not for a one-time status check or concurrency advice alone.
---

# Babysit Runs

Operate existing runners toward the authorized outcome at the agreed quality. Prefer targeted repairs over a new scheduler or pipeline rewrite. Use the selected provider/runtime skill when invocation or access needs troubleshooting; use `live-ai-pipelines` only when recovery architecture needs implementation.

## Adopt, detach and schedule

Inspect actual processes, owners, logs and retained results. Adopt a matching live run rather than launch a duplicate. Discover routine facts from existing metadata and task history instead of re-interviewing the user.

Keep a compact continuation brief in the existing run metadata or monitor prompt:

- Goal, scope, checkout, command, owner and run/log/artifact locations.
- Requested model/provider, shared concurrency ceiling, independent transfer limits and applicable resource/cost bounds.
- Agreed quality references, authorized repairs, completion evidence and release or handoff boundary.
- Current progress, retry state, next recovery time and monitoring/reporting cadence.

Check changed or uncertain dependencies before submitting work: launcher permissions, authentication/model access, actual tool configuration and capacity. Reuse recent comparable successful evidence. Record the effective rules and versions where acceptance or replay depends on them; stale historical instructions must not override the current authorized contract. Do not silently substitute models.

Detach substantial runs using the existing manager or simplest reliable mechanism. Verify that execution survives the launching shell/tool and logs remain discoverable.

Create or update one temporary monitor. In Codex, use the automation tool and a thread heartbeat, normally every five minutes; reuse a matching automation. Use another scheduler when requested or appropriate. Disclose unavailable scheduling rather than promise future check-ins. Make the saved prompt self-contained using the continuation brief, and update it when the run moves or resumes. Persist decisions so wakeups do not depend on conversation memory or a stale PID.

## Saturate useful work

Fill slots with ready work and advance independent items without whole-batch barriers. Parallelize preparation, LLM calls, transfers and downstream stages where dependencies permit. Do not add inference or busywork merely to occupy capacity.

Apply the allowance across all runners sharing the same constrained resource, rather than giving each runner the full ceiling. Keep independently justified transfer/media/provider caps. Retain established healthy concurrency instead of repeating ramp experiments on every resume.

Identify the current bottleneck, commonly LLM calls or data transfer. Adjust parallelism using comparable accepted throughput, latency, retries, throttling and resource pressure. Downshift when useful performance degrades and recover capacity when healthy. Increase capacity at the demonstrated bottleneck; active-call count alone is not success.

## Recover without losing successful work

Each check compares accepted/remaining counts, active/queued stages, oldest work, ownership, recent logs, deliveries and retry state with the previous observation. Quiet logs alone do not establish a stall; use representative durations and other progress signals.

Isolate failed items or surfaces while independent work continues. Before replacement, reconcile retained results and cancel or fence a stale owner. Drain affected active work before activating incompatible runner changes. Preserve successful stages and repair only the failed dimension.

- **Established intermittent failure:** recover automatically with bounded backoff and jitter. A status code alone does not establish quota exhaustion or permanent denial.
- **Explicit authentication, entitlement or quota failure:** isolate the affected surface and use normal authorized recovery. If external action is needed, report the concrete requirement.
- **Unknown delivery:** inspect retained output, request IDs and available provider status/idempotency before resubmission. Preserve attempt history; missing local output does not establish that no result was produced.
- **Runner or content defect:** fix the demonstrated cause and resume unfinished work, rather than regenerate accepted results.

Use bounded immediate retries, followed by persisted cooldowns for periodic outages. Respect existing budgets. Wakeups must not reset retry history. When repeated recovery produces no useful progress, diagnose or pause the affected work and report evidence instead of maintaining a hot retry loop. Routine recoverable failures should not require another approval interruption.

## Preserve quality; remove accidental gates

Use agreed examples and past transcripts to judge quality and unnecessary blockers. Local repairs may address runner bugs, contradictory stage rules, performance and finishing defects within the authorized goal. Throughput improvements must preserve substantive quality.

Separate content acceptance, execution validity and metadata completeness. Suggestions and model self-check flags do not become blockers without evidence of a defect. Retain required blockers for demonstrated unsupported claims, identity conflicts or substantive loss where those affect the task. Declared tool access should match actual execution; do not allow normal tool use and reject it downstream.

Sample after changes that could materially affect agreed quality, using existing accepted calibration when sufficient. Test the affected interaction when a repair risks acceptance, replay or output integrity. Neither sampling nor broad verification is a prerequisite for every resume. Stop gathering proof once the relevant risk and authorized outcome are resolved. Preserve applicable privacy, security and release boundaries.

## Log performance and forecast variance

Use existing structured logs/status artifacts, not a new telemetry service. Where available, record run/item/stage/attempt IDs, model/provider, input size, concurrency, queue/start/end timestamps, outcome, retry reason and output receipt. For transfers, record bytes and duration. Exclude credentials and unnecessary source content. Missing optional instrumentation should not stop useful work.

Retain initial stage estimates separately from revised forecasts. Track estimated versus actual duration, absolute and percentage variance, remaining work and accepted throughput. Separate queue wait, service/transfer time, retries/backoff and external waits; do not double-count overlapping intervals. Compare similar stages, input sizes, models and concurrency. Use median/p90 when samples support them and label sparse or unmeasured estimates.

Diagnose the largest unexpected delay on the critical path: slow calls, starvation, transfers, repairs or gating. Record performance changes with their hypothesis and before/after useful throughput. Variance is a diagnostic signal, not an automatic blocker.

Normally inspect every five minutes and report meaningful progress at most every fifteen minutes; report completion or required action promptly and stay quiet when unchanged. Include accepted/total, remaining, active/queued work, concurrency, failures/repairs, elapsed timings, bottleneck and updated ETA. Distinguish generated, accepted and released output.

Forecast from observed comparable work, current capacity and parallel dependencies. Explain material drift against the original estimate, including its causes. Separate execution, outage and approval waits; acknowledge unknown recovery time. At completion, retain a compact estimated-versus-actual stage breakdown for future calibration.

## Stop and hand off

Completion is the authorized outcome: validated outputs for generation, or deployment/live evidence when shipping was authorized. Optional unavailable checks are disclosed; a blocked required dependency receives a precise incomplete handoff.

Link outcomes and remaining qualifications. Pause the monitor after verified completion or explicit external handoff. Preserve reusable results and receipts; clean known disposable resources and avoid orphaned workers or duplicate monitors. Babysitting does not itself authorize additional scope or publication.
