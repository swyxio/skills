# youtube-api

Manage YouTube videos programmatically through the YouTube Data API v3. This skill is for cases where YouTube Studio's browser UI is too slow, unreliable, or manual for the job at hand.

It covers the full flow: one-time OAuth setup, persistent credential storage, direct video uploads, custom thumbnail uploads, metadata updates, and listing videos from the authenticated channel.

## What This Skill Is Good For

- Setting or replacing a custom thumbnail from a local image file
- Batch-updating thumbnails across several videos
- Updating titles, descriptions, and tags without opening YouTube Studio
- Listing your channel videos so you can build scripted update jobs
- Reusing OAuth credentials across Cowork or other headless sessions
- Uploading a finished local video file directly as private, unlisted, or public

## Quick Start

### 1. Google Cloud Setup (~5 min, one-time)

1. Go to [console.cloud.google.com](https://console.cloud.google.com) → create/select a project
2. Enable **YouTube Data API v3** (APIs & Services → Library)
3. Configure **OAuth consent screen** (Google Auth Platform → Overview → Get started)
   - External audience, add your email as a test user
4. Create **OAuth credentials** (Google Auth Platform → Clients → Create client → Desktop app)
5. **Download the JSON** file

### 2. Local Auth (~1 min, one-time)

```bash
# Install deps
pip3 install google-api-python-client google-auth-oauthlib google-auth

# Store credentials
mkdir -p ~/Downloads/.youtube-api
mv ~/Downloads/client_secret_*.json ~/Downloads/.youtube-api/client_secret.json

# Authorize (opens browser)
python3 scripts/setup_auth.py
```

### 3. Use

```bash
# Upload a video as unlisted
python3 scripts/upload_video.py --file /path/to/video.mp4 --privacy unlisted

# Set a thumbnail
python3 scripts/set_thumbnail.py --video-id VIDEO_ID --thumbnail thumb.jpg

# Update metadata
python3 scripts/update_metadata.py --video-id VIDEO_ID --title "New Title"

# List your videos
python3 scripts/list_videos.py
```

## Cowork / Headless

After running `setup_auth.py` once on your local machine, the cached `token.pickle` in `~/Downloads/.youtube-api/` persists across Cowork VM sessions automatically. No re-auth needed.

## See Also

Full details in [SKILL.md](./SKILL.md).
