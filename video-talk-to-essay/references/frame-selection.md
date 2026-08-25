# Selecting thesis and section screenshots

## Candidate selection

Build section-specific candidate pools from cited transcript segments, neighboring segments, chapter boundaries, and transcript phrases indicating something is visible:

- Strong cues: “this slide,” “as you can see,” “on the screen,” “architecture,” “diagram,” “chart,” “benchmark,” “code,” “here is the demo,” “look at this example.”
- Weak cues: transitions, rhetorical summaries, repeated title slides, introductions, applause, sponsor bumpers, audience questions.
- Avoid selecting timestamps outside the section's verified audiovisual range.
- Rank the thesis candidate for how directly it summarizes the talk's core argument, not merely how early it appears.

Use structured model output containing only known `sectionId`, candidate identifier, expected visual type, and a short selection rationale. Reject unknown IDs, cross-section candidates, duplicate selections, and out-of-bounds timestamps.

## Extraction

Use the actual source recording. A representative public-video workflow is:

```bash
yt-dlp --no-playlist -f '134/18/best[height<=720]' -o 'source.%(ext)s' VIDEO_URL
ffmpeg -ss 551 -i source.mp4 -frames:v 1 -vf 'scale=640:360:force_original_aspect_ratio=increase,crop=640:360' frame.jpg
python3 scripts/score_frames.py frame-a.jpg frame-b.jpg frame-c.jpg
cwebp -q 78 chosen-frame.jpg -o section.webp
```

Use the precise downloaded filename and verified offsets. If `yt-dlp` receives HTTP 403, inspect its version and update or use a user-approved newer binary; do not weaken access controls. If FFmpeg lacks a WebP encoder, use `cwebp`.

Extract multiple candidates around each timestamp, initially ±2 seconds. If all fail, scan additional grounded moments inside the same section, widen offsets moderately, or identify adjacent slide changes. Never fill a gap with an unrelated image.

## Scoring and distinctiveness

Run `scripts/score_frames.py` to report brightness, contrast, blur, edge density, face coverage, and a 64-bit perceptual difference hash. Prefer readable slides, diagrams, charts, code, demos, and product interfaces. Penalize audience-heavy or speaker-only frames, over/underexposure, motion blur, blank screens, and generic stage shots.

Use `--distinct` to greedily accept only visually different frames; the default minimum difference is 10 hash bits. When selecting across sections, compare each candidate against every image already chosen for the talk, including its thesis image. Near-identical slide screenshots do not satisfy section coverage even when captured at different timestamps.

Some valuable slides are sparse or dark. Treat thresholds as heuristics, inspect borderline images visually, and prefer the truthful relevant slide over a sharper but irrelevant audience shot. If no trustworthy frame exists, leave that section unillustrated and record the reason internally.

Keep screenshots small: typically 640×360 WebP at quality 75–80. Render around 220–280 CSS pixels wide beside the text on desktop; use compact full-width or narrow floated layouts on mobile. Captions should be brief and avoid unnecessary vertical space.
