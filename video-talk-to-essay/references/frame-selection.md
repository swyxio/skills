# Selecting source screenshots

Choose frames that provide evidence or explain something the adjacent prose needs. There is no default image-per-section quota; a thesis image is optional. When the user explicitly asks for broad section coverage, expand the search for missing sections rather than silently lowering that requested scope.

## Candidate selection

Build section-specific candidate pools from cited transcript segments, neighboring segments, chapter boundaries, and transcript phrases indicating something is visible:

- Strong cues: “this slide,” “as you can see,” “on the screen,” “architecture,” “diagram,” “chart,” “benchmark,” “code,” “here is the demo,” “look at this example.”
- Weak cues: transitions, rhetorical summaries, repeated title slides, introductions, applause, sponsor bumpers, audience questions.
- Avoid selecting timestamps outside the section's verified audiovisual range.
- Rank the thesis candidate for how directly it summarizes the talk's core argument, not merely how early it appears.

Use structured model output containing only known `sectionId`, candidate identifier, expected visual type, and a short selection rationale. Reject unknown IDs, cross-section candidates, duplicate selections, and out-of-bounds timestamps.

## Extraction

Use the actual source recording, or reuse an existing frame only when its video identity and capture timestamp are known and the image is independently inspected. Do not trust an old generated caption as proof of what the frame shows.

Download a suitable source resolution with the configured video tool; do not select a low-resolution stream by default for code-heavy slides. A representative extraction from an already downloaded file is:

```bash
ffmpeg -ss 551 -i source.mp4 -frames:v 1 frame.jpg
python3 scripts/score_frames.py frame-a.jpg frame-b.jpg frame-c.jpg
cwebp -q 78 chosen-frame.jpg -o section.webp
```

Use the precise downloaded filename and verified offsets. Preserve aspect ratio and slide edges; do not automatically crop every recording to 16:9. Resize according to the content and intended display. If `yt-dlp` receives HTTP 403, inspect its version and use an authorized supported path; do not weaken access controls. If FFmpeg lacks a WebP encoder, use `cwebp`.

Extract multiple candidates around a nominated timestamp, initially ±2 seconds. If all fail and a frame would materially help, scan additional grounded moments inside the section or identify adjacent slide changes. A frame can fall later inside a cited segment; avoid limiting selection to segment starts. Never fill a gap with an unrelated image.

## Scoring and distinctiveness

Run `scripts/score_frames.py` to report brightness, contrast, blur, edge density, face coverage, and a 64-bit perceptual difference hash. Prefer readable slides, diagrams, charts, code, demos, and product interfaces. Penalize audience-heavy or speaker-only frames, over/underexposure, motion blur, blank screens, and generic stage shots.

Use `--distinct` to greedily accept only visually different frames; the default minimum difference is 10 hash bits. Compare candidates with images already chosen for the talk, including any thesis image. Repeated slide screenshots usually add little even when captured at different timestamps; retain a repetition only when a meaningful visible change or explicit comparison warrants it.

Some valuable slides are sparse or dark. Treat thresholds as heuristics, inspect borderline images visually, and prefer the truthful relevant slide over a sharper but irrelevant audience shot. If no trustworthy frame exists, leave that section unillustrated and record the reason internally.

## Placement and rendered checks

Encode efficiently, usually as WebP, without shrinking away the information being cited. A simple slide may work at 640×360; dense code or charts may need more resolution and a larger display. Do not upscale a poor source and call it restored detail.

Interleave the frame at the passage it supports. Give code, diagrams and tables enough width to be useful; avoid tiny floated thumbnails or clipped captions merely to save vertical space. Use responsive full-width placement when it explains better, with access to the original timestamp or a larger view where supported.

Caption what is visibly present, not what an old summary expected to be on screen. Tie the click target to the actual capture time. In the browser, verify nonzero natural dimensions, correct aspect ratio, mobile layout and readability alongside the text. Never edit an authentic source slide to conform to the article's authored-visual styling preferences.
