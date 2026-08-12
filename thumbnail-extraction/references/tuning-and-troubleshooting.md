# Tuning and troubleshooting the bundled extractor

Read this reference when output quality, speed, imports, memory, crops, or
scores are wrong. Unless a historical variant is restored, tuning the current
script means editing constants or detector calls and validating a fixture; most
parameters are not CLI flags.

## Parameter-by-parameter tuning

### `SAMPLE_INTERVAL_SEC = 10`

- Lower to `5` for short videos or fleeting expressions; roughly doubles Pass-1
  seeks and detector work.
- Raise to `15–20` for very long videos, slow storage, or memory/CPU pressure.
- Sparse sampling can miss short reactions and slide transitions.
- Changing it does not change the fixed 30-second candidate gap.

### `ANALYSIS_SCALE = 0.5`

- Lower values reduce detector pixels and improve speed but make small faces
  disappear.
- Higher values help small gallery tiles at increased CPU cost.
- The old troubleshooting note suggested `0.3` for a very large solo face; that
  is not generally a face-detection improvement. Tune from a saved frame rather
  than applying it blindly.

### Face cascade `(scaleFactor=1.1, minNeighbors=5, minSize=(30,30))`

- Lower `minNeighbors` finds more faces and more false positives.
- Raise it to suppress slide portraits and UI avatars.
- Lower `minSize` only when genuine faces occupy tiny gallery tiles.
- The detector runs on the downscaled frame, so `30×30` corresponds to roughly
  `60×60` source pixels at the default scale.

### Smile cascade `(1.8, 20, minSize=(15,15))`

- High `minNeighbors=20` is conservative.
- Reducing it increases smile hits but can dominate scoring with false mouths.
- Smile area is a geometric proxy, not model confidence.

### Edge and presentation thresholds

Current heuristic:

```text
edge_density > 0.08 and saturation standard deviation < 50
```

Lower edge threshold or raise saturation threshold to classify more frames as
presentation-like. Because presentation is only a score floor of 1.5, changing
classification may still not make slides win against face-heavy frames.

### Variance normalization

`variance / 3000` capped at `1.5` rewards visual detail. Noisy, textured, or
high-contrast frames can score well without being useful. Increase the divisor
to damp this signal; inspect score distributions before changing it.

### Candidate gap and depth

- `min_gap_sec=30` controls Pass-1 diversity.
- `top_n × 3` controls how many frames reach DeepFace.
- More deep candidates improve recovery when quadrant winners are weak but
  increase model latency and retained frame memory.

### Expression mapping

Edit the `WEIGHTS` map or happy/surprise bonus only with a labeled fixture set.
These values encode thumbnail preference, not psychological truth. A lower
neutral weight can over-favor misclassified dramatic expressions.

### Crop padding

Current horizontal and lower padding are half a face dimension; upper padding
is one face height. Reduce padding for crowded gallery cells; increase it for
shoulders and compositing room. Clamp and inspect every crop.

## Import and first-run failures

### `ModuleNotFoundError: cv2` or `numpy`

Activate the intended environment and install the required packages from
[setup-and-models.md](setup-and-models.md). Avoid installing into an unrelated
system Python.

### DeepFace missing

Current behavior: Pass 1 completes, then Pass 2 fails at
`from deepface import DeepFace`. The old claim that OpenCV-only scoring still
completes is false for this script revision. Either install a compatible
DeepFace stack or intentionally modify the script to skip Pass 2 and promote
Pass-1 candidates.

### DeepFace model unavailable

Exceptions inside `DeepFace.analyze` are swallowed, producing neutral scores,
but import or framework initialization failures may still terminate. Run one
frame and log the exception while diagnosing; do not permanently hide setup
errors behind the broad catch.

### TensorFlow/Keras compatibility errors

DeepFace can impose narrow framework compatibility. Record Python and package
versions, reproduce in a fresh virtual environment, and prefer a known working
lock over upgrading packages independently.

## Output quality failures

### All outputs are neutral

- Confirm DeepFace actually initialized and did not fail inside every analysis.
- Inspect `num_smiles`, Pass-1 score, and full frames.
- Neutral labels do not make the visual candidates unusable.
- Do not rename emotions based on appearance without model/source evidence.

### No faces detected

- Verify the cascade loaded.
- Save and inspect a sampled downscaled frame.
- Increase `ANALYSIS_SCALE` for small gallery tiles.
- Tune `minSize`/`minNeighbors` against that fixture.
- Accept scene candidates when the source genuinely lacks suitable faces.

### Wrong face crop

The script chooses the largest detected face, which can be a slide portrait,
profile avatar, or audience tile. Use the full frame to select the intended
person. A future fix could score location, motion, persistence, or known layout
regions rather than size alone.

### Candidates cluster or miss a key moment

- Lower the sample interval.
- Lower the 30-second minimum gap only when several desired moments are close.
- Inspect quadrant winners and whether the final forced segments displace a
  globally stronger frame.
- Add a manually supplied time window when the desired section is known.

### Slides never appear

The current presentation floor is weak and the script has no slide exporter.
Use full-frame scores only as rough candidates, or explicitly restore/implement
the scene-cut design described in
[slide-vlm-implementation-history.md](slide-vlm-implementation-history.md).

## Performance and memory

### Slow Pass 1

- Increase sample interval.
- Lower analysis scale when faces remain large enough.
- Check whether random seeking is slow for the codec/container; transcode a
  seek-friendly local proxy when appropriate.
- Log elapsed time separately for video open, seek/decode, face detection, and
  edge/color calculations before optimizing.

### Slow Pass 2

- Reduce `top_n` or the `top_n × 3` candidate multiplier.
- Confirm model initialization happens once, not per candidate.
- Benchmark a single frame before the complete recording.

### Process killed or out of memory

Pass 1 holds metadata only, but Pass 2 stores every analyzed candidate frame
until final selection. Reduce deep candidate count or release nonfinal frames
earlier. Large full-resolution frames multiplied by many candidates can still
consume substantial memory.

### Video reports zero FPS or duration

The current probe returns zero duration and may scan nothing. Verify the input
with `ffprobe`, try a supported local container/codec, and fail visibly instead
of interpreting an empty manifest as “no interesting frames.”

## Background-removal failures

- Halos around hair: inspect current human-segmentation model options.
- Missing model download: run in an approved networked environment or pre-stage
  the model; do not silently upload the crop to a hosted remover.
- Transparent output absent from manifest: expected for the current separate
  script; update the manifest deliberately after verification.

## Historical parameters that are not current

The old skill listed `SCENE_THRESHOLD=27.0` and
`MIN_FACE_CONFIDENCE=0.80`. Neither exists in the bundled script. The historical
advanced extractor used different scene-cut and perceptual-hash parameters;
see the implementation-history reference rather than adding these names to the
current script without understanding the algorithm.
