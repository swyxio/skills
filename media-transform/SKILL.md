---
name: media-transform
description: Orchestrate an explicitly requested multi-stage media workflow such as download → transcribe → chapter/metadata → publish. Use when more than one media stage is needed and route each stage to the narrowest atomic skill; do not trigger for a single download, transcription, thumbnail, or YouTube edit.
---

# Media Transform

Plan the requested media stages, hand off to the atomic skills, and preserve
the user's source and publication choices. This is a router, not a second copy
of every downloader, ASR backend, image generator, or publishing API.

## Route stages

- Acquire a source from X/Twitter, Zoom, an embed, or a generic URL with the
  matching download skill.
- Transcribe audio/video with `transcribe-anything`.
- Produce chapters, descriptions, titles, or other copy with
  `podcast-publishing-assistant` or `summarize-anything`.
- Create or extract thumbnail assets with `youtube-thumbnails` or
  `thumbnail-extraction`.
- Upload or edit YouTube metadata with `youtube-api`, `youtube-publish`, or
  the Studio computer-use skill according to the requested surface.

Select the API skill for supported metadata/upload operations. Use browser
automation only for authenticated or Studio-only state. Do not duplicate an
atomic skill's provider-specific command reference here.

## Plan before external actions

Confirm the source, destination, desired stages, output directory, title and
metadata authority, privacy/visibility, and whether publication is authorized.
For multi-stage work, show the stage order and the artifacts each stage will
produce. Preserve local files until the user accepts the result or explicitly
requests cleanup.

Default a new YouTube upload to the least-public visibility supported by the
chosen workflow unless the user explicitly selects another visibility. Never
publish, overwrite metadata, rotate a title, or start an experiment merely
because the pipeline reached that stage.

## Checkpoints and handoffs

After acquisition, verify the final file path, media type, duration, and that
the source is the intended one. Before publication, verify the title,
description, chapters, thumbnail, playlist, and visibility together. After an
authorized mutation, verify the owning account/video and report the resulting
URL or exact failure.

Pass explicit paths and structured metadata between stages; do not infer a
downloaded filename from progress output. Keep transcript timestamps tied to
the source and disclose when chapter/title generation is model-produced.

## Quality and recovery

- If a stage fails, preserve the prior artifact and resume from the last
  verified checkpoint rather than restarting or deleting it.
- Do not upload private media to a hosted transcription or image service
  without telling the user and using the approved credentials.
- Treat title/thumbnail A/B testing as an optional, separately authorized
  experiment. Choose its duration and success metric from the product context;
  do not impose a fixed rotation schedule or claim a winner from early noise.
- Verify file-size, format, and platform limits using current primary docs or
  the target API before upload. Do not retain stale model names, pricing, or
  command paths in this orchestrator.

## Compact completion report

Report the source artifact, each completed stage, paths/URLs, publication
visibility, checks performed, and any stage deliberately skipped or left
unverified. If the request only names one stage, hand it directly to that
atomic skill instead of expanding the work into a full pipeline.
