---
name: youtube-channel-operator
description: Design, build, or review a production multi-channel YouTube operations operator with typed API methods, guided human approval, durable execution, OAuth isolation, audit history, and post-change measurement. Use when the shared operator core or its channel/approval/analytics architecture is the task; hand one-off API execution to youtube-api, Studio-only browser work to youtube-studio-computer-use, and ordinary content writing to the narrower media skills.
---

# YouTube Channel Operator

Build a channel-agnostic YouTube operations core with two interfaces:

1. typed raw API methods for trusted power users;
2. guided workflows that resolve exact resources, preview a change set, and apply it after approval.

Use `slackbot-builder` for Slack transport maturity and `data-chatbots` for
proposal/apply semantics. Use this skill for the YouTube-specific domain layer
that joins them.

## The one rule

**Raw and guided operations must share one deterministic executor.**

The model may choose an operation and draft parameters. It must never construct
authorization, call arbitrary URLs, or independently decide what was applied.
The server resolves the account and resource, builds the provider request,
persists the exact reviewed action, applies it once, and verifies the result.

## Route the task

| Need | Load |
| --- | --- |
| Determine whether an operation exists, its scope, quota, or API limitation | [references/capabilities.md](references/capabilities.md) |
| Design OAuth accounts, raw tools, proposals, execution, idempotency, or audit | [references/architecture.md](references/architecture.md) |
| Implement common Slack workflows and approval cards | [references/slack-playbooks.md](references/slack-playbooks.md) |
| Download captions or generate summaries, chapters, clips, quotes, and titles | [references/transcripts.md](references/transcripts.md) |
| Measure performance after title, thumbnail, description, or playlist changes | [references/analytics-experiments.md](references/analytics-experiments.md) |
| Reconcile paid reach, organic lift, subscriber quality, and Google Ads evidence | [references/analytics-experiments.md](references/analytics-experiments.md) |
| Build or review the test matrix | [references/test-cases.md](references/test-cases.md) |

Do not load every reference automatically.

## Distinguish the three execution surfaces

| Surface | Use it for |
| --- | --- |
| Official API | Stable reads and writes: metadata, thumbnails, captions, comments, playlists, channel layout, uploads, live, analytics, reporting |
| Studio/browser | Native title/thumbnail A/B tests, pinning comments, Community posts, end screens/cards, Studio editor, Shorts thumbnail frames, and other undocumented controls |
| Local atomic skill | One-off scriptable uploads, thumbnail sets, metadata changes, and channel listing through `youtube-api` |

Never claim an MCP or private endpoint can perform a Studio-only action unless
the owning UI is actually controlled and verified.

## Non-negotiable invariants

1. **Pin the account.** Map an immutable account key to one expected channel ID
   and one credential namespace. Verify `channels.list(mine=true)` before
   drafting and applying.
2. **Isolate channels.** Use separate OAuth grants and secrets per brand/channel.
   Never infer routing from a title or reuse one channel's refresh token.
3. **Expose methods, not arbitrary HTTP.** Raw tools accept a registered method
   ID, typed parameters, body, and optional immutable media asset. Reject custom
   URLs, hosts, headers, tokens, or an unreviewed `execute` flag.
4. **Use full metadata for content work.** Treat catalogs, search hits, and
   `descriptionExcerpt` fields as discovery records only. After resolving exact
   video IDs, fetch `videos.list(part=snippet,...)` and use the complete
   `snippet.description` before extracting, comparing, or rewriting content.
   Never conclude text is absent because it is absent from an excerpt. YouTube
   detail reads should use 50-video pages to match YouTube's native request
   limit and continue larger sets with an explicit page or cursor.
   YouTube update endpoints use replacement semantics for included `part`s, so
   merge a patch into the full current mutable part and review the complete
   outgoing representation.
5. **Apply exactly what was reviewed.** Persist the exact resource ID, base
   ETag, before state, desired patch, normalized provider request, actor, and
   expiry. If live state drifts, conflict and create a fresh proposal.
6. **Keep Slack thin.** Verify/ack/dedupe/render in Slack; resolve, validate,
   persist, execute, and audit in a channel-agnostic core.
7. **Make external writes durable.** Use a workflow or queue for uploads,
   scheduled rotations, multi-step packages, retries, and analytics follow-ups.
8. **Verify the owning surface.** Refetch the resource after every API mutation.
   For Studio-only work, reopen the exact Studio/video record.
9. **Keep immutable audit history.** Record the actual human proposer and
   approver, provider/account, exact request, before/after, attempts, and outcome.
   Never store OAuth tokens or Authorization headers in D1, logs, traces, or Slack.
10. **Separate change proof from performance impact.** A successful write proves
    state changed. Analytics later describe correlation, not causality, unless
    YouTube's native concurrent experiment supplies the result.
11. **Separate acquisition objectives and evidence.** Cheap paid views can be a
    valid awareness outcome. Report paid reach, organic behavior, attributed
    subscribers, and repeat engagement separately; do not collapse them into a
    single quality score or dismiss inexpensive views by default.

## Build the two capability layers

### Raw power-user layer

Expose a compact typed surface:

```text
youtube.data.call
youtube.live.call
youtube.analytics.query
youtube.reporting.call
youtube.transcript.get
```

Require `accountKey`, a registered method ID, exact IDs/parameters, a validated
body, and an optional immutable asset ID. Show the normalized provider request
before execution. Keep the method registry complete even when common workflows
cover only a subset. `youtube.transcript.get` is a read-only convenience tool
over registered `captions.list` and `captions.download` calls; it must preserve
the selected caption track and timestamps rather than scrape watch-page HTML.

### Guided workflow layer

Promote frequently repeated operations into domain workflows:

- title/thumbnail candidate package;
- complete video metadata refresh;
- create or update the channel-owned top-level comment;
- playlist create/update/add/remove/reorder/shelf;
- upload package with thumbnail, captions, playlists, scheduling, and comment;
- scheduled-release batch for already uploaded unpublished videos;
- caption download and transcript-derived summary/chapter/clip/quote package;
- comment moderation and reply queue;
- live broadcast setup and operations;
- before/after analytics checkpoints.

Each workflow lowers to the same typed raw methods. Do not maintain a second
mutation implementation.

## Proposal-to-apply lifecycle

```text
request
  → resolve exact channel + resource IDs
  → read current resource + ETag
  → validate ownership and provider constraints
  → merge full mutable API part
  → persist immutable draft + idempotency key
  → render before/after, effects, quota, and deep link
  → signed human approval
  → atomically claim the draft
  → refetch + reject drift
  → execute/reconcile once
  → refetch owning API
  → append audit result
  → schedule measurement checkpoints
```

For a multi-step package, report each step independently. YouTube does not
provide a transaction spanning metadata, thumbnail, comment, playlist, and
caption calls. Store rollback inputs, but never describe compensation as atomic.

## Design the approval card

Show:

- account label and exact channel ID;
- resource kind, exact ID, URL, and current owner;
- compact before → after diff;
- API method, affected `part`s, and media asset;
- irreversible or public side effects;
- idempotency/expiry and drift behavior;
- analytics baseline and planned follow-ups;
- full-review deep link when Slack truncates content.

Button values contain only an opaque proposal ID. Load all executable content
from server-side storage. Resolve buttons in place after approve, reject,
conflict, or failure.

## Handle the common API gaps explicitly

- Native title/thumbnail A/B testing is Studio-only. API title/thumbnail changes
  stop a running native experiment.
- Comment creation/editing is supported; pin/unpin is not.
- Community posts, end screens/cards, Studio editing, handles/avatar changes,
  Shorts thumbnail-frame selection, and most VOD monetization controls are not
  public Data API operations.
- Native A/B arm allocation and winner data are not exposed in Analytics or
  Reporting APIs.

Offer an exact Studio handoff or supervised browser workflow. Do not silently
substitute a sequential rotation and call it a native A/B test.

Google Ads campaign creation and mutation belong to an Ads operator. This skill
may ingest Ads campaign evidence and reconcile it with YouTube analytics, but it
must not invent Ads mutation methods inside the YouTube executor.

## Implementation order

1. Record product decisions: account keys/IDs, Slack-to-role mapping, which
   mutations require approval, public/private delivery, deterministic
   channel-comment marker, native versus sequential experiment policy, media
   storage, reporting windows, and any winner thresholds.
2. Inventory channels, exact IDs, OAuth ownership, runtimes, and current API
   grants.
3. Build account routing and token refresh with fail-closed channel verification.
4. Implement the typed raw method registry and read-only dry-run/normalization.
5. Add a provider-neutral external-action proposal, attempt, and audit ledger.
6. Add Slack/web proposal rendering and signed approval.
7. Ship metadata, thumbnail, comment, and playlist guided workflows.
8. Add Reporting API reach jobs and durable impact checkpoints.
9. Add resumable uploads, captions, live operations, and Studio handoffs.
10. Provision each additional channel independently and run live canaries.

## Completion proof

Do not report the operator complete until all applicable evidence exists:

- OAuth grant stored in the intended runtime secret store;
- exact channel ID verified from the active grant;
- raw read and reversible write canary;
- approval actor and immutable audit row;
- drift conflict test;
- duplicate delivery/retry test;
- API readback or Studio owning-surface verification;
- analytics job/checkpoint proof when measurement is promised;
- paid/organic and attribution reconciliation when promotion is measured;
- refresh-token health check and explicit reauthorization failure handling;
- independent proof for every configured channel and runtime.
