# Change impact and experiments

Use this file when tying analytics to title, thumbnail, description, playlist,
comment, publication, or channel changes.

## Contents

- [Two distinct proofs](#two-distinct-proofs)
- [Change marker](#change-marker)
- [Baseline and checkpoints](#baseline-and-checkpoints)
- [Metrics](#metrics)
- [Native versus sequential experiments](#native-versus-sequential-experiments)
- [Reporting workflow](#reporting-workflow)
- [Slack report](#slack-report)

## Two distinct proofs

Never collapse:

1. **State proof:** the exact YouTube resource changed and readback matches.
2. **Impact evidence:** performance metrics changed after the operation.

Impact evidence is observational unless YouTube's native concurrent experiment
provides the result.

## Change marker

Persist an immutable marker for every measured change:

```ts
type YouTubeChangeMarker = {
  proposalId: string;
  accountKey: string;
  channelId: string;
  videoIds: string[];
  appliedAt: string;
  changedFields: string[];
  before: unknown;
  after: unknown;
  reportingTimeZone: string;
  nativeExperiment?: {
    status: "pending" | "running" | "complete" | "unknown";
    verifiedInStudioAt?: string;
  };
};
```

Do not infer a native experiment from an API resource. The public API exposes no
experiment ID, arms, or status.

## Baseline and checkpoints

At apply time:

- capture trailing 7 and 28 **complete** reporting days ending before the change;
- exclude partial or delayed days;
- persist window boundaries and capture time;
- normalize totals to per-day rates when comparing unequal availability.

Schedule:

- first complete reporting day;
- 7 complete post-change days;
- 28 complete post-change days.

If reports are delayed, mark the checkpoint pending instead of treating missing
rows as zero.

For sequential rotations, use equal finalized windows per variant and record
traffic-source mix, publication age, and overlapping changes.

## Metrics

### Targeted Analytics API

Capture:

- views and engaged views;
- estimated minutes watched;
- average view duration and percentage;
- likes, comments, shares;
- subscribers gained/lost;
- videos added to/removed from playlists;
- traffic sources;
- retention where useful;
- playlist starts/views/saves when the changed object is a playlist.

### Bulk reach report

Capture:

- `video_thumbnail_impressions`;
- `video_thumbnail_impressions_ctr`;
- date/channel/video dimensions.

The targeted Analytics API does not supply all reach metrics. Create the
Reporting API job before the first change; reports do not backfill arbitrary
history and may take roughly 48 hours to begin.

### Monetary analytics

When the product grants `yt-analytics-monetary.readonly`, keep revenue metrics
available to raw power users and explicit guided reports. Preserve the report's
currency, finalization delay, and window boundaries.

## Native versus sequential experiments

### Native YouTube A/B

- concurrent arms;
- up to three title/thumbnail combinations;
- winner based on watch-time share;
- result available in Studio;
- no public start/stop/status/result API.

Do not mutate title or thumbnail through the API during the test.

### Sequential API rotation

- one active variant at a time;
- fully automatable;
- audience composition, traffic source, video age, seasonality, and external
  events confound comparisons;
- YouTube explicitly warns that sequential third-party results may differ from
  native concurrent tests.

Label the result “observed before/after” or “sequential rotation,” never native
A/B.

## Reporting workflow

Use a durable job:

```text
change applied
  → persist change marker
  → enqueue due checkpoints
  → fetch finalized Analytics query metrics
  → import/aggregate Reporting reach rows
  → compare exact windows
  → store bounded aggregates
  → post/update Slack thread
```

Store bounded aggregates attached to the change, not unrestricted raw report
rows, unless the product explicitly requires a reporting warehouse.

## Slack report

Show:

```text
Title + thumbnail refresh · 7-day checkpoint
Video: <title> (<id>)
Changed: <timestamp>

Metric                     Baseline/day   After/day   Delta
Views
Thumbnail impressions
Thumbnail CTR
Watch minutes
Average view duration
Subscribers gained

Windows: <exact dates>
Data finalized through: <date>
Traffic mix changed: <summary>
Interpretation: observational, not causal
```

Link to:

- exact video;
- applied proposal and full diff;
- reporting window definition;
- Studio native experiment report when applicable.
