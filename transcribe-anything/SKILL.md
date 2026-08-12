---
name: transcribe-anything
description: Transcribe a local audio/video file or an explicitly supplied media URL, with optional timestamps, speaker diarization, or a requested output format. Use for transcription and speech-to-text work; do not trigger for downloading media alone, summarizing an existing transcript, or editing unrelated audio.
license: MIT
compatibility: Requires ffmpeg and one available ASR backend. Cloud backends require environment-held API keys. Long diarization on local CPU requires explicit opt-in.
metadata:
  author: swyxio
  version: "1.1"
  last-updated: "2026-08-11"
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

## Curated backend recommendations (deliberate research shortcut)

This section is intentionally broader than the minimal workflow. It saves the
backend-comparison and setup research that otherwise gets repeated on every
transcription task. Treat provider models, prices, and limits as a snapshot
checked on **2026-08-11**; verify the linked primary documentation at action
time.

### Local backend decision matrix

| Need | Recommended backend | Why / caveat |
|---|---|---|
| Apple Silicon default | `mlx-whisper` | Native MLX acceleration; a good first local path on M-series Macs. |
| Portable reference CLI | `openai-whisper` | Canonical Whisper implementation and CLI; simple, but not usually the fastest long-file path. |
| Long files or bounded memory | `faster-whisper` | CTranslate2 implementation with quantization and Silero VAD support. |
| Word alignment plus optional diarization | `whisperx` | Combines faster-whisper-style ASR, forced alignment, and pyannote-backed speaker labels. Its dependency stack is more fragile, so isolate it. |
| Diarize an existing transcript | `pyannote.audio` | Produces a speaker timeline that can be aligned to any ASR output. `community-1` is the current open pipeline; GPU is strongly preferred. |
| Diarization without HF/cloud credentials | NVIDIA NeMo | Real VAD/embedding/clustering or Sortformer pipelines; operationally heavier and best on CUDA. |
| Batched NVIDIA throughput | `insanely-fast-whisper` | Opinionated Transformers/Optimum CLI. Useful when its supported CUDA/MPS stack matches the machine; benchmark before standardizing on it. |
| Minimal Python-free runtime | `whisper.cpp` | C/C++ implementation with first-class Metal support and a simple offline binary. |

Recommended priority when the user does not name a backend:

1. For transcription only, use an already-installed accelerated local backend:
   `mlx-whisper` on Apple Silicon, `faster-whisper` on CUDA/CPU, then canonical
   `whisper` as the portable fallback.
2. For speaker labels, prefer a configured hosted diarization model when upload
   is acceptable; otherwise use pyannote on GPU when Hugging Face access is
   ready, or NeMo on CUDA when no credentialed diarizer is available.
3. Use WhisperX when both word-level forced alignment and diarization are needed
   in one pipeline. For an already-good transcript, pyannote direct is usually a
   cleaner separation of concerns.
4. Use `whisper.cpp` when a small native/offline deployment matters more than
   Python ecosystem convenience.

### Isolated installation recipes

Do not install all of these. Confirm the platform and requested feature, show
the command, and obtain approval before changing the environment. Prefer an
existing project environment; otherwise isolate incompatible audio/ML stacks.

Base tools on macOS:

```bash
brew install ffmpeg yt-dlp
```

Canonical Whisper and Apple-Silicon MLX:

```bash
uv tool install openai-whisper
uv tool install mlx-whisper
```

Long-file local ASR with faster-whisper:

```bash
uv venv --python 3.11 .venv-faster-whisper
uv pip install --python .venv-faster-whisper/bin/python faster-whisper
```

WhisperX in its own environment:

```bash
uv venv --python 3.11 .venv-whisperx
uv pip install --python .venv-whisperx/bin/python whisperx
```

Open pyannote diarization:

```bash
uv venv --python 3.11 .venv-pyannote
uv pip install --python .venv-pyannote/bin/python "pyannote.audio" soundfile
```

For `pyannote/speaker-diarization-community-1`, the user must accept the model's
Hugging Face conditions and provide `HF_TOKEN` through the environment. Do not
embed the token in a command or generated script. WhisperX transcription and
alignment can run without diarization access; speaker labels cannot.

NeMo diarization in a separate CUDA-oriented environment:

```bash
uv venv --python 3.11 .venv-nemo
uv pip install --python .venv-nemo/bin/python "nemo_toolkit[asr]"
```

The opinionated batched CLI and native C++ implementation:

```bash
pipx install insanely-fast-whisper
brew install whisper-cpp
```

Run each installed tool's `--help` and a short fixture before starting a long
recording. For faster-whisper/NeMo libraries, run a small import or repository
example. CUDA, cuDNN, PyTorch, and package-version compatibility are part of the
selected backend setup, not generic prerequisites for every transcription.

### Hosted provider decision matrix

| Provider | Prefer when | Current details to verify |
|---|---|---|
| OpenAI Transcription API | High-quality managed transcription, or native speaker labels with `gpt-4o-transcribe-diarize` | Current model/response-format support, VAD chunking requirements, upload limits, token pricing. `diarized_json` is required for speaker annotations. |
| Groq Speech-to-Text | Very fast, inexpensive Whisper transcription/translation | Current `whisper-large-v3` / `whisper-large-v3-turbo` availability, tier-specific upload limits, and per-hour price. |
| Deepgram | Production pre-recorded/streaming STT with diarization and formatting | Current Nova model, region, diarization options, file/time limits, concurrency, and pricing. |
| AssemblyAI | Managed speaker utterances plus transcript features such as keyterms or chapters | Current Universal model, `speaker_labels`, region/language support, concurrency, and add-on pricing. |
| Gemini audio understanding | Very long audio, transcription plus translation/Q&A/structured extraction | Current Gemini audio model, Files API, context/token cost, timestamp fidelity, and maximum combined duration. It is an audio-understanding model, not the default dedicated real-time STT path. |

Primary references:

- [OpenAI Whisper](https://github.com/openai/whisper),
  [faster-whisper](https://github.com/SYSTRAN/faster-whisper),
  [WhisperX](https://github.com/m-bain/whisperX),
  [pyannote.audio](https://github.com/pyannote/pyannote-audio),
  [NVIDIA NeMo Speech](https://github.com/NVIDIA-NeMo/Speech),
  [insanely-fast-whisper](https://github.com/Vaibhavs10/insanely-fast-whisper),
  and [whisper.cpp](https://github.com/ggml-org/whisper.cpp) for local stacks.
- [OpenAI transcription API](https://platform.openai.com/docs/api-reference/audio/createTranscription),
  [Groq Speech-to-Text](https://console.groq.com/docs/speech-to-text),
  [Deepgram pre-recorded audio](https://developers.deepgram.com/docs/pre-recorded-audio),
  [AssemblyAI speaker diarization](https://www.assemblyai.com/docs/pre-recorded-audio/label-speakers),
  and [Gemini audio understanding](https://ai.google.dev/gemini-api/docs/audio)
  for hosted paths.

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
