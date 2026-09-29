# Selective edge-state checks

Choose states affected by the redesign; this is a reference menu, not an exhaustive acceptance checklist. Test enough to expose changed layout and behavior risks.

| Changed area | Useful states |
| --- | --- |
| Settings | expanded, edited/unsaved, dependent or destructive controls |
| Navigation | direct URL, mobile access, back/exit, account or workspace recovery |
| Content | empty, typical, dense, long text, missing media |
| Async work | loading, partial progress, failure/retry, interruption |
| Access | signed out, expired session, insufficient permission |
| Inputs | focus, invalid, disabled, submitting, interrupted edit |
| Overlays | dismissal, nested surfaces, keyboard or viewport changes |
| Display | alternate themes, zoom, overflow, safe areas, software keyboard |

Preserve applicable shell access and user input, selection, focus, scroll, and task progress through layout changes. Check primary actions remain reachable and overlays dismissible. For affected interactions, inspect keyboard access, visible focus, touch targets, contrast, and state cues beyond color. Check asset weight or layout stability when the treatment introduces those risks.

Expand to offline, reduced motion, screen-reader detail, landscape, or ultrawide checks when the changed feature creates a relevant risk. Use the viewport guidance in [visual-comparison](visual-comparison.md).
