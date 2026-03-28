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
