---
name: next-steps
description: Review the full available conversation context, infer the user's underlying outcome from their explicit asks, corrections, preferences, constraints, and accepted or rejected proposals, concisely reconcile progress, and recommend prioritized groups of next-step options. Use when the user invokes $next-steps or /next-steps, asks what to do next, wants a holistic recap and recommendation, or needs research, review, action, verification, and monitoring options ranked after a substantial or winding thread.
---

# Next Steps

Turn a conversation's accumulated context into a concise, judgment-rich menu of what should happen next. Organize options around the user's goals rather than forcing every thread into one linear plan.

## Reconstruct the outcome

1. Read the full available thread, while respecting explicit conversation boundaries and newer instructions that supersede older ones.
2. Distinguish:
   - the active explicit request;
   - the underlying outcome suggested by repeated preferences, corrections, and choices;
   - constraints, non-goals, rejected paths, and authorization limits;
   - assumptions or missing context that reduce confidence.
3. State one concise intent hypothesis and its confidence. If two interpretations would materially change the recommendations, present both instead of silently choosing one.
4. Do not reactivate stale tasks merely because they appear earlier in the thread. Do not expose private chain-of-thought; summarize only conclusions and supporting evidence.

## Reconcile progress

Build a delta-first status view. Identify what is:

- completed and evidenced;
- in progress;
- blocked or awaiting a decision;
- implemented but unverified;
- superseded or no longer relevant.

Keep distinct proof layers separate when relevant, such as source changes, merge state, deployment state, live behavior, and downstream measurement. Label material claims as observed, inferred, or unavailable rather than presenting inference as fact.

## Perform bounded discovery

Use lightweight read-only discovery only when it could materially change the option set or priority. Prefer readily available thread, task, repository, or live-state evidence. Do not turn every invocation into deep research, and do not mutate state unless the user separately asks for execution.

## Generate adaptive option groups

Create two to five goal-oriented groups that fit the thread. Number group headings sequentially from `1` so each option has a stable shorthand such as `1A` or `2B`. Examples include product direction, technical work, evidence gaps, rollout, operations, growth, or follow-up. Do not use fixed categories when they distort the actual decision.

Within each group, provide up to three ranked options. For each option include:

- a rank within its group;
- a priority: **Now**, **Soon**, **Later**, or **Optional**;
- a type tag such as **Research**, **Review**, **Decision**, **Action**, **Verification**, or **Monitoring**;
- a short, action-led title using consistent verb-object wording, such as **Verify the production rollout** or **Freeze further homepage changes**;
- one concise judgment explaining why it belongs there and what outcome it produces;
- effort, risk, reversibility, or dependencies only when they materially affect the choice.

Treat the group number plus option letter as the stable option ID. A user may
reply with shorthand such as `1A` or `2B`; interpret it against the most recent
next-steps output. When referring back to an option in the response, pair its ID
with the repeated short title, such as **1A — Verify the production rollout**,
instead of ambiguous wording such as “Rollout A” or “Protect A.”

Format each option as one compact heading line followed by one or two indented
bullets. Put the judgment and outcome in a **Why** bullet. Add a second bullet
for dependencies, effort, risk, or reversibility only when materially useful.
This nested structure should make the groups easy to scan without flattening
all details into dense paragraphs.

Rank with judgment rather than a synthetic numeric score. Consider expected impact, urgency, uncertainty reduction, ability to unblock other work, dependency order, risk, reversibility, and fit with the user's demonstrated intent.

Interpret priorities consistently:

- **Now**: blocks the outcome, prevents a material risk, is time-sensitive, or unlocks several valuable paths.
- **Soon**: high-value follow-through that should happen after current blockers or evidence gaps.
- **Later**: worthwhile but not currently decisive.
- **Optional**: exploratory, marginal, or preference-dependent.

Include a monitor-or-stop option when taking no further action is legitimately strong. Do not manufacture research tasks when existing evidence is sufficient. Allow parallel and mutually exclusive options; do not force them into a false sequence.

## Recommend a portfolio

After the grouped options, recommend a small portfolio of complementary moves, normally one to three. Identify each selected option with its stable ID and repeat its exact short title. Use a short numbered or bulleted list with nested bullets for ordering or concurrency. Distinguish alternatives from complements and note any necessary order, but do not collapse the whole answer into a single mandatory sequence.

Recommendations are not authorization to execute. If the user asks only what comes next, remain non-mutating.

## Output format

Stay compact by default and expand only for consequential, ambiguous, or complex threads.

```markdown
## What you appear to want

<One-sentence intent hypothesis and confidence.>

## Where things stand

- <Up to five delta-first bullets.>

## 1. <Adaptive goal area>

A. **Now · Verification — Verify the production rollout**
   - **Why:** <Concise judgment and outcome.>
   - **Dependency:** <Only when materially useful.>

B. **Soon · Action — Freeze further homepage changes**
   - **Why:** <Concise judgment and outcome.>

## 2. <Another adaptive goal area>

A. **Now · Decision — Choose the measurement window**
   - **Why:** <Concise judgment and outcome.>

## Recommended portfolio

1. **1A — Verify the production rollout**
   - Do this first because it unlocks reliable live evidence.
2. **1B — Freeze further homepage changes**
   - Run this in parallel to protect the experiment.
3. **2A — Choose the measurement window**
   - Do this after live verification.

## Decision needed

<Up to two questions only when answers materially change the path.>
```

Omit empty sections. Number groups sequentially and use letters within each group, resetting at `A`, to create stable IDs such as `1A` and `2B`. Keep option titles short, action-led, and repeated verbatim with their IDs wherever referenced. Use nested bullets consistently, but omit empty metadata bullets. Keep the default response to one intent paragraph, no more than five progress bullets, two to five groups, up to three options per group, one portfolio recommendation, and at most two decision-critical questions.
