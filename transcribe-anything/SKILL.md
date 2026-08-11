---
name: transcribe-anything
description: Transcribe a local audio/video file or an explicitly supplied media URL, with optional timestamps, speaker diarization, or a requested output format. Use for transcription and speech-to-text work; do not trigger for downloading media alone, summarizing an existing transcript, or editing unrelated audio.
license: MIT
compatibility: Requires ffmpeg and one available ASR backend. Cloud backends require environment-held API keys. Long diarization on local CPU requires explicit opt-in.
metadata:
  author: swyxio
  version: "1.1"
  last-updated: "2026-06-13"
  primary-tools: ffmpeg, a local or hosted ASR backend
---

# Transcribe Anything

Choose the smallest reliable pipeline for the requested output. First identify
the source, language, duration, whether speaker labels or word timestamps are
needed, the destination format, and whether local processing or a hosted
service is acceptable.

## Safety and privacy

- Keep provider keys in environment variables or a secret manager; never put
  them in commands, transcripts, generated scripts, or logs.
- Tell the user before uploading media to a hosted service and preserve the
  source locally unless cleanup was requested.
- Do not run long diarization on a laptop CPU by default. Prefer a configured
  managed service or GPU; ask before an expensive or resource-heavy fallback.
- Speaker diarization produces anonymous clusters. Do not claim a cluster is a
  named person without evidence from the recording or user-provided mapping.
- Treat a failed diarization as failed. Inspect label counts and sample early,
  middle, and late sections before delivering speaker-labeled output.

## Backend choice

Use what is already installed or explicitly configured. As a default:

- local transcription: an Apple-Silicon- or CUDA-appropriate Whisper backend;
- long local files: a backend with VAD/silence skipping and bounded memory;
- hosted transcription: the provider the user selected or already configured;
- diarization with a provider key: a provider with native speaker labels;
- diarization from an existing transcript: a dedicated GPU/cloud diarizer whose
  speaker turns can be aligned to ASR segments; and
- no-key diarization: a locally installed GPU-capable diarizer, only after
  confirming the runtime is available.

Verify the chosen package and current API/CLI contract before installing or
running it. Do not install every backend listed in an old guide.

## Minimal workflow

1. Resolve a URL with the download workflow or the user's approved downloader;
   do not treat an inaccessible/private URL as a transcription failure without
   reporting the acquisition problem.
2. Inspect duration, codec, channels, and sample rate with `ffprobe`.
3. Normalize only when the selected backend needs it. A common speech input is
   mono, 16 kHz PCM WAV:

   ```bash
   ffmpeg -i input.mp4 -vn -ac 1 -ar 16000 -acodec pcm_s16le output.wav
   ```

   Preserve the original and record any trimming or channel selection. If each
   speaker has a separate track, transcribe tracks independently and merge by
   timestamps instead of diarizing them again.
4. For long inputs, use the backend's VAD when it is reliable. For hosted APIs,
   check the current upload limit, compress or split at safe boundaries, and
   carry each chunk's start offset into the merged timestamps. Do not assume a
   provider's old size limit.
5. Transcribe with the selected language/model settings. For long Whisper-like
   runs, disable cross-window conditioning when the backend documents it as a
   protection against repetition cascades.
6. If diarizing, align speaker turns to word/segment timestamps. Keep raw
   diarization output when it is useful for review and name speakers only with
   evidence.
7. Render the requested format (plain text, Markdown, SRT, VTT, JSON, or TSV),
   retaining source timestamps and clearly stating the backend/model used.

## Output and QA

For Markdown, group text into readable paragraphs with periodic timestamps;
avoid a heading for every short segment. Preserve uncertainty and unintelligible
spans rather than inventing words. Custom vocabulary or prompt hints are useful
for names, products, and jargon, but cannot guarantee correct recognition.

Before delivery, check that:

- the transcript covers the full duration or reports omitted chunks;
- chunk offsets do not reset timestamps;
- requested language, timestamps, and format are present;
- speaker labels are not collapsed onto one speaker in a known conversation; and
- no secret, private URL, or raw provider error leaked into the output.

## Common recovery choices

- Repeated phrases: inspect silence/music and disable cross-window conditioning
  or use VAD; do not silently return the corrupted text.
- Poor speaker separation: verify audio quality and known speaker count, then
  change to a real diarizer or keep an unlabeled transcript.
- Memory/runtime failure: choose a smaller model, VAD, chunking, or a GPU/cloud
  path and state the tradeoff.
- Inaccurate word times: use a backend with forced alignment and report that
  segment-level times are approximate when that is all the source supports.

Do not conflate this workflow with transcript summarization, chapter creation,
or media download; hand those stages to the narrowest matching skill.
