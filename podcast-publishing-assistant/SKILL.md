---
name: podcast-publishing-assistant
description: Draft or update podcast write-ups, chapters, title/hook options, show notes, and X promotion; prepare podcast posts and verify requested release states. Not standalone ASR, video editing, or thumbnail artwork.
---

# Podcast publishing assistant

Resume the existing episode and requested deliverables, reusing approved media,
copy, transcripts and overlay sources. Preserve user edits. Keep the current
master/version, edit map, approved angle/cover, destination IDs and release states
in the existing episode record, not a second tracking system.

Use `swyx-writing` for editorial copy, not verbatim transcripts or speaker labels.
Route missing ASR to `transcribe-anything`, edits and annotations to
`annotated-video-production`, and LS artwork to `latent-space-thumbnail-director`.
Prefer source audio; captions serve an explicitly requested rough pass. Anonymous
ASR labels do not establish named identities. Publishing consumes the approved
edit; it does not silently introduce editorial cuts.

## Choose the angle

For a new YouTube package or X launch angle, offer at least four distinct options
unless the user specifies otherwise. Pair YouTube titles with thumbnail hooks;
recommend one and briefly argue against each, including overemphasis on a minor
segment. Apply the user's selection or delegated choice; do not reopen it on
resume. Continue independent copy and chapter work while a choice is pending.

Prefer specific theses and mechanisms over vague promises. Keep recurring series
identity first. Thumbnail hooks should be thoughtful sentence/title case, with a
concise role, company or verified milestone where useful. Attribute guest claims.
Write one coherent description by default; alternatives, clips and quote cards
are optional unless requested, not mandatory launch-pack filler.

## Timing and source fidelity

Align chapters and transcript to the approved edit, including commentary, intro,
cold open and cuts. Use the edit map and verify against media or a synchronized
transcript. Do not assume a revision shifts every timestamp by one constant.
Approximate times are draft-only until verified. Format chapters as start time
plus a 2–10 word headline, in normal text rather than headings:
`0:00 Intro and origin story`. Verify quoted words and named speakers; identify
automated transcript uncertainty without rewriting it into polished commentary.

## Podcast post and media

Resume the named platform or existing draft, whether Beehiiv or Substack. For a
complete podcast post, use the approved MP3, episode-specific write-up, full
transcript and available video embed. Use the approved thumbnail as episode cover
when supported, adapting the crop without distorting faces or text.

Before the transcript, place bulleted show notes with a short description and
verified link for each relevant guest, company or source. Reuse research from
the edit selectively. Order: show notes → chapters → transcript.

Verify the exact destination publication/post/episode, saved audio and cover,
embed and requested visibility. **Newsletter post, podcast/RSS episode, YouTube
and X have independent release states.** A Beehiiv post draft does not prove the
episode is absent from RSS. Keep each unpublished, scheduled or live only as
authorized, and confirm video embeds are accessible to their intended audience
before release.

After media replacement, verify the saved attachment by filename and duration or
playback; upload completion alone is insufficient. Preserve prior media locally.
Update affected transcript, chapters, embed and promo links to the new edit;
report stale or unverified dependencies instead of calling the package ready.

## X promotion

Ground each angle in the episode write-up and specific moments, supplying verified
source timestamps for review. Lead with a concrete idea, story or tension and tag
verified guest accounts with relevant roles. Use the angle-selection rules above.

For a full native-video launch, attach the approved episode, put verified chapters
in the **same main post as the video**, and include domain and YouTube links. Use
a long post when supported; check timestamps against that uploaded edit and their
clickability. Replies can carry extra context, but are not equivalent to chapters
beside the video. Explain actual platform limits rather than silently moving them.

For clips, choose a useful opening and accurate captions that work without sound.
Offer link-led alternatives when helpful. When requested, provide clip windows
and quote-card candidates with their editorial rationale; mark provisional timing.

For inspiration, consult [X examples](references/x-podcast-promo-inspiration.md)
or research comparable announcements from followed accounts. Confirm whose follows
a filter uses. Treat visible views/likes as descriptive, not proof of listens or
causal evidence for a format; account for post age and audience differences.
Do not make fresh inspiration research a prerequisite to an already chosen post.

## Finish at the requested state

Deliver the requested copy, draft or authorized publication, with destination links
and verified state where applicable. Do not expand a single deliverable into an
entire launch pack or treat a draft as permission to publish.

The existing `scripts/transcribe_youtube.sh` helper remains available for audio
acquisition/transcription; inspect suitability before use. `transcribe-anything`
owns current ASR choices and recovery.
