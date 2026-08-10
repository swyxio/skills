---
name: design-apps-with-imagegen
description: Design, reskin, or improve apps and sites through a user-confirmed image-first product loop. Use when Codex should audit an existing interface, generate four materially different visual and behavioral directions including a wildcard, present numbered visual and product-behavior decisions for user approval, implement the selected direction with code and generated assets where appropriate, candidly compare matched screenshots across mobile, tablet, and desktop, repair visual drift, and integrate the proven result.
---

# Design Apps with ImageGen

Use an image-to-product-implementation-to-critique loop. Explore layout, interaction, and product behavior—not styling alone. Do not jump from a verbal brief directly into live interface code, and do not silently choose visual or behavioral changes for the user.

Read [references/imagegen-workflow.md](references/imagegen-workflow.md) before generating directions. Read [references/visual-comparison.md](references/visual-comparison.md) before evaluating prototypes. Read [references/edge-case-matrix.md](references/edge-case-matrix.md) before integration.

Read [references/implementation-miss-ledger.md](references/implementation-miss-ledger.md) before coding and again before the visual critique. It records omissions that commonly make an implementation technically complete but visually unlike its selected design.

Inspect `assets/design-loop-reference.png` when a compact reminder of the loop is useful.

## Required loop

### 1. Audit the real interface

- Inspect routes, components, state owners, persisted contracts, current screenshots, and existing responsive behavior.
- Inventory every user-visible capability, including settings, nested menus, account or permission surfaces, destructive actions, help, imports and exports, and developer or audit tools.
- Record loading, empty, success, error, disabled, offline, retry, confirmation, and maximum-density states.
- Separate non-negotiable data, safety, and behavioral invariants from visual and product-behavior questions that are open to proposals.
- Do not let a cleaner mock silently remove or weaken existing functionality.

### 2. Generate four directions before coding

- Use ImageGen to create four materially different visual, interaction, and product-behavior directions. Make the fourth a purposeful wildcard unconstrained by review cost.
- Aim for a conservative refinement, a structural rethink, a bold product direction, and a wildcard rather than four surface variations.
- Include enough real content and controls to test hierarchy, not just a decorative hero view.
- Show at least one compact/mobile composition and one desktop composition.
- Generate expanded settings or menu states when those surfaces affect the information architecture.
- State true invariants explicitly, but invite ideas for capabilities, navigation, defaults, workflow, and interaction where the product contract is open.
- Treat generated text and controls as proposals, never as automatically approved product truth.
- Evaluate each direction for usability, feasibility, minimum accessibility, asset requirements, behavioral consequences, and treatment of the audited capabilities.

### 3. Present choices and get explicit confirmation

- Present all four directions as mutually exclusive lettered choices with a stable label, thumbnail or image, design thesis, strongest advantage, main tradeoff, and implementation risk.
- Beneath the direction choices, number every material visual, interaction, or product-behavior decision that needs approval. Give each decision lettered options, mark a recommendation, and explain its rationale and consequence.
- Recommend one option and explain why, but do not treat the recommendation as approval.
- Use the product's structured choice UI when available. Otherwise present a numbered list and ask one blocking question.
- Use one selection gate for the direction and all known material visual and behavioral decisions. Wait for the user to explicitly select, combine, or reject them before editing production UI.
- Do not infer approval from silence, prior enthusiasm, or the fact that one option appears objectively strongest.
- If the user requests a hybrid, restate the combined contract and get confirmation when the combination materially changes layout or interaction.
- Record the selected direction, retained traits, rejected tradeoffs, and any authorized deviations. This becomes the visual acceptance reference.
- Treat approval as authority only for the numbered visual and behavioral changes presented at the gate. Keep every other audited capability and contract invariant.
- Skip this gate only when the user explicitly delegates the selection.

Use this compact choice shape:

```text
A — <name>: <visual and product thesis>
Best for: <primary advantage>
Tradeoff: <main cost or risk>

1. <Material visual or behavioral decision>
   A. <option and consequence>
   B. <option and consequence> — Recommended because <rationale>

Direction recommendation: <A–D>, because <reason>.
Which direction and numbered options should I implement? Example: `C, 1B, 2A`.
```

### 4. Implement the confirmed direction beside the live product

- Choose isolation on risk and iteration speed. Use a standalone route, story, prototype, or feature gate for structural or behavior-heavy changes; implement bounded corrections directly. When uncertain, prototype separately for a faster feedback cycle.
- Use real content, representative data density, and existing components where practical.
- Keep prototype persistence, network effects, analytics, and destructive actions isolated.
- Use ImageGen again after selection to create production-bound textures, seamless tiles, illustrations, material surfaces, decorative assets, or other raster details needed to reproduce the approved design.
- Do not force every visual trait into HTML, CSS, JavaScript, or SVG. Prefer generated raster assets when texture, organic variation, or illustrative detail is central to the selected direction; prefer code-native rendering for dynamic text, interactive state, simple geometry, and frequently changing UI.
- Prove any asset-heavy treatment early with one representative asset at its actual display size. Test tile seams, crops, resolution, compression, theme compatibility, and asset weight.
- Translate the selected direction's spatial thesis into explicit geometry: fold position, column widths, maximum copy measures, fixed or sticky regions, breakpoint behavior, and disclosure rules.
- Reuse the application's real header, footer, theme tokens, typography, and interaction primitives unless the selected direction explicitly replaces them.
- Constrain unpredictable data such as long titles, descriptions, counts, and lists. Do not let convenient `flex-wrap` or content length silently redesign the composition.
- Preserve audited behavior and state contracts. Matching the picture does not authorize removing functionality.

### 5. Capture matched screenshots

- Capture the ImageGen reference and prototype at the same viewport, UI state, content density, and expanded-menu state.
- Include iPhone portrait, iPad portrait, half-width desktop, and full desktop. Never critique only the desktop composition.
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
- Fix the highest-impact visual differences, recapture the same states, and repeat without an arbitrary round limit until the remaining gaps are understood and acceptable.
- Prefer targeted corrections over repeatedly rewriting the whole prototype.
- Do at least one correction round after the first honest comparison unless the implementation already matches closely and the evidence supports that conclusion. Pay special attention to mobile and iPad recomposition in every critique round.
- Finish autonomously when the confirmed contract is met and no material delta remains. Return to the user when an open delta would change the selected thesis, approved behavior, or primary responsive composition.

### 7. Validate settings, edge cases, and responsive behavior

- Exercise settings both collapsed and expanded, including dependent, disabled, destructive, and unsaved states.
- Test long labels, translated or user-generated text, zero items, one item, maximum items, slow loading, failure, retry, expired sessions, missing permissions, and offline recovery.
- Enforce a minimum bar for visible and reachable focus, zoom, contrast, overflow, asset weight, and layout stability or performance. Treat serious failures in these areas as blockers.
- Check keyboard-only completeness, screen-reader detail, coarse pointers, safe areas, reduced motion, and high-contrast modes proportionally to the product and task rather than making every redesign a full accessibility audit.
- Recompose for smaller screens instead of merely shrinking desktop layout. Use sheets, drawers, dedicated routes, or progressive disclosure when side panels become cramped.
- Preserve selection, focus, scroll position, and in-progress edits when the layout changes across breakpoints.

### 8. Integrate and merge

- Port the proven prototype into shared production components only after the visual comparison is close enough.
- Preserve application contracts unless the task explicitly authorizes behavior changes.
- Prefer semantic tokens and reusable primitives over scattered one-off styling.
- Keep every audited capability reachable; move secondary controls into clear nested surfaces rather than deleting or hiding them.
- Run focused behavior tests, responsive visual checks, and the real user flow after integration.
- Commit and merge only after implementation and visual validation pass, following the repository's source-control and deployment rules.

## Preserve design history

Keep the selected reference, the original implementation capture, matched final captures, capture metadata, approved visual and behavioral decisions, and the final delta ledger in the project's established design-history location. Keep rejected and intermediate explorations only when they retain decision value; otherwise leave them outside the repository.

## Maintain the miss ledger

After each real use, identify any broadly reusable omission that was not already covered in [references/implementation-miss-ledger.md](references/implementation-miss-ledger.md).

- Never edit this skill or its ledger as part of running the skill itself.
- Report proposed lessons under `Memory ledger candidates` in the handoff so the user can review them and authorize a separate skill update.
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
