/**
 * Reference: src/frontend/components/FloatingAiebot.tsx + AiebotPanel.tsx
 *
 * The finnicky copilot-surface bits, in one place:
 *   1. A floating/dockable panel whose summon hotkey (⌘/Ctrl+J) CYCLES size
 *      presets instead of plain open/close.
 *   2. Reconciling those presets with free-form drag + native corner-resize.
 *   3. A full-height flex layout so the message history grows and the composer
 *      stays pinned to the bottom.
 *
 * Illustrative (Preact + signals); helpers/types abbreviated. Copy the pattern.
 * Companion prose: ../surface-ux.md
 */

import { useEffect, useRef, useState } from 'preact/hooks';

type Pos = { x: number; y: number };
type Size = { w: number; h: number };

// ── size presets ───────────────────────────────────────────────────────────
// `custom` = user dragged/resized by hand; we leave their size alone.
type SizeMode = 'dock-half' | 'dock-tall' | 'center-full' | 'custom';
// The ladder ⌘/Ctrl+J walks while open; after the last preset it minimizes.
const OPEN_CYCLE: SizeMode[] = ['dock-half', 'dock-tall', 'center-full'];

const MIN = { w: 320, h: 320 };
const NARROW_W = 380; // width of the docked "sidebar" presets
const EDGE = 16; // gap kept from viewport edges

const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);

const clampSize = (s: Size): Size => ({
  w: clamp(s.w, MIN.w, Math.max(MIN.w, window.innerWidth - 2 * EDGE)),
  h: clamp(s.h, MIN.h, Math.max(MIN.h, window.innerHeight - 2 * EDGE))
});

// Clamp on-screen: a size/pos saved on a wide monitor must not place an OPEN
// panel off-screen on a laptop (where the open panel replaces the toggle button
// → the copilot would vanish).
const clampPos = (p: Pos, s: Size): Pos => ({
  x: clamp(p.x, EDGE, Math.max(EDGE, window.innerWidth - s.w - EDGE)),
  y: clamp(p.y, EDGE, Math.max(EDGE, window.innerHeight - 48))
});

/** Compute size + position for a named preset from the CURRENT viewport. */
function presetGeom(mode: SizeMode): { size: Size; pos: Pos } | null {
  if (mode === 'custom') return null;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  if (mode === 'center-full') {
    const size = clampSize({ w: Math.round(vw * 0.8), h: Math.round(vh * 0.8) });
    return { size, pos: clampPos({ x: Math.round((vw - size.w) / 2), y: Math.round((vh - size.h) / 2) }, size) };
  }
  // narrow sidebar docked to the right edge, vertically centered
  const size = clampSize({ w: NARROW_W, h: Math.round(vh * (mode === 'dock-half' ? 0.5 : 0.8)) });
  return { size, pos: clampPos({ x: vw - size.w - EDGE, y: Math.round((vh - size.h) / 2) }, size) };
}

const prefersReducedMotion = () =>
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;

// ── component ────────────────────────────────────────────────────────────────
export function FloatingCopilot() {
  const open = openSignal.value; // boolean signal: minimized vs shown
  const [size, setSize] = useState<Size>(() => loadSize());
  const [pos, setPos] = useState<Pos>(() => loadPos());
  const [mode, setMode] = useState<SizeMode>(() => loadMode());
  const [snapping, setSnapping] = useState(false);

  const sizeRef = useRef(size); sizeRef.current = size;
  const modeRef = useRef(mode); modeRef.current = mode;
  // While a preset is applied programmatically, ignore ResizeObserver ticks so
  // mid-transition sizes aren't misread as a manual ("custom") resize.
  const suppressUntil = useRef(0);
  const snapTimer = useRef<ReturnType<typeof setTimeout>>();

  // Snap to a named preset, animating the move.
  const applyMode = (next: SizeMode): void => {
    setMode(next);
    const geom = presetGeom(next);
    if (!geom) return; // custom → leave size as-is
    suppressUntil.current = Date.now() + 300; // ≥ transition duration (200ms)
    setSnapping(true);
    clearTimeout(snapTimer.current);
    snapTimer.current = setTimeout(() => setSnapping(false), 240);
    setSize(geom.size);
    setPos(geom.pos);
  };

  // The state machine: minimized → 50% → 80% → centered → minimized.
  // A custom (hand-resized) panel snaps back to the first preset.
  const cycleSize = (): void => {
    if (!openSignal.value) { openSignal.value = true; applyMode('dock-half'); return; }
    const i = OPEN_CYCLE.indexOf(modeRef.current);
    if (i === -1) { applyMode('dock-half'); return; }      // custom → re-enter cycle
    const next = OPEN_CYCLE[i + 1];
    if (next) applyMode(next);
    else openSignal.value = false;                          // past last preset → minimize
  };

  // ⌘/Ctrl+J cycles size from anywhere.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && !e.altKey && e.key.toLowerCase() === 'j') {
        e.preventDefault();
        cycleSize();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => () => clearTimeout(snapTimer.current), []);

  // Re-flow presets on viewport change (centered-80% recomputes, sidebar re-pins);
  // a custom panel just re-clamps. Same on (re)open.
  const reflow = (): void => {
    if (modeRef.current === 'custom') {
      const s = clampSize(sizeRef.current);
      setSize(s); setPos((p) => clampPos(p, s));
    } else applyMode(modeRef.current);
  };
  useEffect(() => { window.addEventListener('resize', reflow); return () => window.removeEventListener('resize', reflow); }, []);
  useEffect(() => { if (open) reflow(); }, [open]);

  // Persist size/pos/mode (localStorage). Default mode = 'custom' so first load
  // keeps the previously persisted size; the cycle is opt-in via key/button.
  useEffect(() => { saveSize(size); }, [size]);
  useEffect(() => { savePos(pos); }, [pos]);
  useEffect(() => { saveMode(mode); }, [mode]);

  // Persist native corner-resize; a hand-resize that diverges from the active
  // preset flips us to `custom`. We detect by DIVERGENCE (no "user resized" event):
  // compare observed size to presetGeom(mode); skip entirely during a snap.
  const panelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const node = panelRef.current;
    if (!node || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => {
      if (Date.now() < suppressUntil.current) return; // mid-snap: don't chase the moving target
      const w = node.offsetWidth, h = node.offsetHeight;
      setSize({ w, h });
      if (modeRef.current === 'custom') return;
      const geom = presetGeom(modeRef.current);
      if (geom && (Math.abs(geom.size.w - w) > 2 || Math.abs(geom.size.h - h) > 2)) setMode('custom');
    });
    ro.observe(node);
    return () => ro.disconnect();
  }, [open]);

  // Dragging the header off a docked preset is also "custom".
  const onHeaderDragMove = (nextPos: Pos): void => {
    setPos(nextPos);
    if (modeRef.current !== 'custom') setMode('custom');
  };

  if (!open) {
    return (
      <button
        class="fixed bottom-5 right-5 z-50 rounded-full ..."
        // Click RESTORES last size/mode (reflow on open); the hotkey CYCLES.
        title="Open copilot — restores your last size. ⌘/Ctrl+J cycles sizes."
        onClick={() => { openSignal.value = true; }}
      >
        Ask copilot ⌘J
      </button>
    );
  }

  return (
    // Panel: fixed-position flex COLUMN. Transition left/top/width/height ONLY
    // during a snap (so drag/resize stay instant); honor reduced-motion.
    <div
      ref={panelRef}
      class="fixed z-50 flex flex-col overflow-hidden rounded-lg ..."
      style={{
        left: `${pos.x}px`, top: `${pos.y}px`,
        width: `${size.w}px`, height: `${size.h}px`,
        minWidth: `${MIN.w}px`, minHeight: `${MIN.h}px`,
        resize: 'both',
        transition: snapping && !prefersReducedMotion()
          ? 'left 0.2s ease, top 0.2s ease, width 0.2s ease, height 0.2s ease'
          : 'none'
      }}
    >
      <Header onDragMove={onHeaderDragMove} onCycle={cycleSize} modeLabel={mode} />
      {/* content wrapper: fills remaining height, hides overflow (history scrolls within) */}
      <div class="flex min-h-0 flex-1 flex-col overflow-hidden px-3 py-2.5">
        <CopilotBody />
      </div>
    </div>
  );
}

// ── fill-height body: history grows, composer pinned ─────────────────────────
function CopilotBody() {
  const chatScrollRef = useRef<HTMLDivElement | null>(null);
  const log = chatLog.value;

  // Autoscroll to newest still works with flex-1 (same node).
  useEffect(() => {
    const n = chatScrollRef.current;
    if (n) n.scrollTop = n.scrollHeight;
  }, [log.length]);

  return (
    // Full-height flex column with exactly ONE growing region.
    <section class="flex min-h-0 min-w-0 flex-1 flex-col gap-2">
      <small class="shrink-0 ...">Scheduling copilot — ask anything…</small>

      {/*
        The message history is the single grow+scroll region.
        GOTCHA: this is display:grid. A grid container's default align-content
        STRETCHES auto rows to fill free space → every bubble balloons with dead
        space. `content-start` (align-content:start) packs messages at the top.
        `min-h-0` is required or a flex child won't scroll (it pushes siblings out).
      */}
      <div
        ref={chatScrollRef}
        class="grid min-h-0 min-w-0 flex-1 content-start gap-1.5 overflow-y-auto overflow-x-hidden"
      >
        {log.map((entry, i) => <ChatBubble key={i} entry={entry} />)}
      </div>

      {/* composer pinned to the bottom: shrink-0 so it never grows/scrolls */}
      <form class="grid shrink-0 gap-1" onSubmit={onSubmit}>
        <textarea class="field min-h-[5.5rem] resize-y" rows={3} /* … */ />
        <button type="submit" class="btn btn-primary">Send (⌘/Ctrl+Enter)</button>
        {/* model select + option checkboxes … */}
      </form>

      <button type="button" class="btn shrink-0 text-[11px]" onClick={toggleHelp}>
        What can it do? Show examples
      </button>
      {/* Collapsible help is taller than the window when open — cap + scroll it so
          it can't blow out the overflow-hidden layout. */}
      {showHelp.value && (
        <div class="grid shrink-0 max-h-[45vh] gap-2 overflow-y-auto ...">{/* examples */}</div>
      )}
    </section>
  );
}

// ── abbreviated stubs ────────────────────────────────────────────────────────
declare const openSignal: { value: boolean };
declare const chatLog: { value: Array<unknown> };
declare const showHelp: { value: boolean };
declare function loadSize(): Size;
declare function loadPos(): Pos;
declare function loadMode(): SizeMode;
declare function saveSize(s: Size): void;
declare function savePos(p: Pos): void;
declare function saveMode(m: SizeMode): void;
declare function toggleHelp(): void;
declare function onSubmit(e: Event): void;
declare function Header(props: { onDragMove: (p: Pos) => void; onCycle: () => void; modeLabel: SizeMode }): unknown;
declare function ChatBubble(props: { entry: unknown }): unknown;
