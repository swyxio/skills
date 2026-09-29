# ImageGen direction workflow

Use the installed `imagegen` skill and its built-in tool mode by default.

## Reference search before ideation

- Use computer use in Chrome to browse and search the free Mobbin website. If Chrome is stuck, use computer control. Do not substitute the Codex in-app browser, a Mobbin MCP, or an API for this research step.
- Search by the actual interaction problem, such as command menus, progressive disclosure, dense reading, search results, or long-running progress. Inspect screens and flows where accessible; do not infer behavior from a single screenshot.
- Aim for 6–8 useful references across at least three product families, including adjacent categories rather than only direct competitors. Keep scouting to roughly ten minutes; stop earlier when the references provide distinct principles.
- Use only content accessible for free. If login is needed, use an existing authorized Chrome session; do not create an account, subscribe, or bypass access restrictions. If access is blocked or the free sample is small, record the limitation and continue with accessible public product references.
- For each inspected reference, save its source link and a short note: the composition or interaction principle to borrow, why it fits, and what should not transfer. Retain screenshots when the tool permits, and visually inspect them before using them as ImageGen inputs. A link or product name alone is not a visual reference.
- Give each direction a different reference set. Include a reference outside software—editorial typography, wayfinding, physical instruments, or another relevant discipline—when it adds a useful principle to the wildcard. Borrow principles rather than reproducing branding or an entire screen.

## Divergent creative briefs

Before generating images, define each candidate's composition, typography, density, palette, interaction model, and signature move. Each pair must differ on at least three axes, including composition or interaction. Reject candidates that become indistinguishable when their accent colors are removed.

For a substantial redesign, start with about eight lightweight studies and develop the four most meaningfully different candidates. Keep early studies cheap: concise briefs or rough compositions suffice before full desktop/mobile ImageGen studies. For a bounded task, proceed directly to four distinct briefs. Do not spend the entire exploration budget polishing the first idea.

Generate each finalist in a separate call with its own brief and references; avoid one shared prompt that anchors every direction to the same aesthetic. Label the current app as a functionality reference, and state which styling and geometry may change within scope. Shared shell requirements remain invariant unless their replacement is explicitly in scope.

## Exploration prompt structure

```text
Use case: ui-mockup
Asset type: responsive app or site interaction study
Primary request: <the unresolved hierarchy or interaction>
Input images: <label each as style reference, geometry reference, or current implementation>
Style/medium: shippable product UI, not concept art
Design thesis: <specific composition and interaction principle>
Visual language: <typography, density, palette, and spatial organization>
Signature move: <one recognizable defining treatment>
Reference principles: <what to borrow from each attached, inspected reference>
Composition: <named viewports and expanded states>
Shared invariants: <exact counts, rules, controls, and behavior that must not change>
Open product questions: <behavior, navigation, defaults, workflow, or capability proposals invited>
Direction: <one independently briefed direction; use separate calls for the other finalists>
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

- Does each direction have a recognizable signature and differ meaningfully from the others beyond color and corner radius?
- Does the output preserve every named capability?
- Are collapsed and expanded states both represented?
- Are primary and secondary actions visually distinct?
- Is the strongest accent used sparingly and consistently?
- Does mobile recompose rather than merely shrink?
- Can the look be built with the available asset pipeline?
- Is any generated text being mistaken for an authoritative rule?
- Does the direction remain coherent across mobile, tablet, half-width desktop, and full desktop?
