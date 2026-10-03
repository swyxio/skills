---
name: babysit-runs
description: Operate unattended runs through completion, from a single detached pilot to a large batch. Instrument execution, inspect traces and output quality, recover failures, and improve demonstrated performance or reliability problems using the existing workflow and temporary monitoring. Use for supervised pilots, overnight runs and bounded autonomous optimization, not a one-time status check or concurrency advice alone.
---

# Babysit Runs

Operate existing runners toward the authorized outcome at the agreed quality. Prefer targeted repairs over a new scheduler or pipeline rewrite. Use the selected provider/runtime skill when invocation or access needs troubleshooting; use `live-ai-pipelines` only when recovery architecture needs implementation.

## Choose the operating mode

**Completion mode:** finish the authorized workload using the established implementation, repairing defects as needed.

**Pilot-and-improve mode:** exercise an existing or modified workflow on representative inputs, inspect execution and output quality, and make bounded improvements before broader rollout. State what is being tested, the quality baseline, resource/spending limits and the completion boundary. A pilot is complete when the requested behavior is demonstrated and material findings are resolved or clearly reported; optional optimization ideas do not keep it running indefinitely.

## Adopt, detach and schedule

Inspect actual processes, owners, logs and retained results. Adopt a matching live run rather than launch a duplicate. Discover routine facts from existing metadata and task history instead of re-interviewing the user.

Keep a compact continuation brief in the existing run metadata or monitor prompt:

- Goal, operating mode, scope, checkout, command, owner and run/log/artifact locations.
- Requested model/provider, shared concurrency ceiling, independent transfer limits and applicable resource/cost bounds.
- Agreed quality references, authorized repairs, completion evidence and release or handoff boundary.
- Current progress, retry state, next recovery time and monitoring/reporting cadence.

Check changed or uncertain dependencies before submitting work: launcher permissions, authentication/model access, actual tool configuration and capacity. Reuse recent comparable successful evidence. Record the effective rules and versions where acceptance or replay depends on them; stale historical instructions must not override the current authorized contract. Do not silently substitute models.

Detach substantial runs using the existing manager or simplest reliable mechanism. Verify that execution survives the launching shell/tool and logs remain discoverable.

Create or update one temporary monitor. In Codex, use the automation tool and a heartbeat in the main thread, normally every 2–5 minutes during a pilot or unstable run; reuse a matching automation. Use another scheduler when requested or appropriate. Disclose unavailable scheduling rather than promise future check-ins. Make the saved prompt self-contained using the continuation brief, including intervention authority and stopping conditions, and update it when the run moves or resumes. Persist decisions so wakeups do not depend on conversation memory or a stale PID.

Each wakeup inspects actual ownership, progress, recent traces, errors and representative new results. Periodically use a stronger model within the authorized model and spending scope to spot-check substantive outputs and diagnose trace patterns, especially after model substitutions, implementation changes, repeated failures or unexpected slowdowns. Reuse prior assessments when their inputs are unchanged. Process health and valid schemas do not establish output quality.

Reduce monitoring frequency once execution is healthy. Notify the user of meaningful milestones, material regressions, required external action and completion; stay quiet when unchanged.

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

## Authority to intervene

Within the authorized outcome and resource/spending limits, the supervisor may autonomously pause admission, drain or stop affected work, repair or refactor the existing implementation, resume retained stages and increase useful concurrency. Routine diagnosis, targeted refactoring, recovery and concurrency adjustment are part of the delegated job and do not require repeated approval.

Intervene when evidence shows incorrect output, a stall, excessive latency, repeated unreliability or substantial wasted work. Preserve original evidence and accepted results, reconcile ambiguous deliveries, and change executable code only at safe boundaries.

Prefer one coordinated repair over repeated small interruptions. Record the finding, intervention and observed result. Stop repeating an intervention that produces no useful improvement. Do not weaken quality requirements, invent a replacement pipeline or expand the workload merely to keep workers busy.

## Preserve quality; remove accidental gates

Use agreed examples and past transcripts to judge quality and unnecessary blockers. Local repairs may address runner bugs, contradictory stage rules, performance and finishing defects within the authorized goal. Throughput improvements must preserve substantive quality.

Separate content acceptance, execution validity and metadata completeness. Suggestions and model self-check flags do not become blockers without evidence of a defect. Retain required blockers for demonstrated unsupported claims, identity conflicts or substantive loss where those affect the task. Declared tool access should match actual execution; do not allow normal tool use and reject it downstream.

Sample after changes that could materially affect agreed quality, using existing accepted calibration when sufficient. Test the affected interaction when a repair risks acceptance, replay or output integrity. Neither sampling nor broad verification is a prerequisite for every resume. Stop gathering proof once the relevant risk and authorized outcome are resolved. Preserve applicable privacy, security and release boundaries.

## Instrument performance

Instrument enough of the critical path to distinguish useful execution, queue waits, retries/backoff, release waits and duplicated work. Use existing structured logs/status artifacts, not a new telemetry service. Record run/item/stage/attempt IDs, effective model/configuration, input size, active/queued counts, concurrency, queue/start/end timestamps, outcome, retry reason, output disposition and receipt where available. For transfers, record bytes and duration. Exclude credentials and unnecessary source content. Instrumentation should answer an operational question; incomplete optional observability should not block a useful pilot.

Look for missed opportunities: idle capacity despite ready work, unnecessary stage barriers, serial independent I/O, repeated validation of unchanged artifacts, redundant model calls and repeated builds. Prioritize the largest measured delay. Measure accepted output delivered per elapsed hour, and record user interventions as an operational cost; worker activity alone is not progress.

Diagnose the largest unexpected delay on the critical path: slow calls, starvation, transfers, repairs or gating. Record performance changes with their hypothesis and before/after useful throughput. Variance is a diagnostic signal, not an automatic blocker.

## Report progress and ETA

Use [report-progress-eta-analyze](../report-progress-eta-analyze/SKILL.md) for whole-task summaries, remaining-stage forecasts, comparisons with prior estimates and analysis of measured inefficiencies. Keep evidence in the existing run artifacts. Apply findings through the intervention authority above; reporting does not create a second monitor or completion ledger.

Normally report routine meaningful progress at most every fifteen minutes, with material regressions, completion and required action reported promptly. Stay quiet when progress, forecast and risk are unchanged; answer explicit status requests directly.

## Stop and hand off

Completion is the authorized outcome: validated outputs for generation, or deployment/live evidence when shipping was authorized. Optional unavailable checks are disclosed; a blocked required dependency receives a precise incomplete handoff.

For pilot-and-improve runs, report output quality, timing, reliability, significant interventions and remaining optimization opportunities. Update the existing workflow documentation to reflect verified behavior, distinguishing measured results from proposals.

Link outcomes and remaining qualifications. Pause the monitor after verified completion or explicit external handoff. Preserve reusable results and receipts; clean known disposable resources and avoid orphaned workers or duplicate monitors. Babysitting does not itself authorize additional scope or publication.
