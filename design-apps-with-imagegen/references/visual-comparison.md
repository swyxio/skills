# Visual comparison protocol

Compare the generated reference and the prototype under equivalent conditions. A comparison is weak when the viewport, content, state, crop, or browser scale differs.

## Capture pairs

For each important surface, record:

- viewport width and height
- device pixel ratio or screenshot scale
- route and UI state
- content fixture and data density
- open menu, drawer, modal, tooltip, or settings section
- pointer and focus state when relevant

Capture at minimum:

- iPhone portrait around 390 x 844
- iPad portrait around 834 x 1194
- half desktop around 720 x 900
- full desktop around 1440 x 900

Use product-specific breakpoints when they reveal more meaningful transitions.

Do not complete the critique from a desktop screenshot alone. Inspect mobile and iPad compositions visually in every correction round; responsive assertions or resized DOM geometry are supporting evidence, not substitutes.

## Compare in this order

1. Information hierarchy and primary action
2. Overall composition and responsive reflow
3. Density, whitespace, and grouping
4. Typography scale, weight, and measure
5. Color roles, contrast, and accent restraint
6. Surfaces, borders, shadows, and depth
7. Iconography, imagery, and material details
8. Expanded menus, settings, and state transitions
9. Focus visibility and reachability, zoom, contrast, overflow, and touch affordances
10. Asset weight, layout stability, and obvious rendering-performance risks

## Delta ledger

Write each difference as a testable item:

```text
State: settings open, half desktop
Observed delta: navigation consumes two rows instead of one
Impact: primary content falls below the fold
Targeted fix: collapse labels before moving navigation to a second row
Status: open | fixed | intentional
```

Mark a delta `intentional` only when implementation constraints or usability evidence justify the departure. Do not use that label to excuse unfinished styling.

## Optional overlays

Use a 50-percent opacity overlay or pixel diff for alignment, geometry, and spacing. Do not treat raw pixel difference as a quality score: font rendering, generated-image artifacts, and intentional responsive adaptations can create large diffs without indicating a usability problem.

Recapture the same pair after each focused round of fixes. Stop when remaining differences are explicit, acceptable, and unlikely to undermine the selected direction.
