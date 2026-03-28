# thumbnail-extraction

Extracts the most interesting thumbnail candidates from a local video file and can also export one representative image per detected slide.

This skill scans a recording, scores visually strong frames, and saves ready-to-use JPG outputs plus face crops when faces are detected. It is designed for long-form interviews, Zoom recordings, presentations, and talk videos where manually scrubbing for a thumbnail is slow.

## What It Produces

- Full-frame thumbnail candidates
- Face crops for the largest detected face in a candidate
- A manifest JSON with timestamps and scores
- Optional slide exports grouped proportionately across the video timeline
- Optional VLM fallback when OpenCV sees no slides

## Typical Usage

```bash
python3 thumbnail_extractor.py /path/to/video.mp4 ~/Downloads/thumb_candidates 4

# Also export one representative image per detected slide
python3 thumbnail_extractor.py /path/to/video.mp4 ~/Downloads/thumb_candidates 4 --extract-slides

# If OpenCV sees no slides, retry with the lowest-overhead hosted default
python3 thumbnail_extractor.py /path/to/video.mp4 ~/Downloads/thumb_candidates 4 \
  --extract-slides --vlm-provider gemini

# Retry locally through Ollama if you already have a vision model installed
python3 thumbnail_extractor.py /path/to/video.mp4 ~/Downloads/thumb_candidates 4 \
  --extract-slides --vlm-provider ollama --vlm-model gemma3
```

## Notes

- Works best with OpenCV installed
- If `deepface` is available, expression scoring improves ranking
- If `deepface` is missing, the extractor still runs using OpenCV-only scoring
- Slide extraction is also OpenCV-first: cheap presentation detection plus perceptual-hash grouping
- Lowest-overhead implementation is shared sampled-frame classification, not full-video upload
- Gemini is the best hosted default because it supports both image batches and separate native video workflows through the Files API
- Ollama is the cheapest local option if you already run a vision model such as `gemma3` or `llama3.2-vision`
- OpenAI is the simplest hosted image-batch fallback if you already have `OPENAI_API_KEY`
- Anthropic is strong for image reasoning, but this skill currently uses it on sampled frames rather than native video
- OpenRouter is useful when you want one API key that can route across multiple multimodal providers
- Supported fallback providers: `ollama`, `gemini`, `openai`, `anthropic`, `openrouter`
- If OpenCV sees no slides and no provider is supplied, the script completes and prints provider-specific rerun suggestions
- Use the resulting JPG with the `youtube-api` skill's `set_thumbnail.py`

## Key Insight

The main miss in the first implementation was using sparse VLM classification as the primary method for slide extraction.

That is the wrong abstraction for many talk videos.

For this GitLab / Sid Sijbrandij talk, the slide deck occupies almost the entire frame and slide advances appear as hard visual cuts. The expensive part was not "understanding" the slide. The hard part was choosing the right detection strategy for the video form.

The better approach is a fast heuristic cascade:

- If the video is mostly a full slide canvas with a small presenter inset, use scene-cut detection first.
- If the video is a shared-screen layout, detect or crop the slide region first, then run scene-cut detection on that region.
- If the video alternates between presenter-only shots and slides, use cheap scene and layout heuristics to find candidate change windows, then run VLM classification only on those candidates.
- If a source deck is available, use it as ground truth and calibration:
  - validate expected slide count
  - export reference slide images
  - use deck matching or OCR as a fallback when scene detection is ambiguous

The optimization target is end-to-end speed, not "most intelligent model first." In practice that means:

- Prefer `ffmpeg` scene detection over VLM calls whenever the slide canvas dominates the frame.
- Use OCR or deck matching only as secondary disambiguation signals.
- Run independent cheap steps in parallel when possible:
  - scene detection
  - deck export / download
  - frame extraction
  - OCR on candidate timestamps
- Reserve VLM calls for the smallest possible ambiguous subset.

## Video Form Heuristics

Slides can come in very different visual forms, so the extractor should branch early:

- Full-slide talk with tiny webcam inset:
  - Primary: global scene-cut detection
  - Secondary: OCR on slide number or deck matching
- Shared-screen presentation with speaker next to slides:
  - Primary: detect slide pane, then run scene-cut detection on that pane only
  - Secondary: VLM only on low-confidence pane changes
- Presenter-only segments mixed with slides:
  - Primary: cheap layout classifier to separate "slide-like" vs "talking head"
  - Secondary: scene-cut detection only inside slide-like spans
- Screen recordings with animated builds:
  - Primary: higher-threshold scene detection plus dedupe
  - Secondary: OCR or perceptual-hash grouping to avoid overcounting small reveals
- Known deck available:
  - Primary: deck-aware validation and slide-image matching
  - Secondary: use OCR / VLM only when matching confidence is low

## Ollama Notes

- On this machine, `qwen3.5:4b-q4_K_M` was a workable local VLM, but only after reducing request size.
- Early runs appeared to hang because the script sent large multimodal batches without enough timing or timeout visibility.
- The practical fix was:
  - resize VLM input frames before upload
  - use explicit per-batch timeouts
  - log batch durations and retry behavior
  - prefer `--vlm-batch-size 1` for local Ollama runs with `qwen3.5`
- A stable local rerun looked like:

```bash
python3 thumbnail_extractor.py /path/to/video.mp4 ~/Downloads/thumb_candidates 4 \
  --extract-slides \
  --vlm-provider ollama \
  --vlm-model qwen3.5:4b-q4_K_M \
  --vlm-batch-size 1 \
  --vlm-max-samples 12 \
  --vlm-timeout-sec 45
```

- With those settings, single-frame `qwen3.5` requests completed in roughly `15s` to `30s` per frame on an Apple Silicon laptop, so a 12-frame run can still take several minutes.
- If you want faster local throughput, reduce `--vlm-max-samples` first before increasing batch size.

## Test Cases

- `GitLab / Sid Sijbrandij cancer journey talk`
  - Video: https://www.youtube.com/watch?v=Sn5t8iPLOBQ
  - Deck: https://docs.google.com/presentation/d/1GtYR8Of7215PJbTqwJILK3_ESlMLvKzLRL4lFSgeGl4/edit?slide=id.g3c0968bd9b2_3_0#slide=id.g3c0968bd9b2_3_0
  - Expected deck size: 51 slides
  - Important lesson: sparse VLM sampling badly undercounts this format; calibrated scene-cut detection is much faster and much closer to ground truth
