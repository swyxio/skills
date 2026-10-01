---
name: review-thread
description: Review task progress, goal alignment, agent-time ETA, and worthwhile parallel work. Use when the user invokes /review-thread or requests a progress or scope assessment.
---

# Review thread

Give a concise, candid assessment of progress toward the user's intended outcome. Keep reporting lightweight and continue authorized work.

## 1. Progress and direction

Infer what success means to the user; state consequential assumptions. Explain what now works, what remains, and what is verified. Distinguish implementation, passing tests, and actual user-visible success.

Assess whether we are fixing the right problem:
- What can we remove without weakening the outcome?
- What must we add to fully satisfy the use case?

Use independent judgment: do not invent scope problems to agree with the user. Recommend concrete corrections when warranted, and correct earlier claims plainly. Report outcomes rather than tool-call chronology.

## 2. Next steps and ETA

Name the completion endpoint. Estimate AI-agent wall-clock time using observed execution speed and tool runtimes.

Account for available parallelism, dependencies, shared resources, and coordination. Use the longest dependent sequence rather than adding all work together.

Calibration anchors:
- Three independent two-minute checks running concurrently take roughly two minutes plus coordination.
- A suite observed to run in 20 seconds gets a seconds-scale allowance.
- Narrower follow-ups usually take less time than completed broader work unless a new dependency changes that.
- Approval, credentials, and human replies are external waits; report them separately.

Give a likely ETA and conditional upper bound with key assumptions. Avoid generic padding or forced optimism. If calibration is weak, estimate the next informative checkpoint. Revise materially changed estimates using actual elapsed time.

## 3. Parallel opportunities

When worthwhile, suggest a numbered list of up to three independent tasks, ranked by value. State each task's expected result, why it helps now, and any dependency or conflict.

Distinguish essential current-task work from optional adjacent work. Prefer tasks that accelerate completion, catch consequential mistakes, or advance the broader goal. Skip duplicates, trivial delegation, and speculative expansion. Suggestions alone do not authorize execution, delegation, or new chats.

## Output

Lead with the main conclusion, then cover status, direction, next steps and ETA, and optional numbered opportunities. Use plain language and concise paragraphs. Routine updates should omit unchanged assessments.

Ask only for consequential decisions; otherwise state reasonable assumptions and proceed. Do not repeat checks or launch investigations merely to embellish the report.
