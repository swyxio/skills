# Transcription backends and setup

Read this reference when no transcription route is configured, captions are
insufficient, or the user asks which backend to use. Prefer an existing approved
backend. Do not install packages, download large models, or upload private media
without the user's authorization.

Provider model names, upload limits, prices, concurrency, and CLI flags change.
The exact values below are April 2026 field notes restored for research value;
verify current provider documentation and the installed client before use.

## Backend selection

| Source situation | Practical starting point |
|---|---|
| Reliable captions cover every talk | Caption path; no ASR upload or model setup |
| A few caption gaps | ASR only the affected talk/range |
| Hosted ASR already approved and configured | Compress bounded talk segments and submit within verified limits |
| Sensitive media or upload not approved | Existing capable local ASR |
| No backend installed and captions absent | Present setup/upload choices before changing the machine or sending data |
| Diarization is required | Choose a backend that actually returns speaker/time evidence; do not infer names from anonymous labels |

## Historical April 2026 provider notes

| Route | Recorded recommendation or limit | How to treat it now |
|---|---|---|
| YouTube captions | Preferred for the AIE Europe source because they were immediate and adequate | Inspect current caption languages and quality per source |
| Groq Whisper API | `whisper-large-v3-turbo`; 25 MB upload ceiling; three concurrent calls used | Verify current model ID, request schema, file limit, rate limits, and terms |
| OpenAI transcription API | The workflow grouped it with a 25 MB upload ceiling | Verify current transcription models, endpoint, formats, and upload ceiling |
| Local `faster-whisper` | Available CPU/local fallback, but slow on that fresh-machine seven-hour job | Benchmark a representative segment on the actual hardware |
| Local `mlx-whisper` | Apple Silicon option; large model download around 1.5 GB was observed | Verify model artifact size and run one segment before batch execution |
| Anthropic cleanup | Historically recommended for the optional cleanup pass | Any approved capable LLM can clean; verify context/output limits and preserve raw text |

Do not quote the table as current pricing, availability, or capacity.

## Prerequisite checks

```bash
command -v yt-dlp
command -v ffmpeg
command -v jq
command -v uv
```

Check only whether environment variables are set; never print their values:

```bash
[ -n "${GROQ_API_KEY:-}" ] && echo 'Groq credential configured'
[ -n "${OPENAI_API_KEY:-}" ] && echo 'OpenAI credential configured'
[ -n "${ANTHROPIC_API_KEY:-}" ] && echo 'Anthropic credential configured'
```

The environment-variable names are common conventions, not proof that the
repository's client uses them.

## General command-line installation

Historical macOS setup:

```bash
brew install yt-dlp ffmpeg jq uv
```

Use the current project's package manager and platform instructions. Check for
existing tools first, explain downloads and disk use, and get approval before
installing.

## Isolated local Whisper setup

The event notes used `uv` to avoid modifying the externally managed system
Python:

```bash
uv venv .venv
source .venv/bin/activate
uv pip install faster-whisper
```

For MLX on compatible Apple Silicon, install the currently supported package in
the isolated environment only after confirming model size and disk/network
cost. Do not use `--break-system-packages` as the default workaround for PEP
668.

## Capacity planning

Before submitting a conference batch, verify and record:

- accepted media containers and codecs;
- maximum file bytes and duration;
- whether timestamps or verbose segments are available;
- language and diarization parameters;
- request and token rate limits;
- maximum useful concurrency;
- timeout and retry guidance;
- retention/training policy for uploaded media; and
- current model identifier and pricing when cost matters.

Probe one representative talk before starting the full event. A successful
single upload does not authorize unbounded concurrency.

## Compression sizing

The historical speech-oriented conversion was:

```bash
ffmpeg -i input.wav -ac 1 -ar 16000 -c:a libopus -b:a 32k output.ogg
```

At a nominal 32 kbit/s, an hour of audio is approximately 14.4 MB before
container overhead. Measure the actual output and compare it with the provider's
currently verified limit; do not rely on the estimate as admission control.

## Credential and upload boundary

- Keep credentials in environment variables or the project's secret manager.
- Do not place keys in shell history, command arguments, committed scripts, or
  transcript metadata.
- Tell the user which hosted service will receive private/unlisted audio before
  upload.
- Preserve local raw artifacts when provider output needs auditing, subject to
  the user's retention requirements.
