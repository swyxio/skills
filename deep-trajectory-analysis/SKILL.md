---
name: deep-trajectory-analysis
description: Reconstruct and visually analyze paired agent, game, or policy trajectories to determine whether changed actions produced their intended effects. Use for move-history audits, replay/trace analysis, policy regressions, behavior calibration, causal first-divergence studies, reply-survival analysis, agent personality validation, promotion decisions, and reports that must connect aggregate outcomes to exact state-action sequences.
---

# Deep Trajectory Analysis

Determine not merely whether a candidate scored better, but what it changed, whether the named
mechanism fired, how the environment replied, and whether the benefit survived to the final
outcome.

Read [references/evidence-contract.md](references/evidence-contract.md) before defining metrics or
building the report. Run [scripts/validate-report.mjs](scripts/validate-report.mjs) on a
machine-readable result that follows that contract.

## Establish the causal question

Write one sentence for each intended effect before inspecting favorable examples:

> When opportunity O is publicly observable, policy P should change action A, immediately alter
> mechanism M, survive response R, and improve horizon outcome H without violating safety S.

Operationalize every noun. Prefer board-, state-, or trace-derived quantities over labels such as
“aggressive,” “safe,” “precise,” or “wild.”

Separate:

- **strength**: final win, reward, score margin, rank, or task success;
- **identity**: the behavior the policy is meant to exhibit;
- **safety**: compute, fairness, legality, information access, termination, and worst-case floors.

Do not let one metric stand in for all three.

## Preflight integrity

Stop promotion analysis until these checks pass:

1. Freeze engine/model, rules, maps/environments, search budget, opponent/control policies, seeds,
   seats/roles, starter/order, horizon, and terminal scoring.
2. Pair baseline and candidate on the exact physical/random inputs. Exclude unmatched cells.
3. Reproduce sampled trajectories and verify replay, state, or trace fingerprints.
4. Separate natural finishes, adjudications, horizon caps, failures, and unexplained outcomes.
5. Check symmetry, label invariance, hidden-information access, legal actions, and compute parity.
6. Archive incompatible epochs rather than merging them into one trend.

If compact results omit actions or states, rerun the exact manifests with decision evidence enabled.
Do not infer a causal move story from final aggregates.

## Audit telemetry semantics

Trace each metric to the code path that emits it.

- Distinguish **policy exposure**, **selector activation**, and **action divergence**.
- A replacement evaluator may be active on every decision while reporting zero selector changes.
- A selector may activate without producing the named mechanism.
- A signal may double-count overlapping concepts, especially in two-player or single-opponent cases.
- A physically retained object or cell may have negative strategic value after opportunity cost.

Rename misleading report labels immediately. Preserve the original field for compatibility if
needed, but never use an inapplicable field as the research conclusion.

## Reconstruct paired trajectories

For every exact pair:

1. Align baseline and candidate until the first focal decision with identical public pre-state.
2. Find the first different action. This is the strongest causal comparison.
3. Record the shared state, hand/input, legal choices, chosen action, predicted receipt, actual
   transition, opponent/environment reply, next focal action, and final outcome.
4. Treat later branch differences as consequences. Do not describe them as independent causal
   policy choices unless their pre-states are again identical.
5. Measure both the action’s targeted region and the opponent’s best alternative payoff elsewhere.

Store exact pair keys, turn/step numbers, fingerprints, placements/actions, changed entities,
score/reward checkpoints, and terminal evidence.

## Build the effect funnel

Count distinct stages rather than compressing them into “activation”:

1. opportunities;
2. policy exposures;
3. selector activations, when applicable;
4. actual action divergences;
5. intended immediate effect;
6. physical survival after the reply;
7. positive full response-cycle exchange;
8. medium-horizon conversion;
9. final outcome conversion.

Report the denominator at every stage. Measure both:

- **physical survival**: targeted cells, objects, resources, or state remain;
- **value survival**: backed-up score/reward after the best observed or searched reply.

Use response-cycle value for promotion. Treat physical survival and immediate gain as diagnostic
mechanism metrics only.

## Combine population and case evidence

Use both layers:

- **Population layer:** all paired trajectories, clustered uncertainty, map/environment and
  opponent/task slices, distribution tails, compute, termination, and funnel rates.
- **Case layer:** at least one intended-effect success, one counterexample, and one held-out
  regression. Select cases by predeclared rules such as largest paired outcome changes—not by
  visual appeal.

Case studies explain mechanisms; they do not estimate prevalence. Aggregate statistics estimate
prevalence; they do not explain the move.

## Make the report visual

Always produce work-in-progress charts once real data exists. Prefer:

1. a population effect chart with experimental-unit dots and uncertainty;
2. a stage funnel from exposure through final conversion;
3. paired baseline/candidate score or reward trajectories with the first divergence annotated;
4. a four-frame state filmstrip: shared state, baseline action, candidate action, reply;
5. small multiples for map/environment, opponent/task, role/seat, and held-out splits.

Render real state and actions where possible. Use schematic illustrations only when clearly marked.
Keep local proxies and final success visually separate; a locally successful move that loses must
look like a failed final conversion.

## Draw conclusions

Classify each intended effect:

- **fires and converts**;
- **fires but is erased by reply**;
- **fires but carries excessive opportunity cost**;
- **proxy fires, intended mechanism does not**;
- **policy is exposed but does not change actions**;
- **improves discovery but fails held-out transfer**;
- **unmeasurable because instrumentation is semantically wrong**.

Recommend the smallest next mechanism that directly represents the failed stage. Examples include
reply backup, route-hinge detection, multi-purpose payoff, plan-level variety, calibrated horizon
value, or corrected telemetry. Do not solve a missing strategic model by merely increasing a
generic weight.

## Deliverables

Produce:

- a concise verdict with quantified findings;
- a machine-readable report satisfying the evidence contract;
- a reproducible reconstruction/analyzer command;
- visual population and trajectory analysis;
- links to exact replay/trace artifacts;
- verification results and explicit remaining limitations.

Do not promote or modify a live policy unless the user asked for implementation and the
predeclared held-out strength, identity, safety, and compute gates all pass.
