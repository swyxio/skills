---
name: conference-transcribe
description: |
  Transcribe a multi-talk conference livestream or long YouTube video into separate per-talk transcripts. Parses timestamps from the video description to split talks, downloads audio/video, transcribes each segment, then uses an LLM to clean up and format the transcripts with key takeaways and frequent timestamps. Use when user says "transcribe this conference", "split this livestream into talks", "transcribe each talk separately", or provides a YouTube URL of a multi-hour event stream with chapter timestamps.
license: MIT
user_invocable: true
argument-hint: <youtube-url>
compatibility: |
  Requires macOS with ffmpeg and yt-dlp installed. Needs at least one transcription backend (Groq API recommended for speed). Needs an LLM API key (Anthropic recommended) for cleanup pass.
metadata:
  author: swyxio
  version: "1.0"
  last-updated: "2026-04-10"
  primary-tools: yt-dlp, ffmpeg, Groq Whisper API, Claude API
---

# Conference Transcribe

Transcribe a multi-talk conference livestream into individual, cleaned-up per-talk markdown files with key takeaways and frequent timestamps.

## Lessons Learned (from AIE Europe Day 1, April 2026)

This skill was born from a real transcription session. Here's what worked and what didn't:

### What Worked

1. **YouTube auto-captions as primary source** -- YouTube's English auto-captions (VTT) are surprisingly good and *instant*. No download wait, no model download, no GPU needed. Prefer this over Whisper for YouTube videos that have captions available.
2. **`yt-dlp --write-sub --write-auto-sub --sub-lang en`** to grab captions directly, then parse the VTT file.
3. **`yt-dlp --download-sections`** to download individual talk clips as MP4 (for archiving/sharing), parallelized with `ThreadPoolExecutor(max_workers=2)`.
4. **Parsing the video description** for chapter timestamps -- the description is the ground truth for talk boundaries.
5. **Two-pass transcript pipeline**: raw VTT parse -> LLM cleanup. The raw parse handles deduplication and timestamp bucketing; the LLM handles readability, proper nouns, key takeaways, and formatting.
6. **Opus compression** for cloud API uploads: `ffmpeg -c:a libopus -b:a 32k` gets 1 hour of audio down to ~14MB (under Groq/OpenAI's 25MB limit).
7. **`metadata.json`** from `yt-dlp --write-info-json` gives structured chapter data that's easier to parse than the description text.

### What Didn't Work

1. **Local Whisper (any variant)** on a fresh machine is painful:
   - `pip install` fights with macOS externally-managed-environment (PEP 668). Need `uv venv` or `--break-system-packages`.
   - `mlx-whisper` model downloads are huge (~1.5GB for large-v3-turbo) and get throttled without `HF_TOKEN`.
   - `faster-whisper` on CPU is very slow for 7+ hours of audio.
   - All told, setting up local Whisper from scratch took longer than just using YouTube captions.
2. **Groq API without a key** -- need to ask user upfront.
3. **Parallel Whisper on Apple Silicon** -- MLX uses the GPU, so parallel workers contend. Sequential is better for local models.
4. **Large WAV files for API upload** -- 16kHz mono WAV is ~1.9MB/min. A 30-min talk is 57MB, over the 25MB API limit. Must compress to opus/ogg first.

### Decision Tree: Which Transcription Backend?

```
Has YouTube captions? (check with yt-dlp --list-subs)
  YES -> Use YouTube captions (fastest, free, no setup)
  NO  -> Has Groq/OpenAI API key?
    YES -> Use Groq API (whisper-large-v3-turbo, nearly free, very fast)
    NO  -> Has local Whisper installed?
      YES -> Use faster-whisper or mlx-whisper
      NO  -> Install via uv: `uv venv .venv && source .venv/bin/activate && uv pip install faster-whisper`
```

## Step-by-Step Workflow

### Step 0: Check Prerequisites

```bash
which yt-dlp || echo "MISSING: brew install yt-dlp"
which ffmpeg || echo "MISSING: brew install ffmpeg"
which jq || echo "MISSING: brew install jq"

# Check for API keys (optional but recommended)
[ -n "$GROQ_API_KEY" ] && echo "Groq: ready" || echo "Groq: not set (needed for Whisper API)"
[ -n "$ANTHROPIC_API_KEY" ] && echo "Anthropic: ready" || echo "Anthropic: not set (needed for cleanup)"
```

### Step 1: Get Video Metadata and Captions

```bash
VIDEO_URL="$1"  # YouTube URL from user

# Download metadata + captions (no video)
yt-dlp --write-info-json --skip-download \
  --write-sub --write-auto-sub --sub-lang en \
  -o "media/%(id)s" "$VIDEO_URL"
```

This produces:
- `media/<id>.info.json` -- full metadata including chapters
- `media/<id>.en-orig.vtt` or `media/<id>.en.vtt` -- auto-captions

### Step 2: Parse Chapter Timestamps into Talk Manifest

Read the `.info.json` file and extract chapters. Filter out breaks, untitled segments, etc.

Create a `talks.json` manifest:
```json
[
  {
    "index": 1,
    "title": "Speaker Name: Talk Title",
    "speaker": "Speaker Name",
    "slug": "01-speaker-name",
    "source_chapter_start": "00:24:25",
    "source_chapter_end": "00:42:39",
    "start_seconds": 1465,
    "end_seconds": 2559,
    "duration_seconds": 1094
  }
]
```

If no chapters in metadata, fall back to parsing the video description for timestamp lines matching patterns like:
- `HH:MM:SS - Speaker Name: Talk Title`
- `HH:MM:SS Speaker Name (Company): Description`

### Step 3: Build Raw Transcripts (Caption Path)

If YouTube captions are available, parse the VTT file:

1. Parse all VTT cues (timestamp + text).
2. For each talk in the manifest, select cues within the talk's time range.
3. **Deduplicate overlapping text** -- YouTube VTT cues often repeat words from the previous cue. Use a sliding window word-match approach (see `append_without_overlap` pattern).
4. **Bucket cues into ~30-second paragraphs** for readability.
5. Write each talk as a raw transcript file with dual timestamps: `[HH:MM:SS | +MM:SS]` (absolute stream time | relative to talk start).

Output format:
```markdown
# Speaker Name: Talk Title

- Source: https://youtube.com/watch?v=ID&t=1465s
- Source range: 00:24:25 - 00:42:39
- Duration: 00:18:14
- Transcript source: YouTube auto-captions

## Timestamped Transcript

[00:24:26 | +00:00:01] Good morning everyone...

[00:24:54 | +00:00:29] Next paragraph of text...
```

### Step 3 (alt): Build Raw Transcripts (Whisper/API Path)

If no YouTube captions, transcribe from audio:

1. Download audio: `yt-dlp -f bestaudio -x --audio-format wav -o "full_audio.%(ext)s" "$VIDEO_URL"`
2. Split into per-talk segments using ffmpeg:
   ```bash
   ffmpeg -i full_audio.wav -ss "$START" -to "$END" -ac 1 -ar 16000 "segments/${SLUG}.wav"
   ```
3. Compress for API upload:
   ```bash
   ffmpeg -i "segments/${SLUG}.wav" -ac 1 -ar 16000 -c:a libopus -b:a 32k "segments/${SLUG}.ogg"
   ```
4. If ogg > 25MB, further split into 10-min chunks.
5. Transcribe via Groq API (preferred) or other backend:
   ```bash
   curl -s https://api.groq.com/openai/v1/audio/transcriptions \
     -H "Authorization: Bearer $GROQ_API_KEY" \
     -F file="@segments/${SLUG}.ogg" \
     -F model="whisper-large-v3-turbo" \
     -F language="en" \
     -F response_format="verbose_json" \
     -F 'timestamp_granularities[]=segment'
   ```
6. Reassemble chunks with offset correction for absolute timestamps.
7. Parallelize: 3 concurrent API calls is safe for Groq rate limits.

### Step 4: Download Video Clips (Optional, Parallel)

For archiving individual talk videos:

```bash
yt-dlp -f 91 \
  --downloader ffmpeg \
  --downloader-args "ffmpeg_i:-allowed_extensions ALL" \
  --download-sections "*${START}-${END}" \
  -o "clips/${SLUG}.%(ext)s" \
  "$VIDEO_URL"
```

Run with `ThreadPoolExecutor(max_workers=2)` -- more than 2 concurrent yt-dlp downloads tends to get throttled.

### Step 5: LLM Cleanup Pass

Send each raw transcript to Claude (or another LLM) for cleanup. Use 3 concurrent API calls.

**System prompt for cleanup:**

```
You are an expert transcript editor. Take this raw auto-caption transcript and produce a clean, readable document.

Rules:
1. KEEP all timestamps in [HH:MM:SS | +MM:SS] format. Include them every 30-60 seconds.
2. Fix transcription errors: proper nouns, technical terms, company names, jargon.
3. Add paragraph breaks at natural topic transitions.
4. Remove filler words (um, uh, like, you know) unless they add meaning.
5. Preserve the speaker's voice -- clean up, don't rewrite.
6. For multi-speaker segments, use [Speaker Name]: format.

Output format:
# Talk Title
**Speaker** -- Role/Company
**Event**: {event name and date}

## Key Points
- 4-8 bullet points of key takeaways

## Timestamped Reading Transcript
[Content with timestamps, paragraphs, and light line-wrapping for readability]
```

### Step 6: Write Final Output

Organize into:
```
transcripts/
  raw/       -- unedited VTT-parsed or Whisper output
  cleaned/   -- LLM-cleaned markdown
clips/       -- individual talk MP4s (optional)
talks.json   -- manifest with metadata
reports/
  talk-manifest.md  -- summary table
```

## Quick Start (Copy-Paste)

For the common case of a YouTube conference stream with chapters and auto-captions:

```bash
# 1. Grab metadata + captions
yt-dlp --write-info-json --skip-download --write-auto-sub --sub-lang en -o "media/%(id)s" "$URL"

# 2. Build talks.json from chapters in info.json
python3 scripts/build_transcripts.py

# 3. Download individual clips (parallel, optional)
python3 scripts/download_clips.py

# 4. Clean up transcripts with LLM
python3 scripts/cleanup_transcripts.py
```

The `build_transcripts.py` and `cleanup_transcripts.py` scripts handle VTT parsing, deduplication, timestamp formatting, and LLM cleanup. See the AIE Europe project for reference implementations.
