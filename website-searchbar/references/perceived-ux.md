# Search perceived-UX refinement

Use when the user requests polish, predictive loading, faster-feeling navigation,
or discovery/ranking improvements after basic search works. Preserve the current
interaction contract; recommend or implement only the authorized scope.

## Find the remaining wait

Inspect current behavior before proposing an optimization already present:
trigger hover/focus/touch preload, hydration/idle UI preload, shared catalog
initialization, HTTP caching, and index reuse across navigation. Separate
opening, first useful match, warm typing, destination navigation, and searching
again after navigation. A fast query does not make a slow destination feel fast.

Prefer existing framework prefetching, browser storage, analytics, and content
publication. Avoid new infrastructure or a search-specific scheduler for polish.

## Destination prefetch

- Warm the destination on result hover or deliberate keyboard focus. Touch
  intent can start prefetching, but must not delay the tap or hijack scrolling.
- If navigation remains expensive, consider prefetching one high-confidence
  leading result after the query settles. Do not fetch every result on every
  keystroke. Cap speculative work and avoid aggressive prefetch on constrained
  connections or when data-saving preferences are available.
- Use the router's maintained prefetch API or normal link behavior. Inspect its
  actual capabilities first. Next Pages Router prefetch is production-only;
  a development browser pass cannot prove the resulting network improvement.
- Respect routing ownership: same-app client navigation preserves the index;
  archived zones or other applications may require full-document navigation.
  Derive that boundary from existing route/zone metadata, not guessed years.

## Navigation feedback and result stability

- Acknowledge selection immediately with an opening state or subtle route
  progress feedback when a visible wait exists. Bind feedback to actual
  navigation completion/failure; avoid fake progress or delaying a fast route.
- Preserve enough query/selection state to recover from failed navigation.
  Keep input editable during catalog initialization and filtering.
- Do not reorder rows beneath an active pointer or keyboard selection when
  background catalog/popularity updates arrive. Preserve selected entity
  identity where possible and apply new ranking on the next query interaction.

## Recent destinations

- For an empty query, a few recent selections can shorten the open-to-destination
  loop. Store bounded canonical entity IDs locally; resolve against current
  public metadata and skip removed destinations. No account synchronization or
  server-side history is needed by default.
- Keep curated common destinations available for first use and loading/failure
  states. Label recent/popular groups accurately and respect entity-type chips.
  Do not silently replace the user's active query with a previous one.

## Popularity without weakening relevance

- Keep exact names/titles and strong textual matches first. Use a bounded
  popularity boost among comparably relevant hits, or for empty-query discovery.
  Test ambiguous queries and obscure exact names before adopting the change.
- Existing aggregate destination visits or search selections are suitable
  candidates. YouTube views describe video popularity, not speaker/org interest
  or unique people; do not compare unlike signals directly across entity types.
- Inspect source freshness and coverage. Missing popularity is unknown, not
  evidence of zero interest. Older content can dominate lifetime counts; prefer
  a recent window or coarse capped tiers when the available data supports it.
- Publish aggregate scores with the existing catalog/content pipeline and reuse
  unchanged artifacts. Weekly lag can be reasonable when the user accepts it;
  avoid live analytics calls on dialog opening, per-query exports, or catalog
  regeneration on every PR. Include ranking-input versions in artifact identity.
- Add selection rank, entity type, result count, and timing to existing telemetry
  only when needed to assess outcomes. Raw query text is not necessary by default.
  Verify an aggregate export is available before promising analytics-based ranks.

## Demonstrate the gain

Compare fresh and warm browser contexts under the same hostname, network,
viewport, and CPU conditions. Count catalog/document requests across result
navigation and measure click-to-page-ready separately from the next query.
Exercise pointer, keyboard, and short mobile touch flows, plus failed navigation
and ranking stability when those behaviors change. State physical-phone gaps.

An AIE production experiment (September 2026) reduced first full-catalog name
matches from about 2 seconds to 0.55 seconds desktop / 0.73–0.95 seconds under
4× mobile CPU throttling using a static compact catalog. Retaining the index
across same-app result navigation reduced the next query from 2.2–2.3 seconds
to 28 ms desktop / 135 ms mobile and requests from two catalogs/documents to one.
Modal opening and already-warm typing were roughly unchanged; CPU long tasks
did not consistently improve. These observations motivate stage-specific
measurement, not universal targets or proof that destination prefetch,
navigation feedback, recents, or popularity have already improved a given site.

Stop after the selected refinements work and their measured benefit or practical
limits are clear. Leave unrelated header redesign and release engineering out
of this pass.
