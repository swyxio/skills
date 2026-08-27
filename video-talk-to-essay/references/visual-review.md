# Concrete visuals and rendered review

Use this guidance for authored diagrams, interactions and their placement in an article. The goal is explanatory value, not a particular component style or a quota of interactive elements.

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

Source/code review and browser inspection answer different questions. Review the actual component plus the data, helpers and reducers it uses; a provisional plan is not an authority that can overrule a correct source-grounded repair.

Inspect the rendered article at a representative desktop width and a narrow phone width:

1. Read the setup, visual and following passage together. Can the reader explain the mechanism without an extra concluding paragraph? Does the visual add something rather than duplicate adjacent bullets?
2. Capture and inspect initial and consequential states. Verify inputs that must stay fixed, results that must change, approval/permission boundaries, retained work and reset. For static comparisons, check the mapping and both sides; do not invent controls just to satisfy an interaction checklist.
3. Check code/labels, contrast, focus and keyboard behavior, responsive layout and horizontal overflow. Internal scrolling for a long code line can be appropriate; page-wide overflow is not. Give multicolumn procedures or event histories unambiguous reading order.
4. Verify images decode with nonzero natural dimensions, captions match the visible frame, and screenshots remain useful at their rendered size. Inspect console/page errors and hydration failures. Preserve and check timestamp/player behavior when affected.
5. Record the article and component revision, viewports, screenshots, exercised states, observed failures and unresolved limits. If code or layout changes, recheck the affected states and update the evidence; do not reuse a screenshot as proof of a different revision.

Keep the evidence private. Report actual observations separately from automated checks and things not tested. Visual review belongs in the generation/revision workflow, not as a cosmetic audit after publication.
