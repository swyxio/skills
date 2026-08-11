# Devblog story modes

Choose one primary mode after reconstructing the evidence. These are editorial
tools, not fill-in-the-blank templates. Borrow the reasoning moves of strong
technical writers without impersonating their diction, profanity, jokes, or
personal history.

## Field report

Use for one implementation, debugging session, migration, incident, or measured
result.

- Reader change: understand what changed, why, and whether the lesson transfers.
- Shape: consequence or artifact → prior state → mechanism → proof → alternative
  → limitation.
- Title families: concrete result, incident, distinction, measured change.
- Avoid: a changelog inventory dressed up as a feature article.

## Short lab note

Use for one bounded experiment, release, command, artifact, or strange
mechanism. Simon Willison's project notes are useful inspiration: a real task or
curiosity, a small experiment, a visible result, verification, and the useful
implication.

- Reader change: know or try one useful thing.
- Shape: why I looked → what I tried → what happened → how I checked → why it
  matters → stop.
- Title families: specific result, exact distinction, quantified mechanism,
  personal milestone when authentic.
- Avoid: transcript dumps, chronological play-by-play, or inflating a small
  result into a universal thesis.

## Mechanism explainer

Use when the value is making a system predictable to a reader. Strong Fly.io
explainers reduce an intimidating system to a memorable minimum model, then
trace one object through it.

- Reader change: replace a vague abstraction with a model that predicts
  behavior.
- Shape: familiar surface → surprising question → minimum model → recurring
  example → production consequence → failure limit.
- Title families: literal subject, paradox, hidden mechanism, concrete question.
- Avoid: saying `it is simple` while hiding the constraints that make production
  hard.

## Incident or reversal

Use when a reasonable plan, product bet, or technical belief was falsified.
Fly.io's candid reversals are useful inspiration because they state the failure
and its current consequence before defending the old choice.

- Reader change: understand why the former belief was reasonable and what new
  evidence should replace it.
- Shape: admission → current consequence → former belief → disconfirming
  evidence → decision → retained principle.
- Title families: reversal, confession, `we were wrong about…` only when the
  subject and accountability are real.
- Avoid: false humility, blame shifting, or rewriting history as inevitable.

## Evidence-led argument

Use when several cases, measurements, papers, or counterexamples challenge a
common technical belief. Dan Luu's strongest essays are useful inspiration for
premise selection, bottom-up explanation, evidence against the thesis, and
careful scope.

- Reader change: adopt a more predictive, bounded model of a class of systems.
- Shape: disputed premise → simplest case → accumulating cases → strongest
  counterexample → mechanism → where the thesis stops → consequence.
- Title families: named problem, defense of a contested choice, direct claim.
- Avoid: forced contrarianism, selective examples, caveat avalanches, and a
  conclusion broader than the sample.

Before drafting, write the strongest version of the conventional position and
name what evidence would weaken the preferred thesis.

## Hands-on argument

Use when the reader needs direct experience before an opinion will be useful.
Fly.io's `You Should Write An Agent` is the model: smallest build, observed
surprise, mechanism, then recommendation.

- Reader change: try a bounded exercise and update a practical opinion.
- Shape: disputed claim → smallest reproducible exercise → observed surprise →
  explanation → objection → invitation.
- Title families: imperative, stance, practical challenge.
- Avoid: an imperative unsupported by firsthand work or a toy that conceals the
  production boundary.

## Origin story

Use when the current design only makes sense through earlier constraints,
failed approaches, and enabling ideas.

- Reader change: understand why the system has this shape rather than merely
  when events occurred.
- Shape: present claim → consequential turning points → recurring problem →
  enabling mechanism → current design → what the history predicts.
- Title families: `How we got to…`, evolution, named turning point.
- Avoid: chronology in which events do not change the explanation.

## Product announcement

Use when a release contains a useful technical or product idea, not merely a
new feature.

- Reader change: understand the benefit, hidden hard part, exact offer, and
  important constraint.
- Shape: what is new → reader benefit → hard constraint → mechanism → exact
  limits → realistic try path.
- Title families: literal announcement, benefit, hidden hard problem.
- Avoid: concealing price, maturity, lock-in, commercial interest, or a sharp
  limitation below promotional language.

## Angle prompts

When the first angle is merely `what we built`, ask whether the evidence earns
one of these stronger and still truthful tensions:

- Which conventional assumption expired?
- Which complicated system reduces to a few concrete parts?
- Which reasonable bet did reality falsify?
- What familiar tool behaves in an unexpectedly strange way?
- What can only be understood by trying the smallest version?
- Which boring implementation detail is the real product insight?
- Which turning point explains the present architecture?
- Which disagreement can varied evidence resolve?

Use the literal subject in the title, deck, or first paragraph. A tension helps
the reader choose the story; it must not hide what the story is about.
