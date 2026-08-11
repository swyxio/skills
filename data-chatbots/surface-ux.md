# Copilot surface UX (panel sizing, hotkeys, ergonomics)

How the copilot *presents itself*—distinct from the draft→apply review flow in
[proposal-review-ux.md](proposal-review-ux.md). This is the floating/dockable
panel, its summon hotkey, and how it shares screen space with the app it edits.

## Floating + dockable, not a fixed sidebar

A data copilot is used in **bursts** (ask, review drafts, apply) interleaved with hands-on editing. So the panel should be:

- **Summonable from anywhere** with one global hotkey (no hunting for a button).
- **Out of the way** when idle (collapses to a small floating button).
- **Resizable to the task**: a narrow sidebar for quick Q&A, a large centered surface for reviewing a big batch of draft cards / reading long answers.

Reserve a single, memorable chord for the copilot (we use **⌘/Ctrl+J**; pair it with **⌘/Ctrl+Shift+K** = clear chat). Don't collide with browser-reserved chords (⌘+number, ⌘+T/W/L…). See the host app's keyboard-shortcut conventions.

## The size state machine (the headline pattern)

Overload the summon hotkey into a **size cycle** instead of a plain open/close toggle. Each press advances a deterministic state machine:

```
minimized (floaty button)
  → sidebar · 50% viewport height   (narrow, edge-docked)
  → sidebar · 80% viewport height   (narrow, edge-docked)
  → centered · 80% width × height   (big, for batch review / long reads)
  → minimized …
```

Why a cycle beats a toggle: users want *different* footprints for different tasks, and a single key that walks a fixed ladder is fully predictable and learnable — no extra modifiers to remember.

### Two entry points, each doing the intuitive thing

| Action | Behavior | Rationale |
|--------|----------|-----------|
| **Hotkey (⌘/Ctrl+J)** | Deterministic cycle, including the collapse step | Power users get a fast, predictable ladder |
| **Click the floating button** | **Restores last size/mode** (not "always preset 1") | A mouse toggle should bring back the layout you left |
| **Header cycle button (`⤢`)** | Same as the hotkey | Discoverability for mouse-only users |
| **× / minimize** | Collapse to floaty, **keep** mode + size for restore | Closing shouldn't forget your setup |

### Custom resize must coexist with presets

Keep native drag-to-move + corner-resize. Track a **`custom` mode**: any hand drag/resize flips the panel to `custom` (and persists that exact size). The next hotkey press **snaps back into the cycle** at the first preset — so a hand-tuned panel is never a dead end. Don't fight the user mid-drag.

```
modes: 'dock-half' | 'dock-tall' | 'center-full' | 'custom'
cycle:  custom ─(hotkey)→ dock-half → dock-tall → center-full → minimized → dock-half …
```

## Implementation gotchas (all hit while building this)

- **Presets are viewport-relative and must re-flow.** Compute size/pos from `innerWidth/innerHeight` at apply time, and re-apply on `window.resize` (centered-80% recomputes; a docked sidebar re-pins to the edge). A `custom` panel just re-clamps.
- **Always clamp on-screen.** A size/pos persisted on a wide monitor can place an open panel off-screen on a laptop — and if the open panel *replaces* the toggle button, the copilot vanishes. Clamp both size (≤ viewport − margin) and position on load, on open, and on resize.
- **ResizeObserver vs programmatic snap race.** You use a `ResizeObserver` to persist hand-resizes and to detect "user diverged from the preset → mark `custom`". But a programmatic preset change *also* fires the observer with **intermediate** sizes during the CSS transition. Guard with a short **suppression window** (`Date.now() < suppressUntil`): while a snap is in flight, the observer returns early — don't read `offsetWidth` (it's mid-animation) and don't write `size` (you'd stall the transition by chasing a moving target). After the window, resume persisting + custom-detection (tolerance ±2px).
- **Detect custom by divergence, not by event source.** There's no "user resized" event. Compare observed size to `presetGeom(currentMode)`; if it differs beyond tolerance (and we're not suppressing), it was a hand-resize → `custom`. Dragging the header → set `custom` directly (that one *is* user-initiated).
- **Persist `mode` too**, alongside size/pos (localStorage). Default first-ever load to `custom` so existing users keep their prior size — the cycle is opt-in via the key/button, not a surprise relayout.

## Snap animation

A discrete snap (not continuous motion) can transition `left/top/width/height` for ~200ms — acceptable layout cost for a one-shot move. Rules:

- Only enable the transition **during** a snap (gate on a `snapping` flag set for the transition duration); set `transition: none` otherwise so **drag and corner-resize stay instant/jank-free**.
- Respect **`prefers-reduced-motion`** → no transition.
- Keep the suppression window ≥ the transition duration (e.g. 300ms ≥ 200ms) so the observer stays inert until the panel settles.
- This is a *discrete* animation; the continuous-motion thrash rules (transform/will-change, avoid animating layout props every frame) don't apply — but don't transition layout props on anything that animates continuously.

## Fill the height: history grows, composer pinned

A resizable copilot panel must **use** the height it's given. The mistake: lay the panel out as a static stack (or cap the history at `max-h-50vh`), so a tall panel just shows a big dead gap under the controls.

Make the panel a **full-height flex column** with exactly one growing region:

```
panel (flex flex-col, fixed height)
 ├─ header                shrink-0
 └─ content (flex-1 min-h-0 flex flex-col, overflow-hidden)
     ├─ intro/blurb        shrink-0   (top)
     ├─ message history    flex-1 min-h-0 overflow-y-auto   ← the ONE growing, scrolling region
     └─ composer block     shrink-0   (textarea + send + options + examples) ← pinned to bottom
```

Rules:

- **One scroll region.** The message history scrolls (`flex-1 min-h-0 overflow-y-auto`); the outer content wrapper is `overflow-hidden`. Avoid nested double-scrollbars (outer panel scroll + inner history scroll fighting each other).
- **`min-h-0` everywhere it matters.** A flex child won't shrink below its content without `min-h-0` (or `min-height:0`) — omit it and the history refuses to scroll and instead pushes the composer off-screen.
- **Composer pinned, not floating.** Mark the textarea/send/options/help block `shrink-0`; because the history is `flex-1`, the composer naturally sits at the bottom in both a tall centered panel and a short sidebar.
- **Cap collapsible help/examples.** A toggle-open examples/guide panel can be taller than the whole window; give it its own `max-h-[45vh] overflow-y-auto` so it never blows out the fixed-height layout (which is `overflow-hidden`).
- **Keep autoscroll.** Pin-to-newest (`scrollTop = scrollHeight` on new message/draft) still works with `flex-1`; the growing region is the same node.
- **CSS-grid history stretches its rows — top-align it.** If the message list is a `display:grid` (not flex) and you make it `flex-1` (tall), the grid's default `align-content` *stretches* its auto rows to fill the free space, so every message bubble balloons with dead space inside. Add `align-content:start` (Tailwind `content-start`) so messages pack at the top and the slack stays empty below. (A flex-col list doesn't have this problem.)
- **Graceful fallback when short.** In a small sidebar the history shrinks to its scroll; the composer stays usable. The same layout serves every size preset — no per-mode CSS.

## Discoverability

- **Header control** mirrors the hotkey (a `⤢` button) with a tooltip that **names the current mode and the full cycle**: *"Cycle size (⌘/Ctrl+J): sidebar 50% → sidebar 80% → centered → minimize. Now: Sidebar · 80% height."*
- **Floaty button tooltip** states both behaviors: *"Open aiebot — restores your last size. ⌘/Ctrl+J cycles sizes."*
- Document the chord in the app's **Help / keyboard-shortcuts** surface, not just in code.

## Smells

- Summon hotkey is a bare open/close toggle → users resize by hand every session.
- Cycle that resets to preset 1 on *every* open (mouse users lose their layout) — restore on click, cycle on key.
- Programmatic preset changes misclassified as `custom` (missing suppression window) → the cycle "sticks" after one press.
- No on-screen clamp → panel persisted on a big monitor opens off-screen / invisible.
- Animating `width/height/left/top` permanently (not just during snap) → laggy drag/resize.
- Ignoring `prefers-reduced-motion`.
- Presets in fixed px instead of viewport-relative → wrong on other screen sizes, no reflow.

Reference: `src/frontend/components/FloatingAiebot.tsx` (size state machine, `applyMode`/`cycleSize`, ResizeObserver suppression, snap transition), `AiebotPanel.tsx` (full-height flex layout), `HelpPanel.tsx` (shortcut docs).

**Copyable sample:** [samples/surface-panel-sizing.tsx](samples/surface-panel-sizing.tsx) — the whole pattern (presets, custom-resize reconciliation, snap transition, fill-height layout) in one illustrative file.
