# Command recipes

Read this reference when executing metadata, caption, audio, segment, or clip
operations. Inspect current `yt-dlp` and `ffmpeg` help before using flags in an
unfamiliar installed version. Quote URLs and paths; do not put cookies or API
keys directly in commands.

The examples use explicit placeholders rather than nonexistent helper scripts.

Prepare the requested artifact directories first:

```bash
mkdir -p media segments transcripts/asr transcripts/raw transcripts/cleaned clips reports
```

## Inspect before downloading

```bash
yt-dlp --dump-single-json --skip-download "$VIDEO_URL" > media/source.info.json
yt-dlp --list-subs "$VIDEO_URL"
```

Review duration, chapters, description, caption languages, and source identity
before choosing the path.

## Fetch metadata and English captions without media

```bash
yt-dlp \
  --write-info-json \
  --skip-download \
  --write-sub \
  --write-auto-sub \
  --sub-lang 'en.*,en' \
  -o 'media/%(id)s.%(ext)s' \
  "$VIDEO_URL"
```

The resulting names vary by source and language variant. Discover the actual
`.info.json` and `.vtt` files rather than assuming `en-orig.vtt` exists.

## Inspect chapters

```bash
jq '{id, title, duration, chapters, description}' media/*.info.json
```

Use structured `chapters` when present. Description timestamps remain a useful
fallback or correction source, but do not silently override source metadata
without recording why.

## Download full audio only when needed

```bash
yt-dlp \
  -f bestaudio \
  -x \
  --audio-format wav \
  -o 'media/full-audio.%(ext)s' \
  "$VIDEO_URL"
```

For very long sources, prefer bounded section downloads or one compressed audio
download when the backend accepts it. Avoid downloading multiple equivalent
renditions.

## Split a talk from local audio

```bash
ffmpeg \
  -i media/full-audio.wav \
  -ss "$START_SECONDS" \
  -t "$DURATION_SECONDS" \
  -vn \
  -ac 1 \
  -ar 16000 \
  "segments/$TALK_SLUG.wav"
```

Placing `-ss` after `-i` favors accurate seeking; moving it before `-i` can be
faster for long inputs. `DURATION_SECONDS` should equal manifest end minus
start. Verify the first and last seconds of every segment instead of assuming
perfect cuts.

## Compress speech for hosted ASR

```bash
ffmpeg \
  -i "segments/$TALK_SLUG.wav" \
  -vn \
  -ac 1 \
  -ar 16000 \
  -c:a libopus \
  -b:a 32k \
  "segments/$TALK_SLUG.ogg"

wc -c "segments/$TALK_SLUG.ogg"
```

The codec/bitrate is a historical starting point. Confirm that the selected API
accepts the resulting container and measure actual bytes before upload.

## Historical Groq transcription request

This April 2026 request shape is retained as a migration reference. Verify the
current endpoint, model, fields, and upload limit before executing it.

```bash
curl --fail-with-body --silent --show-error \
  'https://api.groq.com/openai/v1/audio/transcriptions' \
  -H "Authorization: Bearer $GROQ_API_KEY" \
  -F "file=@segments/$TALK_SLUG.ogg" \
  -F 'model=whisper-large-v3-turbo' \
  -F 'language=en' \
  -F 'response_format=verbose_json' \
  -F 'timestamp_granularities[]=segment' \
  > "transcripts/asr/$TALK_SLUG.json"
```

Never enable shell tracing around credential-bearing commands.

## Download one optional talk clip

Historical section-download shape:

```bash
yt-dlp \
  -f 91 \
  --downloader ffmpeg \
  --downloader-args 'ffmpeg_i:-allowed_extensions ALL' \
  --download-sections "*$START_SECONDS-$END_SECONDS" \
  -o "clips/$TALK_SLUG.%(ext)s" \
  "$VIDEO_URL"
```

Format `91` is source-specific and not a general recommendation. Inspect
available formats and choose one that satisfies the requested clip quality.

## Bounded batch shape

Do not paste an unbounded shell loop over every talk. Read the manifest, select
a small batch, preserve each completed output atomically, and record failures by
talk slug. Historical starting concurrency was:

- two simultaneous `yt-dlp` clip downloads; and
- three simultaneous hosted ASR or cleanup calls.

Those values were observed for one event/provider combination. Verify current
limits and lower concurrency on throttling. Local GPU ASR often performs better
sequentially.

## Historical quick-start translated without ghost scripts

The old skill referenced `scripts/build_transcripts.py`,
`scripts/download_clips.py`, and `scripts/cleanup_transcripts.py`, but those
files were not part of this skill. The truthful equivalent is:

1. run the metadata/caption command above;
2. construct `talks.json` using
   [manifest-vtt-and-batching.md](manifest-vtt-and-batching.md);
3. parse captions into `transcripts/raw/` using the same reference;
4. run optional clip commands from the manifest in a bounded worker pool; and
5. apply the prompt in
   [output-templates-and-cleanup.md](output-templates-and-cleanup.md) to each
   completed raw transcript.

If a repository already contains equivalent scripts, inspect and reuse them
rather than generating a second pipeline.
