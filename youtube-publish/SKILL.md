---
name: youtube-publish
description: >
  Use when the user explicitly asks to upload, publish, or edit YouTube video
  metadata in Studio, including titles, descriptions, timestamps, playlists, or
  visibility. Do not infer publication from a request to prepare an upload.
version: 0.1.0
---

# YouTube Video Publishing & Metadata

## Overview
Upload or edit video metadata in YouTube Studio. Treat publication and
visibility as explicit user choices.

## Step-by-Step Workflow

### 1. Upload Videos
- Navigate to YouTube Studio → Content → click **Create** → **Upload videos**
- **Browser limitation**: File inputs cannot be set programmatically. The user must manually select files in the file picker dialog.
- Upload all files, wait for processing to complete (YouTube shows a progress indicator)

### 2. Set Title
Use this format based on content type (determined from frame extraction or meeting name):

| Content Type | Title Format | Example |
|---|---|---|
| Weekly Jam (demo) | `[Topic/Demo]: AI in Action [D Mon YYYY]` | SpaceMolt - AI Agents in Multiplayer Space Games: AI in Action 7 Feb 2026 |
| Weekly Jam (talk) | `[Topic]: AI in Action [D Mon YYYY]` | Recursive Language Models & Reasoning Trees: AI in Action 31 Jan 2026 |
| Paper Club | `[Paper Short Name] Paper Reading: AI in Action [D Mon YYYY]` | RL via Self-Distillation (SDPO) Paper Reading: AI in Action 12 Feb 2026 |
| Guest session | `[Topic]: [Guest] and swyx [D Mon YYYY]` | — |

Keep titles **under 100 characters**. Topic first for discoverability; series name and date at the end.

### 3. Set Description
Template:
```
Latent Space [Series Name] - [D Mon YYYY]

[Presenter name] [presents/demos/discusses] [brief 1-2 sentence description of content].

[Optional: Paper link, e.g., "Paper: https://arxiv.org/abs/XXXX.XXXXX"]

Timestamps:
[HH:MM:SS] - [Section description]
[HH:MM:SS] - [Section description]
...

Participants: [names visible in gallery view]

Join the Latent Space community: https://latent.space
```

#### Generating Timestamps
Use frame extraction data (from the `zoom-download` skill) to identify natural section breaks:
- **Slide changes** = new topic or section
- **Demo start/end** = transition points
- **Q&A segments** = usually at the end
- **Paper sections** (for Paper Club) = introduction, method, results, discussion

Format as `MM:SS` for videos under 1 hour, `H:MM:SS` for longer. YouTube auto-links timestamps in descriptions.

Aim for **5-10 timestamps** per video. Each entry should represent a meaningful shift in content.

### 4. Set Playlist
On the Details page, under **Playlists** → click **Select**:

| Content Type | Playlist |
|---|---|
| AI in Action Weekly Jam (demos, presentations, talks) | **AI in Action** |
| Paper readings / Paper Club sessions | **Paper Club** |

How to tell them apart:
- Zoom meeting name "AI in Action Weekly Jam!" → **AI in Action** playlist
- Meeting names like "[Person] and swyx" with arxiv papers on screen → **Paper Club** playlist
- When unclear, check frame extractions for arxiv links or paper titles → Paper Club

### 5. Other Settings
- **Audience**: "No, it's not made for kids" (usually already default)
- **Visibility**: use the visibility requested by the user; default to a saved
  draft or unlisted staging state when the request does not authorize release.
- Do not publish immediately merely because processing completed.

### 6. YouTube Studio Navigation Flow
For each video:
```
Details → (title, description, playlist) → Next →
Video Elements → Next →
Checks → (wait for checks to pass) → Next →
Visibility → (select Unlisted) → Save/Publish
```

Repeat for each video, saving and verifying one item before moving to the next.

### 7. Verify
After publishing, confirm:
- Video URL is accessible (shown on the Details page under "Video link")
- Title, description, and playlist are correct
- Status shows "Unlisted" (not "Draft" or "Private")

## Troubleshooting
- **"Processing…" stuck**: YouTube processing can take 5-30 minutes for long videos. Wait and refresh.
- **Checks show warnings**: surface the warning and ask for the user's decision;
  do not dismiss copyright or policy warnings automatically.
- **Wrong channel**: If you see unfamiliar videos in Content, you're on the wrong channel. Switch accounts via the avatar menu.
- **Duplicate uploads**: Check the Content list for videos with the same duration/date before uploading. The `_gvo_` filename suffix indicates a gallery-view-only duplicate that should not be uploaded.
