# AIE Europe Day 1 transcription — April 2026 field notes

Read this reference when choosing an approach for a new multi-hour conference
source, diagnosing why a seemingly sophisticated ASR path is slower than the
source captions, or preserving the incident history behind this skill. These
are observations from one April 2026 event workflow, not universal provider or
hardware claims.

## Situation

The source was a roughly seven-hour conference livestream containing multiple
talks. The desired artifact was not one giant transcript: it was a talk manifest,
one timestamped Markdown file per talk, optional clips, and a readable cleanup
pass that retained raw source evidence.

The initial instinct was to download all audio and run a modern Whisper variant.
The faster path turned out to be using the platform's chapter metadata and
English automatic captions as the primary evidence, then applying ASR only to
gaps.

## What worked

1. **Captions before ASR.** The YouTube English automatic-caption VTT was
   immediately available, avoided a multi-hour media download and model setup,
   and was adequate as the raw transcript source once overlapping cues were
   deduplicated.
2. **Metadata-only acquisition.** `yt-dlp --write-info-json --skip-download`
   produced structured chapter data without fetching the video. This was more
   reliable than reparsing prose when chapters were present.
3. **Description timestamps as a fallback.** When chapter metadata needed
   correction, timestamp lines in the description supplied useful event intent
   for talk boundaries.
4. **Two-pass output.** A deterministic VTT pass retained timestamps and source
   wording; an optional LLM pass improved paragraphs, obvious proper nouns, and
   readability without replacing the raw artifact.
5. **Talk-level artifacts.** Splitting by manifest boundaries made failures
   resumable, allowed selective re-transcription, and avoided rerunning the
   entire event.
6. **Section downloads.** `yt-dlp --download-sections` was useful for optional
   per-talk clips without downloading every stream rendition.
7. **Low-bitrate Opus for hosted ASR.** Mono 16 kHz Opus at a historical 32
   kbit/s target substantially reduced uploads while remaining suitable for
   speech recognition in that run.

## What did not work well

### Installing local Whisper on a fresh Mac

The setup path consumed more time than caption extraction:

- system Python rejected ordinary package installation under PEP 668;
- an isolated `uv` environment was needed;
- large MLX model downloads were slow and could be throttled without an
  authenticated model-host account; and
- CPU transcription with `faster-whisper` was unattractive for seven hours of
  audio.

This does not mean local Whisper is generally poor. It means “install a local
stack from scratch for one already-captioned source” had a bad time-to-result.

### Parallel local inference on Apple Silicon

Concurrent MLX jobs contended for the same GPU and did not provide the expected
throughput gain. Sequential local segments were more predictable. Hosted APIs
had a different concurrency envelope and benefited from a small bounded worker
pool.

### Uncompressed WAV uploads

Mono 16 kHz PCM WAV was observed at roughly 1.9 MB per minute. A thirty-minute
talk therefore approached 57 MB, exceeding the 25 MB hosted-upload limits used
in that workflow. Opus/Ogg compression or smaller chunks solved the transport
problem.

### Discovering missing credentials after segmentation

The hosted path was unusable without the appropriate API key. Backend
availability and upload consent should be established before spending time
preparing every segment.

## Operative decision path from the event

```text
Reliable source captions and boundaries?
  yes → parse captions, retain raw VTT-derived transcript, optionally clean
  no  → approved hosted ASR already configured?
          yes → compress/split to the provider's currently verified limits
          no  → capable local ASR already installed?
                  yes → run bounded local segments, usually sequential on one GPU
                  no  → ask before installing or uploading; do not improvise a backend
```

The key lesson was not “always use YouTube captions.” It was: inspect the
highest-quality source evidence already available before creating a large media
and model pipeline.

## What should remain event-specific

- speaker/title corrections derived from this event's schedule;
- break names and room transitions;
- the exact seven-hour duration;
- package/model performance on the machine used that day; and
- the provider limits observed in April 2026.

Those details are evidence for decisions, not constraints on every conference.
Current provider baselines and setup recipes are separated into
[backends-and-setup.md](backends-and-setup.md).
