---
name: design-apps-with-imagegen
description: Design or reskin apps and sites through an image-first implementation loop. Use when Codex should audit an existing interface, generate several ImageGen directions before coding, build isolated prototypes, compare matched screenshots against the generated references, iterate on visual differences, validate settings and edge cases across responsive sizes, and then integrate and merge the proven design.
---

# Design Apps with ImageGen

Use an image-to-implementation loop. Do not jump from a verbal brief directly into live interface code.

Read [references/imagegen-workflow.md](references/imagegen-workflow.md) before generating directions. Read [references/visual-comparison.md](references/visual-comparison.md) before evaluating prototypes. Read [references/edge-case-matrix.md](references/edge-case-matrix.md) before integration.

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

### 3. Select a direction and prototype beside the live product

- Choose a direction deliberately; record the useful traits and rejected tradeoffs of the alternatives.
- Build a standalone, story, route, or feature-gated prototype before changing the live flow.
- Use real content, representative data density, and existing components where practical.
- Keep prototype persistence, network effects, analytics, and destructive actions isolated.
- Prove any asset-heavy treatment early with one representative asset at its actual display size.

### 4. Capture matched screenshots

- Capture the ImageGen reference and prototype at the same viewport, UI state, content density, and expanded-menu state.
- Include iPhone portrait, iPad portrait, half-width desktop, and full desktop.
- Add landscape, ultrawide, or embedded-panel sizes when the product supports them.
- Inspect screenshots visually. Passing builds and DOM assertions do not establish visual quality.

### 5. Compare, list deltas, and fix

- Compare side by side first; use overlays or pixel diffs when alignment and spacing need closer inspection.
- Create a finite delta list covering hierarchy, composition, spacing, type, color, depth, material, iconography, density, and interaction reachability.
- Distinguish intentional implementation adaptations from accidental drift.
- Fix the highest-impact visual differences, recapture the same states, and repeat until the remaining gaps are understood and acceptable.
- Prefer targeted corrections over repeatedly rewriting the whole prototype.

### 6. Validate settings, edge cases, and responsive behavior

- Exercise settings both collapsed and expanded, including dependent, disabled, destructive, and unsaved states.
- Test long labels, translated or user-generated text, zero items, one item, maximum items, slow loading, failure, retry, expired sessions, missing permissions, and offline recovery.
- Check keyboard focus and order, touch targets, coarse pointers, safe areas, zoom, reduced motion, and high-contrast needs.
- Recompose for smaller screens instead of merely shrinking desktop layout. Use sheets, drawers, dedicated routes, or progressive disclosure when side panels become cramped.
- Preserve selection, focus, scroll position, and in-progress edits when the layout changes across breakpoints.

### 7. Integrate and merge

- Port the proven prototype into shared production components only after the visual comparison is close enough.
- Preserve application contracts unless the task explicitly authorizes behavior changes.
- Prefer semantic tokens and reusable primitives over scattered one-off styling.
- Keep every audited capability reachable; move secondary controls into clear nested surfaces rather than deleting or hiding them.
- Run focused behavior tests, responsive visual checks, and the real user flow after integration.
- Commit and merge only after implementation and visual validation pass, following the repository's source-control and deployment rules.

## Handoff

Report:

- The generated directions and why one was selected.
- Which functionality was preserved, moved, or newly exposed.
- Which matched viewports, settings, menus, and edge states were visually inspected.
- Which visual deltas remain and whether each is intentional.
- Which ImageGen outputs were exploratory and which assets were copied into the project.
- The exact paths and source-control state of the integrated work.

Never claim visual parity from a build, test result, or generated mock alone.
