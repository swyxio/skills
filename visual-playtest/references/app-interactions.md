# App Interaction Pass

Read this only when the request includes functional QA of an app-like interface.
Select the checks relevant to the named flow; this is not a mandatory catalog.

## Controls and navigation

- Verify that each tested control changes visible UI, URL, focus, or persisted
  state. Treat a control with no observable result as a defect.
- Test the navigation surfaces used by the flow: sidebar or sheet open/close,
  search, relevant keyboard shortcuts, history selection, and back/forward.
- Confirm panel close removes its layout footprint and pointer events, and that
  the panel can be reopened at narrow widths.
- For overflow menus, verify useful actions, focus, outside-click dismissal,
  and Escape dismissal.

## Layout-changing states

- Check dialogs and sheets for opaque-enough surfaces, contained focus,
  keyboard dismissal, backdrop dismissal where intended, and no horizontal
  overflow.
- Check independently scrollable panels and enough bottom breathing room to
  reach the final item.
- Verify that counts match reachable items or that a working “See all” or scroll
  path exists.
- Retest fixed or sticky UI with panels both open and closed.

## Trust and safety boundaries

Inspect protected or destructive flows without completing them unless the user
authorized the action. Do not turn a visual playtest into mutation of real data.
