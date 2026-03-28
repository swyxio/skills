---
name: youtube-api
description: |
  Manage YouTube videos programmatically via the YouTube Data API v3 — upload video files, upload custom thumbnails, update video metadata (titles, descriptions, tags), and query video/channel info without touching YouTube Studio's browser UI. Use this skill whenever the user wants to: upload a local video file to YouTube; set, update, or change a YouTube video's thumbnail from a local image file; batch-set thumbnails across multiple videos; update video titles, descriptions, or tags programmatically; query their channel's video list; or do anything involving the YouTube Data API. Triggers: "upload to youtube", "upload video", "set thumbnail", "upload thumbnail", "change thumbnail", "YouTube API", "batch thumbnails", "update video title", "update video description", "youtube metadata", or any reference to programmatically managing YouTube videos. Also use when the browser-based YouTube Studio upload is unreliable or slow.
license: MIT
compatibility: |
  Requires Python 3.8+ with google-api-python-client, google-auth-oauthlib, and google-auth.
  Works on macOS, Linux, and Windows. Requires a Google Cloud project with YouTube Data API v3 enabled
  and OAuth 2.0 Desktop credentials. One-time browser-based OAuth consent required on the user's
  local machine before headless/Cowork use.
metadata:
  author: swyxio
  version: "1.0"
  last-updated: "2026-03-28"
  primary-tools: YouTube Data API v3, Python, Google OAuth 2.0
---

# YouTube API

Manage YouTube videos programmatically — uploads, thumbnails, metadata, and queries — via the YouTube Data API v3, completely bypassing the YouTube Studio browser UI.

## Why This Skill Exists

YouTube Studio's browser UI is unreliable for bulk operations and awkward for automation. The file picker for thumbnails is flaky, editing metadata for multiple videos is tedious, and browser uploads can stall or reset. This skill wraps the YouTube Data API v3 with OAuth2 authentication and persistent token caching, so once set up, uploads and follow-up edits are fully scriptable — including across Cowork VM resets.

## Prerequisites

### Python Dependencies

```bash
pip install google-api-python-client google-auth-oauthlib google-auth --break-system-packages
```

### Google Cloud Project Setup (One-Time)

If the user hasn't set up YouTube API credentials yet, walk them through this. It takes about 5 minutes:

1. **Create/select a Google Cloud Project**
   - Go to [console.cloud.google.com](https://console.cloud.google.com)
   - Create a new project or select an existing one

2. **Enable the YouTube Data API v3**
   - Navigate to APIs & Services → Library
   - Search for "YouTube Data API v3" → click Enable

3. **Configure the OAuth consent screen**
   - Go to Google Auth Platform → Overview → "Get started"
   - App name: anything (e.g., "YouTube API Tool")
   - User support email: select the user's Google email
   - Audience: **External**
   - Contact email: the user's email
   - Agree to the Google API Services User Data Policy → Create

4. **Add the user as a test user** (critical — the app stays in Testing mode)
   - Go to Google Auth Platform → Audience
   - Under "Test users", click "+ Add users"
   - Add the Google email associated with their YouTube channel
   - Save

5. **Create OAuth 2.0 credentials**
   - Go to Google Auth Platform → Clients → "+ Create client"
   - Application type: **Desktop app**
   - Name: anything (e.g., "YouTube API Tool")
   - Click Create
   - **Download the JSON** — this is the `client_secret.json` file

6. **Store the credentials**

   On macOS/Linux (standard):
   ```bash
   mkdir -p ~/.config/youtube-api
   mv ~/Downloads/client_secret_*.json ~/.config/youtube-api/client_secret.json
   ```

   For Cowork persistence (survives VM resets):
   ```bash
   mkdir -p ~/Downloads/.youtube-api
   mv ~/Downloads/client_secret_*.json ~/Downloads/.youtube-api/client_secret.json
   ```

7. **Run the first-time OAuth flow** (must happen on the user's local machine — a browser opens)
   ```bash
   python <skill-path>/scripts/setup_auth.py
   ```
   This opens a browser for Google OAuth consent. The user signs in, authorizes the app, and a `token.pickle` is cached alongside the `client_secret.json`. After this, all subsequent runs (including in Cowork) are fully automatic.

   When the consent screen appears, it will warn the app is "unverified" — this is normal for testing mode. Click "Advanced" → "Go to [app name] (unsafe)" → allow access.

### Where Credentials Live

The scripts auto-detect the best credential location:

| Environment | Config directory | Persists across sessions? |
|---|---|---|
| Cowork | `/sessions/*/mnt/Downloads/.youtube-api/` | Yes (on user's real machine) |
| Standard | `~/.config/youtube-api/` | Yes |

Both `client_secret.json` and `token.pickle` must be in the same directory. The scripts check the Cowork path first, then fall back to the standard path.

## Operations

### Set Thumbnails

Upload custom thumbnail images to one or more YouTube videos.

**Single video:**
```bash
python <skill-path>/scripts/set_thumbnail.py --video-id VIDEO_ID --thumbnail /path/to/image.jpg
```

**Batch mode:**
```bash
python <skill-path>/scripts/set_thumbnail.py \
  --batch VIDEO_ID_1:/path/to/thumb1.jpg VIDEO_ID_2:/path/to/thumb2.jpg
```

**Thumbnail requirements:**
- Max size: 2 MB (compress with `convert input.jpg -resize 1280x720 -quality 85 output.jpg`)
- Formats: JPEG (recommended), PNG
- Dimensions: 1280x720 recommended (16:9 aspect ratio)

### Upload Videos

Upload a finished local video file directly to YouTube.

```bash
python <skill-path>/scripts/upload_video.py --file /path/to/video.mp4 --privacy unlisted
```

Optional metadata at upload time:

```bash
python <skill-path>/scripts/upload_video.py \
  --file /path/to/video.mp4 \
  --privacy unlisted \
  --title "Video Title" \
  --description "Optional description" \
  --tags "tag1,tag2"
```

### Update Video Metadata

Update titles, descriptions, and/or tags for one or more videos.

**Single video:**
```bash
python <skill-path>/scripts/update_metadata.py --video-id VIDEO_ID \
  --title "New Title" \
  --description "New description" \
  --tags "tag1,tag2,tag3"
```

**Batch mode (from JSON):**
```bash
python <skill-path>/scripts/update_metadata.py --batch updates.json
```

Where `updates.json` looks like:
```json
[
  {"video_id": "abc123", "title": "New Title", "description": "New desc"},
  {"video_id": "def456", "tags": ["tag1", "tag2"]}
]
```

Only the fields you specify are updated — everything else is preserved.

### List Channel Videos

Query the authenticated user's channel for their uploaded videos.

```bash
python <skill-path>/scripts/list_videos.py [--max-results 50]
```

Returns video IDs, titles, publish dates, and thumbnail URLs. Useful for building batch operations.

## API Quota

- `thumbnails.set`: 50 units per call
- `videos.update`: 50 units per call
- `videos.list`: 1 unit per call
- `search.list`: 100 units per call
- Default daily quota: 10,000 units → ~200 thumbnail uploads or metadata updates per day
- If you hit quota limits, wait until the next day or request a quota increase in Google Cloud Console → APIs & Services → Quotas

## Troubleshooting

| Error | Cause | Fix |
|---|---|---|
| "token has been expired or revoked" | OAuth token expired beyond refresh | Delete `token.pickle` from the config directory (shown at startup) and re-run `setup_auth.py` |
| "quotaExceeded" | Hit daily API quota | Wait until tomorrow or request a quota increase |
| "forbidden" or "thumbnailsNotAccessible" | Account lacks custom thumbnail permission | Verify the YouTube account is in good standing with custom thumbnails enabled |
| "The caller does not have permission" | Not a test user on the OAuth consent screen | Add the Google email as a test user in Google Auth Platform → Audience |
| "fileNotFound" on image | Bad file path | Check the file path; the script validates before uploading |
| Image too large | Over 2 MB | Compress: `convert input.jpg -resize 1280x720 -quality 85 output.jpg` |
| Browser doesn't open for OAuth | Running in headless/Cowork environment | Run `setup_auth.py` on your local machine first, then copy `token.pickle` to the Cowork config directory |

## Integration with Other Pipelines

This skill works well as the final step in content pipelines. For example, after generating thumbnails with an image generation tool:

```bash
# Generate thumbnails, then upload them
python <skill-path>/scripts/set_thumbnail.py \
  --batch \
  xUy0vno25k0:~/Downloads/thumb_feb4.jpg \
  LJFL6bYyGHg:~/Downloads/thumb_feb13.jpg \
  s5bTZfYUcac:~/Downloads/thumb_feb18.jpg
```
