---
name: download-video
description: Download a video embedded in a supplied web page or media URL when the actual player URL, referer, cookies, or host-specific extraction matters. Use for local media acquisition; do not trigger for transcription, publishing, or a plain public URL that the user's existing downloader can already handle.
license: MIT
compatibility: Requires a current yt-dlp installation and network access. Some sources require the user's authenticated browser cookies or explicit access.
metadata:
  author: swyxio
  version: "1.1"
  last-updated: "2026-03-28"
  primary-tools: yt-dlp and a page inspector
---

# Download Video

Resolve the real player/embed URL before downloading. Do not bypass access
controls or guess a private URL; use only media the user is authorized to
download.

## Resolve the source

Inspect the supplied page for, in order:

- `iframe` player URLs;
- `video`/`source` elements;
- Schema.org `VideoObject` `contentUrl` or `embedUrl`; and
- player configuration in scripts or data attributes.

Record the source page, host, media ID, privacy hash, and any required origin or
referer. For private/unlisted embeds, the player URL often works where the
public landing URL does not. Preserve the page's privacy hash when the host
requires it.

## Download progressively

Use the existing `yt-dlp` version and inspect `yt-dlp --help` for current flags.
Start with the player URL, then add only the headers or authenticated cookies
that the page requires:

```bash
yt-dlp "PLAYER_OR_MEDIA_URL"
yt-dlp --referer "SOURCE_PAGE_URL" "PLAYER_OR_MEDIA_URL"
yt-dlp -F "PLAYER_OR_MEDIA_URL"
yt-dlp -o "/explicit/output/%(title)s.%(ext)s" "PLAYER_OR_MEDIA_URL"
```

Use `--add-header "Origin: ..."` or `--cookies-from-browser PROFILE` only when
the source and user's authorization call for it. Never print cookie values or
embed private credentials in a reusable command.

Select formats according to the user's requested quality and available disk
space. Verify the final path, file type, duration, and that audio/video streams
are present. Keep the source page and final artifact separate from logs.

## Recovery

- A 403 usually means the referer/origin, cookies, or access scope is wrong;
  re-inspect the page rather than trying arbitrary headers.
- A public-host 404 for an embedded private video often means the player URL or
  privacy hash is required.
- An impersonation warning may require an optional current extractor
  dependency, but install it only if the actual source needs it.
- Geo-restriction or missing authorization is a boundary to report, not a
  reason to invent a bypass.

If the task continues into transcription or publication, hand the verified
artifact to the narrowest downstream skill and report the exact path.
