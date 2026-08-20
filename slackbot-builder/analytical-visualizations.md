# Analytical visualizations in Slack

Use this L3 reference for quantitative answers rendered as native charts,
interactive tables, or deterministic artifacts. Keep the analytical spec in the
channel-agnostic core; let the Slack adapter validate and render it.

Apply `data-visualization-quality` before this reference when deciding whether
an analysis is publishable and which visual form is justified. This reference
owns Slack delivery constraints, not general analytical design.

## Contents

- [Gate visualization creation](#gate-visualization-creation)
- [Choose the surface](#choose-the-surface)
- [Bound model output](#bound-model-output)
- [Apply the approved analytical decision](#apply-the-approved-analytical-decision)
- [Honor Slack contracts](#honor-slack-contracts)
- [Render richer forms](#render-richer-forms)
- [Test the real result](#test-the-real-result)

## Gate visualization creation

Answer inline in Slack unless the validated result is substantial and a visual
materially improves understanding. A request that mentions charts, drawing, or
visualization does not override this publishability gate.

Do not create a hosted artifact when the central measure is unavailable, the
result answers only an adjacent question, the returned data is too sparse to
support the requested claim, or concise prose communicates everything useful.
Give the inline answer, state the material gap once, and suggest a recovery
action when one exists. Preserve failed-attempt telemetry privately; do not turn
the receipt itself into a user-facing visualization.

Run this gate before allocating chart rendering, artifact storage, previews,
share links, CSV generation, or follow-up controls. This avoids spending model,
rendering, storage, and user attention on an output that should never ship.

Requester-scoped Slack evidence inherits the private source boundary. Answer
inline and privately unless the product has a separately designed,
capability-matched private artifact with audited access. Do not persist raw
search hits or derived private tables into ordinary visualization artifacts,
share links, PNG attachments, CSV downloads, traces, or logs. A useful native
Slack table may still be appropriate when the answer is substantial; it is not
a reason to create a durable artifact.

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

Treat model-authored pipe tables as untrusted intermediate text. Convert them to
native `data_table` only after validating one physical line per row, matching
leading/trailing pipes, one header divider, equal cell counts, and a practical
column count. If conversion fails, render compact bullets or plain prose; never
show raw pipe fragments or a broken Markdown table to the user.

## Apply the approved analytical decision

Receive a publishable analytical specification from the channel-agnostic core.
Do not use Slack rendering as a reason to substitute a nearby metric, publish a
mostly unavailable table, or turn an unavailable analysis into a dashboard.
Preserve explicit missing-value states in accessible fallback text. Keep
pending or unavailable values outside columns that must sort numerically.

Preserve all meaningful validated observations by default. Do not silently
reduce an ordered series to a handful of representative points merely to make a
chart easier to render. If the provider or Slack surface imposes a point limit,
use an honest aggregation or a richer authenticated surface, disclose the
transformation, and keep the complete authorized dataset in the matching
export.

Keep preview, interactive view, Markdown receipt, and CSV derived from the same
validated dataset. Slack may show a legible sampled preview, but the authorized
interactive view and export should retain all meaningful observations. If that
cannot be done honestly, prefer the inline answer or table over a misleading
partial visualization.

When an artifact is justified, make its portable receipt useful outside the UI.
Arrange the sanitized prompt, applicable application instructions, concise
decision/process summary, and validated data in a logical top-to-bottom
transcript. Keep referenced thread context separate from the requester's verbatim
prompt. Offer copy/download as Markdown when useful, but exclude platform
prompts, secrets, hidden reasoning, raw private search hits, and unsafe tool
payloads.

Public sharing may remain a useful explicit action. Build the share view from a
separately redacted public projection: the safe answer and public data may be
included, while requester-scoped Slack evidence, internal provenance, private
receipts, and capability-gated exports remain excluded. Do not infer public
authorization merely because an authenticated artifact exists.

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
Also test one unavailable or insubstantial result that must remain an inline
Slack answer with no visualization artifact.

For mixed Slack-plus-data prompts, also test a zero-result Slack search paired
with a successful deterministic lookup. The answer should still report the
verified data, state that no Slack comparison was supported, remain private,
and create no durable artifact.

Validate:

1. malformed, duplicate, oversized, and ambiguous parser cases;
2. exact Block Kit, including `raw_number.text` and message-wide budgets;
3. `chat.postMessage` `{ok:false}` handling plus prose-only fallback;
4. malformed pipe-table suppression plus readable bullet/prose fallback;
5. live pagination, filtering, sorting, and row-header behavior;
6. Markdown receipt completeness and public-share redaction;
7. desktop/mobile labels, legends, cropping, alt text, and readability.

A success reaction, generated payload, or mocked Slack card is not visual proof.
After deployment, send representative prompts through the real Slack instance,
inspect the human-visible Slack response, and open any authenticated artifact in
the real browser UI at desktop and mobile widths. Report source/CI, deployment,
Slack API acceptance, artifact authorization, and human-visible rendering as
separate claims.
