# Chart and analytical-surface design

Read this reference only after the requested claim is publishable. It governs
form, encoding, density, interaction, responsive behavior, accessibility, and
export—not whether missing evidence may be substituted.

## Contents

- [Choose the smallest sufficient form](#choose-the-smallest-sufficient-form)
- [Match form to analytical task](#match-form-to-analytical-task)
- [Scales, ordering, and comparison](#scales-ordering-and-comparison)
- [Labels, precision, and annotation](#labels-precision-and-annotation)
- [Interaction and information density](#interaction-and-information-density)
- [Responsive and accessible rendering](#responsive-and-accessible-rendering)
- [Tables and exact values](#tables-and-exact-values)
- [Exports and provenance](#exports-and-provenance)

## Choose the smallest sufficient form

| Need | Preferred surface |
| --- | --- |
| One or two decisive values | Sentence or directly labeled values |
| Exact lookup or small comparison | Compact table |
| Ranked category comparison | Ordered bar, dot, or lollipop plot |
| Ordered change over time | Line or area chart |
| Before/after or two-value comparison | Dumbbell or slope chart |
| Composition across groups | Stacked or normalized stacked bar |
| Distribution | Histogram, density, box, violin, or ECDF as appropriate |
| Relationship between measures | Scatterplot with meaningful encodings |
| Separate cohorts or incompatible scales | Facets or small multiples |
| Entity-by-evidence coverage | Coverage matrix or heatmap |
| Flow from gross to net | Waterfall |
| Shared population stages | Funnel, only with a consistent denominator |
| Many exact values plus exploration | Sortable/filterable table |
| Brushing, drill-down, or scenario inputs | Interactive explorer |

Prefer one decisive visual. Use a mini-dashboard only when each component
answers a different necessary part of one question. Avoid a chart plus table
that merely duplicate each other; use hover, direct labels, or an export for
secondary exact values.

## Match form to analytical task

### Time and ordered sequences

- Use line charts for measurements at ordered points and area charts when
  accumulated magnitude is itself meaningful.
- Preserve the real temporal spacing when intervals differ.
- Do not draw continuity through unavailable intervals without visually marking
  the gap.
- Align comparable series to one time axis. Use normalized views only with an
  explicit baseline and retain the original measure when it matters.
- For pacing, distinguish cumulative levels, interval increments, velocity, and
  share of final total; they answer different questions.

### Categories and rankings

- Order categories by the analytical purpose: value, chronology, geography, or
  an established domain order. Alphabetical order is rarely analytical.
- Start ordinary bar charts at zero. Prefer dots or intervals when a truncated
  quantitative scale is necessary.
- Use horizontal layouts for long category labels.
- Avoid grouped bars when too many series prevent comparison; use small
  multiples, a heatmap, or a focused subset with honest coverage.

### Composition

- Use pie or donut charts only for a simple parts-of-whole question with a small
  number of clearly distinct parts. Prefer bars when precise comparison matters.
- Use 100% stacked bars for shares across groups, and ordinary stacked bars when
  both composition and totals matter.
- Define the denominator and handle unknown/unclassified portions explicitly.

### Distributions and uncertainty

- Show the distribution rather than only an average when spread, skew, or
  outliers affect the decision.
- State sample size and distinguish observations from estimates.
- Use bands for dense uncertainty, whiskers for isolated estimates, and avoid
  implying precision beyond the source.

### Relationships

- Use scatterplots only when both axes are meaningful quantitative measures.
- Do not imply causation from association. Show relevant uncertainty or grouping
  when supported.
- Avoid encoding redundant dimensions with size, color, and shape unless each
  encoding is needed for the question.

## Scales, ordering, and comparison

- State quantities and units on axes or direct labels.
- Use shared scales for direct comparison. When scales must differ, facet and
  label them rather than disguising the difference.
- Use logarithmic scales only when orders of magnitude are central; label them
  plainly and never mix zero or negative values without a valid treatment.
- Derive domains from all visible observations, uncertainty, and references.
- Keep reference lines and annotations inside the plot and visually subordinate
  to the data.
- Choose color for grouping or emphasis, not decoration. Use a colorblind-safe
  palette and do not rely on color alone for status.
- Reserve semantic colors for stable meanings such as positive, negative,
  warning, or unavailable states.

## Labels, precision, and annotation

- Give the visual a concise title that states the subject, not a conclusion the
  data cannot support.
- Keep labels short but unambiguous. Expand acronyms when the audience may not
  know them.
- Use consistent precision appropriate to the source and decision. Do not show
  spurious decimals.
- Put decisive values and takeaways on marks, axes, or restrained annotations
  rather than in a separate wall of prose.
- Anchor edge labels inward and remove optional annotations before shrinking
  text below a readable size.
- Legends should be compact, ordered consistently with the visual, and omitted
  when direct labels are clearer.

## Interaction and information density

Add interaction only when it materially supports inspection or exploration.

- **Inspect:** aligned hover details, exact values, changes from prior points.
- **Compare:** series toggles, sorting, filtering, or shared crosshairs.
- **Explore:** brushing, drill-down, cross-filtering, or adjustable scenarios.

Default to Inspect. Add Compare when several series or rows need focused
comparison. Use Explore only for a real analytical workflow; do not create a
dashboard to justify controls.

Keep one mechanism per state. Do not invent search, filters, reset controls,
KPI cards, tabs, or permanent side panels merely to fill space. Put secondary
detail in hover, disclosure, or an export rather than increasing permanent
visual density.

## Responsive and accessible rendering

- Size each plot from its container and redraw or reflow when its width changes.
- At narrow widths, reduce optional ticks and annotations, shorten labels, and
  stack facets. Do not shrink the entire desktop plot until text is unreadable.
- Reserve enough margin for axis titles and values; verify actual bounding boxes
  rather than guessing.
- Keep essential marks, labels, and focus targets visible without horizontal
  page scrolling. A genuinely wide table may use a contained scroll region.
- Provide meaningful accessible text: chart purpose, axes, units, series, key
  values, and material gaps.
- Make legend toggles and interactive marks keyboard reachable with visible
  focus. Provide hit targets large enough to operate reliably.
- Verify realistic desktop and mobile views, long labels, sparse data, dense
  data, missing values, and light/dark themes when supported.

## Tables and exact values

- Use a table when exact lookup and comparison are primary.
- Keep the identifier column visually stable and order rows intentionally.
- Preserve numeric types for numeric sorting. Do not mix status prose into a
  numeric column; use a separate status or coverage field.
- Remove columns that do not help answer the question.
- Do not repeat an identical coverage-gap sentence in every row when one table-
  level note communicates it better.
- Do not publish a table dominated by unavailable values. Return a compact
  unavailable state or a coverage matrix only when coverage itself is the
  requested subject.
- Paginate or progressively reveal long tables; provide filtering only when it
  helps locate rows in a meaningful result set.

## Exports and provenance

- Export the complete validated aggregate data, not merely sampled chart points,
  when authorization permits.
- Keep units, column definitions, normalization, missing-value semantics, and
  source coverage discoverable in the export or receipt.
- Do not expose private prompts, source payloads, or capability-gated data in a
  share link or ordinary download.
- A download or interactive link must refer to the exact visual beside it.
- Do not offer a chart CSV, interactive link, or share action when the requested
  analysis was unavailable and no publishable visual exists.
- Treat provider completion, application validation, publication, and human
  usefulness as separate outcomes.
