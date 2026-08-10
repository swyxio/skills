---
name: visual-playtest
description: Run a concise, evidence-backed browser playtest of a visual web app, especially image/video generation UIs. Use when asked to QA a deployed or local interface, find dead controls, verify media playback/download/expansion, check responsive scrolling and bottom spacing, audit generation settings, or compare a clone with a reference product.
---

# Visual Playtest

Use the Chrome control skill for real browser interaction, including existing logged-in sessions. Test the smallest safe path first; do not submit paid generations or destructive actions unless the user explicitly authorizes them. Prefer demo/starter assets and local builds for destructive or expensive checks.

## Pass

1. Open the target at desktop and a narrow mobile viewport. Capture a DOM snapshot and screenshot before interacting.
2. Audit every control that looks clickable. Verify that each action changes visible UI, URL, focus, media state, or a persisted record; a click with no observable result is a bug.
3. Check the media loop: select image and video assets; play/pause with both the custom button and native controls; confirm a video has `paused === false` and `currentTime` advances; check error messaging; test expand/lightbox, Escape, backdrop close, overflow menu, copy/open/download, edit, animate, and delete confirmation.
4. Check navigation and workspace: controls panel open/close, sidebar collapse/mobile navigation, search, advertised keyboard shortcuts, history selection, access to every asset (not only the first eight), independent panel scrolling, and 24–40px bottom breathing room.
5. Check the composer and inspector: Enter submits, Shift+Enter inserts a newline, upload and URL references validate, reference counts/order are clear, required image/video inputs disable generation, workflow/model/settings changes update estimates, and clamped values are reflected in both the control and estimate.
6. At narrow widths, ensure overlays are opaque enough that the canvas does not bleed through, focus is inside dialogs, Escape works, and there is no horizontal overflow.
7. Run a trust-state pass: compare status badges, counts, connected-provider labels, approval targets, cost estimates, and completion claims against persisted/API state. A polished but false “connected,” “ready,” or “complete” state is a release bug. Verify every clickable control produces an observable result; inspect protected actions without executing them unless explicitly authorized.

## Known regression checklist

Always explicitly retest these recurring failures:

- Expand icon opens a real focused-media view rather than doing nothing.
- Three-dot icon opens an accessible menu with useful actions and outside-click/Escape dismissal.
- Desktop inspector close removes its layout footprint and pointer events; mobile close/reopen also works.
- Asset counts match reachable thumbnails or provide a working “See all”/scroll path.
- Downloads either produce a browser download or explain a same-origin/fallback path; never fail silently.
- Video playback advances and errors are surfaced; opening a lightbox pauses any background video.
- Delete is keyboard dismissible, focuses a safe dialog action, and updates selection/references/history coherently.
- Connected/ready badges come from authoritative backend state, not demo copy or optimistic UI defaults.
- Approval dialogs show the authoritative frozen target and payload; focus enters the dialog and Escape/backdrop dismissal work without performing the action.
- Settings, icon-only, and decorative-looking controls are not dead: each changes URL, focus, visible state, or a persisted record.
- Console checks come from a fresh tab or clean reload after edits. Separate reproducible application errors from stale HMR/development warnings.

## Report

Return a short severity-ranked table with: `control`, `repro`, `expected`, `observed`, `evidence`, and `smallest fix`. Separate observed facts from inference and label anything not tested because it would spend money, mutate data, grant access, or invoke a protected action. Include viewport(s), URL/build if available, which state claims were checked against authoritative data, and a final list of verified working paths. If comparing a reference product, record the reference behavior separately and recommend only concrete, subtle improvements that fit the clone.
