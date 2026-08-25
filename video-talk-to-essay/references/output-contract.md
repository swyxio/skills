# Output contract and validation

Adapt field names to the host project; preserve the semantics.

```json
{
  "source": {
    "videoId": "VIDEO_ID",
    "videoUrl": "https://www.youtube.com/watch?v=VIDEO_ID",
    "title": "Verified source title",
    "speakers": [{ "name": "Verified speaker name" }],
    "durationMs": 982000,
    "transcriptChecksum": "sha256:..."
  },
  "essay": {
    "title": "A specific editorial title",
    "dek": "One accurate sentence describing the argument.",
    "thesisImage": {
      "src": "./images/thesis.webp",
      "width": 640,
      "height": 360,
      "alt": "The actual concept shown on the slide",
      "caption": "Short accurate caption",
      "startMs": 551000
    },
    "sections": [
      {
        "id": "1-the-actual-core-argument",
        "title": "The actual core argument",
        "startMs": 21000,
        "paragraphs": [
          "The speaker argues that **the key idea** changes the practical design tradeoff. [0:21](https://www.youtube.com/watch?v=VIDEO_ID&t=21s)"
        ],
        "sourceSegments": [{ "index": 4, "startMs": 21000 }],
        "image": {
          "src": "./images/1-the-actual-core-argument.webp",
          "width": 640,
          "height": 360,
          "alt": "The specific diagram actually visible in this section",
          "caption": "The design tradeoff in one diagram",
          "startMs": 34000
        }
      }
    ],
    "takeaways": [
      {
        "text": "A bounded conclusion the speaker actually supports.",
        "sourceSegments": [{ "index": 4, "startMs": 21000 }]
      }
    ]
  }
}
```

Keep model/grounding metadata internal unless explicitly requested. `observedModel: null` means unavailable, not verified. Omit optional metadata rather than guessing.

## Validation

- Confirm every paragraph and takeaway references a real segment.
- Keep every timestamp inside the verified source-video duration and the appropriate segment/section interval.
- Preserve absolute livestream timestamps; a standalone recording starts at zero.
- Confirm every image exists, decodes successfully, belongs to the actual source video, and has truthful dimensions/caption.
- Ensure section images are visually distinct; compare frame hashes across sections and against the thesis image.
- Do not require a thesis image when the recording has no defensible central slide.
- Represent a missing section image explicitly rather than inserting an unrelated screenshot.
- Escape or sanitize model-generated Markdown/HTML before rendering.
- Check requested versus observed model without misrepresenting unavailable identity.

## Resumability

Key checkpoints by immutable video identity, transcript checksum, correction signature, prompt version, selected model, and output schema version. Write output atomically after each successfully validated item. On source changes, prune only affected records before importing any registry that rejects stale generated artifacts; preserve unrelated completed work.
