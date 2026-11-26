# Adaptable code examples

Use these optional starting points with the project’s existing renderer and cue records.

- Copy [review-board.html](../examples/review-board.html) with [review-controls.js](../examples/review-controls.js). Replace the sample data and set the project and round IDs. Supply matching dialogue excerpts in `before.media` and `after.media` with their shared time range. Export the JSON before clearing browser storage. The [cue guide](capture-and-cues.md) defines how to interpret the decisions.
- [render-overlay.py](../examples/render-overlay.py) demonstrates one still or video insert with a fade and slide. It needs FFmpeg with libx264. Adapt crop, placement, audio, captions, codec, and design to the project; it is not a multi-cue renderer. For video inserts, supply a clip at least as long as the hold. It copies original audio/subtitles when available and does not add sound effects. Check output-container compatibility and inspect playback.
- [extract-cue-frames.py](../examples/extract-cue-frames.py) extracts two frames per cue from an encoded video. Use [cues.example.json](../examples/cues.example.json) as the input shape. The files support visual review; they do not verify motion, sound, or caption accuracy.

Example invocations:

```sh
python3 render-overlay.py input.mp4 source.png output.mp4 --start 20 --duration 6 --x 30 --y 300 --width 700
python3 extract-cue-frames.py output.mp4 cues.example.json checks/
```
