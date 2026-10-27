---
name: podcast-publishing-assistant
description: Transcribe long-form audio, YouTube videos, podcasts, interviews, or panels; summarize them; extract chapter markers; and draft publishing assets like titles, YouTube descriptions, show notes, and tweet/X copy. Use when a user shares a YouTube link or audio/video file and asks for transcription, diarization, summaries with timestamps, chapter markers, show notes, titles, descriptions, promo copy, or social posts. Especially use for Whisper-based workflows, source-audio-first podcast processing, and any request to turn a recorded conversation into publishable assets.
---

# Podcast Publishing Assistant

Use this skill for podcast or interview publishing workflows.

Apply `swyx-writing` to summaries, titles, descriptions, show notes, newsletter
blurbs, and social copy. Do not apply it to verbatim transcripts or speaker
labels. This skill owns transcription, timing, chapter, and publishing-pack
requirements.

## Core rules

- Prefer source audio over platform captions.
- Do not rely on YouTube captions unless the user explicitly asks for the fastest possible rough pass.
- For Whisper or API transcripts, be honest about uncertainty. Do not claim true diarization unless the tool actually produced it.
- If the user has a formatting preference, preserve it exactly on later turns.
- For a new YouTube episode, offer at least four distinct title angles and thumbnail hooks for swyx to choose from in a scannable table. Recommend one and briefly argue against each option, including when a hook overweights a minor part of the episode. Wait for his selection before applying either, unless he explicitly asks you to choose. Favor specific, substantive concepts over vague or clickbait titles. Prefer thoughtful sentence-case thumbnail copy and allow a concise role, company, or verified milestone where useful; attribute guest claims. Continue independent description and chapter work.
- Favor thoughtful, specific sentence-case or title-case thumbnail hooks over all-caps slogans. Where relevant, propose a genuine, verified guest post or a concise arrow label with the guest’s company and role.
- Default chapter output for swyx: YouTube timestamp format only, start times only, followed by a 2 to 10 word headline.

## Workflow

1. Fetch source audio first.
   - For YouTube URLs, use `yt-dlp` to extract audio.
   - Prefer MP3 output for compatibility.

2. Transcribe with a fallback ladder.
   - First try the OpenAI Whisper API when `OPENAI_API_KEY` is available.
   - The OpenAI audio transcription upload cap is about 25 MB. Expect long episodes to exceed it.
   - If the file is too large, compress before retrying, for example mono 16 kHz MP3 around 32 kbps.
   - If API transcription still fails, fall back to local Whisper.
   - If a script exists but is not executable, invoke it with `bash` rather than failing on permissions.

3. Keep the user updated during long jobs.
   - Brief progress notes are enough: downloading, compressing, transcribing, packaging.
   - If a fallback happens, say what failed in one line and continue.

4. Produce the publishing pack.
   - Summary tuned for someone deciding whether to watch or listen.
   - Key takeaways or key arguments.
   - 5 title ideas when asked.
   - 5 description ideas when asked.
   - Chapter timestamps.
   - Optional: tweet thread, show notes, key quotes, newsletter blurb.

5. Package timestamps correctly.
   - Prefer real timestamps if the transcription source provides segments.
   - Align chapters to the released edit, including cold open, intro, and any cuts. Check the media or a synchronized transcript; do not publish guessed timestamps. If only approximate times are available, label them as draft and verify before publishing.
   - For swyx, default to this exact style:
     - `0:00` Intro and origin story
     - `3:30` How the brand grew

## Transcript quality notes

- OpenAI Whisper API often returns plain text unless a segment-rich response format is requested elsewhere.
- Plain text transcripts are good for summaries and rough chapters, but weak for precise diarization.
- When speaker labels are needed without true diarization, reconstruct heuristically from turn-taking and identify this clearly as approximate.

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

## Launch template

When a user wants publishing help, default to a reusable launch pack.

### Standard launch pack

1. YouTube titles
   - Provide 3 to 4 options.
   - Prefer thesis first, guest second.
   - Keep them specific, not generic.

2. YouTube descriptions
   - Provide 3 to 4 options.
   - Each should include:
     - one short framing paragraph
     - 3 to 6 concrete bullets on what the audience will learn
     - chapter markers in YouTube timestamp format when available

3. X main post
   - Provide at least 4 distinct hook and post directions for the user to choose or mix; recommend one and briefly explain each option's weakness. Do this before posting unless the user explicitly chooses or delegates the choice.
   - Ground each angle in the write-up and specific moments in the released episode. Include a source timestamp for review, verified against the released edit, and distinguish a guest's argument from an established fact.
   - Lead with a substantive idea, surprise, mechanism, or real tension; name the guest and relevant role, and make the episode link easy to find. Use concrete takeaways where they help, without forcing every post into a bullet-list template.
   - For a recurring series, put its identity first, then make the episode's particular idea or tension clear.
   - When a relevant clip exists, offer a native-video direction that makes sense without sound, with accurate captions and a useful opening. Offer a link-led alternative; choose formats for the user's goal rather than claiming a universal algorithm preference.
   - When publishing the full episode as native X video, put the verified chapter timestamps in the same main post as the video, so viewers can click them to navigate it. Use a long post when the account supports it; do not move chapters to a reply merely to shorten the post. Confirm the timestamps match the uploaded edit and check that X makes them clickable.

4. X follow-up reply
   - Use replies for additional links or context when useful. If the main post cannot accommodate chapters, explain the limitation and offer a fallback; a reply is not equivalent to timestamps alongside the embedded video.
   - Format chapter timestamps as start times only, with 2 to 10 word headlines.

5. Native clip ideas
   - Provide 3 to 4 options.
   - For each clip idea, include:
     - clip theme
     - why it works as promo
     - rough timestamp window if known

6. Quote card ideas
   - Provide 3 to 4 options.
   - Prefer clean, arguable lines with strong standalone meaning.

### Packaging guidance

- Distinguish between:
  - what the episode is about
  - why it matters now
- Prefer concrete bullets over abstract topic labels.
- For X, optimize for curiosity plus utility, not just announcement tone.
- For YouTube, optimize for searchable thesis plus guest credibility.
- If the audience is technical, specificity beats hype.
- Research recent, comparable podcast announcements from the user's followed accounts when available. Confirm which account's follows a filter uses. Note the hook, format, guest attribution, date and observable metrics alongside links; treat the sample and visible engagement as descriptive, not causal proof of reach, clicks, or listening. Account for age and audience differences, and test formats against actual goals. X's own guidance on [notifications](https://help.x.com/en/resources/recommender-systems/notifications-recommendations) describes personalized signals for that surface; its [traffic guidance](https://help.x.com/en/business-and-advertising/optimizing-website-traffic-campaigns) concerns ads, not a guaranteed organic ranking formula.
- For concrete examples and their tradeoffs, consult [X podcast promo inspiration](references/x-podcast-promo-inspiration.md). Refresh examples as needed, and use them to develop varied, episode-specific options rather than copying a formula.

## Output format

Default output order:
1. Short summary
2. Key takeaways
3. Chapter timestamps
4. 3 to 4 title options
5. 3 to 4 description options
6. 3 to 4 X post options
7. 3 to 4 clip ideas
8. 3 to 4 quote card ideas

## Scripts

- `scripts/transcribe_youtube.sh`: download audio from YouTube, shrink oversized audio for Whisper API, and fall back cleanly.

## Notes

- Prefer speed first, but do not fake certainty.
- If a transcript path is broken, say what failed and continue with the next fallback.
- For long episodes, give the user a progress update before the final packaging pass.
- If the user says a format like “always give me YouTube timestamp format”, treat that as a sticky preference for the rest of the task.
