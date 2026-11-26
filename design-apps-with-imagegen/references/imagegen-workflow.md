# ImageGen direction workflow

Use the installed `imagegen` skill and its built-in tool mode.

## Targeted inspiration

Choose references for the problem and scope. Free [Mobbin](https://mobbin.com) is one useful source: browse it in Chrome computer use; if Chrome is stuck, follow the applicable recovery guidance. Also consider live products, adjacent disciplines such as editorial layouts and wayfinding, or the user's own design references. Avoid a fixed research quota for small component changes.

Search by the interaction problem: command menus, progressive disclosure, dense reading, search results, or progress. Inspect flows where accessible; a screenshot alone does not establish behavior. Look beyond direct competitors to adjacent product families.

For substantial exploration, look across multiple product families; stop when distinct useful principles are clear. Use an existing authorized Chrome session if login is needed; do not create accounts, subscribe, or bypass restrictions. If free access is limited, disclose that and continue with accessible public references.

For each inspected reference, keep its link and a note on what to borrow, why it fits, and what should not transfer. Capture and inspect images when the tools permit; a product name or URL is not an image input.

### Taste MCP

If Taste MCP is connected, discover its available tools and read the relevant profile, saved references, notes, or collection for the task. An empty library or unavailable tool is not evidence of a design preference; report the limitation and use other sources. The local Taste skill/export is not proof that the live MCP connection works. See [Taste's setup and privacy details](https://buildwithtaste.com/product/mcp). Do not configure or authenticate an MCP connection without the user's request. Taste Previews is optional when available: it can save designs, feedback, and project decisions to Taste; follow the user's authorization and the tool's current instructions. Do not assume it is read-only or that it applies changes to the app.

## Distinct briefs

Define composition, typography, density, palette, interaction model, and a signature move appropriate to the scope. Give directions meaningfully different reference principles and avoid shared prompts that force the same layout. Label the current app as a functionality reference and identify what may change.

Reject palette-only variants. For a small element, compare three alternatives with distinct hierarchy, behavior, or visual treatment and explain the tradeoffs. For a larger screen, compare four concepts across at least three axes, including composition or interaction; use a wildcard where useful. Borrow a principle from editorial design, wayfinding, physical instruments, or another non-software discipline when it fits.

For fast feedback, one ImageGen call can produce a clearly labeled three- or four-panel contact sheet with the same representative content, no phone frames, and enough room to compare the primary idea. Treat it as a rough study, not a detailed or accurate UI specification: small text and controls may be wrong. If panels are hard to inspect, generate separate full-size directions; after feedback, expand or combine the favored ideas at the actual desktop or mobile viewport. Separate calls also suit directions requiring distinct visual references. Do not make one contact sheet or a fixed number of calls mandatory.

## Prompt shape

```text
Use case: ui-mockup
Request: <one direction's design thesis and unresolved interaction>
References: <attached inspected images, their roles, and principles to borrow>
Visual language: <composition, typography, density, palette, signature move>
Composition: <scope, viewport, representative content density, expanded states>
Invariants: <capabilities, exact counts, dependencies, and rules>
Open questions: <authorized areas for workflow or behavior proposals>
Constraints: shippable UI, readable copy, practical controls, no watermark
```

Inspect results for missing capabilities, invented controls, impossible navigation, and contradictory states. Correct factual drift while retaining invariants; present useful new behavior as a proposal. Keep exploratory images outside the project; copy selected production assets into its established asset location.

## Asset-dependent directions

Generate one representative asset at real usage scale. Check crops, resolution, compression, supported themes, and consistency across the required set; test seams for tiles. Use raster assets for texture, illustration, and organic material. Keep small text, changing state, UI controls, and simple geometry code-native. Generate production assets separately rather than extracting them from a contact sheet.
