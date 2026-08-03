# Slack playbooks

Use this file to promote common YouTube operations over the typed raw method
registry. Follow `slackbot-builder` for signed requests, fast acknowledgement,
threads, Block Kit, durable execution, and button resolution.

## Contents

- [Shared interaction contract](#shared-interaction-contract)
- [Title and thumbnail](#title-and-thumbnail)
- [Complete video refresh](#complete-video-refresh)
- [Top-level comment and pin handoff](#top-level-comment-and-pin-handoff)
- [Playlist manager](#playlist-manager)
- [Upload package](#upload-package)
- [Scheduled release batch](#scheduled-release-batch)
- [Transcript and viewer package](#transcript-and-viewer-package)
- [Moderation queue](#moderation-queue)
- [Live operations](#live-operations)
- [Raw mode](#raw-mode)

## Shared interaction contract

Every playbook:

1. acknowledge Slack immediately;
2. resolve the account and exact resource;
3. post live status while reading/validating;
4. persist the complete draft;
5. render before/after plus side effects;
6. require signed approval according to product policy;
7. execute durably;
8. rewrite the card with the final outcome;
9. verify YouTube readback;
10. post analytics checkpoints in the originating thread.

Keep canonical state in the backend, not Block Kit. Button values contain opaque
proposal IDs only.

## Title and thumbnail

Example:

> Propose three title and thumbnail combinations for this video, then help me
> test them.

First ask or infer whether the user wants:

### Native concurrent A/B

1. generate up to three title/thumbnail combinations;
2. validate title and image requirements;
3. render candidates in Slack;
4. provide `Open Studio A/B test` for the exact video;
5. record a local pending marker only after the human confirms the test started;
6. avoid API title/thumbnail writes while the marker is active;
7. verify the winner in Studio.

The public API cannot create, detect, stop, or read the result of the native
experiment. An API title/thumbnail update stops a running native test.

### Sequential rotation

1. disclose that the test is observational, not concurrent A/B;
2. approve variants, order, windows, stop conditions, and fallback;
3. snapshot current title/thumbnail and complete baselines;
4. rotate with durable scheduled actions;
5. record exact start/end times and API readbacks;
6. compare equal finalized windows with traffic-source context;
7. propose the winning package rather than silently locking it in.

## Complete video refresh

Example:

> Update the title, thumbnail, description and first comment, add this talk to
> the Agents and World's Fair playlists, then report performance.

Lower one reviewed package into:

1. `videos.update` with the complete merged `snippet`;
2. `thumbnails.set`;
3. top-level comment create/update;
4. playlist-item inserts/deletes/reorders;
5. optional channel-section update;
6. measurement plan.

Show every sub-operation and ordering. The package is not atomic. Store the
previous snippet, thumbnail reference, channel-owned comment, and playlist
memberships as rollback inputs.

For long descriptions, render a compact line/section diff in Slack and link to a
durable full review page.

## Top-level comment and pin handoff

Example:

> Post this as our first pinned comment and link the conference playlist.

1. find an existing channel-owned top-level comment selected by exact comment ID
   or a deterministic product marker;
2. propose update or create;
3. disclose the public channel attribution;
4. apply and refetch the exact comment;
5. link directly to the comment/watch page;
6. show `Open to pin`;
7. verify pinning only through YouTube UI.

Do not promise literal first position: comment creation is not atomic with video
publication and other viewers may comment first. Do not promise API pinning.

## Playlist manager

Examples:

- “Create a podcast playlist for this series.”
- “Move this video to position three.”
- “Remove duplicates and unavailable videos.”
- “Feature this playlist as the second channel shelf.”
- “Sync every event talk matching this source dataset.”

Support:

- create/update/delete playlist;
- title, description, privacy, podcast status, language/localizations;
- playlist image insert/update/delete;
- add/remove/reorder playlist items;
- channel-section/shelf create/update/delete.

Persist playlist-item IDs for removals and reorders. Preflight exact membership
to avoid duplicates. For rule-based sync, show an add/remove/reorder table and
source evidence before approval.

## Upload package

Example:

> Upload this recording unlisted with its metadata, thumbnail, captions,
> playlists, scheduled publish time, and channel comment.

Use durable resumable upload:

1. copy the immutable asset into controlled object storage;
2. calculate SHA-256 and media metadata;
3. approve video metadata and initial privacy;
4. create/reuse a resumable upload session;
5. upload and verify video ID/processing state;
6. apply thumbnail and captions;
7. add playlists;
8. schedule/publicize only if reviewed;
9. create/update channel comment;
10. post the full step ledger.

Prefer private/unlisted canaries. API projects may force uploads private until a
YouTube compliance audit is complete.

## Scheduled release batch

Example:

> Schedule the private playlist videos every 30 minutes from 9:30 AM Pacific.

1. resolve exact owned video IDs; convert the requested local cadence to future,
   canonical UTC timestamps with milliseconds;
2. hydrate each video and accept only private, never-published uploads by
   default; treat unlisted sources as canary-only and reject public, missing, or
   cross-channel videos before approval;
3. draft one `videos.scheduleRelease` action per video. Its complete status write
   sets `privacyStatus: private` and `publishAt` together—never draft a separate
   make-private action;
4. render the ordered cadence, each video, its current visibility, the scheduled
   normal public release, and a clear statement that this is **not** a Premiere;
5. let the human use the existing `Approve all remaining` control over these
   independently-ready drafts; a durable executor claims, drift-checks, and
   records each item separately;
6. refetch each video and require `privacyStatus: private` plus the same instant
   for `publishAt`. A slot that has expired while awaiting approval fails closed
   before any provider write.

One draft turn plus one bulk approval is appropriate because each release is a
complete typed transition, not because the system has silently auto-approved an
ordered plan. Retain partial failures and their exact reasons in the terminal
summary; never blindly retry an ambiguous provider mutation.

## Transcript and viewer package

Examples:

- “Summarize this talk with timestamped evidence.”
- “Give me detailed YouTube chapters, pull quotes, and potential titles.”
- “Find the best three clips about evals.”

1. resolve the exact owned video and account;
2. list caption tracks and select a serving requested-language track;
3. download VTT through the official API;
4. normalize timed segments and retain the exact caption/video IDs;
5. run the requested prompt from
   [transcripts.md](transcripts.md);
6. render summaries as normal thread text and structured moment lists as native
   Slack tables;
7. deep-link timestamps to the exact video;
8. keep any proposed description/chapter update as a separate reviewed write.

Caption downloads and derived analysis are read-only and need no apply button.
If no usable caption exists, report that state and stop; do not silently invoke
media download, Whisper, or an unofficial scraper.

## Moderation queue

Example:

> Summarize held comments, draft replies, and propose the obvious moderation
> actions.

Return a table of exact comment IDs, text, author, video, recommendation, and
effect. Keep separate approvals for:

- publish;
- reject;
- reject and ban;
- reply;
- edit/delete channel-owned comment.

Rejecting hides the thread's replies. Rejected comments may not be listable
later. Surface those consequences in the card.

## Live operations

Promote:

- schedule/configure broadcast;
- create/bind stream;
- update title/description/privacy;
- transition to testing/live/complete;
- manage chat moderators/bans/messages;
- insert cuepoint or supported midroll setting.

Require fresh state and prominent consequences for transitions, deletion,
bans, or ad breaks. Stream/broadcast state can make previously valid edits
illegal; always refetch at apply.

## Raw mode

Example:

```text
/aiebot youtube raw playlists.update
account: ai_engineer
part: snippet,status
id: PL...
body: { ... }
```

Normalize the request through the registered method, fetch the resource, and
render the same proposal card. Raw mode changes input ergonomics, not execution,
auth, audit, drift, or verification semantics.
