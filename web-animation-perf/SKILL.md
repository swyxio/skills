---
name: web-animation-perf
description: Prevent layout/transition/reflow thrash in JS-driven CSS animations. Use when building or debugging continuous motion (rotation, orbit, parallax, scroll-linked effects, marquee, carousels) and when symptoms appear like jank, stutter, lag, animation drift, ghosting, "elements collapsing toward center", "going slow", "should we use canvas?", or when mixing `setInterval`/React state with CSS `transition`.
---

# Web Animation Performance

Guidance for writing smooth, GPU-accelerated animations on the web. Most jank comes from three avoidable mistakes; the rest is diagnostic technique.

## The Three Cardinal Rules

### 1. Never combine `transition: all <duration>` with JS that updates the same property every frame

This is the single most common animation bug. If JS updates `left`/`top`/`transform` on every tick AND the element has `transition-all duration-700` (or similar), CSS will linearly interpolate between every pair of successive JS values over the transition duration. For non-linear motion (orbit, arc, easing curve) the linear chord cuts across the intended path — e.g., rotating nodes appear to drift inward toward the center, parallax elements ghost-trail, scroll-linked effects lag noticeably behind the scroll.

Pick exactly one driver:

- **Pure CSS**: `@keyframes` + `animation: spin 8s linear infinite` and let the browser handle it.
- **Pure JS**: set the *final* position every frame; no `transition` on that property. Use a separate, narrower `transition` only for state changes (e.g., active/inactive scale and color).

If you want a transition on hover/active states but JS-driven continuous motion on position, scope the transition to the specific properties (`transition: transform 300ms, background-color 300ms`) and exclude the JS-driven property.

### 2. Use `requestAnimationFrame`, never `setInterval`, for continuous motion

| Concern | `setInterval(fn, 16)` | `requestAnimationFrame(fn)` |
|---|---|---|
| Frame sync | Drifts; may fire 2× per frame or miss frames | Pinned to vsync |
| Backgrounded tab | Keeps running, wasting CPU/battery | Browser pauses |
| Timing precision | Wall clock, ±browser timer resolution | High-res `performance.now()` arg passed to callback |
| Jitter under load | Compounds | Skips frames cleanly |

Always integrate by elapsed time, not by fixed step-per-tick. Motion stays correct under dropped frames:

```js
useEffect(() => {
  let lastFrame = performance.now();
  let id = 0;
  const tick = (now) => {
    const dt = Math.min(now - lastFrame, 100); // clamp to handle tab-switch gaps
    lastFrame = now;
    const degrees = SPEED_DEG_PER_SEC * (dt / 1000);
    setRotation((prev) => (prev + degrees) % 360);
    id = requestAnimationFrame(tick);
  };
  id = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(id);
}, []);
```

### 3. Animate `transform` and `opacity`. Avoid `left`/`top`/`width`/`height`/`margin`/`padding`

Only `transform` and `opacity` skip layout & paint and run entirely on the GPU compositor. Anything else triggers reflow on every change — fine once on hover, catastrophic at 60Hz.

| Want to change… | Do this | Not this |
|---|---|---|
| Position | `transform: translate3d(x, y, 0)` | `left`, `top`, `margin` |
| Size | `transform: scale(s)` | `width`, `height` |
| Rotate | `transform: rotate(a)` | (no `left/top` equivalent — but use `transform` for compositor promotion) |
| Fade | `opacity` | `visibility`, `display`, color alpha |

For static positioning (rendered once and not animated), `left`/`top` is fine. The rule applies to *continuously animated* properties.

## Supporting practices

### Promote to a compositor layer with `will-change`

```jsx
style={{ willChange: 'transform, opacity' }}
```

Only on elements that actually animate continuously. Overusing `will-change` consumes GPU memory.

### Drive DOM directly via refs when state-driven re-renders dominate

If profiling shows React reconciliation is the bottleneck (rare for <50 elements), bypass React for the per-frame update:

```jsx
const nodeRefs = useRef([]);
// in rAF tick:
nodeRefs.current[idx].style.transform = `translate3d(${x}px, ${y}px, 0)`;
```

Re-render via React state *only* when a meaningful semantic change occurs (e.g., the highlighted node changes), not for every frame.

### When in doubt about animation-state correctness, sample DOM positions

Use Playwright or DevTools to actually measure rendered geometry. For circular motion you can verify positions land on the orbit ring:

```js
// In Playwright page.evaluate, sample every 200ms for ~1s
const nodes = Array.from(document.querySelectorAll('.orbital-node'));
const ratios = nodes.map((n) => {
  const r = n.getBoundingClientRect();
  const dx = r.left + r.width / 2 - centerX;
  const dy = r.top + r.height / 2 - centerY;
  return Math.hypot(dx, dy) / expectedOrbitRadius; // should be 1.00
});
```

If ratios drift below 1.00 (toward center), rule 1 is broken: a CSS transition is fighting JS updates. If ratios are correct but the animation *looks* janky, suspect rule 2 (timer/rAF) or rule 3 (`left/top` reflow).

### Canvas? Almost never the right answer for UI

For ≤ ~100 DOM elements, GPU-composited `transform` animation is faster than canvas redraw and keeps accessibility, click targets, hover states, and inspectability for free. Reach for canvas only when (a) element count is in the thousands, (b) you need pixel-level rendering control (particles, fluid sim), or (c) the layout doesn't map to a DOM tree.

## Diagnostic Workflow

When the user reports "the animation is slow/janky/broken":

Reflect on the 5–7 typical causes, then narrow to the most likely 1–2 before changing code. Common culprits, in rough order:

1. **`transition-all` racing JS updates** (rule 1) — characteristic symptom: motion *looks like* an interpolated short-cut of the intended path (inward drift on circles, lag on parallax, ghost trails).
2. **`left/top/width/height` instead of `transform`** (rule 3) — characteristic symptom: jank scales with element count or viewport size, DevTools Performance shows layout/paint columns.
3. **`setInterval` instead of rAF** (rule 2) — characteristic symptom: stutter that gets worse when the tab is busy or backgrounded.
4. **React state update per frame** — characteristic symptom: profiler shows reconciliation dominating; OK for small element counts.
5. **Animations on `display`/`visibility`/`height: auto`** — characteristic symptom: animation doesn't run at all or snaps instead of tweens.
6. **Excessive `will-change`** — characteristic symptom: scrolling jank elsewhere on the page, GPU memory pressure.
7. **Layout thrash in tight loops**: reading layout (`offsetWidth`, `getBoundingClientRect`) interleaved with writes inside the same frame.

Validate with logs/measurements before changing more than one thing at a time.

## Quick Reference Anti-Pattern → Fix

```jsx
// ❌ ANTI-PATTERN
<div
  className="absolute transition-all duration-700"
  style={{ left: `${x}%`, top: `${y}%` }}
/>
useEffect(() => {
  const id = setInterval(() => setAngle((a) => a + 0.6), 50);
  return () => clearInterval(id);
}, []);

// ✅ FIX
<div
  className="absolute"
  style={{
    left: `${x}%`, top: `${y}%`,
    willChange: 'left, top',
  }}
/>
useEffect(() => {
  let last = performance.now(); let id = 0;
  const tick = (now) => {
    const dt = Math.min(now - last, 100); last = now;
    setAngle((a) => (a + DEG_PER_SEC * dt / 1000) % 360);
    id = requestAnimationFrame(tick);
  };
  id = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(id);
}, []);
```

(For maximum perf, swap `left/top` for `transform: translate3d(...)` as well.)

## In-repo case study: `OrbitalDiagram` (AIE conference sites)

`apps/main/src/pages/worldsfair/index.jsx` — a rotating orbital diagram with 11
role nodes. The original implementation hit all three cardinal anti-patterns:

1. Each node had `transition-all duration-700` while a `setInterval(50ms)` updated `left/top` every tick. The CSS transition linearly interpolated between successive JS-set positions, cutting straight-line chords across the orbit. Visible symptom: under the post-release boost, nodes appeared to collapse inward toward the center logo instead of orbiting the ring. (rule 1)
2. `setInterval` instead of `requestAnimationFrame` → stutter and unsynced timing. (rule 2)
3. Animating `left`/`top` instead of `transform` → reflow on every tick. (rule 3)

The fix:

- Removed `transition-all duration-700` from the rotating wrapper (kept `transition-all duration-300` only on the inner circle for active-state scale/color, which is event-driven, not per-frame).
- Switched to `requestAnimationFrame` with delta-time integration (`degPerSec × dt`), so speed reads in degrees-per-second and motion stays correct under dropped frames.
- Added `willChange: 'left, top, opacity'`.
- Validated by sampling node positions via Playwright (`getBoundingClientRect`) and checking that distance-from-center ÷ expected orbit radius = 1.00 for every node across multiple frames.

When verifying PRs that touch animation code in this repo, use Playwright to sample
geometry over time and assert the expected invariant — don't rely on screenshots
alone, since the artifact may be subtle (chord-vs-arc) or only appear during
boost/peak motion.
