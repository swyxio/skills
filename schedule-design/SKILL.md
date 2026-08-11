---
name: schedule-design
description: Design patterns and lessons for building conference schedule pages with React. Covers theme systems, 2D grid overviews, filter UX, sticky layouts, modals, favorites, and data normalization. Use when building or modifying schedule views, grid tables, filter panels, or conference UI components.
---

# Schedule Design Patterns

Lessons extracted from building the `/europe/schedule` page — a single-file (~2000 line) React component with a 2D room×time grid, 1D session list, modal detail view, multi-axis filtering, favorites, theming, and semantic search.

## Architecture

### Keep the schedule component cohesive
Schedule views can keep closely related sub-components together when that makes
the data flow and interaction state easy to follow. Extract components when
reuse, testability, or file size clearly benefits; a single-file layout is not a
universal requirement.

### Build-time data extraction with `getStaticProps`
Raw JSON (with nullable/optional fields) is normalized at build time into clean `ScheduleSession` objects with guaranteed string fields (empty string, not null). This eliminates null checks throughout the render logic.

### Synthetic plenary sessions
Plenary/logistics sessions (breakfast, lunch, expo hours) are hardcoded as a `PLENARY_SESSIONS` array and merged with speaker sessions at build time. They get `id: 10000 + i` to avoid collisions.

## Theme System

### Semantic token objects, not CSS variables
Define a `Theme` type with ~40 semantic tokens (`bg`, `bgCard`, `text`, `textSecondary`, `border`, `accent`, `gridHeaderBg`, `starActive`, etc.). Create `DARK_THEME` and `LIGHT_THEME` constants. Pass `t: Theme` and `isDark: boolean` to every sub-component.

### Theme persistence across pages
Store preference in `localStorage` under a shared key (`eu-theme`). On mount, check `localStorage` first, then fall back to `window.matchMedia('(prefers-color-scheme: light)')`. This syncs theme between `/europe` and `/europe/schedule`.

### Global styles must also be themed
Body background, scrollbar colors (`::webkit-scrollbar-*`), text selection (`::selection`), and any `<style jsx global>` blocks must reference theme tokens. Don't forget the logo image — use `filter: invert(1)` for light mode if the logo is white-on-transparent.

## 2D Grid Overview (Room × Time)

### HTML `<table>` for the grid, not CSS grid
A real `<table>` with `<thead>`, `<tr>`, `<th>`, `<td>` handles column alignment, sticky headers, and horizontal scroll correctly. CSS Grid struggles with sticky columns in a scrollable container.

### Sticky header and sticky first column(s)
- Day header row: `position: sticky; top: 0; zIndex: 20` with `colSpan={rooms.length + 1}` so it spans full width on horizontal scroll.
- Room header row: `position: sticky; top: 30px` (offset by day header height).
- Time column: `position: sticky; left: 0; zIndex: 10`.
- Priority column (e.g. Plenary): `position: sticky; left: 48px` (offset by time column width), `zIndex: 10`.

### Plenary column spanning
Plenary sessions span across the full day, so the Plenary column needs special logic: track which plenary sessions are "active" (started before, ending after) each time slot, and render continuing sessions with reduced opacity and a "continues" label.

### Room sort order matters
Sort rooms: Plenary first → Keynote rooms → Regular rooms (alphabetical) → Special rooms (e.g. Leadership Lunch) → Expo rooms. Use a numeric group assignment for sorting.

### Bright pastel grid cell colors with dark text
Grid cells use a separate `GRID_COLORS` palette with bright pastel backgrounds and dark text — different from the badge colors which use dark backgrounds with light text. This improves readability in the dense grid.

### Cell overflow
Set `maxHeight: 80` and `overflowY: 'auto'` on grid cell content divs so dense cells scroll rather than expanding the row.

### Grid cell click → modal
Clicking a grid cell opens a `SessionModal` overlay (not inline expansion). The modal uses `position: fixed; inset: 0` with backdrop blur, and closes on ESC, backdrop click, or close button. Lock body scroll (`document.body.style.overflow = 'hidden'`) while modal is open.

## Filter System

### Type grouping for cleaner filters
Map granular types into user-friendly groups. Example: `track_keynote`, `talk`, and `lightning` all map to a single `"talks"` filter group via a `TYPE_FILTER_GROUPS` record and `typeFilterGroup()` function. Individual session badges still show the specific type — only the filter pills are grouped.

### Inclusive multi-select with `Set<string>`
Each filter axis (day, type, track) uses a `Set<string>`. Empty set = no filter (show all). Use a `toggleSet` helper to add/remove values immutably.

### Filter panel is collapsible, but active state must be obvious
When the filter panel is collapsed:
1. The "Filters" button turns purple/highlighted with badge count: `Filters (3) ▼`.
2. A compact summary strip below the header shows active filter chips.
3. The session count in the header (`92/214`) turns bold + accent color.

Without these, users don't realize filters are active — this was a real usability issue.

### Filter layout: grouped rows with labels
Each filter axis gets its own row with an uppercase label (`DAY`, `TYPE`, `TRACK`). A separate row at the bottom holds "Starred", "Clear all filters", and a count summary. This is much clearer than a single inline row of mixed pills.

### Starred/favorites in localStorage
Use `localStorage` key `aie-schedule-favorites` storing a JSON array of session IDs. Wrap in a `useFavorites` hook returning `{ favorites, toggleFavorite, isFavorited }`. Starred items get a golden border/glow in the grid: `boxShadow: '0 0 8px rgba(250,204,21,0.5)'`.

## Session Display

### Title first, then speaker attribution
Grid cells and cards show the session title first, then speaker info below. Speaker attribution format: `{name} - {company}, {role}` with graceful fallbacks — omit dash/comma segments if company or role is missing.

### TBD speaker detection
Use regex `/^tbd\b/i` to detect placeholder speaker names and render them with reduced opacity.

### Speaker photos with initials fallback
`SpeakerPhoto` component tries to load the image, falls back to a circular badge with initials (extracted from name) on error. Use `loading="lazy"` on images.

## URL State

### Modal state syncs to URL query param
Opening a modal sets `?session=<id>` via shallow router replace. On mount, check `router.query.session` to restore the modal. This makes session links shareable.

### Persistent identity must be stable across schedule rebuilds
Never use array indexes, sort positions, or regenerated numeric ordinals as identities for detail API lookups, cache keys, favorites, or new deep links. Schedule restructuring changes those numbers and can pair a current title with another session's cached description.

- Use the stable scheduled-occurrence/assignment ID; fall back to a stable slot ID for assignment-less logistics such as lunch.
- Store stable IDs in favorites and deep links. Keep numeric-link parsing only as a temporary compatibility path.
- When session details load separately from the page payload, include the schedule version in the request/cache key and return it in the response.
- Reject a page/API schedule-version mismatch instead of merging potentially unrelated content.
- Add a regression test that reorders slots and proves each stable session ID still resolves to the same description.

## Semantic Search

### Debounced API call with request-ID guard
Each keystroke increments a `semanticRequestIdRef`. Only the response whose ID matches the latest ref is applied — stale/out-of-order responses are silently dropped. Use `AbortController` for cleanup. Debounce delay: 400ms.

## Common Pitfalls

1. **`next lint` doesn't work in Next.js 16** — use `npx tsc --noEmit` instead.
2. **Sticky `position` in tables**: `position: sticky` on `<td>` requires explicit `background` — otherwise transparent cells show content underneath during scroll.
3. **`colSpan` on day headers**: Without proper `colSpan` spanning all columns, the day header won't stretch when scrolling horizontally.
4. **Plenary contrast**: Dark-on-dark or light-on-light plenary badges are easy to miss. Give plenary sessions distinct, high-contrast colors in both palettes.
5. **Line height in dense grid cells**: Default line height is too spacious for 9-10px text in grid cells. Use `lineHeight: 1.15`.
6. **Room name typos**: Always validate room names against the source data (e.g. "Westley" vs "Wesley"). A bulk rename in the JSON source is safer than patching in rendering code.
7. **Filter state invisible to users**: The most common UX complaint was "I don't know why I'm seeing fewer sessions." Always make active filter state visible even when the filter panel is collapsed.
8. **Ordinal IDs are not cache keys**: A positional session ID may point to a different talk after any insertion, removal, or reorder. Lazy detail endpoints keyed by ordinals can transiently attach the wrong abstract to a title when page and API caches come from different schedule builds. Use stable occurrence IDs plus schedule-versioned requests.
