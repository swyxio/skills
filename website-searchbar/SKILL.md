---
name: website-searchbar
description: Implement or repair universal website search UI, fuzzy typeahead, catalog coverage, or search responsiveness. Excludes standalone directory filtering and release engineering.
---

# Website Searchbar

Use these as preferences, not a mandatory feature checklist. Honor the user's requirements and the site's existing interaction contract. Choose tradeoffs according to catalog size, browser cost, freshness needs, and web/server architecture; explain material departures from the defaults. Correctness, authorization, and preservation of user input remain requirements.

## UX preferences

- Let desktop search fill available header space without squeezing branding/navigation. Grow both its slot and trigger (`flex: 1; min-width: 0`); compact it when space is genuinely limited. A field-like trigger may open the shared dialog rather than duplicate the input.
- Prefer a compact mobile trigger, roughly 44px tap targets, and 16px input text. Keep input and dismissal reachable at keyboard-reduced height; reuse library viewport sizing or dynamic viewport units before adding custom machinery. Scrollable type chips can save height; retain clear access to hidden filters.
- Prefer `/` and Cmd/Ctrl+K. Guard `/` while typing and all shortcuts during composition or another dialog. Support arrows/Enter, Esc/backdrop dismissal with focus restoration, and touch navigation. Use established accessible primitives appropriate to the framework: React Aria is a React option, not a requirement for other stacks.
- Open results directly at canonical pages. Preserve existing directory filters and theme/brand conventions. Prefer immediate common destinations derived from existing registries, with explicit partial/loading/error states rather than an empty-looking dialog.
- For name/title search, normally disable autocorrection/capitalization. Preserve input focus when filtering or scrolling suggestions; deliberately navigating or dismissing may leave it. Query changes should reveal leading results after an earlier scroll.
- Use URL-addressable full results and facets when useful for the site's size and content model. A small site may need only suggestions. Preserve edits and back/forward behavior when synchronizing query state with the URL.

## Architecture tradeoffs

Prefer existing loaders, dependencies, and hosting. MiniSearch and uFuzzy are examples of suitable fuzzy-search libraries; choose according to the current stack and ranking needs.

| Approach | Acceptable tradeoff |
| --- | --- |
| Client catalog | Transfer, parse, memory, and indexing cost buys local low-latency suggestions. Fits bounded catalogs and static hosting; load on intent when the payload is substantial. |
| Existing server search | Small browser payload buys network latency and possible cold initialization. Fits larger/dynamic catalogs, server-held authorization, and richer facets. |
| Hybrid | Instant common paths or local suggestions plus server-side complete results/facets. Useful when browser and backend serve different latency or query needs. |

A dedicated service can be appropriate for demonstrated scale or query requirements, but is not a prerequisite. Static catalogs can follow the existing build/publication lifecycle. Do not impose Workers, D1, a database, or an indexing service merely to add search.

## Catalog correctness

For catalog implementation or repair, trace authoritative published-page metadata, not just a loader named “search.” Related hits and plausible totals can conceal missing canonical pages.

- Compare searchable published identities/URLs with indexed documents. Merge missing public metadata and deduplicate within entity type by canonical identity; prefer current page titles/descriptions while preserving confirmed aliases, relationships, and facets.
- Use coverage checks derived from actual published metadata, alongside synthetic ranking tests. Verify canonical inclusion and appropriate exact-title/type-filtered retrieval, overlap precedence, and affected facets. Inspect missing inclusion before tuning fuzziness; do not assume another entity type has the same defect.
- Refresh against every contributing source's versions/cache policy. Share initialization and reuse warm indexes when applicable, without indefinite staleness or mixing incompatible publication versions. Query cancellation must not abort initialization still shared by other consumers.
- Search only data authorized for the caller. Public/downloadable catalogs must exclude private fields and raw records; normally project IDs, types, URLs, titles, aliases, concise summaries, and needed facets. Summaries rather than transcripts are the default scope. A cached index does not replace authorization.
- Prefer exact names/titles ahead of prefixes and bounded fuzzy matches. Preserve distinct identities for duplicate names, handle Unicode, and share ranking/projection semantics when browser and backend both search.

## Performance decisions

For responsiveness work, separate dialog opening from suggestion latency: chunk loading → paint/focus versus debounce → network/catalog initialization → indexing/ranking → result paint. Optimize the measured stage rather than assuming fuzziness is expensive.

- Keep heavier UI lazy when beneficial; preload on focus/hover/touch intent, or during idle if opening latency warrants it. Tiny interfaces may reasonably ship eagerly. Opening must work without a completed preload.
- A shared catalog download can remove per-query round trips. Measure compressed bytes, parse/index time, memory, and phone long tasks before choosing it; no fixed catalog count or byte threshold proves suitability. Show useful local matches while fuller coverage initializes, and yield index construction in batches if it blocks typing.
- Remote typeahead commonly starts after two characters with about 150ms debounce; tune this to the product. Local suggestions need not inherit network pacing. Guard stale responses and prevent hydration/URL updates from overwriting active edits; aborting requests alone is insufficient.
- Measure initial JavaScript, lazy UI, catalog transfer, and cold/warm user-visible latency separately. Keep environment/cache conditions comparable. Node ranking, warmed local opening, and uncontrolled first production observations are not equivalent measurements; zero timer readings do not prove zero work.

## Scope-dependent acceptance

Apply checks that can change acceptance of the requested outcome:

- **UX changes:** Exercise the affected desktop/mobile loop, navigation, typing, focus, and viewport fit. Use touch gestures for touch claims; check short/landscape layouts when overlays change. Emulation does not establish native-phone keyboard behavior.
- **Catalog changes:** Verify published coverage, canonical retrieval, and affected ranking/facets. When exposure or authorization changes, verify the intended projection and access boundary.
- **Performance changes:** Demonstrate the requested improvement under comparable conditions without breaking the affected interaction. Broader device, theme, or architecture studies are follow-up unless their risk is introduced by this change.

Stop when the named outcome and checks for risks introduced by the change pass. A layout adjustment does not require a catalog audit, a catalog repair does not require new infrastructure, and this skill adds no separate release gates.
