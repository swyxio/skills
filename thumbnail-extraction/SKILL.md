---
name: thumbnail-extraction
description: "Extracts the most interesting frames from video files for thumbnail compositing. Detects faces, expressions, smiles, and presentation slides. Outputs full frames, face crops, and transparent cutouts. Use when asked to extract thumbnails, find interesting frames, grab screenshots from video, or create thumbnail candidates from recordings."
version: 0.1.0
---

# Video Thumbnail Extraction

## Overview
Automatically scan a local MP4 video (or YouTube URL via yt-dlp) and extract the 4 most visually interesting frames — prioritizing expressive faces (laughing, shocked, smiling) and engaging presentation slides. Outputs full frames, face crops, and background-removed transparent PNGs ready for compositing.

## When to Use
- Before creating YouTube thumbnails (feeds into `youtube-thumbnails` skill)
- When you need the best screenshot from a long video recording
- When compositing a thumbnail and need transparent guest cutouts
- Processing Zoom gallery recordings, interviews, or presentations

## Dependencies

### Python packages (install once)
```bash
# In sandbox (Cowork VM):
pip install opencv-python scenedetect deepface pillow numpy --break-system-packages

# On host Mac (for background removal — sandbox can't download the model):
pip3 install 'rembg[cpu]' pillow --break-system-packages
```

### System tools
- `ffmpeg` (usually pre-installed)
- `python3` (3.10+)
- `yt-dlp` (optional, for YouTube URLs): `pip install yt-dlp --break-system-packages`

### Model downloads (first run)
- **DeepFace expression model** (~1MB): Downloads automatically on first use. If blocked by proxy, expression detection falls back to OpenCV smile cascade (still effective).
- **rembg u2net model** (~176MB): Downloads on first use. Must run on host Mac if sandbox blocks GitHub releases.

## Pipeline Architecture

### Two-Pass Design (memory-efficient)

**Pass 1 — Quick Scan** (OpenCV only, no deep learning)
- Sample a frame every 10 seconds across the video
- Skip first/last 60 seconds (intro/outro)
- For each frame:
  - Detect faces via Haar cascade (fast, no GPU needed)
  - Detect smiles within face regions
  - Compute visual variance (proxy for "interesting" content)
  - Detect presentation slides (high edge density + low color saturation)
- Score each frame based on: face count, smile count, smile size, visual variance
- Select top 12 diverse candidates using **quadrant system**: divide video into N time segments, pick best from each → ensures temporal spread

**Pass 2 — Deep Analysis** (DeepFace, only on top 12 candidates)
- Re-read only the selected frames from video
- Run DeepFace emotion detection (happy, surprise, fear, sad, angry, disgust, neutral)
- Weight emotions by thumbnail value: happy > surprise > fear > angry > sad > neutral
- Combine Pass 1 score with expression score
- Final selection: divide candidates into N time segments, pick best from each → guarantees spread across the full video

**Pass 3 — Output** (rembg, only on final 4 frames)
- Save full frame as JPG (95% quality)
- Crop largest detected face with generous padding (0.5x)
- Run background removal on face crop → transparent PNG
- Generate manifest JSON with metadata

### Scoring Heuristics

| Signal | Weight | Notes |
|--------|--------|-------|
| Face detected | +2.0 per face (cap 3) | Gallery views score high |
| Smile detected | +3.0 per smile | Cascade-based, no model needed |
| Smile size ratio | +5.0 × ratio | Bigger smiles = more expressive |
| Multi-person shot | +1.0 bonus | 2+ faces = engaging |
| Happy expression | +2.0 bonus (Pass 2) | Best for thumbnails |
| Surprise expression | +2.0 bonus (Pass 2) | Eye-catching |
| Fear/angry expression | +1.0 bonus (Pass 2) | "Shocked" reactions |
| Visual variance | +0.0–1.5 | Normalized by frame complexity |
| Presentation slide | baseline 1.5 | Useful for slide screenshots |

### Temporal Diversity Algorithm

The pipeline enforces temporal spread to avoid clustering picks in one segment:

1. **Quadrant selection** (Pass 1 → Pass 2): Divide video duration into N segments, pick the highest-scoring frame from each segment
2. **Segment-forced selection** (Pass 2 → Final): Divide top candidates into `top_n` equal time segments, pick best from each
3. Fallback: If any segment is empty, fill from overall top scores

This ensures a 76-minute video yields picks from different parts (e.g., 1:00, 2:10, 21:50, 48:50) rather than clustering in the most face-heavy section.

## Usage

### Command Line
```bash
python3 thumbnail_extractor.py <video_path> [output_dir] [top_n]
```

**Arguments:**
- `video_path` — Path to MP4 file (required)
- `output_dir` — Where to save outputs (default: `~/Downloads/thumb_candidates`)
- `top_n` — Number of candidates to extract (default: 4)

**Examples:**
```bash
# Basic — extract 4 best frames
python3 thumbnail_extractor.py "GMT20260130-210038_Recording_gallery_2380x1544.mp4"

# Custom output dir and count
python3 thumbnail_extractor.py recording.mp4 ./thumbs 6

# YouTube video (download first)
yt-dlp -o "video.mp4" "https://youtube.com/watch?v=..."
python3 thumbnail_extractor.py video.mp4
```

### Output Files

For each candidate, the pipeline generates:

| File | Format | Description |
|------|--------|-------------|
| `{name}_{n}_{emotion}_{timestamp}_full.jpg` | JPG 95% | Full video frame |
| `{name}_{n}_{emotion}_{timestamp}_face.jpg` | JPG 95% | Cropped face with padding |
| `{name}_{n}_{emotion}_{timestamp}_transparent.png` | PNG w/ alpha | Background-removed face cutout |
| `{name}_manifest.json` | JSON | Metadata for all candidates |

**Naming example:** `GMT20260130-210038_3_happy_2-10_full.jpg`
- `GMT20260130-210038` — video name (truncated for Zoom recordings)
- `3` — candidate number (ranked by score)
- `happy` — detected dominant emotion
- `2-10` — timestamp (2 minutes 10 seconds)
- `full` / `face` / `transparent` — file type

### Manifest JSON Structure
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
        "full": "..._full.jpg",
        "face_crop": "..._face.jpg",
        "transparent": "..._transparent.png"
      }
    }
  ]
}
```

## Background Removal (Separate Step)

Since the Cowork sandbox may block model downloads, run rembg on the host Mac:

```bash
# On host Mac (via osascript or Terminal)
cd ~/Downloads/thumb_candidates
python3 -c "
from rembg import remove
from PIL import Image
import glob, os

for f in sorted(glob.glob('*_face.jpg')):
    out = f.replace('_face.jpg', '_transparent.png')
    print(f'Processing {f}...')
    img = Image.open(f)
    result = remove(img)
    result.save(out)
    print(f'  -> {out} ({os.path.getsize(out)//1024}KB)')
"
```

This takes ~10-15 seconds per image on Apple Silicon. The u2net model downloads automatically on first run (~176MB).

## Integration with Other Skills

### Feeding into `youtube-thumbnails`
After extraction, use the transparent PNGs as compositing elements:
1. Pick the best face cutout from the candidates
2. Use it in the Gemini thumbnail prompt as a reference, or
3. Composite it manually onto the generated Gemini background using ImageMagick:

```bash
# Composite transparent face onto Gemini-generated background
convert gemini_background.jpg transparent_face.png \
  -gravity southeast -geometry +50+50 \
  -composite final_thumbnail.jpg
```

### Pipeline flow
```
[Video MP4] → thumbnail-extraction → [face crops + transparent PNGs]
                                          ↓
                                   youtube-thumbnails → [Gemini background]
                                          ↓
                                   [Composite final thumbnail]
```

## Tuning Parameters

Edit these at the top of `thumbnail_extractor.py`:

| Parameter | Default | Effect |
|-----------|---------|--------|
| `SAMPLE_INTERVAL_SEC` | 10 | Lower = more frames scanned, slower |
| `ANALYSIS_SCALE` | 0.5 | Lower = faster face detection, less accurate |
| `SCENE_THRESHOLD` | 27.0 | Lower = more scene boundaries detected |
| `MIN_FACE_CONFIDENCE` | 0.80 | Higher = fewer false positive faces |
| `top_n` | 4 | Number of final candidates |

For short videos (<10 min), consider `SAMPLE_INTERVAL_SEC=5` for finer coverage.

## Troubleshooting

- **OOM / killed process**: The v2 pipeline never holds more than 1 frame in memory during Pass 1. If still OOM, increase `SAMPLE_INTERVAL_SEC` to 15-20.
- **All emotions "neutral"**: DeepFace model couldn't download (proxy block). Pass 1 smile detection still works — look at the `num_smiles` field in the manifest.
- **Face crop is wrong person**: The pipeline picks the largest detected face. In screenshare mode, this may be a profile picture rather than a webcam face. Check the full frame to verify.
- **No faces detected**: Zoom gallery recordings with "shared screen with gallery view" work best. Solo speaker view may have the face too close/large for the cascade detector — try lowering `ANALYSIS_SCALE` to 0.3.
- **Background removal artifacts**: rembg's u2net can produce halos around hair. For cleaner results, try the `u2net_human_seg` model: `remove(img, model_name='u2net_human_seg')`.
- **Slow processing**: A 76-minute video takes ~2 minutes for Pass 1, ~15 seconds for Pass 2 (12 candidates), and ~60 seconds for bg removal (4 faces). Most time is in Pass 1 scanning.
