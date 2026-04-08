---
name: zoom-to-youtube
description: >
  This skill should be used when the user asks to "upload Zoom recordings to YouTube",
  "publish Zoom videos", "download and upload recordings", or wants to run the full
  Zoom-to-YouTube pipeline. It orchestrates the zoom-download, youtube-publish, and
  youtube-thumbnails sub-skills with checkpoint stages between each phase.
version: 0.1.0
---

# Zoom Cloud Recordings → YouTube Pipeline

## Overview
End-to-end workflow to download Zoom cloud recordings, upload them to YouTube with proper metadata, and generate custom thumbnails. This is an **orchestrator skill** — each stage is handled by a focused sub-skill that can also be used independently.

The pipeline has **checkpoint stages** between each action phase. At each checkpoint, gather context, present a summary to the user, and get confirmation before proceeding. This catches mismatches, duplicates, and edge cases early.

---

## Stage 0: Pre-Flight Scan

**Goal**: Understand the current state of both Zoom and YouTube before doing anything.

### 0a. Scan Zoom Recordings
- Navigate to `zoom.us/recording` (log in via Google SSO if needed)
- List all recent recordings: meeting name, date, duration
- Note which have "Shared screen with gallery view" available vs only "Gallery view"

### 0b. Scan YouTube Channel Content
- Navigate to YouTube Studio → Content (Videos tab)
- **Verify you're on the correct channel** — check the channel name in the sidebar
- List recent uploads: title, date, status (Published/Unlisted/Draft)

### 0c. Cross-Reference & Present Plan
Compare the two lists and identify:
- **New recordings** on Zoom that don't yet exist on YouTube (match by date and meeting name)
- **Already uploaded** recordings (skip these)
- **Unusual situations** to flag:
  - Recordings with no "Shared screen with gallery view" (host didn't share screen?)
  - Very short recordings (<10 min — test calls?)
  - Very long recordings (>2 hrs — may need splitting or was left running?)
  - Multiple recordings for the same meeting (Zoom split it?)
  - Recordings from unknown/unexpected meeting names
  - Draft or Private videos on YouTube that might be incomplete uploads from a previous attempt

**→ CHECKPOINT: Present the user a table like this and ask for confirmation:**
```
Zoom recordings found:
  1. AI in Action Weekly Jam! — 7 Feb 2026 — 53:46 — NEW, will download
  2. AI in Action Weekly Jam! — 31 Jan 2026 — 58:45 — Already on YouTube, skip
  3. Johan Duramy and swyx — 12 Feb 2026 — 56:22 — NEW (Paper Club), will download

Flags:
  - None

Proceed with downloading #1 and #3?
```

Wait for user confirmation. They may say "skip #3" or "also grab the Jan 31 one" etc.

---

## Stage 1: Download from Zoom

**Sub-skill**: `zoom-download`

Only download the recordings confirmed in Stage 0. For each:
- Download **"Shared screen with gallery view"** only
- Verify filename contains `_gallery_` (not `_gvo_`)
- Extract frames with ffmpeg for content analysis

**→ CHECKPOINT: Present download results and frame analysis:**
```
Downloaded 2 recordings:
  1. Feb 7 — SpaceMolt demo by Ian Langworth (statico)
     - 53:46, screen share shows space game UI
     - Participants: Ian, swyx, Sebastian, Ted
     - Type: AI in Action (weekly jam demo)

  2. Feb 12 — SDPO paper reading by Ted Kyi
     - 56:22, screen share shows arxiv paper
     - Paper: Self-Distillation Preference Optimization
     - Participants: Ted, Johan, swyx
     - Type: Paper Club

Proposed titles:
  1. "SpaceMolt - AI Agents in Multiplayer Space Games: AI in Action 7 Feb 2026"
  2. "RL via Self-Distillation (SDPO) Paper Reading: AI in Action 12 Feb 2026"

Proposed playlists:
  1. → AI in Action
  2. → Paper Club

Any changes to titles or classifications?
```

Wait for user feedback. They might correct a presenter name, adjust the title wording, or reclassify a video.

---

## Stage 2: Upload & Publish on YouTube

**Sub-skill**: `youtube-publish`

- User manually uploads the downloaded files to YouTube Studio (browser file picker limitation)
- For each video, set:
  - Title (as confirmed in Stage 1 checkpoint)
  - Description with timestamps
  - Playlist assignment
  - Visibility: Unlisted, publish immediately

**→ CHECKPOINT: Present published video summary:**
```
Published 2 videos:
  1. "SpaceMolt - AI Agents in Multiplayer Space Games: AI in Action 7 Feb 2026"
     - URL: https://youtu.be/XXXXX
     - Playlist: AI in Action
     - Status: Unlisted ✓

  2. "RL via Self-Distillation (SDPO) Paper Reading: AI in Action 12 Feb 2026"
     - URL: https://youtu.be/YYYYY
     - Playlist: Paper Club
     - Status: Unlisted ✓

Ready to generate thumbnails?
```

---

## Stage 3: Generate & Set Thumbnails

**Sub-skill**: `youtube-thumbnails`

- Open Gemini, enable Create Images in Pro mode
- Generate one thumbnail per video using content-appropriate prompts
- Compress all to under 2MB
- Upload to YouTube Studio

**→ CHECKPOINT: Confirm thumbnails are set:**
```
Thumbnails set:
  1. SpaceMolt — space-themed, neon ships & asteroids ✓
  2. SDPO — academic brain/neural net with formulas ✓

All done! Anything to adjust?
```

---

## Stage 4: Cleanup

- Ask user if they want to delete the Zoom cloud recordings that were successfully uploaded
- User must perform the actual deletion (permanent deletion is a prohibited action)
- Optionally delete local downloaded .mp4 files from ~/Downloads to free space

---

## Sub-Skills

| Skill | Use Standalone When |
|---|---|
| `zoom-download` | Just need to grab recordings, no YouTube work |
| `youtube-publish` | Videos already downloaded, just need to upload & title |
| `youtube-thumbnails` | Videos already published, just need thumbnails |

## Common Pitfalls

1. **Wrong Zoom file**: `_gvo_` = gallery view only (no screen share). Always use `_gallery_`.
2. **Wrong YouTube channel**: Studio may default to your primary channel. Switch accounts if needed.
3. **File upload limitation**: Browser security prevents programmatic file selection. User must pick files manually.
4. **Thumbnail too large**: Gemini Pro outputs ~3-4MB. Compress with `convert -resize 1280x720 -quality 85`.
5. **Left as Draft**: Always click through to Visibility → Unlisted → Save. Don't stop at Details.
6. **Skipping checkpoints**: Don't skip the confirmation stages. A wrong title or missed duplicate is much harder to fix after publishing.
