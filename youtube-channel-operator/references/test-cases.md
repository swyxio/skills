# Test cases

Use this matrix while building or reviewing a YouTube channel operator.

## Account and OAuth

- Correct account grant resolves the configured channel ID.
- Wrong/default Brand Account channel fails closed.
- One channel's token cannot act on another account key.
- Revoked/expired refresh token produces reauthorization state, not a blind retry.
- Ordinary service-account credentials are rejected.
- Testing-mode token expiry is surfaced.

## Raw registry

- Every documented supported method has a typed registration.
- Unknown method IDs fail.
- Arbitrary URL, host, headers, token, or execute-bypass input fails.
- Raw and guided forms normalize to the same provider request.
- Exact channel/resource ownership is checked before draft and apply.

## Metadata reads

- Exact-ID video metadata lookup returns the complete default description beyond
  any discovery excerpt limit.
- Missing text in `descriptionExcerpt` triggers a targeted full metadata read
  before the agent reports it absent.
- Multi-video detail reads preserve requested ID order and batch within the
  provider and application's shared 50-ID page limit.
- Exact-ID sets larger than 50 expose stable pagination metadata and do not
  refetch earlier pages.
- Every selected page returns complete descriptions without a second
  row-omission or silent description-truncation mechanism.
- Non-public or cross-channel resources follow the operator's delivery policy
  and never leak through a public result.

## Captions and transcripts

- Raw `captions.list` and `captions.download` are registered typed methods.
- Transcript lookup verifies the pinned account, channel, and exact owned video.
- Owner-authorized public, private, and unlisted videos are not filtered by
  visibility after ownership verification.
- Explicit caption ID requires that exact track.
- Default selection prefers a serving requested-language standard track, then
  requested-language ASR.
- Syncing, failed, forced-only, wrong-language, and ambiguous tracks return
  explicit states rather than guessed transcript text.
- VTT parsing preserves cue start/end time and removes styling and rolling-ASR
  duplicate prefixes without deleting new words.
- Cache identity includes caption ID and `lastUpdated`; caption changes
  invalidate derived artifacts.
- `no_captions` stops without media download, Whisper, public-page scraping, or
  a fabricated summary.
- Long talks use timestamp-window retrieval or map-reduce rather than injecting
  the entire transcript into every model turn.
- Viewer chapters start at `0:00`, contain only ascending starting times, include
  at least three sections, and keep sections at least 10 seconds long.
- Pull quotes are verbatim, timestamped, and distinguish uncertain ASR text.
- Potential titles cite the timestamped transcript evidence that supports them.
- A generated chapter list does not mutate the video description until a
  separately reviewed `videos.update` action is approved.

## Update replacement semantics

- Description-only edit retains title, category, tags, language, and other
  mutable `snippet` fields.
- Playlist title edit retains description/status.
- Playlist-item reorder retains playlist/resource IDs and offsets.
- Omitted values are deleted only when the reviewed patch explicitly requests it.
- Unsupported or inconsistently documented mutable fields require a canary.
- Scheduled release sends the complete preserved `status` with
  `privacyStatus: private` and a future canonical UTC `publishAt` in one write.
- Private, never-published owned uploads may be scheduled. Unlisted sources
  remain canary-only until the exact one-write transition is verified for the
  target channel; already-public, missing, and cross-channel videos fail before
  approval.

## Proposal and concurrency

- Draft persists exact request, before state, ETag, actor, and idempotency key.
- Apply sends exactly the reviewed request.
- Resource changed after draft → conflict, no silent rebase.
- Double-click and duplicate Slack delivery execute once.
- Expired/rejected/applied proposals cannot execute.
- Scheduled-release drafts reject extra patch fields and non-canonical/past
  timestamps; approval-delay expiry sends no provider write.
- Unauthorized approver fails closed.
- Actual human proposer/approver appears in audit.

## Reconciliation

- Successful update is refetched and compared.
- Scheduled-release readback requires `privacyStatus: private` and an equivalent
  `publishAt` instant, not byte-identical timestamp formatting.
- Timeout after dispatch reconciles current resource before retry.
- Playlist add retry does not duplicate membership.
- Playlist removal uses playlist-item ID.
- Resumable upload survives worker restart and retains asset checksum.
- Thumbnail/caption retry uses immutable asset identity.
- Delete retry-time 404 is accepted only after a dispatched attempt.
- Partial multi-step package reports every completed/failed step.

## Slack

- Event and interactivity signatures use raw bodies.
- Events and button clicks acknowledge within three seconds.
- Proposal cards show account, exact resource, before/after, method, parts,
  side effects, and deep link.
- Button payload contains only opaque proposal ID.
- Card resolves in place for applied/rejected/conflicted/failed.
- Long descriptions link to a durable full diff.
- Public output excludes tokens, headers, unpublished content not approved for
  display, and raw provider errors.

## Guided workflows

- Metadata + thumbnail + comment + playlist package lowers to raw methods.
- Top-level comment workflow does not claim literal first or pinned status.
- Pin action produces Studio/watch handoff and owning-surface verification.
- Native A/B workflow never calls title/thumbnail API while running.
- Sequential rotation is labeled observational.
- Playlist sync previews adds/removes/reorders and handles duplicates.
- Upload begins private/unlisted according to the reviewed request.
- Scheduled-release batches render local-time cadence plus canonical UTC times,
  use one `videos.scheduleRelease` draft per unpublished owned video, make no
  Premiere claim, and leave a separate terminal audit outcome for every item.
- Moderation card explains reject/ban consequences.
- Live transition refetches broadcast/stream state immediately before apply.

## Analytics

- Change marker records exact apply time and changed fields.
- Baselines use complete finalized days.
- Missing/delayed reports remain pending, not zero.
- Checkpoints run at first complete day, 7 days, and 28 days.
- Reach data supplies impressions and CTR.
- Per-day normalization is correct.
- Traffic-source mix and overlapping changes are disclosed.
- Native experiment arms/winner are never invented from API data.
- Report labels correlation versus causality.

## Multi-channel and runtime proof

- Every channel has an isolated grant, secret namespace, and exact ID.
- Every runtime that reads or writes YouTube has only its intended credentials.
- Deploying one runtime does not imply the other is current.
- Live canaries independently prove API read, reversible write, readback, Slack
  approval, audit row, and analytics checkpoint for each channel.
