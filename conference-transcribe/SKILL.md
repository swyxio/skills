---
name: conference-transcribe
description: Split a supplied multi-talk conference livestream or long video into per-talk transcripts using source chapters/captions, with audio transcription and optional LLM cleanup when needed. Use when separate talk boundaries and timestamped outputs are required; use transcribe-anything for one undivided recording.
license: MIT
user_invocable: true
argument-hint: <video-url-or-file>
compatibility: Requires ffmpeg, a downloader for remote sources, one transcription path, and an optional LLM for cleanup.
metadata:
  author: swyxio
  version: "1.0"
  last-updated: "2026-04-10"
  primary-tools: yt-dlp, ffmpeg, captions or an ASR backend
---

# Conference Transcribe

Produce a manifest and one timestamped Markdown transcript per talk. Prefer
source-provided chapter metadata and captions; use ASR only for missing or
insufficient segments.

## Workflow

1. Inspect the URL/file, permissions, duration, chapters, available caption
   languages, and desired output directory. Do not download the full video if
   metadata/captions are sufficient.
2. Fetch metadata and captions without media when possible. Treat chapter
   boundaries as a starting point: check for untitled breaks, overlaps, and
   missing final ends before creating `talks.json`.
3. For each talk, select caption cues within the absolute time range, remove
   only overlapping duplicate cue text, and retain both absolute and talk-
   relative timestamps.
4. If captions are missing, download audio or the requested clip, convert only
   as needed, split at the manifest boundaries, and carry each segment offset
   into the final timestamps. Check the current upload limit before sending
   compressed audio to a hosted backend.
5. Optionally clean the raw transcript with an LLM. Correct obvious proper
   nouns only when the source, title, slides, or user provides evidence; do not
   rewrite the speaker's meaning. Mark model-cleaned text and retain raw output.
6. Write the manifest, raw transcripts, cleaned transcripts, and optional clips
   using stable slugs. Verify every talk is covered exactly once and that
   timestamps remain within the source duration.

## Output shape

```text
talks.json
transcripts/raw/<talk-slug>.md
transcripts/cleaned/<talk-slug>.md   # only when cleanup was requested
clips/<talk-slug>.*                  # optional
```

Each transcript should include the source, talk range, duration, transcript
source (captions or ASR backend), readable timestamp sections, and uncertainty
notes. Do not assign named speakers from anonymous diarization without evidence.

## Safety and recovery

- Keep API keys and browser cookies out of commands, output, and logs.
- Tell the user before uploading private media or captions to a hosted service.
- Process remote/API work in bounded batches, preserving completed artifacts;
  do not restart the entire event after one talk fails.
- If the source has no reliable chapters, report the boundary ambiguity and ask
  for a manifest or use clearly labeled inferred boundaries.

Do not rely on this file for current provider models, size limits, concurrency
limits, or CLI flags; retrieve them at action time.
