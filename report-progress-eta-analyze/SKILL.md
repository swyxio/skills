---
name: report-progress-eta-analyze
description: Summarize progress, estimate completion from remaining work and observed timings, explain forecast changes, and identify measured inefficiencies. Use for status and ETA requests or progress reports on multi-stage work such as batches, builds, research, migrations and releases. Does not launch, schedule or modify the work being reported.
---

# Report Progress, ETA, and Analyze

Use existing plans, process state, logs, results and timing receipts to explain how close the authorized outcome is to completion. Refresh cheap, time-sensitive evidence when available; distinguish current observations, older receipts, estimates and unknowns. Reuse the existing run artifacts rather than introducing another ledger or telemetry system.

## Establish progress and remaining work

Report the state of the whole authorized outcome, not just the last command or heartbeat. Lead with what is complete, what remains and the current bottleneck. Distinguish generated, accepted, released and live-verified output. When work has separate deliverables, such as a code release and a content pilot, give each its own state and forecast. Counts of passing tests or completed model calls are supporting evidence, not a percentage of the whole task.

Name the completion boundary being forecast: for example, private review ready, approved release, or live verified. User validation time is separate from processing time. Label every remaining count with its stage and denominator: “writing 0 remaining; assembly 25/66 remaining; final QA pending.” Never show an unqualified “0 remaining” while required downstream work remains. Reused approvals count only for their qualified scope; an automated pass is not manual inspection.

## Use past runs as forecast data

Always give a reasonable provisional ETA when a numerical estimate can be constructed, even if timing evidence is incomplete. State assumptions explicitly and distinguish measured rates from judgment. If a required external hold has no observable resolution time, give a conditional ETA for the remaining work after clearance rather than inventing a recovery time.

For long-running agent or UI batches, inspect the existing session or execution log for timestamped verified completions and match them to the durable work log. When individual checkpoints lack timestamps, use surrounding turn-completion timestamps and count the verified items between those boundaries; exclude the initial boundary items, failed or unverified actions, and duplicates. Record the interval, number completed, and whether pauses or overhead are included. Prefer a recent comparable window reflecting the current task and copy complexity, and compare it with earlier runs when available. Do not infer a batch rate from a single quick action or count parallel observations as independent completions.

When the completed-ID inventory or ranking is not reconciled, label the count and remaining units approximate, avoid claiming full coverage, and include the final reconciliation in the forecast. If no usable rate exists, estimate a reasonable per-item service range from explicit judgment, label it unmeasured, and revise it as soon as observed timings become available. Explain material corrections to earlier estimates, including when an assumption was unnecessarily pessimistic.

Before the first forecast, make a bounded lookup of comparable past runs in existing timing reports, stage receipts and completion records. Refresh that lookup when the remaining bottleneck changes. Prior forecast text is not an actual duration: prefer timestamped stage transitions and verified completion receipts. If history is unavailable, say what was checked; do not silently substitute intuition when usable records exist.

Select comparisons by completion boundary, workflow/source version, work type and size, new versus reused content, effective concurrency and shared resources. Record run IDs/dates, sample count, stage durations and material differences. Separate ordinary service, exception repair, ready-to-start delay, supervision/inspection and final assembly/release. Retain failed and unfinished attempts as failures or incomplete observations; never count them as zero-duration completions or build rates only from the easy successes. Do not blend an obsolete defect's recovery time into normal service after its fix without explaining the difference.

Use history to fill stages not yet observed in this run, especially the finishing tail. Update those estimates with comparable current observations; a few fast current items do not erase historical tail or repair evidence. Split ordinary remaining items from held or difficult items and use the appropriate cohort for each. Scale per-item work by remaining units and observed capacity, but estimate fixed assembly/release costs separately. Show which inputs came from current measurements, historical measurements or judgment; explain material departures from comparable history.

Calibrate using forecasts made at comparable milestones and their actual remaining times to the same completion boundary. Report sample size, typical signed error (late versus early) and upper-bound misses when supported. Do not treat many heartbeat forecasts from one run as independent runs. Correct an observed cause or consistent bias rather than adding a blanket safety multiplier. Small samples support observed ranges and provisional estimates, not confident p95 claims. When authorized to maintain run receipts, retain forecast timestamp, scope, boundary, range, assumptions and actual completion in the existing artifacts; otherwise report the comparison without writing state. Never rewrite old forecasts to match the outcome.

## Build and revise the ETA

Build the forecast from remaining work before giving a completion time:

1. List unfinished stages, remaining units, dependencies and current active/queued work. Include finishing work such as assembly, review, release and live verification, not only generation.
2. Estimate each stage from comparable retained timings, preferring the current run, then recent runs with similar input size, model, configuration and effective concurrency. Record the evidence source, sample count and measurement interval. Match units: automated screenshot capture does not measure actual pixel inspection, and model generation does not measure acceptance. For queues use observed accepted throughput, not the configured slot ceiling. Where evidence is sparse, give a labeled provisional range; where no defensible estimate exists, say unavailable. A new or failing finishing helper has unmeasured recovery time; a representative successful smoke run can establish its normal service rate, but does not establish repair or inspection time.
3. Account for work already spent in an active stage without restarting its full estimate at every heartbeat. If it has exceeded comparable durations, inspect progress and revise the explanation rather than clamping remaining time to zero. Separate normal work, known queue/cooldown waits and expected repair overhead supported by observations.
4. Follow the dependency path to completion: add sequential stages and use the longest overlapping branch at joins. Name the executor or resource supporting each overlap, including shared human/agent attention. Distinguish unattended processing from hands-on inspection and repair. Account for branches sharing constrained capacity; do not assume they overlap perfectly or add all worker durations as wall time. Include measured ready-to-start and orchestration delays where they affect the critical path; a heartbeat interval alone is not proof that every stage incurs that wait.
5. Give a likely remaining range and, when useful, a completion window in the user's timezone. State the assumptions and dominant uncertainty. An unresolved external hold makes the unconditional finish time unknown; still estimate independent work and the remaining work after clearance when evidence supports it. Never invent a provider recovery time or hide the rest of the task behind “blocked.”
6. Recompute after a major stage completes, scope changes, a hold clears, or observed throughput changes. Forecast from the current unfinished dependency graph; do not carry forward an admission-time duration or historical finish window merely because it was previously reported. Use comparable tail/rework timings when the remaining items differ from the completed bulk. Compare with the previous forecast and original baseline, preserving both. Explain material movement with concrete causes: new scope, slower service, lost concurrency, a repair, queue time or duplicated validation. If an upper bound is missed, say so, quantify the miss and identify the cause before replacing it. At completion, retain estimated versus actual durations for the same boundary and use the error to improve the next comparable forecast.

## Show the calculation and check it

Every numeric ETA includes a compact, visible derivation in the response, even when detailed evidence is linked: remaining units, measured rate or provisional duration, actual overlap and sequential tail, then remaining range and local completion window. Link the timing receipts and show their freshness. Do not substitute “low confidence” for a calculation, or require the user to open an artifact to discover the assumptions.

For example: inspection has 33 talks left; two comparable six-talk batches took 6m35s and 6m23s, suggesting about 36 minutes before observed recheck allowance. If inspection is provisionally 35–60m, repairs 20–40m and profile checks 5–10m, with independent capacity and a sequential assembly tail of 10–20m, show `max(35–60, 20–40, 5–10) + 10–20 = 45–80m`. Label the provisional inputs; this is a conditional planning range, not a statistically calibrated confidence interval. If those branches share capacity or have prerequisites, adjust the graph rather than using this formula unchanged.

Any allowance must have a named basis and appear in the arithmetic. Do not add an unexplained buffer after calculating the range. Keep unknown provider recovery separate from bounded work. If all required work for the named boundary is verified complete, report complete now; do not retain a future ETA. A useful check is: “What concrete unfinished dependency requires waiting until the quoted time?” If none can be identified, the forecast is stale or unsupported.

Match precision to the evidence: keep exact timestamps in receipts, but round provisional user-facing windows to sensible intervals. A broad hours-long estimate should not imply minute-level accuracy. Include a compact historical basis when used, such as “assembly: observed range across three comparable completed runs; current inspection: two batches.” Do not invent sample values for this summary.

## Report the useful summary

Use this compact shape for meaningful updates, adapting it to the task:

- **Progress:** accepted/delivered scope versus total; major completed milestones and total elapsed time.
- **Since the last update:** the consequential change and its effect on completion or quality.
- **Remaining:** the next stages, which can overlap, and the critical blocker or bottleneck.
- **ETA:** visible remaining-work calculation, evidence freshness, comparison with the previous estimate, and assumptions. Separate conditional completion from unknown external waits.
- **Next action:** what is being done to advance or unblock the work; whether the user needs to act.

Keep detailed timing receipts in existing run artifacts; retain the compact calculation in the response. A short remaining-stage table is appropriate when several branches make the estimate hard to follow. Report measured elapsed time for major steps and batches, separating useful service time from queueing, repair and orchestration where available. Do not dump raw counters or repeat that the monitor is active. Answer an explicit status request even when unchanged, stating how fresh the evidence is. For scheduled reporting, follow the existing notification cadence and stay quiet when there is no meaningful change in progress, forecast, risk or required action. This skill does not create a monitor.

## Observe inefficiencies

End the analysis with a brief look for avoidable delay: idle capacity with ready work, unnecessary serial dependencies, repeated checks or builds, redundant model calls, excessive retries, and coordination overhead. Distinguish necessary quality/release gates from duplicated work; a long duration alone does not prove waste.

Surface only the most consequential evidenced finding or two. State the observation, its likely effect on the critical path, and the smallest improvement worth trying. Quantify recoverable time only when the data supports it; otherwise label the idea unmeasured. Track whether a prior intervention actually helped. If there is no meaningful finding, omit this from the user-facing report.

Analysis does not itself authorize pausing jobs, changing concurrency or refactoring. An already-authorized supervisor can use the finding to act through [babysit-runs](../babysit-runs/SKILL.md); otherwise present it as a recommendation. Do not turn a progress request into an open-ended optimization project.
