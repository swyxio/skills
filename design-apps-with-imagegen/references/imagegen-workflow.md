# ImageGen direction workflow

Use the installed `imagegen` skill and its built-in tool mode by default.

## Exploration prompt structure

```text
Use case: ui-mockup
Asset type: responsive app or site interaction study
Primary request: <the unresolved hierarchy or interaction>
Input images: <label each as style reference, geometry reference, or current implementation>
Style/medium: shippable product UI, not concept art
Composition: <named viewports and expanded states>
Shared invariants: <exact counts, rules, controls, and behavior that must not change>
Open product questions: <behavior, navigation, defaults, workflow, or capability proposals invited>
Variants: conservative refinement; structural rethink; bold product direction; purposeful wildcard
Constraints: practical touch targets; readable copy; distinguish proposals from invariants; no watermark
```

## Rules

- Label the role of every reference image.
- Ask for practical UI, not cinematic concept art.
- Put exact counts and dependencies in both `Shared invariants` and `Constraints`.
- Generate separate calls for distinct assets or surfaces. Do not rely on one giant contact sheet for final asset production.
- Keep preview-only studies under the generated-image path. Copy selected project-bound assets into the project or skill before referencing them.
- Inspect every result for factual drift. Common failures include invented menu items, missing controls, impossible navigation, contradictory toggle states, misleading text, and inconsistent counts.
- Treat plausible new controls or behaviors as proposals to include in the numbered confirmation gate, not as errors to implement silently.
- Correct one factual or visual issue per edit where practical; restate every invariant that must remain unchanged.

## Asset-feasibility study

When a visual direction depends on raster assets, or when code-native approximations would flatten its material character:

1. Generate one representative asset at its real usage scale.
2. Test it on light/dark states and at mobile/desktop density.
3. Check whether the look can be repeated consistently for the full required set.
4. Test seamless tiles for visible edges and illustrations for cropping at every target aspect ratio.
5. Check resolution, high-density rendering, compression, theme compatibility, and asset weight.
6. Prefer code-native rendering if the generated asset would contain small text, UI chrome, simple geometry, or a frequently changing state. Prefer raster assets for texture, organic variation, illustration, and decorative material detail.
7. Save selected project-bound assets in the project's established asset location; keep discarded explorations outside the repository.

## Direction-selection checklist

- Does the output preserve every named capability?
- Are collapsed and expanded states both represented?
- Are primary and secondary actions visually distinct?
- Is the strongest accent used sparingly and consistently?
- Does mobile recompose rather than merely shrink?
- Can the look be built with the available asset pipeline?
- Is any generated text being mistaken for an authoritative rule?
- Does the direction remain coherent across mobile, tablet, half-width desktop, and full desktop?
