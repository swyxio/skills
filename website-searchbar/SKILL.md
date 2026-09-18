---
name: website-searchbar
description: Build or improve a shared website search bar, keyboard command dialog, fuzzy typeahead, and full results page with responsive UX and minimal infrastructure. Use for universal site search across content directories and branded landing pages; preserve existing directory filters.
---

# Website Searchbar

Make search a visible, shared way to reach pages. Prefer the existing application, public content loaders, and maintained search/accessibility dependencies. Keep implementation proportional to the catalog and measured latency.

## Desktop presence and mobile composition

- On desktop, make the search field fill the available header space between branding and navigation. A small centered button surrounded by unused space is insufficient. Grow the containing slot as well as the trigger; use `min-width: 0` so navigation remains intact.
- Use a field-like surface with a search icon, a useful placeholder, left-aligned text, and a shortcut hint at the trailing edge. It may open a shared dialog rather than being a second independent search input.
- Let branding and navigation keep their needed width. When the remaining space becomes too narrow, compact the trigger or switch the header layout before labels collide. Check actual header content instead of assuming one breakpoint fits every conference theme.
- A typical desktop composition is `logo (shrink-0) | search slot (flex-1 min-w-0) | navigation (shrink-0)`, with a full-width trigger inside the slot. Do not apply expansion indiscriminately to explicitly compact conference/mobile triggers.
- Preserve conference marks, colors, CTA contrast, and header positioning. Universal search should look integrated with each theme.
- On phones, use an unmistakable search button with an accessible label. Target at least 44 × 44 CSS px for the trigger, close button, chips, selects, pagination, and the full-results action; use a comfortable input height around 48 px.
- Optimize the touch loop: open → type → filter → scroll → open. Autofocus lets users begin thumb typing immediately. Keep the input and dismissal reachable when the keyboard reduces usable height.
- Prefer one horizontally scrollable row of mobile type chips to several rows consuming the results area. Make offscreen filters discoverable and reachable by touch. Hide desktop-only keyboard instruction strips on phones.
- Constrain overlays to the usable viewport and scroll the results within them. Reuse the accessibility library's visual-viewport sizing when available; use dynamic viewport units where appropriate. Do not add custom keyboard/viewport machinery before inspecting the library.
- Use at least 16 px text in editable inputs. For names and titles, normally disable autocorrection and automatic capitalization and provide an appropriate `enterKeyHint`.

## One search controller

Mount one controller in the main application. Headers expose triggers; keep the dialog and typeahead UI in a lazy chunk. Preload that chunk on search intent (focus, pointer hover, or touch intent), and consider an idle preload when opening latency warrants it. Share the preload promise so triggers do not duplicate work; opening must still work if preloading has not completed. Keep each directory's own search/filter field for filtering that directory.

- `/` opens universal search unless the user is typing, composing text, or interacting with another dialog. Support Cmd/Ctrl+K too.
- Reuse established dialog, autocomplete, and listbox primitives. In the AIE stack, use existing React Aria components instead of recreating focus management and keyboard selection.
- Esc dismisses and restores the previous focus. Arrows move through suggestions; Enter opens the highlighted result. Support touch selection and backdrop dismissal, and contain background scrolling.
- Navigate suggestions directly to canonical full pages. Avoid a preview side panel and a second “open profile” step.
- Show a small useful list immediately, before any catalog request: content directories, current conferences, schedules, and About. Derive conference paths from the registry rather than maintaining another destination list.
- Common links remain usable during cold initialization and catalog failures. Explain loading/unavailability without representing seeds as actual catalog matches. A type filter must not silently mislabel unrelated fallback links.

## Choose infrastructure from evidence

The initial AIE design used **local common paths plus same-origin search in the existing main Worker**, backed by MiniSearch and existing authorized public loaders. Measurements can justify adding a shared public catalog download for local typeahead while keeping the backend for full results and facets. Both fit the same minimal-infrastructure principle: no new Worker, database, bucket, cron, indexing service, or separate publication step.

| Option | Latency and browser cost | When it fits |
| --- | --- | --- |
| Shared lazy client catalog | One download and browser indexing cost; subsequent suggestions are local. | Measured per-query network/initialization latency dominates and compressed size plus phone CPU/memory cost are acceptable. Full results/facets may remain server-side. |
| Common paths + existing backend | Seeds are instant; catalog results need a request. Browser ships a small UI and seed list. | A good starting point when a small initial payload matters and measured remote typeahead is responsive. |
| Dedicated search service / D1 | Can isolate workloads or support richer querying; adds indexing, deployment, and freshness responsibilities. | Only when measured scale, latency, or query requirements justify it. |

These are decision criteria, not permission to replace an existing working architecture. Inspect current source and dependencies before adding machinery or reimplementing an optimization.

## Catalog coverage before ranking changes

Trace the data used by published routes and directories, not just the loader already called “search.” A site may render newer editorial/encyclopedia pages while search still consumes an older relationship or taxonomy catalog.

- Inventory each searchable entity type and its authoritative published-page metadata. Compare canonical IDs/URLs against the search documents. A plausible total count or a related talk result does not prove the entity's own page is indexed.
- Merge authorized public summaries from additional published catalogs into the existing projection. Deduplicate within an entity type by canonical slug/identity; prefer the published page's current title and description over older catalog labels. Preserve legitimate aliases, relationships, and facet metadata.
- Include every contributing catalog's publication/version and loader cache policy in freshness decisions. A correction to encyclopedia metadata must invalidate search even if the older catalog is unchanged.
- Add coverage tests using the real published metadata (or a snapshot derived from that same source), requiring each searchable page's canonical document and an appropriate exact-title, type-filtered search result. Test overlap precedence, deduplication, and facet combinations. Keep synthetic ranking fixtures too; they cannot establish production catalog coverage.
- When a reported query finds related documents but omits the expected page, inspect inclusion and canonical mapping before tuning fuzziness or adding infrastructure. Generalize across the affected catalog; do not assume other entity types have the same omission without evidence.

## Backend and ranking

For the hybrid design, expose same-origin `GET /api/search` in the existing application/Worker.

- Load public talks, speakers, topics, organizations, and conference metadata through the existing authorized loaders. Search titles, names, confirmed aliases, affiliations, topic names, and concise summaries. Exclude transcripts and private content by default.
- Build MiniSearch once per loaded content version and Worker isolate. Share the initialization promise across concurrent requests, reuse the index for warm queries, and refresh through existing version checks and loader cache policies. A constant version must not cause indefinite staleness when loaders have a finite cache window.
- If content changes during initialization, avoid publishing an index assembled from incompatible versions. If authorization becomes unavailable, do not treat an old in-memory index as authorization to serve content.
- Prioritize exact names/titles, then prefixes and bounded fuzzy matches. Normalize Unicode/diacritics and retain stable identities for duplicate names. Use confirmed aliases; do not invent entity equivalence.
- Validate query length, types, facets, limits, and offsets. Return bounded projections: stable ID, entity type, canonical URL, title, concise snippet, and relevant facet metadata. Keep raw source records and private fields out of browser payloads and API responses. Keep the server index out of initial browser bundles; an intentionally downloaded client catalog must contain only the public projection needed for search.
- Facets should use stable registry/topic identities and combine correctly. Define which facets remain available when filters narrow results; do not accidentally lose the selected option or count a different population.
- Use isolate memory and the existing content lifecycle first. Do not introduce durable synchronization or a second publishing workflow for a derived index.

## Separate opening cost from suggestion cost

Profile the user-visible stages independently: intent → chunk available → dialog painted/focused; query input → debounce → catalog/network → index construction/ranking → results painted. Measure first-use and warm states on production-shaped desktop and phone conditions before selecting a remedy.

- A slow dialog needs UI preload/render work; slow suggestions may need fewer round trips or cheaper catalog initialization. Worker initialization and network latency can dominate even when ranking is already fast. Do not optimize ranking from end-to-end latency alone.
- Show useful local common-path and compact topic/title matches immediately. Distinguish partial local coverage from complete catalog results, especially while a download or index build is pending. Never flash “no results” merely because initialization is unfinished.
- When justified, fetch one compressed public search catalog on intent and share its download/index initialization promise across consumers. Reuse it across queries instead of requesting the backend for each keystroke. Query changes must not abort a catalog initialization still shared by other consumers. Keep it out of initial JavaScript and avoid eagerly downloading a substantial catalog for every visitor.
- Measure compressed transfer size, parse/index time, memory, and long tasks on slower phones. A few hundred KB can be acceptable on intent and still significant on a slow connection; no universal byte threshold proves suitability.
- Use the existing publication/build lifecycle and same-origin delivery for a derived static catalog where appropriate. Retain authorized projection, version/freshness checks, and failure handling; static output is not a reason to expose raw loaders or add another publishing service.
- Reuse projection, normalization, ranking options, canonical IDs, and facet semantics between browser suggestions and backend search. Add parity checks where both implementations exist; avoid silently diverging search engines.
- If browser indexing blocks typing, construct the index in small yielding batches and share the in-progress work. Keep input responsive and expose partial-loading/unavailable states. Do not add a separate Web Worker or persistence layer before measuring a need.
- Preserve input focus and the native keyboard when tapping type chips or scrolling/replacing suggestions. Deliberate result navigation or dismissal may leave the input; filtering should not force another tap to resume typing.

## Requests and complete results

- For remote typeahead, start catalog queries after two characters, with a default debounce around 150 ms. A shared client catalog download is independent of per-query debounce; once ready, local suggestions need not wait on network pacing. Cancel obsolete requests and guard response ordering; abort alone is not sufficient to prevent a stale result replacing the newest one.
- Keep input updates immediate. Hydration, shallow URL updates, older navigation promises, and responses must not overwrite text already being edited.
- Offer entity-type chips in the dialog. Add `/search?q=…` for complete results using the same backend and ranking, with type, conference, year, topic, and pagination stored in the URL.
- Preserve deep links and browser back/forward behavior. Distinguish user navigation from URL changes initiated by the input itself.
- On a new query or filter, ensure the relevant leading suggestions remain discoverable after the user has scrolled an earlier result set.

## Verify the product before expensive release work

Test observable behavior, then finish desktop/mobile browser QA before starting expensive builds. Follow the repository's release requirements; this skill does not waive trusted preview, exact-head/base/tree, compiled privacy, promotion, or live verification checks.

- Verify real published-catalog coverage as well as exact names, prefixes, misspellings, aliases, Unicode names, duplicate names, canonical destinations, and combined facets. Verify shared initialization and warm index reuse where applicable.
- Exercise `/`, Cmd/Ctrl+K, arrows, Enter, Esc/focus restoration, composition, rapid typing, delayed/stale responses, failure/common-link behavior, URL hydration, and back/forward navigation.
- Use actual touch input/gestures where browser tooling supports them: swipe hidden chips, scroll suggestions, select a result, dismiss, and edit immediately after loading the results page. DOM inspection or mouse clicks alone are insufficient evidence for thumb usability.
- Check desktop widths where header space varies, ordinary phones, a narrow phone, landscape, and a reduced-height viewport. Useful AIE samples are 320×568, 390×844, 430×932, 390×420, and 844×390. Resize while the dialog is open and confirm text survives and actions stay reachable.
- Capture and inspect screenshots across AEO/shared headers and representative light/dark conference themes. Check tap dimensions, horizontal overflow, console/page/hydration errors, and navigation.
- Emulation and a short viewport approximate keyboard constraints; they do not prove native iOS/Android keyboard behavior. State that limitation unless tested on hardware.
- Measure added initial JavaScript separately from the lazy UI chunk and any compressed catalog transfer; measure dialog paint/focus, cold download/index initialization, warm queries, and input-to-render latency. Report client-observed wall time separately from backend timings, with cache/region conditions. A zero timer reading is not proof of zero work; goals are not measurements. Node ranking samples, warmed local dialog timings, and uncontrolled first production observations are not comparable before/after production-browser measurements.

Stop at a working, verified search experience. Keep unrelated header redesign, release engineering, semantic/transcript search, and speculative infrastructure outside a scoped search fix. Add capability only when the current product or measurements establish the need.
