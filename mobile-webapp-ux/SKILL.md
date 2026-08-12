---
name: mobile-webapp-ux
description: Design, build, or review responsive mobile web-app UX when a phone experience needs task-first layout, usable touch controls, compact media comparison, mobile navigation, overlays, forms, or responsive validation without degrading the desktop experience. Use for requests to make an existing web app work well on phones, fit a task into one mobile viewport, improve tap targets, adapt comparison/review screens, or audit mobile usability.
---

# Mobile Web-App UX

Treat the phone as a distinct task surface, not a narrower desktop canvas. Preserve the desktop contract unless the requested behavior genuinely differs.

## Start with the mobile task loop

Identify the smallest repeated loop the user needs to complete: inspect → decide → act; scan → filter → open; compose → send. Make that loop dominant in the first viewport.

- Keep the current task, its evidence, and its primary action visible together whenever practical.
- Reduce decorative chrome, repeated headings, descriptive copy, and secondary metadata before reducing the primary action.
- Prefer a concise mobile-specific composition over merely scaling down desktop spacing.
- Keep secondary operations available but visually subordinate: overflow, disclosure, an anchored utility area, or a later section.

For a head-to-head visual review, use this default hierarchy:

1. Two equal, side-by-side candidate thumbnails.
2. Large, labeled voting controls immediately beneath the candidates.
3. Tap-to-expand media in a full-detail lightbox.
4. Skip, undo, tags, annotation, exports, and history below or compacted.

Do not stack the two candidates vertically when the comparison itself is the primary task, unless the images cannot remain legible side by side at the supported minimum width.

## Media and detail inspection

- Constrain inline media by viewport height and use `object-fit: contain` when framing or full outfit/body visibility matters.
- Make media an obvious button with a visible focus style and an accessible label. Do not require tiny zoom controls to inspect detail.
- Use a modal lightbox for detail. Provide a close button, backdrop dismissal, `Esc`, focus management, and scroll locking.
- Keep the image pair’s cards the same visual weight. Do not let different source aspect ratios change the comparison hierarchy.
- Avoid putting important voting controls below a very tall image by default.

## Touch controls

- Make the primary action row visually strongest and easy to hit: target at least 44 × 44 CSS px; use roughly 48–56 px height for repeated vote buttons when space permits.
- Keep labels on primary actions. Icon-only controls are for unmistakable secondary actions with an accessible label and tooltip.
- Put destructive or recovery actions apart from the main action row. Make undo available after fast, high-frequency actions.
- Never rely on hover for critical information or controls.
- Preserve keyboard shortcuts for desktop users, but never make mobile completion depend on them.

## Responsive layout rules

- Establish a supported narrow reference size (normally 390 × 844) and test there before considering the work complete.
- Use a two-column grid for compact comparisons: `grid-template-columns: minmax(0, 1fr) minmax(0, 1fr)`.
- Prevent labels, chips, and candidate IDs from forcing cards wider; allow controlled ellipsis or hide nonessential metadata.
- Use `dvh` for viewport-constrained media and overlays where browser chrome changes can otherwise cause clipping.
- Hide or compact desktop-only status strips and verbose introductory copy in a task-focused mobile view; retain access through an alternate route or disclosure if needed.
- Do not make an entire page `overflow: hidden` on mobile unless the current task is deliberately designed to fit and every needed control remains reachable.

## Validate the actual phone experience

After implementation, inspect the rendered app at the narrow reference viewport. Check:

- Both compared items are visible simultaneously.
- The primary actions are in the initial viewport and are comfortably tappable.
- The initial decision loop requires no vertical scroll, or any intentional scroll is obvious and minimal.
- Image expansion opens, renders, and closes correctly; `Esc` and backdrop close work.
- Long labels, localized text, loading states, and small screens do not overlap or hide actions.
- Desktop layout and shortcuts still work at the existing desktop breakpoint.

If browser control is available and visual mobile QA is requested, use it for this check. Otherwise validate the layout structurally and state the limitation rather than claiming a visual result.

## Avoid

- Treating mobile as only `font-size` and padding reductions.
- Stacking comparison media vertically while moving the vote controls out of view.
- Hiding labels from the main action buttons to save a few pixels.
- Requiring pinch zoom because inline media is too small without offering a lightbox.
- Putting export, settings, and annotations ahead of the core task.
- Breaking desktop keyboard or pointer workflows in the course of the mobile adaptation.
