# Recurring YouTube CTA campaigns

Use this reference for repeatable description and pinned-comment campaigns,
including canonical content links, conferences, launches, sponsors, and other
time-bounded calls to action. Keep campaign editorial policy outside the generic
provider/auth executor, then lower approved changes to its typed actions.

## Separate the three records

Maintain distinct durable records for:

1. **Editorial policy:** copy, eligible content, relevance rules, campaign dates,
   links, and lifecycle state.
2. **Immutable plan:** exact channel/video IDs, ETags, complete before/after text,
   rollback text, quota ledger, checksum, and selection evidence.
3. **Execution receipts:** proposal, approver, attempt, provider readback, and any
   Studio-only verification.

Campaign expiry and source-observation dates belong in policy and plan metadata,
not viewer-facing copy. Keep the public CTA concise unless the user explicitly
asks to display lifecycle language.

## Evidence before copy

- Resolve event/product names, dates, stable landing pages, registration state,
  and lifecycle from current authoritative source plus live production.
- Prefer stable first-party landing pages. If a page or registration flow is not
  live, omit that link and report the gap rather than inventing one.
- Date-pin the evidence. A later run must refresh stale source/live evidence and
  omit expired items.
- Preserve the exact user-approved wording after factual validation. Do not
  silently soften positioning language or expose internal operational notes.

## Canonical identity

- Join catalogs, metrics, plans, and receipts by exact case-sensitive YouTube
  video ID, never by title or slug.
- Require a canonical page to contain that exact ID in its identity-bearing URL
  segment. Treat trailing labels and slugs as cosmetic.
- Verify the immutable OAuth channel before every authenticated provider read,
  proposal hydration, execution, and readback.
- Exclude unavailable/private videos, Shorts, trailers, and records without a
  canonical page. Preserve exclusion reasons instead of dropping rows silently.

## Cohorts and metric finality

- Define lifetime cohorts from current public lifetime view counts.
- Define recent-performance cohorts from views earned inside the latest complete
  trailing window, not upload date.
- Do not infer finality merely because Analytics returned rows. Prefer a
  manager-native `latest finalized Analytics day` capability; until available,
  require explicit evidence for the window end. If finality is unavailable,
  report the cohort unavailable and do not substitute another metric.
- Preserve raw rankings, observation timestamps, window dates, overlap, and
  exclusions. Deduplicate by exact ID, retain overlap in the first cohort, and
  backfill the second from its next eligible record.

## Description editing

- Read the complete current description and ETag before parsing or drafting.
- Preserve synopsis, chapters, speakers, links, and useful resources verbatim.
- Use one compact shared CTA block near the top. Do not allow campaign copy to
  displace the official-source link or turn the first screen into several pitches.
- Give managed blocks an unambiguous whole-block boundary, such as an exact
  separator-delimited template. Replace the complete recognized block; never
  delete snippets based on a loose keyword match.
- A standalone exact canonical URL may be normalized to the managed block. An
  inline/custom use, a wrong canonical ID, or an unknown campaign-like CTA needs
  manual review.
- Classify active, expired, and unknown CTAs separately. Only auto-remove an
  expired CTA when the complete manager-owned block is confidently recognized.
- Enforce provider length limits after composing the full outgoing description.

## Pinned comments

- Keep pinned comments more selective than descriptions: official canonical page
  plus one best CTA.
- Choose the CTA from explicit topical evidence and event proximity. Record the
  reason; when there is no strong match, say that the chronologically next broad
  event was selected.
- Prefer editing an existing channel-owned pinned comment. Otherwise draft a new
  top-level comment only after approval.
- Comment create/update may use the typed API executor when requested, but pinning
  is Studio-only. In Studio, verify account/channel, video ID, exact text, and
  final pinned state after every mutation. Stop on account ambiguity, challenges,
  or unexpected UI state.

## Quota accounting

Recheck Google's current quota documentation on every campaign. Budget the full
protected operation, not only the nominal mutation:

```text
channel verification
+ current resource / ETag preflight
+ mutation
+ provider readback
= protected per-action cost
```

Also account for catalog reads, proposal hydration, pagination, drift recovery,
and invalid requests. If proposal preparation and execution use different quota
days, say so explicitly and ensure proposal expiry permits that schedule. Preserve
the requested review cohorts even when the first executable wave must be smaller;
mark deferred rows and never silently exceed the daily reserve.

## Pilot, plan, and execution

1. Produce a read-only pilot that deliberately samples active, expired, missing,
   unknown/custom, and already-correct states. Include any user-named video even
   when it falls outside the final cohorts, and label it pilot-only.
2. Review complete diffs for content loss, identity mismatch, CTA overload, stale
   dates, link readiness, quota, and rollback integrity.
3. Produce deterministic manager-compatible actions with an immutable checksum.
   Dry-run is the default.
4. Stage individual proposals only after the checksum has been reviewed. Checkpoint
   every receipt and do not treat proposal creation as approval.
5. Execute only through the shared manager executor. Use no mutation retry after
   an ambiguous outcome; reconcile from provider state.
6. Verify applied descriptions by provider readback. Perform Studio-only pinning
   afterward, with its own per-video ledger and readback.

Tests should cover exact-case IDs, cosmetic canonical labels, existing canonical
links, mixed custom descriptions, whole-block expired replacement, unknown CTAs,
cohort overlap/backfill, quota arithmetic, stale evidence, rollback integrity,
and ambiguous outcomes.
