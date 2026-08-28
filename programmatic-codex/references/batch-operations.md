# Sustained Codex runs

Use an existing task runner when possible. These are operating decisions, not a requirement to build a queue framework, telemetry service or new approval system. Worker counts, observation intervals and stopping conditions come from the task, not one historical run.

## Prepare and calibrate

Define what a useful completed item means before counting throughput. Native completion, structural validity, source/content acceptance, sampled visual review, user approval and publication are distinct; record only the states the task needs.

Inspect representative sparse, typical and dense inputs. Verify the effective inputs actually contain available descriptions, identities and source context. Fetch or reuse metadata before research needs it; overlap recording downloads or other preparation with independent model work.

Keep intermediate outlines concise while retaining mechanisms, source ranges, important quantities and the substantive ending. Do not shorten the final deliverable or discard grounding to satisfy an arbitrary section cap. Reuse researched references only when identity, version and context fit; preserve verification dates. Reuse media by source identity and capture time rather than repeating extraction after a prose edit.

## Parallelize without batch barriers

- Use one shared in-flight model budget across planning, research, visual selection, writing, reviews and repairs. Nested batches must not each obtain the full budget.
- Continuously admit replacement work as items finish. Measurement windows need not be execution barriers; a straggler or quarantined item should not idle unrelated slots.
- Bound downloads, decoding and other local work separately. Prefetch a small amount of useful work; do not turn the remaining corpus into an unbounded download queue.
- When preparation or scheduling is demonstrably starving useful work, prioritize ready finishing stages with starvation protection. Measure utilization before adding a scheduler abstraction.
- A worker limit is not a request/token rate limit. Respect actual provider pacing and backoff signals when available.

## Ramp against the bottleneck

Begin modestly, within the user's approved model, settings, cost and concurrency boundaries. Measure a stable interval, try a bounded increase, then retain it only if useful throughput improves without unacceptable latency, failures or resource pressure. Permission to probe a higher setting is not evidence that it performs better. Reductions should drain naturally rather than cancel valid work.

Compare similar input-duration/size mixes or report the difference. Mark startup, recovery, mixed-concurrency and paused intervals separately; do not use them as clean causal evidence. Do not assume linear scaling, force a fixed maximum, or stop at a target ETA unless the user made that the stopping condition.

Distinguish local preparation pressure from model capacity. High host CPU load alone does not identify the culprit: inspect owned CPU and decode queues before reducing every stage. Retain relevant memory/disk safeguards and a fresh health check before growth. Unknown health is not evidence of headroom. Time of day may explain contention, but should not replace measurements.

## Keep measurements honest

| Question | Useful observation |
| --- | --- |
| How fast are we finishing? | Accepted items per elapsed time, plus source-size/duration mix when it changes cost. Count completions, not admissions or successful stages. |
| When will the queue finish? | Recent pause-inclusive rate and remaining workload, with an uncertainty buffer and observation interval. Show clean probe rates separately. |
| Where is time spent? | Preparation, queue wait, request duration, retries and repair time by stage. Cache/resume hits are not fresh downloads or new inference. |
| Are requests constrained? | Throttling, reconnects, failure classes, p50/p95 duration, and available provider limits. First persisted assistant output is not token-level latency. |
| Is the host constrained? | Owned RSS/CPU, actual host memory pressure, disk headroom and local-worker queues. RSS is not host memory pressure; system load is not owned CPU. |

Freeze the end time of a completed measurement window; rereading it later must not change its throughput. Missing telemetry is unavailable, not zero. Usage and wall time are not independently verified dollar cost or raw model latency. Report material progress with concrete elapsed times, chosen concurrency and the bottleneck—not unchanged polling chatter.

## Inspect actual output, including sampled visuals

Use cheap structural/privacy checks and task-appropriate content review. Read representative finished outputs for coherence, technical meaning, coverage and repetitive or overcompressed writing; valid JSON is insufficient.

For visual deliverables, inspect actual rendered samples throughout the run, not just the first pilot. Include early output after a meaningful prompt/model/rendering change, representative routine output, and material exceptions. Combine targeted and occasional random samples so selection does not systematically favor easy cases. For web output, check desktop and narrow-phone views; for other media, use the relevant rendered artifact.

Look at the screenshots themselves: text/table legibility, image decoding, source-caption agreement, reading order, overflow and visible errors. Exercise decisive interaction states for new or changed visuals. A saved screenshot or successful server render is not visual inspection. Preserve a compact record of the exact output revision, URL/page or state, viewport, captures and findings; do not claim every item was browser-reviewed from a sample.

Deep-check new visual behavior and flagged outputs; reuse evidence for unchanged components. Repair the smallest defect and recheck its affected scope. Illustrative code needs faithful meaning and readable presentation, not mandatory compilation, complete imports or execution. Test runnable behavior when the user requests it or the output promises it.

## Diagnose before regenerating

| Failure | Response |
| --- | --- |
| Missing metadata or poor media selection | Fix preparation/selection; preserve useful prose and other media. An optional frame failure need not discard every frame. |
| Wrong field, caption or prose block | Apply an exact base-bound field/block repair, then check the assembled result and affected evidence. Do not request a whole replacement artifact by default. |
| Validator or renderer rejects sound content | Reproduce with the actual output and sibling cases; correct that layer. Literal arrays, example addresses or environment lookups are not automatically private markers or leaked credentials. |
| Timeout, network interruption or throttling | Inspect delivery first, then use a bounded classified retry/backoff through the shared budget. Do not shorten deadlines indiscriminately: valid long-tail calls may be slow. |
| Auth, quota, refusal, unknown terminal failure or operator cancellation | Preserve the reason and stop the affected work; do not blindly retry or broaden permissions. Independent authorized work may continue when unaffected. |

Recover a valid completed response from saved events/receipts before repeating inference. Known reconnect warnings are nonfatal only when followed by a fresh assistant response, completed turn, successful native exit, valid output contract and matching reported model when available. Unknown errors and terminal failures remain failures.

Distinguish controller deadlines, native deadlines, explicit cancellation and host sleep/wake. Wall-clock elapsed time or `SIGTERM` alone cannot establish a retryable cause. Preserve original timing/cancellation facts when authorizing a bounded recovery; never relabel an incomplete response as successful. Check owner/process state before resuming so a missing controller response does not duplicate a live request.

Keep a nonempty, redacted failure diagnosis with stage, attempt and cause; empty stderr must not erase a useful error. Redact structured logs without corrupting JSON escapes or ordinary illustrative code. Test the actual boundary using synthetic credentials and real failure shapes, not private values.

## Version and supervise proportionately

Keep stable implementation paths under Git. Bind a run to its effective code snapshot (including relevant uncommitted changes), inputs, model/reasoning, prompts and schemas. Store completed responses and derived edits immutably; record the base and changed fields for a repair. A new implementation filename for every fix is unnecessary.

Never change executable bytes a live owner depends on. Prepare and test fixes independently, drain at a safe boundary, then activate the new snapshot. Existing supported concurrency controls may change live if their changes are recorded. Cosmetic or item-local defects need not interrupt a healthy run. Reuse successful stages whose effective inputs still match; a new writing prompt does not automatically invalidate research or media.

Use one owner and durable checkpoints when work outlives its caller. Supervision should read real process state, saved progress and representative output, diagnose recoverable problems, and continue authorized work. If recurring checks are requested, use the environment's supported scheduling mechanism rather than assuming a detached process will notify the user.

Report the queue, actionable exceptions and unresolved external blockers honestly. Keep publication separate. An attractive ETA, submitted command or finished generation stage is not completion of the user's task.
