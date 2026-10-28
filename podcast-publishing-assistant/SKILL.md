---
name: podcast-publishing-assistant
description: Prepare podcast and interview publishing assets, including episode write-ups, chapters, transcripts, title and thumbnail angles, and X promotion; assemble or update podcast posts and verify authorized release states. Resume existing episode assets rather than restarting production.
---

# Podcast Publishing Assistant

Use this skill for editorial packaging and platform handoff. Apply `swyx-writing`
to summaries, titles, descriptions, show notes, newsletter and social copy, not
verbatim transcripts or speaker labels. Preserve the user's wording and existing
draft edits when revising their work.

## Resume the episode

Start from the current assets and requested deliverables. Reuse approved copy,
transcripts, overlay research and media rather than restarting acquisition or
transcription. Keep a compact handoff in the existing episode record: current
master/version, source-to-output edit map when cuts exist, approved angle and
cover, platform IDs/URLs, verified release states, and remaining work. Do not
create another tracking system for an episode that already has one.

Route missing source acquisition to the relevant download skill and ASR to
`transcribe-anything`. Prefer source audio; use platform captions only for an
explicitly requested rough pass. Anonymous speaker labels are not named-person
identification; mark uncertain attribution rather than claiming verified
speakers. Route pacing, commentary cleanup and overlays to
`annotated-video-production`, explanatory motion to `animated-annotations`, and
LS thumbnail artwork to `latent-space-thumbnail-director`. Publishing consumes
the approved edit and its timing; it does not silently make new editorial cuts.

Produce the requested assets. A full launch request can include a write-up,
chapters, title/hook alternatives and social copy; clips and quote cards belong
in the pack when requested or useful to the launch, not as obligatory filler.
Continue independent preparation while an editorial choice is pending.

## Editorial packaging

For a new YouTube episode, offer at least four distinct title angles paired with
thumbnail hooks in a scannable table, unless the user specifies another count.
Recommend one and briefly argue against each, including when it overweights a
minor segment. Wait for selection before applying either unless the user has
already chosen or delegated the choice. Do not reopen an approved choice merely
because work resumes.

Favor a specific thesis and guest credibility over vague promises. For recurring
series, put the series identity first. Use thoughtful sentence-case or title-case
thumbnail hooks rather than all-caps slogans; a concise company/role or verified
milestone can add context. Attribute guest claims. Distinguish the subject from
why it matters now, and use concrete mechanisms and takeaways for technical
audiences. Write one coherent description by default; provide alternatives when
requested rather than several near-duplicates.

Align the transcript and chapters to the final edit, including commentary,
cold open, intro and cuts. Use the edit map and verify against media or a
synchronized transcript; do not publish guessed timestamps. Approximate times
are draft-only until checked. Default chapter format: start time followed by a
2–10 word headline, such as `0:00 Intro and origin story`. Use normal text, not
oversized headings. When an edit changes, revise affected timing and dependencies
instead of assuming every chapter shifts by one constant offset.

## Latent Space podcast posts

Prepare the podcast post or episode in the platform the user names: Substack or
Beehiiv. If an existing draft identifies the destination, resume there. Do not
create a duplicate on the other platform. Treat the newsletter post, podcast
episode/feed, YouTube video, and X post as separate release surfaces: check their
actual states and keep each draft, private, unlisted, scheduled, or published
only as authorized. Saving a draft on one surface does not prove another is
unpublished.

Use the approved final edit's audio (MP3), a substantive, episode-specific
write-up, the full transcript, and an embedded video when available. Set the
audio-player or episode cover to the approved video thumbnail when supported;
adapt its crop to the platform without distorting faces or text. Preserve any
existing user edits when revisiting a draft. Confirm that a private or unlisted
video embed will be accessible to its intended audience before release.

Before the transcript, add relevant show notes as a bulleted list, each with a
short description and a verified link to the guest, company, or material actually
discussed or used in the edit. Reuse overlay research and source manifests rather
than dumping every asset. Follow show notes with chapter timestamps, then the
transcript. Use start times and concise descriptive headlines; confirm timing
against the final edit. Keep the transcript aligned to that edit, including its
cold open and requested cuts, and label automated text appropriately. Render
timestamps as normal readable text, not oversized headings.

In Substack, verify the intended post, audio attachment and cover, video embed,
and draft or published state. In Beehiiv, verify the intended publication and
podcast episode, audio attachment and cover, and separately check the newsletter
post and feed release state where applicable. Do not assume a post draft keeps an
episode off the RSS feed. After replacing audio, verify the saved media by
filename and duration or playback; a completed upload alone is not proof that
the replacement is active. If a cut changes the episode, update and verify the
transcript, chapters, embed and related promotional links against the new edit.
Preserve the old media locally, and report any unverified replacement or stale
material rather than treating it as ready to release.

## X promotion

- Offer at least four distinct hook/post directions when choosing a new launch angle, unless the user specifies otherwise. Recommend one and explain each option's weakness; do not repeat selection after the user chooses or delegates it.
- Ground angles in the write-up and specific released moments. Supply verified source timestamps for review, distinguish guest arguments from established facts, and lead with a substantive idea, mechanism or tension. Name/tag verified guest accounts and relevant roles; make episode links easy to find. Preserve series identity first where applicable.
- For full native-video launches, use the approved full episode, put verified chapter timestamps in the **same main post as the video**, and include the domain and YouTube links. Use a long post when supported; check that timestamps match the uploaded edit and are clickable. Do not move them to a reply just to shorten the post. If a platform limit prevents this, explain the limitation; a reply is not equivalent.
- Use replies for additional context or links. For clip promotion, choose a useful opening with accurate captions that works without sound; offer a link-led alternative when helpful. Choose the format for the user's goal, not a claimed universal algorithm preference.
- When clip or quote-card ideas are requested, supply concrete moments, why they work, and verified or explicitly provisional time windows; verify quoted words against the source.

### Promo research

- Research recent, comparable podcast announcements from the user's followed accounts when available. Confirm which account's follows a filter uses. Note the hook, format, guest attribution, date and observable metrics alongside links; treat the sample and visible engagement as descriptive, not causal proof of reach, clicks, or listening. Account for age and audience differences, and test formats against actual goals. X's own guidance on [notifications](https://help.x.com/en/resources/recommender-systems/notifications-recommendations) describes personalized signals for that surface; its [traffic guidance](https://help.x.com/en/business-and-advertising/optimizing-website-traffic-campaigns) concerns ads, not a guaranteed organic ranking formula.
- For concrete examples and their tradeoffs, consult [X podcast promo inspiration](references/x-podcast-promo-inspiration.md). Refresh examples as needed, and use them to develop varied, episode-specific options rather than copying a formula.

## Existing helper

`scripts/transcribe_youtube.sh` is available for YouTube audio acquisition and
Whisper transcription. Inspect its suitability before use; `transcribe-anything`
owns current ASR choices and recovery rather than duplicating them here.
