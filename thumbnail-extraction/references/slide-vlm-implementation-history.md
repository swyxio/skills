# Slide/VLM implementation history and recovery notes

Read this reference when the README's `--extract-slides` or `--vlm-*` examples
do not work, when recovering the advanced extractor, or when deciding whether
to reintroduce scene-cut and VLM fallback behavior.

## Current status

The working-tree `thumbnail_extractor.py` is 418 lines and accepts only:

```text
<video_path> [output_dir] [top_n]
```

It contains no slide exporter, scene-cut detector, perceptual hash, VLM client,
or related flags. Passing `--extract-slides` makes it a positional token rather
than enabling a feature.

## Repository history

Advanced variants are recoverable from:

- commit `b4b1e0f` — added a 1,027-line VLM fallback implementation;
- commit `d835e50` — expanded it to a 1,262-line scene-cut-first cascade; and
- commit `e0355eb` — replaced the script with the older 418-line implementation
  while the advanced README remained.

These observations come from local repository history. Restoring one of those
files is a code change, not a documentation step: review its diff, provider
calls, secrets, dependencies, and tests before choosing it.

## `d835e50` architecture

The most developed historical variant added:

```text
Pass-1 sampled OpenCV scoring
  ├─ candidate thumbnail path → DeepFace → ranked frames/crops
  └─ optional slide path
       ├─ ffmpeg scene-cut detection when plausible
       ├─ capture shortly after each cut
       ├─ perceptual-hash deduplication
       └─ sampled-frame VLM fallback when heuristics find no slides
```

Historical slide/VLM constants:

| Constant | Value in `d835e50` |
|---|---:|
| `SLIDE_HASH_SIZE` | `9` |
| `SLIDE_HASH_DISTANCE_THRESHOLD` | `10` |
| `SLIDE_GAP_SEC` | `SAMPLE_INTERVAL_SEC × 1.5` |
| `VLM_BATCH_SIZE` | `8` |
| `VLM_MAX_SAMPLES` | `120` |
| `VLM_REQUEST_TIMEOUT_SEC` | `90` |
| `VLM_IMAGE_MAX_DIM` | `960` |
| `SCENE_CUT_THRESHOLD` | `0.10` |
| `SCENE_MIN_SLIDES` | `6` |
| `SCENE_MAX_SLIDES_PER_MIN` | `2.5` |
| `SCENE_CAPTURE_OFFSET_SEC` | `0.2` |
| `SCENE_MIN_GAP_SEC` | `0.5` |

Historical flags:

```text
--extract-slides
--vlm-provider PROVIDER
--vlm-model MODEL
--vlm-batch-size N
--vlm-max-samples N
--vlm-timeout-sec N
```

Historical provider adapters included Ollama, Gemini, OpenAI, Anthropic, and
OpenRouter. Their default model IDs are stale until verified against current
provider documentation.

## Design lesson from the GitLab/Sid Sijbrandij test

The associated README recorded a 51-slide deck where sparse VLM sampling badly
undercounted slides. The useful lesson was structural:

- full-slide canvas with a tiny webcam inset → global scene cuts first;
- shared-screen layout → detect/crop the slide pane, then scene cuts;
- presenter-only and slide alternation → cheap layout classification, then
  scene detection inside slide spans;
- animated builds → stronger cut threshold plus perceptual deduplication; and
- known deck → validate expected count and use matching/OCR for ambiguity.

The optimization target is end-to-end extraction speed and coverage, not using
the most sophisticated model first.

## Historical Ollama diagnosis

The README recorded `qwen3.5:4b-q4_K_M` as workable on one Apple Silicon laptop
only after:

- resizing images before requests;
- adding explicit per-batch timeouts and duration logging;
- setting batch size to one;
- limiting samples to twelve; and
- using a 45-second request timeout.

Observed latency was roughly 15–30 seconds per frame, so twelve frames still
took several minutes. Treat the model ID and timings as historical measurements.

## Recovery checklist

Before restoring the historical implementation:

1. Compare `d835e50:thumbnail-extraction/thumbnail_extractor.py` with the current
   script and preserve any later candidate-extraction fixes.
2. Decide whether slide extraction belongs here or in the existing
   `multimodal-extraction` implementation.
3. Verify every provider model ID, endpoint, timeout, image limit, and credential
   variable from primary documentation.
4. Require approval before hosted frame upload.
5. Add argument validation and real `--help`; the historical hand parser can
   raise index errors on missing flag values.
6. Make DeepFace optional in executable control flow if OpenCV-only fallback is
   promised.
7. Test full-slide, shared-screen, animated-build, and presenter-only fixtures.
8. Validate slide count against a known deck and inspect false merges/splits.
9. Record elapsed time for scene detection, frame extraction, deduplication,
   each VLM batch, and total runtime.
10. Update README and manifest schemas together with the implementation.

Do not present historical flags as working until the implementation is actually
restored and validated.
