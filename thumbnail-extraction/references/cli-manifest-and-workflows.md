# CLI, manifest, and downstream workflows

Read this reference when running the bundled extractor, consuming its output,
removing a crop background, or handing a selected frame to thumbnail creation
or YouTube publication.

## Current positional CLI

```text
python3 thumbnail_extractor.py <video_path> [output_dir] [top_n]
```

| Position | Meaning | Current default |
|---:|---|---|
| 1 | Existing local video path | required |
| 2 | Output directory | hard-coded historical sandbox path `/sessions/gifted-jolly-ptolemy/mnt/Downloads/thumb_candidates` |
| 3 | Number of final candidates | `4` |

Always pass an explicit output directory. The current default is environment-
specific. The script has no argparse parser and no `--help` flag.

## Candidate examples

```bash
cd /path/to/skills/thumbnail-extraction
source .venv/bin/activate

# Four candidates
python thumbnail_extractor.py /path/to/video.mp4 /path/to/thumb_candidates 4

# Six candidates
python thumbnail_extractor.py /path/to/video.mp4 /path/to/thumb_candidates 6

# Short smoke test with one output
python thumbnail_extractor.py /path/to/short-test.mp4 /tmp/thumb-smoke 1
```

Quote every path. The script exits when the input path does not exist.

## YouTube input preparation

Downloading is a separate authorized step; the extractor accepts only a local
path:

```bash
yt-dlp \
  -f 'bv*+ba/b' \
  --merge-output-format mp4 \
  -o '/path/to/input-video.%(ext)s' \
  "$VIDEO_URL"

python thumbnail_extractor.py /path/to/input-video.mp4 /path/to/thumb_candidates 4
```

Use the repository's download skill or existing media pipeline where available.
Respect source permissions and avoid downloading unrelated renditions.

## Actual output names

For each final candidate:

```text
<video>_<index>_<emotion>_<timestamp>_full.jpg
<video>_<index>_<emotion>_<timestamp>_face.jpg     # only when a face was detected
```

Manifest:

```text
<video>_manifest.json
```

The script writes JPGs at quality 95. It does not currently create transparent
PNGs or slide exports. For video stems beginning with `GMT`, it keeps only the
prefix before the first underscore, matching an old Zoom-recording convention.

## Complete current manifest schema

```json
{
  "video": "GMT20260130-210038",
  "candidates": [
    {
      "index": 1,
      "timestamp": "2:10",
      "timestamp_sec": 130.0,
      "emotion": "happy",
      "emotion_score": 0.85,
      "combined_score": 12.4,
      "num_faces": 3,
      "is_presentation": false,
      "files": {
        "full": "GMT20260130-210038_1_happy_2-10_full.jpg",
        "face_crop": "GMT20260130-210038_1_happy_2-10_face.jpg"
      }
    }
  ]
}
```

`face_crop` is optional. The current manifest does not include source path,
dimensions, runtime, model version, raw Pass-1 score, detector thresholds, or a
transparent file. Consumers must not assume those fields exist.

## Background removal as a separate step

With explicit approval for the model download and a configured `rembg`
environment:

```bash
cd /path/to/thumb_candidates
python - <<'PY'
from pathlib import Path
from PIL import Image
from rembg import remove

for source in sorted(Path('.').glob('*_face.jpg')):
    target = source.with_name(source.name.replace('_face.jpg', '_transparent.png'))
    print(f'Processing {source} -> {target}')
    result = remove(Image.open(source))
    result.save(target)
PY
```

This does not update the extractor manifest automatically. If a downstream
consumer needs transparent paths, add them deliberately after verifying each
cutout. Historical notes observed roughly 10–15 seconds per crop on one Apple
Silicon Mac and a roughly 176 MB first-run model; re-measure current behavior.

For hair halos or poor edges, historical `rembg` guidance suggested a human-
segmentation model. Verify the current API/model name before changing it.

## Selection and compositing handoff

1. Inspect every full-frame candidate.
2. Reject false face detections, slide portraits, blurred frames, closed-eye
   frames, and contextually misleading reactions.
3. Select one or more candidate source images with the human.
4. Optionally create and inspect transparent cutouts.
5. Pass selected assets to `youtube-thumbnails` or another explicitly requested
   compositing workflow.

Historical ImageMagick shape:

```bash
magick gemini_background.jpg transparent_face.png \
  -gravity southeast \
  -geometry +50+50 \
  -composite final-thumbnail.jpg
```

Older systems may expose `convert` instead of `magick`. Verify dimensions,
safe-area placement, color profile, and final file-size requirements.

## YouTube publication choreography

Extraction and publication are separate authorities:

```text
local video
→ extract candidates
→ human selects source frame/crop
→ create and approve finished thumbnail
→ explicit request to update a specific YouTube video
→ use youtube-api/set-thumbnail workflow
→ verify the returned video ID and thumbnail state
```

Do not call YouTube merely because extraction completed. When publication is
authorized, confirm the target video ID, final image, account/channel, and any
platform size/format requirements immediately before upload. Preserve the
candidate manifest as provenance for the chosen source frame.
