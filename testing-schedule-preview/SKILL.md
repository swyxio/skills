---
name: testing-schedule-preview
description: Use when testing the AI Engineer Europe internal Bun schedule preview or public schedule page, including tooltip, modal, CFP metadata, and local preview workflows. Load for schedule-preview verification; not for general conference UI testing.
---

# Testing the Europe Schedule

## Overview
There are two schedule views to test:
1. **Bun preview** at the repository's configured preview URL — internal tool with CFP data and organizer-only fields
2. **Public schedule page** at `/europe/schedule` — public-facing with grid overview and session list

## Bun Preview (Internal)

### Starting the Server
Run the repository's current Europe source preview command from the project root.
This runs `bun run bun-preview.mjs` inside `src/pages/europe/source/`.

If the configured preview port is occupied, identify the owning process and stop
it only after confirming it is the preview process.

### Key Files
- `src/pages/europe/source/_deploy/index.html` — the preview HTML
- `src/pages/europe/source/schedule.json` — data source
- `src/pages/europe/source/photos/` — speaker photos

### What to Test
- Hover tooltips show speaker summary near cursor
- Click-to-expand modal shows full details (CFP data, session IDs, contacts)
- Modal close: ESC key, backdrop click, close button
- Tooltip hides when modal opens (no ghost tooltip behind overlay)
- CFP tag colors render in both tooltip and modal

## Public Schedule Page

### Accessing
- Local: the repository's configured Europe schedule route.
- Preview: use the URL supplied by the active deployment.

### Key File
- `src/pages/europe/schedule.tsx` — React component with grid overview, session cards, modal, filters

### Page Structure
1. **Header** with search, semantic search toggle, filters, expand/collapse buttons
2. **Room x Time Overview grid** — day tabs (April 8/9/10), rooms as columns, time slots as rows
3. **Session list** — expandable cards grouped by day

### What to Test
- Grid cells are clickable — clicking opens a centered modal overlay
- Modal shows: type badge, title, time/room/track, speaker photo + name + role + company + social links, full abstract
- Modal close: ESC key, backdrop click, ESC button
- Social links in modal open in new tab without closing modal
- Cross-check: modal content should match expanded SessionCard in list view below
- Day tab switching works in the grid
- Search filters the session list
- Expand All / Collapse All buttons work

### Testing Approach
1. Open the schedule page
2. Switch to April 9 or 10 to see breakout talks in the grid
3. Click a talk cell — verify modal content
4. Test all 3 close mechanisms
5. Search for the same talk title — find it in the list view
6. Expand it and compare content with what the modal showed

## Section Types
- **Keynotes**: Mostly invited speakers, minimal CFP data, INVITED badge
- **Breakout Talks**: Mix of invited/CFP speakers, may have descriptions
- **Expo Sessions**: Company-sponsored, usually in one of three rooms
- **Workshops**: all April 8, someetimes multi-speaker, longer blocks
- **Track Keynotes**: Per-track opening talks

Both views are expected to be unauthenticated; do not add secrets or bypass
authentication to test them.
