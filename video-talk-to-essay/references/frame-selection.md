# Selecting source screenshots

Choose frames that provide evidence or explain something the adjacent prose needs. There is no default image-per-section quota; a thesis image is optional. When the user explicitly asks for broad section coverage, expand the search for missing sections rather than silently lowering that requested scope.

## Start with the simplest useful frame

If a known timestamp shows a relevant readable slide or demo, extract it, inspect it and place it. No model selection, scoring pass or candidate inventory is needed. Reuse an inspected frame when its source identity, capture time and relevant content are unchanged.

When the right frame is unclear, search cited segments or nearby slide changes. Phrases such as “on the screen,” “chart,” “code” and “here is the demo” are useful cues; introductions and applause usually are not. Stay within the passage's verified audiovisual range.

For a large ambiguous pool, optional model selection should return known section/candidate IDs and a short rationale. Reject unknown IDs, accidental duplicates and mismatched source ranges. A model's expected caption is not proof of image content.

## Extraction

Use the actual source recording at a resolution suitable for the material, especially dense code. For an already downloaded file:

```bash
ffmpeg -ss 551 -i source.mp4 -frames:v 1 frame.jpg
cwebp -q 78 frame.jpg -o section.webp
```

Use the precise downloaded filename and verified offsets. Preserve aspect ratio and slide edges; do not automatically crop every recording to 16:9. Resize according to the content and intended display. If `yt-dlp` receives HTTP 403, inspect its version and use an authorized supported path; do not weaken access controls. If FFmpeg lacks a WebP encoder, use `cwebp`.

If the first frame is blurred or mid-transition, try nearby moments, initially ±2 seconds. Broaden the search only if the image would materially help. A frame can occur anywhere in the cited interval, not just its start. Leave missing optional media out rather than indefinitely retrying or substituting an unrelated image.

## Scoring and distinctiveness

For many candidates, `scripts/score_frames.py` and its `--distinct` option can help rank legibility and eliminate near-duplicates. They are optional heuristics, not acceptance gates. Prefer a relevant sparse/dark slide over a sharper irrelevant shot; retain repeated frames only when a visible change matters.

## Placement and rendered checks

Encode efficiently, usually as WebP, without shrinking away the information being cited. A simple slide may work at 640×360; dense code or charts may need more resolution and a larger display. Do not upscale a poor source and call it restored detail.

Interleave the frame at the passage it supports. Give code, diagrams and tables enough width to be useful; avoid tiny floated thumbnails or clipped captions merely to save vertical space. Use responsive full-width placement when it explains better, with access to the original timestamp or a larger view where supported.

Caption visible content and link the actual capture time. Check decoding and aspect ratio; inspect readability alongside the text at the review scope selected in `SKILL.md`. Never restyle an authentic source slide to match authored visuals.
