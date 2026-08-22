---
name: app-ux-paradigms
description: >-
  Apply conventional interaction behavior for keyboard shortcuts, focus,
  dialogs, overlays, menus, forms, and asynchronous controls. Use when those
  interaction mechanics are being built or reviewed; do not use for general
  page aesthetics, information architecture, or visualization quality.
---

# App UX: keyboard shortcuts and common paradigms

## User preference

**Match desktop-app and modern web conventions by default.** Users should not need to hunt for close affordances or discover shortcuts only by accident.

Apply only the patterns relevant to the interaction being built or reviewed.
This skill does not authorize unrelated UI changes, and its tables are defaults,
not a product-wide acceptance checklist. Accessibility, prevention of unintended
destructive action, and avoiding silent data loss remain blocking where the
touched interaction creates those risks. Stop when the requested interaction
works in its relevant input and state variants; report adjacent consistency
improvements as follow-ups.

Pair with the **sync-url-navigation** skill for bookmarkable nav/filter state.

## Keyboard shortcuts

### Common expectations for touched interactions

| Key / chord | Expected behavior |
|-------------|-------------------|
| **Esc** | Close the topmost overlay: modal, drawer, popover, context menu, inline edit. Do not close if a destructive save is in flight—block Esc while `saving` or show a clear state. |
| **⌘/Ctrl+Enter** | Submit primary form or send message in chat/composer (when focus is in a text field). |
| **Enter** | Submit single-line fields; in multi-line fields, Enter = newline unless Shift+Enter is documented as send. |
| **⌘/Ctrl+letter** | Use for global toggles (e.g. **⌘/Ctrl+J** = open assistant panel). Always support **both** `metaKey` (Mac) and `ctrlKey` (Windows/Linux). |

### Recommended implementation notes

- Attach **document-level** `keydown` listeners when an overlay opens; remove on unmount.
- Call `event.preventDefault()` on Esc when handling it so nested browser UI does not steal the key.
- Show shortcuts in **`title` tooltips** on icon buttons (e.g. `Close (Esc)`).
- Surface the same shortcuts in an in-app **Help** section with `<kbd>` styling.
- Avoid shortcut conflicts: check `!event.shiftKey` / `!event.altKey` when the chord is specific (e.g. Ctrl+J vs Ctrl+Shift+K).

### Optional but valued

| Pattern | Use when |
|---------|----------|
| **⌘/Ctrl+K** | Command palette / quick open (if the app has one) |
| **⌘/Ctrl+Shift+K** | Secondary global action (e.g. clear chat / reset context)—only if distinct from Ctrl+K |
| **?** | Toggle keyboard shortcut help (when not typing in an input) |
| **/** | Focus search (when not in an input) |

## Modals and overlays

| Paradigm | Expected behavior when applicable |
|----------|-------------|
| **Esc** | Closes modal (see above). |
| **Backdrop click** | Clicking outside may close lightweight dialogs; keep explicit confirmation dialogs or forms with unsaved work open when dismissal would be unsafe. |
| **× control** | Top-right (or consistent corner), `type="button"`, labeled `title` with Esc hint. |
| **Click propagation** | `stopPropagation` on panel content so inner clicks do not close. |
| **Focus** | Move focus into modal on open; return focus to trigger on close when practical. |
| **Scroll** | Lock or contain body scroll for full-screen overlays; allow scroll inside tall forms. |

Use a consistent close model across comparable overlays. Do not add every close
mechanism when it would discard unsaved work or weaken an explicit confirmation.

## Menus and transient UI

- **Context menus**: Esc closes; click outside closes (`mousedown` on document).
- **Hover cards / tooltips**: Do not trap Esc unless they are modal; dismiss on pointer leave or Esc if sticky.
- **Inline edit** (e.g. grid cell): Esc cancels edit without saving.

## Forms and async actions

- Disable primary submit while **saving**; label button `Saving…`.
- Show **inline error** under the form, not only `alert`.
- **Required fields**: when the touched form has them, validate on submit and focus the first invalid field.
- **Clear** resets filters to empty defaults and syncs URL if using query-param routing.

## Lists, tables, and selection

- **Row click** opens editor or expands detail (consistent per table).
- **Shift+click** multi-select when desktop bulk selection is in scope; show selection chrome and a bulk action bar.
- **ID chips**: click copies to clipboard with brief status feedback (`Copied`).
- **Empty states**: explain why no rows (no data vs no matches vs filters too narrow).
- **Unavailable states**: when primary content cannot be produced, do not show
  the normal success workspace with irrelevant export, share, filter, or edit
  controls. Explain the missing prerequisite and offer the most useful recovery
  action. Analytical publishability belongs to `data-visualization-quality`.
- **Load more** for long tables instead of rendering thousands of rows at once.

## Search and filters

- Use `type="search"` where appropriate.
- Changing filters resets pagination/limit to the first page.
- Debounce URL sync is optional; immediate URL sync is fine for admin tools.

## Feedback and safety

- **Status line** or toast for export, save, copy, undo—not silent success.
- **Undo** for reversible schedule/data edits when the backend supports it.
- **Destructive actions** (delete, rollback): confirm in-modal or `confirm()`; never rely only on icon buttons.
- **Role-gated UI**: hide or disable edit actions for viewers; explain in help text.

## Accessibility baseline

- Visible focus rings on interactive elements.
- Buttons for actions; avoid `div onClick` without `role` and keyboard support.
- Meaningful `title` / `aria-label` on icon-only controls.
- Do not rely on color alone for status (use text labels or pills).

## Selective review lens

Select only items relevant to the changed interaction. Unselected items are not
failed gates, and a review request does not authorize implementation.

- [ ] Esc closes overlay / menu / inline edit
- [ ] Backdrop + × use same close handler
- [ ] Global shortcuts use ⌘ and Ctrl
- [ ] Shortcuts documented in tooltips and Help
- [ ] Submit disabled while saving; Esc blocked if close would lose in-flight save
- [ ] Click-outside closes non-modal menus
- [ ] Primary action discoverable without reading source

## Anti-patterns

- Ordinary dismissible modal with only × and no keyboard or safe outside-dismiss path
- Shortcut only in README, not in UI
- Mac-only `metaKey` with no `ctrlKey`
- Esc closes modal but leaves a nested context menu open underneath
- Silent failures on save/export/copy
