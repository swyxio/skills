---
name: report-progress-eta-analyze
description: Summarize progress, estimate completion from remaining work and observed timings, explain forecast changes, and identify measured inefficiencies. Use for status and ETA requests or progress reports on multi-stage work such as batches, builds, research, migrations and releases. Does not launch, schedule or modify the work being reported.
---

# Report Progress, ETA, and Analyze

Use existing plans, process state, logs, results and timing receipts to explain how close the authorized outcome is to completion. Refresh cheap, time-sensitive evidence when available; distinguish current observations, older receipts, estimates and unknowns. Reuse the existing run artifacts rather than introducing another ledger or telemetry system.

## Establish progress and remaining work

Report the state of the whole authorized outcome, not just the last command or heartbeat. Lead with what is complete, what remains and the current bottleneck. Distinguish generated, accepted, released and live-verified output. When work has separate deliverables, such as a code release and a content pilot, give each its own state and forecast. Counts of passing tests or completed model calls are supporting evidence, not a percentage of the whole task.

## Build and revise the ETA

Build the forecast from remaining work before giving a completion time:

1. List unfinished stages, remaining units, dependencies and current active/queued work. Include finishing work such as assembly, review, release and live verification, not only generation.
2. Estimate each stage from comparable retained timings, preferring the current run, then recent runs with similar input size, model, configuration and effective concurrency. Record the evidence source and sample count. For queues use observed accepted throughput, not the configured slot ceiling. Where evidence is sparse, give a labeled provisional range; where no defensible estimate exists, say unavailable.
3. Account for work already spent in an active stage without restarting its full estimate at every heartbeat. If it has exceeded comparable durations, inspect progress and revise the explanation rather than clamping remaining time to zero. Separate normal work, known queue/cooldown waits and expected repair overhead supported by observations.
4. Follow the dependency path to completion: add sequential stages and use the longest overlapping branch at joins. Account for branches sharing constrained capacity; do not assume they overlap perfectly or add all worker durations as wall time.
5. Give a likely remaining range and, when useful, a completion window in the user's timezone. State the assumptions and dominant uncertainty. An unresolved external hold makes the unconditional finish time unknown; still estimate independent work and the remaining work after clearance when evidence supports it. Never invent a provider recovery time or hide the rest of the task behind “blocked.”
6. Compare with the previous forecast and the original baseline. Explain material movement with concrete causes: new scope, slower service, lost concurrency, a repair, queue time or duplicated validation. Preserve earlier estimates so each wakeup does not silently move the deadline. At completion, retain estimated versus actual stage durations for future calibration.

## Report the useful summary

Use this compact shape for meaningful updates, adapting it to the task:

- **Progress:** accepted/delivered scope versus total; major completed milestones and total elapsed time.
- **Since the last update:** the consequential change and its effect on completion or quality.
- **Remaining:** the next stages, which can overlap, and the critical blocker or bottleneck.
- **ETA:** remaining range, comparison with the previous estimate, and a short evidence basis. Separate conditional completion from unknown external waits.
- **Next action:** what is being done to advance or unblock the work; whether the user needs to act.

Keep the detailed timing breakdown in existing run artifacts and link it when useful. A short remaining-stage table is appropriate when several branches make the estimate hard to follow. Do not dump raw counters or repeat that the monitor is active. Answer an explicit status request even when unchanged, stating how fresh the evidence is. For scheduled reporting, follow the existing notification cadence and stay quiet when there is no meaningful change in progress, forecast, risk or required action. This skill does not create a monitor.

## Observe inefficiencies

End the analysis with a brief look for avoidable delay: idle capacity with ready work, unnecessary serial dependencies, repeated checks or builds, redundant model calls, excessive retries, and coordination overhead. Distinguish necessary quality/release gates from duplicated work; a long duration alone does not prove waste.

Surface only the most consequential evidenced finding or two. State the observation, its likely effect on the critical path, and the smallest improvement worth trying. Quantify recoverable time only when the data supports it; otherwise label the idea unmeasured. Track whether a prior intervention actually helped. If there is no meaningful finding, omit this from the user-facing report.

Analysis does not itself authorize pausing jobs, changing concurrency or refactoring. An already-authorized supervisor can use the finding to act through [babysit-runs](../babysit-runs/SKILL.md); otherwise present it as a recommendation. Do not turn a progress request into an open-ended optimization project.
