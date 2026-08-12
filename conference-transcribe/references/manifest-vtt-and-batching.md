# Manifest, VTT parsing, offsets, and batching

Read this reference when converting chapters or descriptions into talk ranges,
parsing overlapping VTT cues, merging ASR chunks, or implementing resumable
conference batches.

## Manifest contract

Store numeric source offsets as the authority and display strings as derived
values:

```json
[
  {
    "index": 1,
    "title": "Speaker Name: Talk Title",
    "speaker": "Speaker Name",
    "slug": "01-speaker-name-talk-title",
    "source_chapter_start": "00:24:25",
    "source_chapter_end": "00:42:39",
    "start_seconds": 1465,
    "end_seconds": 2559,
    "duration_seconds": 1094,
    "boundary_source": "chapters"
  }
]
```

Useful additional fields include source ID/URL, room/track, chapter index,
caption language, boundary confidence, and operator notes.

## Chapter conversion

For structured chapters:

1. sort by numeric start time;
2. reject negative, duplicate, or decreasing starts;
3. use an explicit chapter end when valid, otherwise the next chapter start;
4. cap the final end at source duration;
5. classify breaks/holding screens rather than simply deleting them;
6. preserve original chapter text; and
7. confirm that every second of the requested event range is covered once or
   intentionally marked non-talk.

Description fallback patterns historically included:

```text
HH:MM:SS - Speaker Name: Talk Title
HH:MM:SS Speaker Name (Company): Description
MM:SS Talk title
```

Do not infer the final end beyond known source duration. If adjacent labels are
ambiguous, keep them in the manifest with low confidence and request review.

## Stable slugs

Prefix slugs with the manifest index so duplicate speaker/title combinations do
not collide:

```text
01-speaker-name-talk-title
02-next-speaker-next-title
```

Keep the slug stable when titles are corrected later; store the corrected
display title separately if downstream links already depend on the path.

## VTT cue selection

Parse each cue into absolute start/end seconds and plain text. For a talk range
`[start, end)`, include cues that overlap that range, but clamp displayed talk-
relative timestamps to the talk boundary. Preserve cue timing before cleanup.

HTML-like VTT markup, positioning directives, and duplicated rolling captions
must be normalized carefully. Do not remove repeated words merely because they
appear in nearby cues; remove only a verified suffix/prefix overlap.

## Suffix/prefix overlap removal

```python
def append_without_overlap(existing_words, new_words, max_overlap=40):
    """Append new_words after removing only the longest exact boundary overlap."""
    upper = min(len(existing_words), len(new_words), max_overlap)
    overlap = 0
    for size in range(upper, 0, -1):
        left = [word.casefold() for word in existing_words[-size:]]
        right = [word.casefold() for word in new_words[:size]]
        if left == right:
            overlap = size
            break
    return existing_words + new_words[overlap:]
```

Exact word overlap is intentionally conservative. Fuzzy deduplication can erase
legitimate repeated rhetoric or corrections.

## Timestamp buckets

The AIE Europe workflow grouped caption text into roughly thirty-second reading
paragraphs and emitted:

```text
[00:24:26 | +00:00:01] Good morning everyone…
```

The left side is absolute stream time; the right side is relative to talk start.
Thirty seconds is a readability default, not a requirement. Start a new block at
a speaker change, topic break, long silence, or configured interval.

## ASR chunk offset correction

If a talk is split into smaller ASR uploads, retain three offsets:

```text
provider segment time
+ chunk offset within talk
+ talk start within source
= absolute source timestamp
```

For each provider segment:

```python
talk_relative = chunk_start_seconds + provider_segment_start
source_absolute = talk_start_seconds + talk_relative
```

Deduplicate only the intentional audio overlap between adjacent chunks. Keep the
provider JSON and chunk manifest so timestamps can be reconstructed.

## Resumable batch state

Persist one status per talk and stage:

```json
{
  "slug": "01-speaker-talk",
  "raw": "complete",
  "cleaned": "pending",
  "clip": "skipped",
  "attempts": 1,
  "backend": "youtube-captions",
  "error": null
}
```

Use bounded workers and write outputs atomically. A failed talk should not
invalidate completed talks. Retry only the failed stage after checking whether
the failure is transient, a source gap, or a deterministic parse problem.

## Historical concurrency observations

- Two parallel clip downloads reduced wall time without the throttling seen at
  higher concurrency in the April 2026 run.
- Three concurrent hosted ASR/cleanup calls were used successfully with the
  provider/account limits in that run.
- Multiple simultaneous MLX jobs contended for one Apple GPU; sequential local
  ASR was more predictable.

Treat all three as initial measurements. Start lower, observe rate-limit and
resource behavior, and respect current provider/source limits.
