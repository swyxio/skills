# Evidence contract

## Contents

1. Required boundaries
2. Metric definitions
3. Machine-readable report
4. Visual grammar
5. Common failure modes

## Required boundaries

Record these identities for every analysis:

- engine, model, solver, policy, and rules fingerprints;
- environment/map/task corpus version;
- baseline and candidate identities;
- seed/random-input, role/seat/home, starter/order, and opponent/control;
- compute/search budget and horizon;
- terminal and scoring semantics;
- replay/trace/state fingerprints.

The exact pair key must contain every physical or random input that can change the trajectory and
must exclude experiment labels that do not affect play.

## Metric definitions

### Opportunity

A public state where the intended mechanism could occur. Define this independently of whether the
candidate selected it.

### Exposure

A decision evaluated by the treatment. Evaluator replacement usually means every focal decision;
a late-game or matchup gate means only decisions inside that gate.

### Selector activation

The treatment selected a different option from its declared shared-strength or baseline choice.
This is inapplicable to treatments that replace the baseline evaluator.

### Action divergence

Baseline and candidate choose different actions from an identical public pre-state. First
divergence supports the strongest causal interpretation.

### Immediate effect

The actual state or score change caused by the focal action, not merely the evaluator’s predicted
signal.

### Physical reply survival

The fraction of newly gained targeted entities that remain after the immediate response.

### Response-cycle value

`margin_after_reply - margin_before_action`, or the equivalent backed-up reward. Also record:

`retained_fraction = response_cycle_value / immediate_margin_gain`

Handle zero or negative immediate gain explicitly rather than dividing silently.

### Medium-horizon conversion

Whether the intended strategic asset, route, objective, or plan converts within a predeclared
number of focal decisions or completion fraction.

### Final conversion

Rules-resolved final win, reward, rank, score margin, or task success. Keep caps, failures, ties,
and adjudications distinct.

## Machine-readable report

The validator accepts additional fields, but requires this minimum structure:

```json
{
  "schemaVersion": 1,
  "analysisId": "unique-id",
  "hypothesis": {
    "policy": "candidate policy",
    "intendedEffects": ["operational mechanism"]
  },
  "provenance": {
    "baseline": "baseline-id",
    "candidate": "candidate-id",
    "engineFingerprint": "fingerprint",
    "scheduleFingerprint": "fingerprint"
  },
  "integrity": {
    "exactPairs": 100,
    "replayVerified": 100,
    "failures": 0,
    "caps": 0
  },
  "population": {
    "opportunities": 1000,
    "exposures": 1000,
    "actionDivergences": 240,
    "immediateEffects": 180,
    "replyEligible": 175,
    "physicalSurvivals": 150,
    "positiveResponseCycles": 70,
    "mediumConversions": 50,
    "finalConversions": 45
  },
  "cases": [
    {
      "kind": "counterexample",
      "pairKey": "environment|seed|role|starter|opponent",
      "firstDivergence": {
        "step": 12,
        "sharedPreStateFingerprint": "fingerprint"
      },
      "replayVerified": true,
      "trajectory": {
        "baselineFinal": 20,
        "candidateFinal": -30
      }
    }
  ]
}
```

Required case kinds for a deep report:

- `intended-effect`
- `counterexample`
- `held-out-regression`

If one does not exist, state that explicitly in limitations; do not fabricate a case.

## Visual grammar

Use consistent semantics:

- neutral gray: baseline/control;
- saturated policy color: candidate;
- green: final conversion or verified benefit;
- red: final failure/regression;
- amber: first divergence or uncertainty;
- solid line: candidate trajectory;
- dashed line: baseline trajectory;
- experimental-unit dots: real map-seed/task-seed clusters;
- whiskers/bands: labeled uncertainty interval.

Every chart must show:

- unit of analysis and sample size;
- denominator;
- higher/lower-is-better direction;
- discovery versus held-out status;
- terminal/censoring treatment;
- whether it is causal, associational, or illustrative.

## Common failure modes

- Calling zero selector changes “no activation” for a replacement evaluator.
- Counting predicted utility as realized effect.
- Measuring only whether attacked cells flip back.
- Ignoring the opponent’s payoff elsewhere.
- Treating every later divergent move as causal.
- Selecting only winning or visually dramatic examples.
- Combining incompatible engine or scoring epochs.
- Promoting on aggregate mean while a matchup, map, role, or tail safety floor fails.
- Reporting immediate variance as productive upside.
- Using one-turn improvement as final conversion.
