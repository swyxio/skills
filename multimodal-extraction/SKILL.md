---
name: multimodal-extraction
description: "Given a local video or video URL, downloads the media if needed, extracts slide frames and key moments, transcribes the audio, and writes a Markdown timeline that interleaves screenshots with the transcript at the associated timestamps. Use when asked to turn a video into a multimodal notes file, slide-synced transcript, screenshot-enhanced transcript, or talk recap with images."
version: 0.1.0
---

# Multimodal Extraction

## Overview

This skill composes the existing video workflows into one artifact:

- `download-video` for URL inputs
- `thumbnail-extraction` for slide frames and key screenshots
- `transcribe-anything` for transcript strategy

The implementation is intentionally speed-first:

1. Download only when the input is a URL
2. Reuse the fast slide/key-frame heuristics from `thumbnail-extraction`
3. Use local `whisper` JSON output for timestamped transcript segments
4. Merge everything into one Markdown timeline with relative image links

## When To Use

- "Turn this talk into multimodal notes"
- "Make me a markdown transcript with screenshots"
- "Extract slides and transcript together"
- "Build a recap doc from this video"
- "Given this YouTube URL, produce a slide-synced transcript"

## Requirements

```bash
brew install ffmpeg yt-dlp
pip3 install --break-system-packages openai-whisper
```

The following existing local script is reused:

- `../thumbnail-extraction/thumbnail_extractor.py`

## Command

```bash
python3 multimodal_extract.py <video_or_url> [output_dir] [--language en] [--whisper-model turbo] [--top-n 4]
```

## What It Does

### Step 1: Resolve the Source

- If the input is a local file, use it directly
- If the input starts with `http://` or `https://`, download it first with `yt-dlp`
- For YouTube URLs, direct `yt-dlp` is usually enough
- For trickier hosted pages, this skill follows the same practical intent as `download-video`: get a usable local file first

### Step 2: Extract Visual Anchors

Run:

```bash
python3 ../thumbnail-extraction/thumbnail_extractor.py "$VIDEO" "$OUTPUT/visuals" 4 --extract-slides
```

This produces:

- top thumbnail candidates in the root of `visuals/`
- slide images in `visuals/slides/`
- manifests with timestamps

### Step 3: Transcribe

Extract normalized mono 16k audio:

```bash
ffmpeg -y -i "$VIDEO" -vn -ac 1 -ar 16000 -acodec pcm_s16le \
  -af "highpass=f=80,lowpass=f=8000,loudnorm=I=-16:TP=-1.5:LRA=11" \
  "$OUTPUT/audio/source_preprocessed.wav"
```

Then transcribe with Whisper:

```bash
whisper "$OUTPUT/audio/source_preprocessed.wav" \
  --model turbo \
  --language en \
  --word_timestamps True \
  --condition_on_previous_text False \
  --output_format json \
  --output_dir "$OUTPUT/transcript"
```

### Step 4: Merge into Markdown

The script:

- reads slide and thumbnail manifests
- reads Whisper transcript segments
- sorts all visual anchors by timestamp
- groups transcript text between successive visual anchors
- writes `multimodal_timeline.md` with:
  - section timestamp
  - associated image(s)
  - transcript span for that interval

## Output

```
output_dir/
  source/
  visuals/
  audio/
  transcript/
  multimodal_timeline.md
```

## Design Principle

The goal is total end-to-end extraction speed.

That means:

- heuristics first
- local transcript by default
- no VLM in the common path
- only enough structure to make the Markdown artifact useful immediately

## Future Extensions

- add backend switching for `transcribe-anything`
- add deck-aware slide labeling when a source deck exists
- add speaker diarization sections
- add chaptering or summary generation on top of the Markdown timeline
