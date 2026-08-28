# Concrete visuals and rendered review

Use this guidance for authored diagrams, interactions and their placement in an article. The goal is explanatory value, not a particular component style or a quota of interactive elements.

## Choose the representation during outlining

Match the form to the relationship, not to a desire for visual variety:

| Relationship the reader needs to see | Useful form | Essential distinction |
| --- | --- | --- |
| Overlapping work and request latency | Span timeline | Shared time axis; parentage is not overlap; summed durations are not elapsed time |
| Calls, returns and handoffs | Sequence diagram or swimlanes | Actors, message direction and ordering; spacing need not encode duration |
| Branches, retries and termination | Flowchart | Conditions on edges and concrete exits, not paragraphs connected by arrows |
| Legal changes to an object | State-transition diagram | States versus events; guards and rejected transitions |
| Information moving through a system | Data-path or boundary diagram | Labeled data and transformations; distinguish control from data flow |
| Reuse, recomputation and allocation | Token/memory schematic | Stable identities across steps; show which work is retained or repeated |
| Pairwise relationships or concentration | Matrix/heatmap | Named axes, scale and missing/masked values |
| Tails or competing constraints | Distribution or tradeoff plot | Evidence, units and comparable populations; clearly label constructed examples |
| A controlled change | Aligned before/after or small multiples | Hold context and scales fixed so the difference is visible |

These are eligible forms, not automatic approval of an instance or a required quota. Prefer a static figure when the insight is visible without interaction. An interactive should reveal a meaningful regime change, competing effects, or a hypothesis the reader can investigate; a slider moving one point along a simple curve is not enough. Keep the useful initial state visible.

Assessments are separate. When requested, use low-friction multiple choice with immediate feedback and an explicit correct answer after a mistake. Progress difficulty through application, diagnosis and combined constraints; more arithmetic, longer wording or extra clicks do not establish greater difficulty. Plausible alternatives should require the chapter's concepts to distinguish them.

## Start with the example, not the controls

Identify the question the visual should answer, its actual objects and the decisive dependency or change. Keep a compact private record of source facts, constructed teaching inputs, expected outcomes and invariants. Adjacent prose, code and images should use the same example or make the transition explicit.

Useful tests of a design:

- **Cache reuse:** show actual tokens, old K/V entries retained, the current token's new Q/K/V, and what uncached execution would recompute. Growing boxes alone does not explain reuse. Do not invent latency numbers.
- **Permissions or approvals:** preserve the exact request while changing authority or approval; show the resulting row or service state. A proposed action is not an executed action. In an example of asynchronous continuation, persist callback-correlatable state before dispatching work that could return immediately.
- **Agent versus judge:** put the task, answer, verdict and human assessment together. Show which instruction or rubric changes when the agent or judge is wrong; two abstract loops alone miss the disagreement.
- **Retrieval filters:** hold the query and candidate identities fixed, then visibly exclude nonmatching records. Preserved order in a toy list does not establish a universal database-ranking guarantee.

These are examples, not mandatory archetypes. A static matrix, code diff, equation or direct screenshot may explain another talk better.

## Compose the explanation once

- Make the meaningful objects large enough to read: tokens, code, data rows, prompt edits and state changes. Minimize introductory labels, decorative icons, duplicate status panels and captions repeating the same outcome.
- Use direct controls for actual choices or operations. Avoid a “Play walkthrough” button that merely narrates cards. Animate a consequence where useful, then leave its final state inspectable. Do not make correctness depend on an animation finishing; respect reduced-motion preferences.
- Use color to communicate state, with labels or another non-color signal. Preserve genuine differences and unchanged objects; do not replace a demonstrated result with an invented benchmark or a generic success message.
- For this user's authored visuals, avoid thin rounded colored card outlines, curved accent-top stripes and decorative outlined status pills. Prefer neutral framing and purposeful typography/color. This is not a ban on all radii, circles, database cylinders, color or motion, and it does not justify altering an authentic source screenshot.
- Introduce a constructed example naturally once. Do not repeat “illustrative,” “synthetic local simulation,” or “not the speaker's exact code” around every object. Retain consequential boundaries such as pending tests, hypothetical outcomes or unexecuted external actions without implying a real API call occurred.

## Review the real composition

First check for missing visuals: can the reader inspect the central temporal, spatial, causal or state relationship, or only read a verbal description? Do not count tables or text cards as resolving that gap. Conversely, remove a figure that merely repeats prose without revealing the relationship.

Use the pilot/batch/patch scope in `SKILL.md`. For a new or materially changed visual, read its actual code and state data with the adjacent prose, then inspect desktop and narrow-phone rendering. A plan cannot overrule a correct implementation.

- Check the initial state, decisive consequence and reset where present. Verify fixed inputs and changing outputs; static comparisons need no invented interaction checklist.
- Inspect legibility, contrast, reading order, overflow and affected controls' focus/keyboard behavior. Internal scrolling for long code is acceptable; page-wide overflow is not.
- Check decoded images against captions, visible errors and affected timestamp/player behavior. Do not retest unchanged player controls for a prose-only edit.

Keep a compact record of the reviewed revision, viewports, meaningful states, screenshots and defects. Reuse unaffected component checks, but do not claim a new page or state was visually inspected from old screenshots. No screenshot-count quota or duplicate independent review is required. Stop once the explanation works and material defects are resolved; distinguish observed, automated and untested results.
