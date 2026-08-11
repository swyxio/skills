# Candidate architecture, scoring, and selection

Read this reference when changing or diagnosing the currently bundled
418-line `thumbnail_extractor.py`. The values below are extracted from that file
and describe its exact behavior, including quirks.

## Current pipeline

```text
local video
  → probe fps/frame count/dimensions with OpenCV
  → Pass 1: seek every 10 seconds, score one downscaled frame at a time
  → select up to 3 × top_n temporally separated candidates
  → Pass 2: re-read candidates, run DeepFace expression analysis
  → force final temporal spread
  → save full JPG, optional largest-face crop, and JSON manifest
```

The script never holds every sampled frame. Pass 1 stores metadata and face
rectangles only. Pass 2 stores frames for the small candidate set until output
is written, then removes each frame from its record.

## Global constants

| Constant | Current value | Effect |
|---|---:|---|
| `SAMPLE_INTERVAL_SEC` | `10` | Seeks one frame every ten seconds |
| `ANALYSIS_SCALE` | `0.5` | Downscales Pass-1 face/smile/edge analysis |
| `FULL_RES_SCALE` | `1.0` | Declared but not used by the current script |
| `TOP_N` | positional argument, default `4` | Final candidate count target |
| candidate minimum time gap | `30` seconds | Prevents near-adjacent Pass-2 candidates |
| output JPEG quality | `95` | Full frames and face crops |

The scan starts at `min(60 seconds, 5% of duration)` and ends at
`max(duration − 60 seconds, 95% of duration)`. For ordinary long recordings,
this skips roughly the first/last minute; for shorter videos it behaves closer
to a five-percent trim.

## Pass-1 detectors and thresholds

```python
faces = face_cascade.detectMultiScale(gray, 1.1, 5, minSize=(30, 30))
smiles = smile_cascade.detectMultiScale(face_roi, 1.8, 20, minSize=(15, 15))
edges = cv2.Canny(gray, 100, 200)
is_presentation = edge_density > 0.08 and saturation_std < 50
```

The face rectangles are converted back to original-frame coordinates before
being stored. The “smile score” is not a calibrated probability; it is the
largest detected smile-region area divided by its containing face area.

## Exact Pass-1 score

| Signal | Contribution |
|---|---:|
| Faces | `min(num_faces, 3) × 2.0` |
| Smiles | `num_smiles × 3.0` |
| Largest smile-area ratio | `ratio × 5.0` |
| Grayscale variance | `min(variance / 3000, 1.5)` |
| Presentation-like frame | raises total to at least `1.5` |
| Two or more faces | `+1.0` |

This scoring strongly favors gallery/interview frames with several detected
faces and smiles. A presentation frame receives only a floor, so it can lose to
almost any strong face frame. Scores rank candidates for thumbnail inspection;
they do not measure semantic importance or actual human emotion.

## Pass-1 temporal diversity

`select_diverse_top`:

1. finds the sampled time range;
2. divides it into `max(top_n, 4)` equal quadrants/segments;
3. takes the highest Pass-1 score from each segment;
4. accepts picks only when at least thirty seconds from prior selections;
5. then fills from the overall score ranking; and
6. stops at `top_n × 3` candidates.

This is why the original documentation referred to twelve deep candidates when
`top_n=4`.

## DeepFace expression weights

The current Pass-2 mapping is:

```python
WEIGHTS = {
    "happy": 1.0,
    "surprise": 0.95,
    "fear": 0.7,
    "sad": 0.5,
    "angry": 0.6,
    "disgust": 0.4,
    "neutral": 0.1,
}
```

DeepFace regions narrower than forty pixels are ignored. For every remaining
face/emotion pair:

```text
weighted expression = provider percentage × weight ÷ 100
emotion_score = maximum weighted expression across faces and labels
combined_score = Pass-1 score + emotion_score × 5
happy or surprise dominant label = additional +2
```

The older table said fear/angry received a `+1` bonus. The current executable
does not do that; they influence only the weighted expression term.

DeepFace runs with `enforce_detection=False`, OpenCV detector backend, and
silent output. Exceptions during `DeepFace.analyze` are swallowed and leave a
neutral zero expression score, but failure to import DeepFace is not caught.

## Final temporal spread

Pass 2 divides the candidate timestamp range into `top_n` equal segments and
takes the highest combined score in each. Empty segments are filled from the
overall combined-score ranking. Final outputs are sorted chronologically, not
by score.

Because segment membership uses a half-open range, a candidate exactly at the
maximum timestamp may miss the segment pass and be recovered only by the fill
step. This is a known implementation detail when diagnosing surprising picks.

## Face crop geometry

For each selected frame, the script chooses the largest Pass-1 face rectangle.
It expands by:

- `0.5 × face width` left and right;
- `1.0 × face height` above (`py × 2`, where `py = 0.5h`); and
- `0.5 × face height` below.

The crop is clipped to frame bounds and written only when nonempty. This favors
head-and-shoulders space but can select a large avatar or slide portrait instead
of the live speaker; inspect the full frame.

## Signals the current script does not implement

- scene-cut extraction;
- perceptual slide hashing;
- OCR or deck matching;
- VLM providers;
- background removal;
- configurable thresholds through CLI flags; or
- a true optional DeepFace path.

Those capabilities existed in historical variants or prose and are separated
in [slide-vlm-implementation-history.md](slide-vlm-implementation-history.md).
