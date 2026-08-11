# Setup, dependencies, and model downloads

Read this reference when bootstrapping the bundled
`thumbnail_extractor.py`, diagnosing an import/model failure, or enabling the
separate background-removal step. Check the current environment before
installing anything.

## Current executable dependency map

| Capability | Dependency | Current bundled behavior |
|---|---|---|
| Video decode, frame seeking, Haar face/smile detection, JPEG output | `opencv-python` (`cv2`) | Required at import time |
| Numeric variance, saturation, edge calculations | `numpy` | Required at import time |
| Expression analysis | `deepface` and its runtime dependencies | Imported unconditionally when Pass 2 begins; the current script does not catch a missing package |
| Paths and JSON manifest | Python standard library | Required |
| Background removal | `rembg`, Pillow | Separate manual step; not imported or run by the bundled extractor |
| YouTube acquisition | `yt-dlp` | Separate input-preparation step |
| Media inspection/conversion | `ffmpeg` | Useful externally; not called by the current candidate-only script |
| Scene/slide extraction | `ffmpeg` plus historical code | Not present in the current script; see the implementation-history reference |

Python 3.10+ was the historical target. Verify the current DeepFace/TensorFlow
compatibility matrix before choosing a Python version on a new machine.

## Recommended isolated bootstrap

Use the repository's environment if one exists. Otherwise, with approval:

```bash
cd /path/to/skills/thumbnail-extraction
uv venv .venv
source .venv/bin/activate
uv pip install numpy opencv-python deepface pillow
```

For optional local background removal:

```bash
uv pip install 'rembg[cpu]' pillow
```

For optional source acquisition and media diagnostics, use the platform's
approved package manager. Historical macOS commands were:

```bash
brew install ffmpeg yt-dlp
```

Do not install every optional package merely to extract candidate JPGs.

## Historical sandbox/host commands

The original skill recorded these commands:

```bash
# Historical Cowork sandbox command
pip install opencv-python scenedetect deepface pillow numpy --break-system-packages

# Historical host-Mac command for background removal
pip3 install 'rembg[cpu]' pillow --break-system-packages

# Historical yt-dlp installation
pip install yt-dlp --break-system-packages
```

They are retained to explain old environments, not as the current default.
`--break-system-packages` modifies an externally managed Python environment and
should be replaced by a virtual environment unless the user explicitly chooses
otherwise. `scenedetect` is not imported by the current bundled script.

## First-run model behavior

### OpenCV cascades

The face and smile XML cascades come from `cv2.data.haarcascades`; there is no
separate download when OpenCV is installed correctly. Diagnose empty cascade
objects before blaming frame content:

```python
assert not face_cascade.empty(), "OpenCV face cascade failed to load"
assert not smile_cascade.empty(), "OpenCV smile cascade failed to load"
```

### DeepFace

The April 2026 notes described the expression model as an automatic first-run
download of roughly 1 MB. DeepFace's dependency/model behavior can vary by
version and backend; run one candidate in the intended environment before a
long video. If the environment cannot download the model, the current script
does not actually fall back—it must be changed or run with a working DeepFace
installation.

### rembg

The original background-removal workflow used a U²-Net model observed around
176 MB, downloaded on first use. A sandbox that blocked model-host downloads
required running this separate step on the host Mac. Current model names,
download URLs, package extras, and sizes may differ.

Do not upload frames or fetch hosted models through a restricted environment
without approval. Record where models are cached when repeatability matters.

## Smoke checks

```bash
source .venv/bin/activate
python -c 'import cv2, numpy; print(cv2.__version__, numpy.__version__)'
python -c 'from deepface import DeepFace; print("DeepFace import ok")'
python thumbnail_extractor.py /path/to/short-test.mp4 /tmp/thumb-smoke 1
```

Use a short local fixture before a long recording. Verify that the output
contains a full JPG and manifest entry, not merely a zero exit status.
