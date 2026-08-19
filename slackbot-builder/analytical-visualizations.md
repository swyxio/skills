# Analytical visualizations in Slack

Use this L3 reference for quantitative answers rendered as native charts,
interactive tables, or deterministic artifacts. Keep the analytical spec in the
channel-agnostic core; let the Slack adapter validate and render it.

## Contents

- [Choose the surface](#choose-the-surface)
- [Bound model output](#bound-model-output)
- [Apply useful defaults](#apply-useful-defaults)
- [Honor Slack contracts](#honor-slack-contracts)
- [Render richer forms](#render-richer-forms)
- [Test the real result](#test-the-real-result)

## Choose the surface

| Need | Surface |
| --- | --- |
| Category comparison, ordered series, parts of a whole | Native `data_visualization` |
| Exact values, search, filtering, sorting, pagination | Native `data_table` |
| Waterfall, heatmap, dumbbell, scatter, funnel, branded layout | Deterministic SVG/Canvas → PNG |
| Hover, cross-filtering, drill-down, many controls | Authenticated HTML dashboard + PNG preview + link |
| Editable source | Upload SVG/CSV alongside the inline PNG/table |

Do not use a generative image model for exact charts. Render from validated data.
Use [image-generation.md](image-generation.md) only for genuinely generative work.

## Bound model output

Do not let a model author arbitrary Block Kit. Give it a small typed language,
parse strictly, then construct Slack blocks in server code. Cap one answer at two
charts plus one table; Slack permits at most two `data_visualization` blocks.

```ts
type VisualSpec =
  | {
      type: "bar" | "line" | "area";
      title: string;
      categories: string[];
      series: Array<{ name: string; values: number[] }>;
      xLabel?: string;
      yLabel?: string;
    }
  | {
      type: "pie";
      title: string;
      segments: Array<{ label: string; value: number }>;
    }
  | {
      type: "data_table";
      caption: string;
      columns: string[];
      rows: Array<Array<string | number>>;
      pageSize?: number;
      rowHeaderColumnIndex?: number;
    };
```

Reject unknown types, non-finite values, duplicate labels/series, mismatched
series lengths, oversized payloads, ambiguous row headers, and incompatible
combinations. Strip the internal spec from prose and fallback text. If one visual
fails validation, preserve the prose answer and add a sanitized omission note.

## Apply useful defaults

These are product defaults, not Slack requirements:

- Lead with one decision-useful sentence, then one decisive visual. Use a
  mini-dashboard only when its pieces answer different parts of one question.
- Prefer time-series line/area for truly ordered time data; use area when filled
  magnitude or cumulative volume matters.
- Prefer grouped bars for cross-category or multi-metric comparisons.
- Use pie only for clear parts-of-whole questions, normally ≤6 slices. Prefer a
  time series when either could answer the question.
- Use tables for exact values. Show compact results of ≤10 rows without
  pagination; paginate longer lists.
- Keep labels short, order categories intentionally, and state units/currency.
- Do not imply continuity across unlike cohorts; facet or label separate series.
- Preserve `unavailable`, `pending`, `reported`, and `calculated`; never coerce
  missing evidence to zero.
- Keep pending/unavailable rows outside columns that must sort numerically.

### Compact visual catalog

| Form | Good use |
| --- | --- |
| Dumbbell/slope | Issued versus active, before versus after |
| Waterfall | Gross → refunds → net |
| Heatmap/coverage matrix | Entity × evidence availability |
| Lollipop/dot plot | Rates or ranked values |
| Scatter | Relationship between two metrics |
| Stacked bar | Composition across comparable groups |
| Small multiples | Separate cohorts, event families, or time windows |
| Funnel | Stages sharing one precisely defined population only |

## Honor Slack contracts

Validate the current provider docs before shipping. Preserve these fragile
contracts in code and tests.

### Native charts

- Maximum two visualization blocks per message.
- Title ≤50 characters; series/category labels ≤20.
- One to twelve unique series, each with one to twenty points.
- Every series supplies exactly one point for every category.
- Pie values are positive; line/bar/area may be negative.

Keep top-level message `text` sufficient for notifications and screen readers.

### Interactive tables

- One to twenty columns; one to two hundred data rows plus the header.
- `page_size` is 1–100.
- All rows have equal cell counts and the caption is non-empty.
- The 20,000-character table-cell budget is aggregate across **every table in
  the message**, not per table. Pick one owner when analytical, parsed Markdown,
  and action-review tables compete. Slack messages allow at most 50 blocks.
- `row_header_column_index` values are unique after canonical normalization;
  Slack treats them as screen-reader row identifiers.
- Every `raw_number` has numeric `value` plus non-empty display/accessibility
  `text`.

Sorting is numeric only when every cell in a column is `raw_number`. Mixing
`Pending` into a numeric KPI column silently changes it to alphabetical sorting;
put incomplete rows in a coverage note or separate status table.

## Render richer forms

Render unsupported chart forms as deterministic SVG/Canvas, then rasterize to
PNG for inline display. Slack image blocks support PNG, JPG/JPEG, and GIF—not
SVG. Include useful `alt_text` and a textual takeaway. Optionally upload the SVG
or CSV as a downloadable file.

Upload private files with `files:write` and the current external flow:

```text
files.getUploadURLExternal
  → POST bytes to upload_url
  → files.completeUploadExternal(channel_id, thread_ts, files)
```

Do not use retired `files.upload`. Do not make a private chart public merely to
satisfy `image_url`; upload it to Slack or use an authenticated durable surface.

Slack does not execute arbitrary HTML in messages. For real hover, brushing,
cross-filtering, or drill-down, host the dashboard behind the source data's auth
boundary, post a PNG snapshot, and link an **Open interactive dashboard** button.
Use Slack buttons/selects only for bounded controls that re-render server-side.

Fast deterministic renders may share the normal answer path. Anything that can
outlive the request must use L5 durable execution and guarantee result-or-error.

## Test the real result

Use clearly marked synthetic design-lab prompts to compare grouped bar, ordered
line/area, pie, a tall compact table, and a two-chart-plus-table dashboard.

Validate:

1. malformed, duplicate, oversized, and ambiguous parser cases;
2. exact Block Kit, including `raw_number.text` and message-wide budgets;
3. `chat.postMessage` `{ok:false}` handling plus prose-only fallback;
4. live pagination, filtering, sorting, and row-header behavior;
5. desktop/mobile labels, legends, cropping, alt text, and readability.

A success reaction is not visual proof. Report source/CI, deployment, Slack API
acceptance, and human-visible rendering as separate claims.
