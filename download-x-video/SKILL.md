---
name: download-x-video
description: Download video from X/Twitter posts using yt-dlp. Use when the user wants to "download this X video", "save this tweet video", "grab video from Twitter", or provides an x.com/twitter.com status URL with a video. Handles HLS streams and uses --print after_move:filepath for reliable path detection.
---

# Download X/Twitter Video

Download video from X/Twitter posts via yt-dlp.

## Prerequisites

- Use an available, current `yt-dlp`; do not install packages without approval.

## Usage

```bash
python3 scripts/download_x_video.py "https://x.com/user/status/123/video/1" [/output/dir]
```

Prints the downloaded file path to stdout.

## How It Works

- Uses yt-dlp with `--print after_move:filepath` for reliable path detection
- Handles Twitter's HLS streaming format (fragmented MP4)
- Output template: `x_video_<tweet_id>.<ext>` in the specified directory

## Troubleshooting

### yt-dlp auth errors

If Twitter requires login, yt-dlp may need cookies:

```bash
yt-dlp --cookies-from-browser chrome "https://x.com/..."
```
