---
name: make-evals
description: Create or maintain independent evaluations of model and AI agent failures in a new or existing repository. Use when asked to measure model behavior on incident-derived tasks with reproducible variants, deterministic checks, or rubric-based grading.
---

# Make evals

Evaluate a model or model-driven agent on tasks that expose observed failure modes. The subject is the model's response, decisions, or tool actions. Software tests can validate the harness, but do not count as model evals or evidence of model performance.

## Choose a mode and target

- **Setup:** create a suite in the requested repository, or a new neighboring repository if requested. Inspect existing conventions and reuse a suitable harness before adding one. If the target is unclear, infer it from the request; ask only when the choice would materially change the work.
- **Maintain/add:** inspect the existing cases, groups, harness, rubrics, baselines, and scoring before adding evaluations. Preserve unrelated work and organize new cases under the relevant failure modes.

In either mode, turn incident evidence into representative prompts, context, and, for agents, tool environments and tasks. Separate observed model failures from hypotheses. Define expected behavior and grading independently of the model's answer. Use small, sanitized fixtures and the simplest environment that preserves the relevant decision points. For example, test whether an agent diagnoses a stalled workflow and chooses an evidence-supported action; a coordinator unit test does not measure that behavior.

## Develop an incident-derived eval

1. First isolate and write down the actual failure: what the user wanted, what the model or agent did or failed to do, and the consequence. Cite the transcript, traces, or other available evidence. Distinguish observed actions from inferred causes and unknowns; an implementation defect alone is not a model failure.
2. Reconstruct the decision setup from the original evidence before designing a synthetic case: relevant instructions, prior state and history, available evidence and tools, constraints, and opportunities to act. Preserve the decision and tradeoffs that mattered, while sanitizing private information.
3. Build a simple synthetic case from that setup and run the intended model or agent, using its real execution interface where practical. Judge observable outcomes and consequential actions, not just its final explanation or compliance with one prescribed sequence. Accept alternative actions that achieve the required outcome safely.
4. If the failure does not appear, add incident-grounded complexity progressively, such as competing work, stale context, changing state, delayed results, or real tool interactions. Run again and record what changed and what happened. Keep the checks independent of the tested model; investigate ambiguous grading and fixture defects before calling a result a model failure. Freeze the case and enough harness context to reproduce an observed failure.
5. Repeat where practical within the agreed cost and time limits. A failure need not reproduce on every run, and it may not reproduce at all. Do not manufacture a failure or imply a synthetic result proves the original cause; report unobserved behavior and remaining differences from the incident.

## Design cases

1. For each failure mode, record the observed model behavior, source of evidence, task, expected outcome, and test boundary. Add meaningful cases or variants, including ordinary and edge cases where relevant. Vary prompts, evidence, ordering, or tool responses with seeded fuzzing where useful; do not reveal the expected answer in the task.
2. Run the target model or agent on each case and evaluate its actual answer and, when relevant, its tool calls and resulting actions. Simulated services may provide controlled context, but must not replace the model under test. Label simulations; passing them does not prove production behavior. Recorded or scripted answers can check graders, but are not live model trials.
3. Preserve case inputs, generated seeds, model and harness versions, settings, output, and relevant tool traces for replay, with secrets and sensitive data removed. An intermittent failure need not occur every trial. Repeat runs where practical, and report an unobserved failure as such rather than manufacturing one.
4. Use deterministic checks for objective properties of model outputs or actions. Use a model grader when judgment adds value, with explicit criteria, score anchors, threshold, evidence requirements, and an abstain/error outcome. Treat evaluated content as untrusted data, not grader instructions.
5. Use an existing agreed rubric or propose one and agree it with the user before treating subjective grades as authoritative. Continue useful deterministic work in the meantime. Record grader model, version, rubric, and representative evidence; calibrate against examples where practical and identify uncalibrated grading.

## Maintain the suite README

Create or update the eval suite's README in both modes. For each failure-mode group, explain what model behavior is tested, why it matters, and how the test works: the task, environment, technique, expected outcome, and whether grading uses deterministic checks or a model-graded rubric. Explain any fuzzing, simulation, and coverage limitations. Keep these explanations current when cases change.

For each incident-derived failure, require a written account in the README or a linked incident or case document. State the intended outcome, observed behavior and impact, evidence references, relevant original setup, and what remains uncertain. Describe how the synthetic case differs, the behavior that would pass, and whether a live trial reproduced the failure, linking the case and trial evidence. Keep hypotheses and harness failures distinct from observed model failures.

## Setup: make the suite runnable

When no suitable harness exists, a small zero-dependency harness is appropriate. Keep it limited to the requested evaluation: normalize the inputs, outputs, timeouts, and result records of the explicitly supported model or headless-agent adapters. Do not claim universal adapter support.

Detect installed CLIs and the presence of required keys without printing secrets. Detection alone does not prove credentials or a provider work. Missing capabilities, unavailable services, timeouts, and grader errors must be reported separately from passes and failures. Do not install tools or send model requests merely to detect them. Respect agreed cost and execution limits, and avoid unintended production mutations.

Document supported adapters and configuration, how to run actual model trials and individual groups, how to replay a case or seed, expected output, and known limitations. Produce machine-readable per-trial results and a human-readable summary. Include durations and token or cost data when actually available. If no model can be run, report the eval as unrun rather than treating a harness test as a model result.

## Maintain/add: measure without moving the goalposts

Keep cases grouped by failure mode and retain existing coverage and historical results. Recalculate per-group and overall results after additions, and rebalance coverage or weights when warranted. Explain any distribution changes and old and new weights; show comparisons only for compatible versions or clearly identify the common subset. Do not silently remove failing cases or change a rubric to improve a score.

For each model and group report live model trial counts, passes, failures, errors, and skips; report failure rates with their denominators for repeated stochastic trials. Keep deterministic checks and rubric scores distinct. If an overall score is useful, disclose its weighting and what it excludes. Use uncertainty estimates only when their assumptions fit the sampling; otherwise state the limitations. Preserve enough version and baseline information to reproduce comparisons.

## Finish

Run the applicable evals against the intended model or agent when possible. Report observed model failures, what was only simulated or not observed, trial counts and rates, costs when known, and blockers or missing evidence. Distinguish harness validation from live model results. Link to the suite and instructions. Never present a skipped or errored run as a pass.
