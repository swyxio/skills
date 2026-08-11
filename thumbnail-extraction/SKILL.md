---
name: thumbnail-extraction
description: Extract representative thumbnail frames, face crops, or slide images from a local video for later compositing. Use when the user asks to find thumbnail candidates or screenshots from a recording; do not trigger for creating a finished thumbnail, downloading a video, or generic frame extraction with no selection goal.
version: 0.1.0
---

# Video Thumbnail Extraction

The bundled `thumbnail_extractor.py` scans a local video and writes a manifest
plus ranked full-frame candidates. Inspect its `--help` output and current
dependencies before running it; do not install every optional model by default.

## Selection strategy

Prefer a cheap cascade:

1. sample frames without retaining the whole video in memory;
2. score faces, expressions when the optional detector exists, visual variety,
   and slide-like frames;
3. choose temporally diverse candidates rather than four adjacent frames; and
4. run expensive expression analysis, background removal, OCR, or a VLM only on
   the small candidate set and only when that signal is needed.

For slide-heavy recordings, scene-cut detection or a known source deck is often
more reliable and cheaper than classifying many frames with a vision model. For
shared-screen layouts, detect/crop the slide pane before scoring it. Treat
face/emotion scores as ranking hints, not evidence of what a person feels.

## Run and verify

```bash
python3 thumbnail_extractor.py /path/to/video.mp4 /path/to/output 4
```

The output should include full-frame JPGs, face crops when detected, and a JSON
manifest with timestamps/scores. Inspect the full frames before using a crop:
the largest detected face can be a profile image or slide artifact. Confirm
that candidates are from the intended source and spread across the useful
content rather than intro/outro noise.

Optional hosted VLM or background-removal steps require explicit approval for
uploading frames. Keep API keys in the environment and preserve the original
video. Use `youtube-thumbnails` or `youtube-api` only after a human selects the
candidate and a separate publication request authorizes the upload.

If the extractor is slow or memory-bound, increase the sample interval or
reduce optional deep analysis before adding a larger model. If no faces or
slides are found, return ranked visual candidates or report that the source
does not contain a reliable signal; do not fabricate an emotion or slide label.
