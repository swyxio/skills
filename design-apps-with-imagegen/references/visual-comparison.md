# Matched visual comparison

Record viewport, screenshot scale, route, content density, and expanded UI state. Compare the generated reference and actual implementation under equivalent conditions.

For responsive products, inspect phone and desktop plus breakpoints where composition changes. A broad redesign usually merits phone (390 × 844), tablet (834 × 1194), split desktop (720 × 900), and full desktop (1440 × 900); use actual product breakpoints when more informative. Recapture sizes affected by each correction, not every size automatically.

Compare the dominant region, fold, primary action, defining traits, density, typography, and material detail before polishing small spacing differences. Include menus or settings that affect composition. Measure geometry when it clarifies a mismatch.

Record material deltas as:

```text
State: settings open, split desktop
Difference: navigation wraps, pushing the task below the fold
Fix: collapse navigation labels sooner
Status: open | fixed | intentional, with rationale
```

Optional overlays help diagnose alignment; raw pixel difference is not a quality score. Mark deviations intentional only when implementation constraints or usability evidence justify them. Fix material gaps, then compare the same states again. Stop when remaining adaptations preserve the selected direction and scoped flow.
