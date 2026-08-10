# Image-to-implementation miss ledger

Read this before coding and before declaring visual completion. These are recurring ways an implementation preserves the mock's parts while losing its design.

| Common miss | Detection check | Prevention rule |
| --- | --- | --- |
| Feature inventory replaces spatial thesis | Do the mock and implementation have the same dominant region, fold, and visual weight? | Write down the composition in measurable terms before coding. |
| No explicit direction approval | Can the user point to the exact option they selected? | Present mutually exclusive choices and wait for explicit confirmation. |
| Generic component rhythm takes over | Did the mock become a stack of familiar cards, headers, and toolbars? | Implement the large-scale geometry before polishing individual components. |
| Preamble pushes the task below the fold | Where does the primary reader or action begin in pixels? | Set a fold target and compact breadcrumbs, metadata, and explanatory copy around it. |
| Real copy changes the layout | Do long titles or descriptions add rows or expand rails? | Use representative content early and define clamps, maximum measures, truncation, and disclosure. |
| `flex-wrap` becomes the responsive strategy | Do controls form accidental second or third rows? | Specify what collapses, hides, scrolls, or moves at every meaningful breakpoint. |
| Desktop is merely shrunk on mobile | Is the primary task preceded by a full desktop rail or inspector? | Recompose with capped lists, drawers, tabs, or progressive disclosure. |
| Half-width desktop is forgotten | Does 720px behave like an enormous phone? | Treat split-screen desktop as a required viewport, not an edge case. |
| App chrome is replaced | Does the page use a different header, footer, theme, or type system from adjacent routes? | Capture neighboring product surfaces and reuse their shell and semantic tokens. |
| Default state differs from the mock | Is the first view raw, collapsed, empty, or on the wrong tab? | Record and test the selected design's initial state explicitly. |
| Semantic markup has no shared styling | Does a component render correctly only when another feature stylesheet is loaded? | Keep reusable component styles with the component and test it in isolation. |
| Mock controls are decorative | Can every visible control be reached, focused, and activated? | Map each visual control to real behavior or mark it as intentionally deferred. |
| Existing behavior disappears | Did the cleaner layout remove settings, permissions, comments, editing, or destructive actions? | Maintain a capability inventory and verify every item after implementation. |
| Empty demo data hides density problems | Does the layout survive realistic counts, long lists, comments, and status rows? | Use representative minimum, typical, and maximum fixtures. |
| Positive mock data masks empty states | Is the real product blank, signed out, unsynced, or erroring? | Inspect both the aspirational populated state and truthful production states. |
| Artwork or material treatment is silently omitted | Is the implementation perceptually flatter or less distinctive than the selected design? | Label asset-dependent traits during selection and explicitly build, adapt, or defer each one. |
| Generated artwork is impractical | Does an asset contain tiny text, UI chrome, or frequently changing state? | Prove one asset at real display size before committing to an asset-heavy direction. |
| Typography is approximated | Do line breaks, hierarchy, and content density differ despite similar boxes? | Compare font family, size, weight, leading, measure, and actual wrapping. |
| Sticky and scroll regions are untested | Do rails become enormous preambles or cover content? | Measure scroll containers and sticky offsets at every target viewport. |
| Global overflow is mistaken for page overflow | Does `scrollWidth` exceed the viewport even when the workbench fits? | Measure the document, app shell, and page regions separately. |
| Dark mode or accessibility arrives last | Does the selected hierarchy survive focus, zoom, reduced motion, and alternate themes? | Validate semantic tokens and interaction states before final polish. |
| Build success substitutes for visual review | Is the evidence limited to tests, types, and bundles? | Capture and inspect the implementation at matched viewports after the build. |
| Screenshot conditions do not match | Are viewport, DPR, content, route, or expanded state different? | Record capture conditions and compare equivalent pairs. |
| First screenshot is treated as finished | Was there no finite delta ledger or correction pass? | Perform an honest critique and at least one targeted fix round. |
| Intentional deviations are undocumented | Can a reviewer distinguish a usability adaptation from unfinished work? | Label each remaining delta `fixed`, `intentional`, or `open`, with rationale. |
| Temporary preview plumbing leaks into source | Did local proxy, fixture, or debug configuration enter the final diff? | Revert preview-only changes before tests and source-control handoff. |
| Preview or deployment implies authorization | Did visual work expand into production mutation? | Keep preview, integration, merge, and deploy as distinct authority boundaries. |

## Adding a lesson

Append only failures observed in a real run that generalize beyond one project. Use this form:

```text
| <general failure mode> | <fast observable check> | <specific prevention rule> |
```

Merge overlapping lessons instead of growing synonymous reminders.
