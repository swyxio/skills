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
  last-updated: "2026-08-11"
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

## Selective references

Load only the supporting material needed for the current source or failure:

- [references/aie-europe-2026.md](references/aie-europe-2026.md) for the event
  narrative, what worked, what failed, and why the caption-first strategy won;
- [references/backends-and-setup.md](references/backends-and-setup.md) when
  selecting or configuring captions, hosted ASR, or local Whisper, including
  dated provider/model/limit observations and installation recipes;
- [references/command-recipes.md](references/command-recipes.md) for copyable
  metadata, caption, audio, segment, compression, and clip commands;
- [references/manifest-vtt-and-batching.md](references/manifest-vtt-and-batching.md)
  when implementing chapter parsing, VTT overlap removal, timestamp offsets,
  manifests, or bounded concurrency; and
- [references/output-templates-and-cleanup.md](references/output-templates-and-cleanup.md)
  for raw/cleaned Markdown templates and the transcript-cleanup prompt.

Do not load every reference for a routine caption split. Historical provider
limits, model names, package versions, and observed concurrency are starting
points only; verify current documentation and the installed CLI before acting.
