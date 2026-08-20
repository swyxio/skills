---
name: data-visualization-quality
description: Decide whether quantitative data should be visualized, choose and design an analytically faithful chart or table, and reject misleading or low-information artifacts. Use for charts, dashboards, analytical tables, visualization specifications, or production visualization pipelines; do not use for generic page styling or interaction mechanics.
---

# Data Visualization Quality

Create visualizations that answer the requested analytical question. A valid
chart specification is not automatically publishable.

## Decide before designing

Establish four things before choosing a visual:

1. **Claim:** the comparison, trend, distribution, composition, relationship,
   or decision the user wants to understand.
2. **Required evidence:** the dimensions, measures, units, denominators, time
   windows, and comparable populations needed to support that claim.
3. **Coverage:** which required fields and entities are complete, partial,
   unavailable, pending, reported, or calculated.
4. **Smallest useful surface:** prose, compact table, one chart, small multiples,
   or a genuinely interactive explorer.

Classify the outcome:

- **Complete:** available comparable data directly supports the requested claim.
- **Partial:** a clearly bounded subset supports a useful part of the claim.
- **Unavailable:** the central requested measure or denominator is absent.
- **Unsupported:** the source or analytical method cannot answer the request.

For unavailable or unsupported outcomes, do not create a chart or data explorer.
Explain the missing evidence and offer the best recovery action. A private run
receipt may preserve the attempt, but it is not a visualization.

## Preserve semantic fidelity

- Never substitute an adjacent measure merely because it exists. Issued tickets
  are not attendance; totals are not concentration; cumulative counts are not
  velocity; ticket counts are not revenue.
- Never imply comparability across unlike cohorts, definitions, currencies,
  denominators, tier taxonomies, or time windows. Normalize, facet, or decline.
- Keep observed, reported, calculated, estimated, pending, and unavailable
  values distinguishable.
- Do not coerce missing evidence to zero.
- State material caveats next to the claim they limit.

## Require a visual to earn its space

Use a visual only when it makes a meaningful relationship easier to understand
than concise prose or a compact table.

Do not publish:

- a chart whose only surviving measure answers a different question;
- a table dominated by repeated `Unavailable`, `N/A`, or coverage prose;
- a large chart for a few values that are clearer in one sentence;
- prose, chart, and table that redundantly repeat the same information;
- decorative KPI cards, controls, legends, or panels that do not aid a decision;
- a normal success workspace around an unavailable result.

In production pipelines, implement deterministic publishability validation.
Skill instructions and model self-assessment are not sufficient enforcement.
Keep exact thresholds schema-aware and tested: absence of one central measure
can invalidate an analysis even when most cells are populated.

## Choose and design the form

Read [references/chart-design.md](references/chart-design.md) when selecting or
reviewing chart form, scales, ordering, labels, interaction, responsive layout,
accessibility, or exports. Skip it when the correct result is prose-only or an
unavailable receipt.

## Product-state contract

Match product status to analytical outcome, not merely execution completion.

- Complete visualizations may expose appropriate interactive and export actions.
- Partial visualizations must label their bounded coverage and omissions.
- Unavailable or unsupported results should be compact, remove irrelevant
  chart/share/export/filter controls, and offer a recovery action.
- Do not call a receipt-only result a dashboard, explorer, or completed analysis.
- Strip internal visualization specifications from fallback prose. Do not show a
  raw Markdown table when the product owns structured table rendering.

## Verify

For production work, validate:

- the visual answers the current request rather than an adjacent one;
- units, scales, denominators, sorting, normalization, and precision;
- missing and partial coverage behavior;
- labels, marks, legends, tooltips, and accessible fallback text;
- realistic desktop and mobile rendering;
- malformed, oversized, duplicate, unavailable-dominated, and metric-
  substitution rejection paths;
- source validation, application publication, provider delivery, and visible
  rendering as separate claims.

Use demonstrated bad outputs as regression fixtures. A polished misleading
visualization is a more dangerous failure than an explicit refusal to chart.
