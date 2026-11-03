# Adaptable code examples

These examples illustrate the review and verification cycle; they are not an editing framework or a substitute for the project's existing tools. Copy and adapt them to the current episode. They contain no episode media or credentials.

- [review-board.html](../examples/review-board.html) is a self-contained cue board. Replace its sample data and set distinct project and review-round IDs. Keep stable cue/alternative IDs with explicit proposal revisions. Browser storage holds only that round’s free-text comments; previous feedback stays in labeled read-only history. Blank comments mean keep the current primary proposal on a returned review; alternatives can be requested in text. Full source URLs and alternative visuals/rationales/tradeoffs are visible without expanding controls. Supply matching dialogue excerpts in `before.media` and `after.media`, plus their shared context range; these are original and composed previews, not source-demo substitutes. Starting one video pauses the others. Missing previews remain explicitly unavailable. The downloaded JSON separates current comments from history and is the portable handoff. Export before clearing browser data. Verify actual source links and media; the sample entries are deliberately marked as proposed.
- [render-overlay.py](../examples/render-overlay.py) demonstrates one still or video insert with a fade and slide. It needs FFmpeg with libx264. Adapt crop, placement, audio, captions, codec, and design to the project; it is not a multi-cue renderer. For video inserts, supply a clip at least as long as the hold. It copies original audio/subtitles when available and does not add sound effects. Check output-container compatibility and inspect playback.
- [extract-cue-frames.py](../examples/extract-cue-frames.py) extracts two frames per cue from an encoded video. Use [cues.example.json](../examples/cues.example.json) as the input shape. The files support visual review; they do not verify motion, sound, or caption accuracy.

Example invocations:

```sh
python3 render-overlay.py input.mp4 source.png output.mp4 --start 20 --duration 6 --x 30 --y 300 --width 700
python3 extract-cue-frames.py output.mp4 cues.example.json checks/
```
