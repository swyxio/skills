---
name: youtube-thumbnails
description: >
  Use when the user asks to create or upload a YouTube thumbnail, including an
  AI-generated image, prompt, compression, or Studio update. Preserve supplied
  branding and do not assume a particular series, logo, model, or date.
version: 0.1.0
---

# YouTube Thumbnail Generation

## Overview
Generate custom thumbnails with the currently authorized image tool or the
user's chosen generator, then prepare and optionally upload them. Confirm the
channel's current size/format limits and preserve the user's branding.

## Step-by-Step Workflow

### 1. Gather Video Info
For each video that needs a thumbnail, collect:
- **Title** (already set on YouTube)
- **Content type** and series, if any
- **Topic summary**: What was presented/demoed (from frame extraction or title)
- **Presenter name** (optional, for subtitle text)
- **Date**, if the user wants it shown

### 2. Navigate to Gemini
Use the authorized image-generation workflow available in the current
environment. Do not ask the user to paste secrets or search for an unlicensed
logo; use supplied or approved brand assets.

### 3. Craft the Thumbnail Prompt
Use this prompt template, customized per video:

```
Create a YouTube thumbnail (1280x720) for a video titled "[FULL TITLE]".
[1-2 sentences describing what the video is about — the demo, paper, or topic].
The visual should be [THEME DESCRIPTION]: [specific visual elements relevant to the topic].
Bold text overlay: "[MAIN TITLE]" prominently, with smaller text "[SUBTITLE]" below it.
Include a bottom bar with "[SERIES NAME] [DATE]" only when requested.
Use an approved logo asset only when supplied or licensed.
Use [COLOR PALETTE] with a dark [THEME] background.
```

#### Prompt Customization by Content Type

**AI in Action (demos/presentations)**:
- Bottom bar text: `AI IN ACTION [D MON YYYY]`
- Visual theme: Match the demo topic (space, gaming, dev tools, etc.)
- Colors: Vibrant, exciting — neon blues, greens, purples, electric tones

**Paper Club (paper readings)**:
- Bottom bar text: `PAPER CLUB [D MON YYYY]`
- Visual theme: Academic but engaging — neural networks, brain visualizations, formulas
- Colors: Deep blue, orange, white — scholarly but modern
- Main text: Paper acronym or short name (e.g., "SDPO")
- Subtitle: Full paper name

#### Key Prompt Tips
- Use only user-supplied or approved reference assets.
- Specify **1280x720** dimensions explicitly
- Request **bold, large text** for the main title — readable at thumbnail size
- Include a **colored bottom bar** with the series name and date
- Keep the background **dark** so text pops

### 4. Generate and Save
- Submit the prompt and wait for the current tool to finish; do not assume a
  fixed provider or latency.
- Click the generated image to expand it
- Click **Save** to download to ~/Downloads
- Generated files will be named `Gemini_Generated_Image_[hash].jpeg`

### 5. Compress to Under 2MB
YouTube requires thumbnails under 2MB. Gemini Pro images are typically 3-4MB.

```bash
convert "Gemini_Generated_Image_[hash].jpeg" -resize 1280x720 -quality 85 thumb_[label].jpg
```

**Naming convention**: `thumb_[abbreviated_date].jpg` (e.g., `thumb_jan31.jpg`, `thumb_feb7.jpg`)

### 6. Upload Thumbnails to YouTube Studio
For each video:
1. Go to YouTube Studio → Content → click on the video
2. Click the pencil/edit icon (Details tab) in the left sidebar
3. Scroll to the **Thumbnail** section
4. Click the **Upload file** button (may be hidden — use `find` tool to locate ref)
5. Select the correct `thumb_[date].jpg` file
6. Verify the thumbnail appears in the preview
7. Click **Save** at the top right

**File picker automation** (macOS):
After clicking Upload file, use osascript to navigate the native file dialog:
```applescript
tell application "System Events"
    delay 1
    keystroke "g" using {command down, shift down}
    delay 1
    keystroke "/path/to/thumb_[date].jpg"
    delay 0.5
    keystroke return
    delay 1
    keystroke return
end tell
```

### 7. Verify
Take a screenshot of each video's details page to confirm the custom thumbnail is set.

## File Size Reference
- Gemini Pro raw output: ~3-4MB (too large)
- After `convert -resize 1280x720 -quality 85`: ~200-250KB (well under 2MB limit)
- YouTube max thumbnail size: 2MB
- YouTube thumbnail dimensions: 1280x720 (16:9)
- Accepted formats: JPG, PNG, GIF

## Example prompt shapes

### Tech Demo Thumbnail
```
Create a YouTube thumbnail (1280x720) for a video titled "SpaceMolt - AI Agents in Multiplayer Space Games".
This is about a demo of SpaceMolt, a multiplayer space trading and mining game where AI agents autonomously play alongside human players.
The visual should be exciting and space-themed: spaceships, asteroids, neon glow, a dark cosmic background.
Bold text overlay: "SPACEMOLT" prominently, with smaller text "AI AGENTS IN SPACE GAMES" below it.
Include a bottom bar with the supplied series/date in bold, if requested.
Use vibrant sci-fi colors — electric blue, green, purple neon tones.
```

### Academic Paper Thumbnail
```
Create a YouTube thumbnail (1280x720) for a video titled "RL via Self-Distillation (SDPO) Paper Reading".
This is an academic paper reading session about SDPO — Self-Distillation Preference Optimization.
The visual should be academic but engaging: neural network or brain visualization with mathematical formulas.
Bold text overlay: "SDPO" prominently, with smaller text "SELF-DISTILLATION PREFERENCE OPTIMIZATION" below it.
Include a bottom bar with the supplied series/date in bold, if requested.
Use deep blue, orange, and white color palette with a dark academic-themed background.
```

## Troubleshooting
- **"File is bigger than 2MB"**: Compress with ImageMagick `convert -resize 1280x720 -quality 85`
- **Gemini generation takes long**: Pro mode takes 30-45 seconds. Wait and check with a screenshot.
- **Upload button not visible**: Use the `find` tool to locate the hidden "Upload file" button by ref.
- **File picker automation fails**: Instruct user to manually select the file.
