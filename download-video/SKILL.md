---
name: download-video
description: |
  Downloads embedded videos from web pages. Fetches the page, identifies the video hosting service (Vimeo, YouTube, etc.), resolves the correct embed/player URL, and downloads using yt-dlp. Handles private/unlisted videos that require referer headers or embed URLs. Use this skill when someone says "download this video", "save this video", "grab the video from this page", "rip this video", or provides a URL and asks to download media from it. Also trigger when someone pastes a URL to a page with an embedded video and wants the video file locally.
license: MIT
compatibility: |
  Requires macOS or Linux with yt-dlp installed (brew install yt-dlp). curl_cffi Python package recommended for impersonation support (pip3 install curl_cffi). Internet connection required.
metadata:
  author: swyxio
  version: "1.1"
  last-updated: "2026-03-28"
  primary-tools: yt-dlp, WebFetch
---

# Download Video

This skill downloads embedded videos from web pages by inspecting the page source, identifying the video hosting service and embed URL, then using yt-dlp to download the video file.

## Why This Skill Exists

Many event replays, webinars, and talks are embedded on pages using private/unlisted video hosting (especially Vimeo). The direct video URL often returns 404 because the video is only accessible through the embed player with the correct referer. This skill handles that automatically.

## Prerequisites

Ensure yt-dlp is installed and up to date (older versions hit different errors):

```bash
which yt-dlp || brew install yt-dlp
brew upgrade yt-dlp
```

Install the impersonation library. On modern macOS (Python installed via Homebrew), the `--break-system-packages` flag is required:

```bash
pip3 install --break-system-packages curl_cffi
```

Note: `curl_cffi` alone does not fix private Vimeo downloads. The embed URL approach (Step 2) is what actually works. But `curl_cffi` prevents a misleading OAuth 400 error that obscures the real issue.

## How to Use This Skill

### Step 1: Fetch the Page and Identify the Video

Use WebFetch to inspect the target URL. Look for:

1. **iframe src** attributes pointing to video players
2. **video/source tags** with direct media URLs
3. **Schema.org VideoObject** metadata (`contentUrl`, `embedUrl`)
4. **JavaScript variables** containing video URLs or config objects
5. **Data attributes** on player container elements

Extract the video hosting service and any identifying info:

| Host | URL Pattern | Embed Pattern |
|---|---|---|
| Vimeo | `vimeo.com/{id}` | `player.vimeo.com/video/{id}` |
| YouTube | `youtube.com/watch?v={id}` | `youtube.com/embed/{id}` |
| Wistia | `fast.wistia.com/medias/{id}` | `fast.wistia.com/embed/medias/{id}` |
| Brightcove | varies | `players.brightcove.net/{account}/{player}/index.html?videoId={id}` |
| Loom | `loom.com/share/{id}` | `loom.com/embed/{id}` |

### Step 2: Resolve the Download URL

The direct URL (e.g., `vimeo.com/123456`) often fails for private/unlisted videos. Use the **embed/player URL** instead:

- **Vimeo**: Use `https://player.vimeo.com/video/{id}` instead of `https://vimeo.com/{id}`
- **YouTube**: The direct URL usually works, but embed URL works too
- **Wistia**: Use the embed URL with the media hash

If the video has a privacy hash (Vimeo `h=` parameter), include it:
```
https://player.vimeo.com/video/{id}?h={hash}
```

### Step 3: Download with yt-dlp

For Vimeo specifically, **skip the direct URL and go straight to the embed URL**. The direct URL almost always fails for private/unlisted videos. For other hosts, try in order and stop at the first that works.

**Attempt 1 — Embed/player URL (start here for Vimeo):**
```bash
yt-dlp "https://player.vimeo.com/video/{id}"
```

**Attempt 2 — With referer header** (if Attempt 1 returns 403):
```bash
yt-dlp --referer "{source_page_url}" "https://player.vimeo.com/video/{id}"
```

**Attempt 3 — With referer + origin headers:**
```bash
yt-dlp --referer "{source_page_url}" --add-header "Origin: {source_origin}" "https://player.vimeo.com/video/{id}"
```

**Attempt 4 — Direct URL (only for public videos or non-Vimeo hosts):**
```bash
yt-dlp "{video_url}"
```

### Step 4: Quality Selection (Optional)

If the user wants a specific quality:

```bash
# List available formats
yt-dlp -F "{url}"

# Download best quality (default)
yt-dlp -f "bestvideo+bestaudio" "{url}"

# Download specific resolution
yt-dlp -f "bestvideo[height<=1080]+bestaudio" "{url}"

# Download audio only
yt-dlp -f "bestaudio" -x --audio-format mp3 "{url}"
```

### Step 5: Output Location

By default yt-dlp saves to the current directory. To specify an output path:

```bash
yt-dlp -o "~/Downloads/%(title)s.%(ext)s" "{url}"
```

## Troubleshooting

### OAuth Token Error (Vimeo)
```
ERROR: Failed to fetch OAuth token: HTTP Error 400: Bad Request
```
This happens when yt-dlp tries the direct `vimeo.com/{id}` URL without impersonation support. Two things to do:
1. Install `curl_cffi`: `pip3 install --break-system-packages curl_cffi`
2. More importantly, **switch to the embed URL** — this is the actual fix. Even with `curl_cffi`, the direct URL will likely fail with a 404 (see below) because the video is private.

### 404 Not Found (Vimeo)
```
ERROR: Unable to download macos API JSON: HTTP Error 404: Not Found
```
This is what you get after installing `curl_cffi` and updating yt-dlp — the OAuth error goes away but the video still can't be found because it's private/unlisted on the direct URL. **Switch to the embed URL**:
- `vimeo.com/{id}` -> `player.vimeo.com/video/{id}`

The typical Vimeo error progression is: OAuth 400 -> (install curl_cffi + update yt-dlp) -> 404 -> (use embed URL) -> success.

### 403 Forbidden
```
ERROR: HTTP Error 403: Forbidden
```
**Fix**: Add the referer header from the source page:
```bash
yt-dlp --referer "{source_page_url}" "{embed_url}"
```

### Impersonation Warning
```
WARNING: The extractor is attempting impersonation, but no impersonate target is available
```
**Fix**: Install curl_cffi. This is a non-fatal warning but may cause downstream failures.

### Geo-restricted Content
```
ERROR: This video is not available in your country
```
**Fix**: Consider using a VPN. yt-dlp supports `--proxy` flag:
```bash
yt-dlp --proxy socks5://127.0.0.1:1080 "{url}"
```

## Real-World Example: OpenAI Forum Vimeo Embed

This is the exact sequence that works, tested on `forum.openai.com` event replay pages (2026-03-28):

```bash
# 1. Page has schema.org VideoObject with contentUrl: https://vimeo.com/1174947711
#    Direct URL fails (private video).

# 2. This works — use the player embed URL:
yt-dlp --referer "https://forum.openai.com/" "https://player.vimeo.com/video/1174947711"

# 3. yt-dlp downloads HLS fragments (484 in this case), merges video+audio.
#    Result: ~683MB MP4 file.
```

The referer wasn't strictly required for this specific video (Attempt 1 worked), but including it is good practice for Vimeo embeds.

## Common Video Page Patterns

### OpenAI Forum Events
- Videos are Vimeo embeds, video ID found in schema.org `contentUrl`
- Direct Vimeo URLs return 404 (private)
- Use `player.vimeo.com/video/{id}` — referer optional but recommended
- Downloads as HLS stream (many fragments), yt-dlp merges automatically

### Conference Talk Pages
- Often use Vimeo or YouTube embeds
- Check for `iframe` elements in the page source
- Some use custom players that wrap YouTube/Vimeo — look for the underlying embed URL

### Course/LMS Platforms
- Often use Wistia or Vimeo with domain restrictions
- Referer header is usually required
- May require cookies — use `--cookies-from-browser chrome` if needed

### Gradual/Event Platforms
- Many event replay platforms (like the one OpenAI Forum uses) are built on Gradual
- They store video metadata in schema.org VideoObject in the page head
- The `contentUrl` field has the Vimeo URL, but it's the public-facing URL that won't work for download
- Always convert to the `player.vimeo.com` embed form
