---
name: youtube-api
description: Use the YouTube Data API v3 scripts to upload a local video, set a thumbnail, update metadata, or list videos for the authenticated channel. Trigger for programmatic YouTube video management; do not trigger for Studio-only controls, general YouTube strategy, or a multi-channel operator architecture.
license: MIT
compatibility: Requires Python 3.8+, the Google YouTube client/auth packages, a Google Cloud project with the YouTube Data API enabled, and OAuth 2.0 credentials. The first authorization needs a user-controlled browser.
metadata:
  author: swyxio
  version: "1.0"
  last-updated: "2026-03-28"
  primary-tools: YouTube Data API v3, Python, Google OAuth 2.0
---

# YouTube API

Use the scripts in this folder for one-off or small-batch API operations. Read
the current [YouTube Data API documentation](https://developers.google.com/youtube/v3/docs)
before relying on quotas, mutable fields, media limits, or OAuth scope details.

## Setup and credential boundary

1. Enable the YouTube Data API in a Google Cloud project and create OAuth
   credentials for a user-controlled desktop or server flow.
2. Install the packages required by the scripts in the project's environment.
3. Run `scripts/setup_auth.py` on a machine where the user can complete the
   browser consent flow. Keep the client secret and cached refresh token in a
   user-approved private credential directory with restrictive permissions.
4. Never commit, print, upload, or paste `client_secret.json`, token caches,
   Authorization headers, or refresh tokens. Do not copy a token into a VM or
   another channel's credential namespace without explicit authorization.

The shared `scripts/yt_auth.py` module detects the supported local/headless
credential locations. Inspect that code and the user's environment rather than
assuming a particular home, Cowork, or mounted-Downloads path.

## Script entry points

```bash
python3 scripts/setup_auth.py
python3 scripts/upload_video.py --file /path/video.mp4 --privacy unlisted
python3 scripts/set_thumbnail.py --video-id VIDEO_ID --thumbnail image.jpg
python3 scripts/update_metadata.py --video-id VIDEO_ID --title "New title"
python3 scripts/list_videos.py --max-results 50
```

Confirm the installed script's `--help` output before adding flags. For batch
metadata or thumbnail work, validate every input path and video ID before the
first write and preserve the full current metadata fields that the API replaces
as a unit.

## External-write rules

- Resolve the authenticated channel with `channels.list(mine=true)` before a
  write. Do not infer the target channel from a title, filename, or browser
  account.
- Default new uploads to the least-public visibility the user requested;
  never make a video public implicitly.
- Treat upload, thumbnail, metadata, playlist, and caption calls as separate
  writes. Preview the target ID, desired fields, visibility, and media before
  executing a batch.
- YouTube update requests may have replacement semantics for an included
  resource part. Fetch the current part, merge the intended patch, and avoid
  accidentally clearing fields not named by the user.
- Refetch the owning video after a mutation and report the exact result. A
  successful HTTP response or upload receipt is not proof that the intended
  metadata is live.

## Handoff boundaries

Use `youtube-studio-computer-use` for Studio-only controls such as native
experiments or editor operations. Use `youtube-channel-operator` when account
isolation, shared approvals, durable multi-step execution, or analytics
follow-up is the primary design problem. Use `transcribe-anything` or
`youtube-thumbnails` for their respective media stages.
