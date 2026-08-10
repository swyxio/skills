---
name: design-apps-with-imagegen
description: Design, reskin, or improve apps and sites through a user-confirmed image-first implementation loop. Use when Codex should audit an existing interface, generate several materially different ImageGen directions, present them as explicit choices and wait for the user to select one, implement the selected direction, candidly compare matched screenshots against that exact design, repair visual drift, validate responsive and edge states, and integrate the proven result.
---

# Design Apps with ImageGen

Use an image-to-implementation-to-critique loop. Do not jump from a verbal brief directly into live interface code, and do not silently choose a visual direction for the user.

Read [references/imagegen-workflow.md](references/imagegen-workflow.md) before generating directions. Read [references/visual-comparison.md](references/visual-comparison.md) before evaluating prototypes. Read [references/edge-case-matrix.md](references/edge-case-matrix.md) before integration.

Read [references/implementation-miss-ledger.md](references/implementation-miss-ledger.md) before coding and again before the visual critique. It records omissions that commonly make an implementation technically complete but visually unlike its selected design.

Inspect `assets/design-loop-reference.png` when a compact reminder of the loop is useful.

## Required loop

### 1. Audit the real interface

- Inspect routes, components, state owners, persisted contracts, current screenshots, and existing responsive behavior.
- Inventory every user-visible capability, including settings, nested menus, account or permission surfaces, destructive actions, help, imports and exports, and developer or audit tools.
- Record loading, empty, success, error, disabled, offline, retry, confirmation, and maximum-density states.
- Separate behavior that must remain invariant from visual structure that may change.
- Do not let a cleaner mock silently remove or weaken existing functionality.

### 2. Generate several directions before coding

- Use ImageGen to create three or four materially different visual and interaction directions.
- Include enough real content and controls to test hierarchy, not just a decorative hero view.
- Show at least one compact/mobile composition and one desktop composition.
- Generate expanded settings or menu states when those surfaces affect the information architecture.
- State functional invariants explicitly in every prompt. Treat generated text and controls as suggestions, never as product truth.
- Evaluate each direction for usability, feasibility, accessibility, asset requirements, and ability to preserve the audited capabilities.

### 3. Present choices and get explicit confirmation

- Present every viable direction as a short, mutually exclusive choice with a stable label, thumbnail or image, design thesis, strongest advantage, main tradeoff, and implementation risk.
- Recommend one option and explain why, but do not treat the recommendation as approval.
- Use the product's structured choice UI when available. Otherwise present a numbered list and ask one blocking question.
- Wait for the user to explicitly select, combine, or reject the directions before editing production UI. Do not infer approval from silence, prior enthusiasm, or the fact that one option appears objectively strongest.
- If the user requests a hybrid, restate the combined contract and get confirmation when the combination materially changes layout or interaction.
- Record the selected direction, retained traits, rejected tradeoffs, and any authorized deviations. This becomes the visual acceptance reference.
- Skip this gate only when the user explicitly delegates the selection.

Use this compact choice shape:

```text
A — <name>: <design thesis>
Best for: <primary advantage>
Tradeoff: <main cost or risk>

Recommendation: <label>, because <reason>.
Which direction should I implement: A, B, C, or a stated hybrid?
```

### 4. Implement the confirmed direction beside the live product

- Build a standalone, story, route, or feature-gated prototype before changing the live flow.
- Use real content, representative data density, and existing components where practical.
- Keep prototype persistence, network effects, analytics, and destructive actions isolated.
- Prove any asset-heavy treatment early with one representative asset at its actual display size.
- Translate the selected direction's spatial thesis into explicit geometry: fold position, column widths, maximum copy measures, fixed or sticky regions, breakpoint behavior, and disclosure rules.
- Reuse the application's real header, footer, theme tokens, typography, and interaction primitives unless the selected direction explicitly replaces them.
- Constrain unpredictable data such as long titles, descriptions, counts, and lists. Do not let convenient `flex-wrap` or content length silently redesign the composition.
- Preserve audited behavior and state contracts. Matching the picture does not authorize removing functionality.

### 5. Capture matched screenshots

- Capture the ImageGen reference and prototype at the same viewport, UI state, content density, and expanded-menu state.
- Include iPhone portrait, iPad portrait, half-width desktop, and full desktop.
- Add landscape, ultrawide, or embedded-panel sizes when the product supports them.
- Inspect screenshots visually. Passing builds and DOM assertions do not establish visual quality.
- Capture the implemented result before calling the implementation complete. A screenshot of the mock alone proves nothing.

### 6. Critique the implementation against the selected design

- Compare side by side first; use overlays or pixel diffs when alignment and spacing need closer inspection.
- Create a finite delta list covering hierarchy, composition, spacing, type, color, depth, material, iconography, density, and interaction reachability.
- Start with the selected direction's spatial thesis. Ask whether the implementation preserves the same fold, dominant region, visual weight, information density, and responsive transformation—not merely the same feature inventory.
- Be candid about implementation habits that caused drift: generic stacked cards, permissive wrapping, excessive preambles, unconstrained registry copy, substituted components, omitted artwork, missing shared styles, or breakpoint fallbacks.
- Measure important geometry when possible: masthead height, content start position, rail widths, line count, overflow width, and visible items above the fold.
- Distinguish intentional implementation adaptations from accidental drift.
- Fix the highest-impact visual differences, recapture the same states, and repeat until the remaining gaps are understood and acceptable.
- Prefer targeted corrections over repeatedly rewriting the whole prototype.
- Do at least one correction round after the first honest comparison unless the implementation already matches closely and the evidence supports that conclusion.

### 7. Validate settings, edge cases, and responsive behavior

- Exercise settings both collapsed and expanded, including dependent, disabled, destructive, and unsaved states.
- Test long labels, translated or user-generated text, zero items, one item, maximum items, slow loading, failure, retry, expired sessions, missing permissions, and offline recovery.
- Check keyboard focus and order, touch targets, coarse pointers, safe areas, zoom, reduced motion, and high-contrast needs.
- Recompose for smaller screens instead of merely shrinking desktop layout. Use sheets, drawers, dedicated routes, or progressive disclosure when side panels become cramped.
- Preserve selection, focus, scroll position, and in-progress edits when the layout changes across breakpoints.

### 8. Integrate and merge

- Port the proven prototype into shared production components only after the visual comparison is close enough.
- Preserve application contracts unless the task explicitly authorizes behavior changes.
- Prefer semantic tokens and reusable primitives over scattered one-off styling.
- Keep every audited capability reachable; move secondary controls into clear nested surfaces rather than deleting or hiding them.
- Run focused behavior tests, responsive visual checks, and the real user flow after integration.
- Commit and merge only after implementation and visual validation pass, following the repository's source-control and deployment rules.

## Maintain the miss ledger

After each real use, identify any broadly reusable omission that was not already covered in [references/implementation-miss-ledger.md](references/implementation-miss-ledger.md).

- If this skill directory is explicitly within the current write scope, append a concise prevention rule to the ledger.
- Otherwise report it under `Memory ledger candidates` in the handoff without modifying the skill.
- Generalize the lesson; do not store project names, blame, transient bugs, or one-off aesthetic preferences.
- Prefer a detection check and prevention rule over a vague reminder.

## Handoff

Report:

- The generated directions and why one was selected.
- Which functionality was preserved, moved, or newly exposed.
- Which matched viewports, settings, menus, and edge states were visually inspected.
- Which visual deltas remain and whether each is intentional.
- Which ImageGen outputs were exploratory and which assets were copied into the project.
- The candid visual critique, measured geometry, correction rounds, and unresolved deltas.
- Any `Memory ledger candidates` discovered during the run.
- The exact paths and source-control state of the integrated work.

Never claim visual parity from a build, test result, or generated mock alone.
