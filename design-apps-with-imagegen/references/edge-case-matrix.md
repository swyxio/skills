# Settings, edge cases, and display-size matrix

Use this matrix to choose representative states before integration. Add product-specific rows discovered during the audit.

| Area | States to inspect |
| --- | --- |
| Settings | closed, open, edited, unsaved, saved, dependent option disabled, reset confirmation, destructive action |
| Navigation | current item, deep item, overflow, back path, direct URL, lost or expired destination |
| Content | empty, one item, typical, maximum density, long text, missing media, user-generated text |
| Async work | initial loading, partial loading, slow response, failure, retrying, recovered, stale data, offline |
| Access | signed out, expired session, insufficient permission, read-only, feature unavailable |
| Inputs | pristine, focused, valid, invalid, disabled, submitting, submitted, interrupted |
| Overlays | menu, tooltip, popover, drawer, modal, nested confirmation, escape or outside-click dismissal |
| Minimum quality bar | visible and reachable focus, zoomed text, contrast, overflow, asset weight, layout stability |
| Proportional accessibility | keyboard-only, reduced motion, high contrast, screen-reader naming, coarse pointers |

## Display sizes

| Class | Reference viewport | Main question |
| --- | --- | --- |
| iPhone portrait | 390 x 844 | Can the primary task be completed one-handed without clipped or unreachable controls? |
| iPad portrait | 834 x 1194 | Does the layout use the extra space without becoming a stretched phone view? |
| Half desktop | 720 x 900 | Does the interface survive split-screen work without accidental tablet assumptions? |
| Full desktop | 1440 x 900 | Is hierarchy clear without excessive empty space or overlong lines? |

Also inspect device safe areas, browser chrome, software keyboards, coarse pointers, hover absence, landscape orientation, and ultrawide widths when relevant.

## Responsive invariants

- Keep the primary action and current status easy to find.
- Preserve user input, selection, focus, scroll, and playback or task progress across layout changes.
- Keep touch targets large enough and prevent fixed controls from covering content.
- Recompose dense regions with progressive disclosure rather than scaling everything down.
- Ensure menus and dialogs remain dismissible when the viewport or software keyboard changes.
- Avoid conveying state through color alone.
