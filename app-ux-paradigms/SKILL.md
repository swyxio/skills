---
name: app-ux-paradigms
description: >-
  Applies standard web app UX for keyboard shortcuts, modals, overlays, forms,
  and interaction patterns. Use when building UI, dialogs, menus, hotkeys, help
  text, accessibility, or when the user asks about Esc, shortcuts, modal close,
  backdrop click, or common desktop-app expectations.
---

# App UX: keyboard shortcuts and common paradigms

## User preference

**Match desktop-app and modern web conventions by default.** Users should not need to hunt for close affordances or discover shortcuts only by accident. Implement the patterns below unless the product explicitly opts out.

Pair with the **sync-url-navigation** skill for bookmarkable nav/filter state.

## Keyboard shortcuts

### Must-have behaviors

| Key / chord | Expected behavior |
|-------------|-------------------|
| **Esc** | Close the topmost overlay: modal, drawer, popover, context menu, inline edit. Do not close if a destructive save is in flight—block Esc while `saving` or show a clear state. |
| **⌘/Ctrl+Enter** | Submit primary form or send message in chat/composer (when focus is in a text field). |
| **Enter** | Submit single-line fields; in multi-line fields, Enter = newline unless Shift+Enter is documented as send. |
| **⌘/Ctrl+letter** | Use for global toggles (e.g. **⌘/Ctrl+J** = open assistant panel). Always support **both** `metaKey` (Mac) and `ctrlKey` (Windows/Linux). |

### Implementation notes

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

| Paradigm | Requirement |
|----------|-------------|
| **Esc** | Closes modal (see above). |
| **Backdrop click** | Clicking dimmed area outside the panel closes (call same `close()` as ×). |
| **× control** | Top-right (or consistent corner), `type="button"`, labeled `title` with Esc hint. |
| **Click propagation** | `stopPropagation` on panel content so inner clicks do not close. |
| **Focus** | Move focus into modal on open; return focus to trigger on close when practical. |
| **Scroll** | Lock or contain body scroll for full-screen overlays; allow scroll inside tall forms. |

Apply the same close trio (**Esc**, backdrop, ×) to **Speaker editor**, **slot editor**, confirmation dialogs, and any `fixed inset-0` overlay.

## Menus and transient UI

- **Context menus**: Esc closes; click outside closes (`mousedown` on document).
- **Hover cards / tooltips**: Do not trap Esc unless they are modal; dismiss on pointer leave or Esc if sticky.
- **Inline edit** (e.g. grid cell): Esc cancels edit without saving.

## Forms and async actions

- Disable primary submit while **saving**; label button `Saving…`.
- Show **inline error** under the form, not only `alert`.
- **Required fields**: validate on submit; focus first invalid field.
- **Clear** resets filters to empty defaults and syncs URL if using query-param routing.

## Lists, tables, and selection

- **Row click** opens editor or expands detail (consistent per table).
- **Shift+click** multi-select where bulk actions exist; show selection chrome and a bulk action bar.
- **ID chips**: click copies to clipboard with brief status feedback (`Copied`).
- **Empty states**: explain why no rows (no data vs no matches vs filters too narrow).
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

## Checklist for new UI

- [ ] Esc closes overlay / menu / inline edit
- [ ] Backdrop + × use same close handler
- [ ] Global shortcuts use ⌘ and Ctrl
- [ ] Shortcuts documented in tooltips and Help
- [ ] Submit disabled while saving; Esc blocked if close would lose in-flight save
- [ ] Click-outside closes non-modal menus
- [ ] Primary action discoverable without reading source

## Reference (this repo)

AI Engineer WF 2026 schedule admin examples:

- `SpeakerEditor.tsx` — Esc + backdrop + ×; Esc disabled while saving
- `ContextMenu.tsx` — Esc + outside click
- `GridView.tsx` — Esc cancels inline edit; Shift+click selection
- `FloatingAiebot.tsx` — ⌘/Ctrl+J toggle, ⌘/Ctrl+Shift+K clear chat
- `AiebotPanel.tsx` — ⌘/Ctrl+Enter send
- `HelpPanel.tsx` — documents grid and aiebot shortcuts

## Anti-patterns

- Modal with only × and no Esc or backdrop close
- Shortcut only in README, not in UI
- Mac-only `metaKey` with no `ctrlKey`
- Esc closes modal but leaves a nested context menu open underneath
- Silent failures on save/export/copy
