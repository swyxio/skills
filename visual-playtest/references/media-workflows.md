# Media Workflow Pass

Read this only when audio, video, image generation, media assets, or related
status claims are part of the requested playtest. Select the relevant loop.

## Playback and focused media

- Play and pause through the controls the product presents. Confirm playback
  time advances and errors are visible.
- Verify expand or lightbox opens a real focused-media view and supports its
  intended Escape, backdrop, and close behavior.
- Check whether opening focused media should pause background playback.
- Test the media layout with persistent players hidden and visible, including
  scrolled desktop and narrow mobile states.

## Asset actions

- Verify the reachable asset count, selection state, overflow menu, copy/open,
  and download paths that the request puts in scope.
- A download must start or explain its supported fallback; it must not fail
  silently.
- If delete is in scope, inspect confirmation, safe default focus, keyboard
  dismissal, and selection/reference updates. Do not confirm deletion without
  authorization.

## Generation or editing workflows

- Check only the active composer inputs: Enter/Shift+Enter behavior, references,
  required-input disabling, and the selected workflow/model/settings.
- Verify that clamped values and estimates reflect the visible settings.
- Confirm inspector close/reopen and reference ordering only when those surfaces
  are part of the requested path.

## Trust states

- Compare connected/ready labels, counts, estimates, approval targets, and
  completion claims with persisted or authoritative backend state when the
  playtest relies on them.
- Treat unavailable state as unavailable, not as success. A polished but false
  ready or complete state is a release defect.
- Inspect paid generation and protected actions without executing them unless
  the user explicitly authorized the action.
