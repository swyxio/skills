---
name: zoom-download
description: >
  This skill should be used when the user asks to "download Zoom recordings",
  "grab recordings from Zoom", "get new Zoom videos", or needs to download
  cloud recordings and analyze their content via frame extraction. Covers
  file type selection, filename verification, and ffmpeg-based content analysis.
version: 0.1.0
---

# Zoom Cloud Recording Download

## Overview
Download recent Zoom cloud recordings, selecting the correct file type and skipping already-uploaded content. Optionally delete old recordings from Zoom after confirming they've been uploaded.

## Which Recordings to Download
- **"AI in Action Weekly Jam!"** meetings → weekly demos/presentations
- **Paper Club / guest sessions** (e.g., "[Person] and swyx") → paper readings
- **Skip** recordings under ~10 minutes (test calls, false starts)
- **Cross-check** against existing YouTube content to avoid re-downloading

## Choosing the Correct File Type
**CRITICAL**: Zoom offers 6+ file types per recording. Always download:

| File Type | Download? | Notes |
|-----------|-----------|-------|
| Shared screen with gallery view | **YES** | Screen share + all webcams |
| Gallery view | NO | Webcams only, no screen share |
| Shared screen with speaker view | NO | Only shows active speaker |
| Speaker view | NO | Single speaker webcam |
| Audio only | NO | No video |
| Chat file | NO | Text chat log |

### Filename Identification
- **Correct**: `GMT[date]_Recording_gallery_[resolution].mp4` — the `_gallery_` suffix (NOT `_gvo_`)
- **Wrong**: `GMT[date]_Recording_gvo_[resolution].mp4` — `_gvo_` = gallery view only = no screen share

### How to Download
1. Navigate to `zoom.us/recording` (log in via Google SSO if needed)
2. On each recording's detail page, locate the **"Shared screen with gallery view"** row
3. Hover over the row to reveal the download button (appears on the right)
4. Click download — file saves to ~/Downloads
5. Wait for download to complete before moving to the next recording

## Content Analysis via Frame Extraction
After downloading, extract frames to understand what each video contains:

```bash
# Extract 7 frames at ~5 min intervals (covers a ~1hr video)
for t in 60 300 600 1200 1800 2400 3000; do
  ffmpeg -ss $t -i "video_file.mp4" -vframes 1 -q:v 2 "frame_${t}s.jpg" -y 2>/dev/null
done
```

Visually analyze the extracted frames to identify:
- **Slide titles** and presentation content
- **Presenter names** (from Zoom name labels in gallery view)
- **Paper titles**, arxiv links, or references visible on screen
- **Demo names** and tools being shown
- **Participant names** visible in the gallery

Save these notes — they feed into the `youtube-publish` skill for titling and description.

## Deleting Old Recordings from Zoom
After confirming videos are successfully uploaded and published on YouTube:
- Navigate back to `zoom.us/recording`
- Select the recordings that have been uploaded
- User must perform the actual deletion (permanent deletion is a prohibited action)
- Inform the user which recordings are safe to delete

## Troubleshooting
- **Multiple recordings for same meeting**: Zoom sometimes splits long meetings. Download all parts.
- **"Shared screen with gallery view" not available**: The host may not have shared their screen. Download "Gallery view" as a fallback and note this in the YouTube description.
- **Large files (>2GB)**: Downloads may take several minutes. Don't start the next download until the current one finishes.
