---
name: sync-url-navigation
description: >-
  Syncs URL query parameters with app navigation, tabs, and filter state so views
  are bookmarkable and shareable. Use when building or changing frontend routing,
  filters, tabs, modals, deep links, browser back/forward, or when the user asks
  to remember navigation in the URL, sync state to query params, or make screens
  linkable.
---

# Sync URL to navigation and filter state

## User preference

**Always keep meaningful UI navigation and filtering state in the URL** (query params). Reloading, sharing, or opening a link should restore the same screen—not only the top-level route.

The user expects this by default on web apps unless they say otherwise.

## What to put in the URL

| State | Include when |
|-------|----------------|
| Active view / tab / mode | User can switch between distinct screens |
| Sub-navigation (sidebar table, nested tab) | Second-level nav exists |
| Search / filter text | User can filter lists or tables |
| Structured filters (dropdowns) | Each materially changes what's shown |
| Pagination cursor (optional) | Only if bookmarking a page matters; prefer omitting page=1 |
| Selection / editor (optional) | Only for shareable deep links (`?focus=type:id`) |

**Omit defaults** from the URL (e.g. default tab id, empty `q`) to keep links clean.

## Implementation pattern

1. **Single routing module** — `readRouteState(search)` + `writeRouteState(state)` (or equivalent). Parse and validate all params in one place.
2. **Initialize store from URL** on load — signals get initial values from `readRouteState()`, not hardcoded defaults alone.
3. **Setter functions** — e.g. `setDataTableId`, `setListFilter`: update signal(s), then call `writeRouteState`. UI never mutates filters without syncing the URL.
4. **`history.replaceState`** for in-app changes (matches existing preference: shareable URL without cluttering history on every keystroke). Use `pushState` only if the user explicitly wants full history stacks per filter change.
5. **`popstate` listener** — `hydrateRouteFromUrl()` re-reads params on browser back/forward.
6. **View-scoped params** — when switching top-level view, drop params that only apply to the other view (avoid stale `q` meaning different things).
7. **Inbound deep links** — support stable aliases (`focus=assignment:asn_…`) that map to table + filter; clear alias once the user changes nav manually.
8. **Tests** — pure tests for parse/read (invalid ids, focus format, view-specific `q`).

## Param naming (conventions)

- Short, stable names: `view`, `day`, `table`, `q`, `area`, `status`
- Avoid overloading one key across views with different semantics unless documented
- Prefer ordinal in URL when UI shows "Day 1" (`day=3`); accept raw ids for forward-compat
- Document params in a short table in the PR or README when adding a new screen

## Checklist for new screens

- [ ] Every navigational control updates the URL via a setter
- [ ] Load path restores state from URL
- [ ] Invalid param values fall back safely (don't crash)
- [ ] Back/forward works (`popstate`)
- [ ] Example URL documented or covered by a test

## Reference implementation

The AI Engineer World's Fair 2026 schedule admin app implements this in:

- `src/frontend/routing.ts` — parse/write query params
- `src/frontend/store.ts` — `setViewMode`, `setDataTableId`, `setDataFilter`, `setListFilter`, `hydrateRouteFromUrl`
- `tests/routing.test.ts` — focus links and view-specific filters

Copy the pattern, not necessarily the exact param names, when working in other repos.

## Anti-patterns

- Filters only in component `useState` / signals with no URL sync
- Syncing URL on initial load but not when user changes filters
- Putting secrets or PII in query params
- Different param names per view for the same concept without clearing on view switch
