---
name: babysit-runs
description: Operate long-running, detached, parallel or failure-prone jobs using existing runners and temporary monitoring. Use when asked to babysit a run, keep slots saturated, recover failures overnight, manage concurrency, or monitor progress and ETA until completion.
---

# Babysit Runs

Keep authorized work progressing unattended, at the agreed quality, with the shortest useful path to a verified outcome. Operate existing runners; do not introduce another scheduler or rewrite the pipeline to supervise it. Prefer simplicity and targeted repairs.

Use `live-ai-pipelines` when durable stages or recovery architecture actually need implementation. Use the selected provider/runtime skill for model invocation or access troubleshooting. Babysitting neither changes the requested model nor expands the task's permissions.

## Establish the run once

Inspect the current runner, actual processes/owners, logs, retained results and adjacent task history before starting anything. If a matching run exists, adopt it instead of launching a duplicate. Use past transcripts, accepted samples and receipts as judgment evidence; current user instructions and effective contracts take precedence over stale operational instructions.

Discover routine facts rather than interviewing the user again. Establish a compact run brief in existing run metadata or the monitor prompt:

- Goal, exact subjects/scope, working checkout, runner command, run/artifact locations and owner.
- Requested model/provider, concurrency ceiling, separate transfer/media/provider limits and any existing cost/resource constraints.
- Agreed quality and accepted examples; required completion evidence; publication/deployment authority or handoff boundary.
- Recovery behavior, progress timestamps, elapsed timings, monitor identity and reporting cadence.

Freeze the effective editorial, schema, validation, review and execution rules together when those affect acceptance or replay. Bind relevant inputs and implementation versions using existing receipts. Remove obsolete repair instructions and compression targets from evidence packets. A frozen historical contract preserves provenance; it must not silently dictate a newly authorized run.

Perform a small, proportional preflight: launcher permissions, applicable authentication/model access, actual tool configuration, available capacity, ownership and one representative output path. Reuse recent comparable successful evidence where sufficient. Do not turn preflight into a repeated broad gate or silently fall back to another model. Keep requested model separate from independently observed model.

## Detach and monitor by default

Most substantial runs should outlive the current conversational turn. Use the existing process manager or simplest reliable detachment supported by the environment. Verify the job survives the launching shell/tool and that its logs, owner and results remain discoverable. A successful launch command alone does not prove detachment.

Create or update one temporary monitor for the task. In Codex, use the automation tool and a thread heartbeat by default, usually every five minutes; inspect existing matching automations before creating one. Use a standalone scheduled job only when requested or appropriate to the selected scheduler. If scheduling is unavailable, disclose that rather than promising future check-ins.

The saved monitor must be self-contained: include the run brief, current authoritative location, quality references, permitted repairs, recovery rules, completion/handoff conditions and notification cadence. Update it after run continuation or location changes. Persist decisions in the run's existing journal/status so another wakeup can resume correctly. Do not rely on a foreground promise, stale process ID or conversation memory alone.

## Saturate useful work

LLM calls and data transfer are common bottlenecks. Measure which one currently limits accepted throughput and schedule independent preparation, transfer, writing, review and assembly concurrently where dependencies allow.

- One shared pool owns the concurrency allowance across mixed stages. Multiple runners must not each receive the full allowance.
- Fill available slots with ready work. Begin each item's next stage immediately; do not wait for an entire batch when items are independent. Do not create busywork or extra inference to occupy slots.
- Use the user's ceiling and retain established healthy concurrency. Avoid repeating conservative ramp experiments for comparable runs already calibrated.
- Adjust concurrency using comparable accepted throughput, latency, failures, throttling and resource pressure. Downshift when useful performance degrades, then recover capacity promptly when healthy. Maximum active calls is not the objective if they mostly retry or wait on transfers.
- Preserve independently justified transfer/media/provider caps. Increase the demonstrated bottleneck within authorized capacity instead of increasing every worker count indiscriminately.

## Inspect, recover and repair

At each check, inspect ownership/process liveness, accepted and remaining items, active/queued stages, oldest work, new logs, retained deliveries, retry history and resource/provider state. Compare with the previous observation. Quiet output is not itself a stall: judge against representative stage durations and other signs of progress.

Keep independent work moving when one item or surface fails. Before restarting, reconcile its results and owner. Cancel or fence a genuinely stale worker before replacement; never leave two owners active. Drain active work before activating incompatible runner changes. Preserve successful stages and repair only the affected dimension.

Classify failures from their evidence:

- **Known intermittent transport/provider rejection:** retry automatically with bounded backoff and jitter. A status such as 403 alone is not proof of quota exhaustion. If the user identifies periodic 403s, recover them without repeated permission requests or permanently stopping the shared pool.
- **Explicit entitlement/quota denial or invalid authentication:** isolate the affected surface; use authorized normal refresh/recovery, without model substitution or new spend. Report a concrete external action if required.
- **Unknown delivery:** check retained output, request IDs and provider status/idempotency before resubmission. Preserve the original attempt; do not turn missing local output into permission for duplicate inference or publication.
- **Launcher, lifecycle or stalled-process failure:** fix the demonstrated local issue, retain its error and resume unfinished work.
- **Content failure:** repair the specific unsupported claim, attribution conflict or loss of substantive coverage rather than regenerate accepted material.

Use a bounded immediate retry window, then a longer cooldown/heartbeat recovery for a known periodic outage. Respect existing time/cost limits. If repeated recovery yields no useful progress, report the evidence and reduce or pause affected work for diagnosis; do not spend the night in a hot retry loop. Record attempts and next recovery time so wakeups do not reset the retry history. Recoverable failures should not wake the user for routine approval.

## Hold quality constant; remove accidental blockers

Local repairs within the authorized goal include runner bugs, inconsistent stage rules, performance problems, metadata and rendering issues. Use agreed examples and task history to decide what quality means. Do not trade away research depth, factual support or substantive explanation for throughput.

Calibrate with a representative pilot when models, prompts or writing behavior materially change. Reuse accepted comparable calibration otherwise. Keep existing useful per-item review; do not add duplicate review layers or require a new pilot on every resume.

Separate content approval, execution validity and metadata completeness. Reviews should distinguish **blockers** from **suggestions**; approval and completion depend on required blockers, not optional notes. Formatting quotas and model-generated self-check flags are warnings or not applicable unless they demonstrate a real defect. Proven identity conflicts, unsupported attribution and substantive loss remain content blockers. Security, privacy and release boundaries are not formatting checks to relax.

Check that declared tool access matches the executable configuration before submitting work. Do not enable a tool and reject its normal use afterward. Use established parsers for supported formatting rather than brittle regex restrictions. Reconcile separate source lists automatically from verified inline destinations when available; never assume every generated URL is verified.

Test a small complete path when repairing interacting contracts: output validation → review-result handling → export → actual renderer, including flexible lengths, inline links and nonblocking suggestions. Verify recovery/replay without duplicate inference when relevant. Stop optional testing once the demonstrated risk is resolved.

## Log execution and monitor performance

Use existing structured logs and status artifacts rather than introducing a telemetry service. Persist enough information to explain where elapsed time went: run/item/stage and attempt IDs, model/provider, input size, concurrency, queued/start/end timestamps, outcome, retry/cooldown reason and output receipt. Record transfers in bytes and duration where available. Keep credentials and unnecessary source content out of logs.

Freeze the initial stage estimates as a baseline; retain updated forecasts separately. Compare representative completions with both the original estimate and the latest forecast rather than overwriting away prediction errors. For each stage, track:

- Estimated versus observed wall time, absolute and percentage variance; elapsed and remaining work.
- Queue wait versus active service time, transfer time, retries/backoff and external approval/outage waits. Separate overlapping intervals so totals do not double-count parallel work.
- Accepted items per minute, failure/retry rate and comparable duration distributions, usually median and p90 when sample size supports them. Label sparse samples and compare similar stages/input sizes/models/concurrency levels.

At each check, identify the largest unexpected delay on the critical path. Distinguish slow individual calls, queue starvation, transfer bottlenecks, repeated repairs and excessive gating before changing concurrency. Record the change, hypothesis and before/after useful throughput; retain changes that improve time to accepted output without reducing quality. A variance is a diagnosis signal, not an automatic blocker.

Update remaining-stage estimates from observed comparable work and current capacity. Reports should explain material forecast drift with evidence, for example: “Review: 18 min versus 10 min estimated (+8 min, +80%); 6 min in backoff; revised completion 25–35 min.” At completion, retain a compact estimated-versus-actual stage breakdown and the main causes of variance for the next comparable run. Keep logging proportional; do not add per-token tracing or costly profiling unless needed to diagnose a demonstrated issue.

## Report progress and ETA

Default to five-minute inspections and meaningful progress updates at most every fifteen minutes, with actionable failures, required user decisions and completion reported promptly. Stay quiet when unchanged. Persist detailed execution logs even when notifications are quiet.

Report accepted/total and remaining counts, active/queued calls, current concurrency, failures/retries and repairs, elapsed time, comparable useful throughput, current critical path and refreshed ETA. Separate generated, reviewed, rendered and published results. Give concrete stage/batch timings rather than vague progress claims.

Derive ETA from observed comparable durations and remaining work along the critical path, allowing for parallel overlap, transfers and recent retries. Label unmeasured ranges. Distinguish execution time from outage and approval waits; if recovery time is unknown, say so rather than supplying a false deadline.

## Finish and cleanly hand off

Completion means the authorized outcome: validated outputs/previews for a generation task; deployment and live verification when shipping was authorized. Optional unavailable checks are disclosed, not automatically promoted into blockers. A blocked required check needs a precise handoff, not a completion claim or repeated forbidden workaround.

Provide outcome links, coverage and remaining qualifications. Pause the temporary monitor after verified completion, or at an explicit external/user handoff with the run's incomplete status recorded. Preserve receipts and reusable work; clean only known disposable run resources. Do not leave duplicate monitors or orphaned workers. Further scaling or release follows the user's existing authorization, not the fact that a babysitting cycle finished.
