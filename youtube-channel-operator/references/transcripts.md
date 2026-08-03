# Caption downloads and transcript workflows

Use this file to expose owner-authorized YouTube captions as reliable raw tools
and transcript-derived workflows. Do not scrape watch-page HTML or use an
unofficial transcript endpoint when the official owner API is available.

## Contents

- [Tool surface](#tool-surface)
- [Caption selection and normalization](#caption-selection-and-normalization)
- [Caching and payload discipline](#caching-and-payload-discipline)
- [Baked-in workflows and prompts](#baked-in-workflows-and-prompts)
- [Failure behavior](#failure-behavior)

## Tool surface

Keep the official methods available to power users:

```text
youtube.data.call method=captions.list
youtube.data.call method=captions.download
```

Promote the common read path:

```ts
type YouTubeTranscriptGetInput = {
  accountKey: string;
  videoId: string;
  captionId?: string;
  language?: string; // default "en"
  translatedLanguage?: string;
  format?: "segments" | "text" | "vtt"; // default "segments"
};

type YouTubeTranscriptSegment = {
  startMs: number;
  endMs: number;
  start: string; // M:SS or H:MM:SS
  text: string;
};

type YouTubeTranscriptTrack = {
  captionId: string;
  language: string;
  trackKind: "standard" | "ASR" | "forced";
  status: "serving" | "syncing" | "failed";
};

type YouTubeTranscriptGetResult =
  | {
      status: "available";
      accountKey: string;
      channelId: string;
      videoId: string;
      videoTitle: string;
      captionId: string;
      language: string;
      trackKind: "standard" | "ASR" | "forced";
      lastUpdated: string;
      sourceFormat: "vtt";
      segments?: YouTubeTranscriptSegment[];
      text?: string;
      vtt?: string;
    }
  | {
      status: "no_captions" | "processing" | "failed" | "ambiguous";
      accountKey: string;
      channelId: string;
      videoId: string;
      videoTitle: string;
      reason?: string;
      availableTracks?: YouTubeTranscriptTrack[];
    };
```

`youtube.transcript.get` must:

1. resolve the exact account and owned video;
2. verify `channels.list(mine=true)` still matches the pinned channel;
3. call `captions.list(part=id,snippet,videoId=...)`;
4. select one exact track deterministically;
5. call `captions.download(id=...,tfmt=vtt)`;
6. parse and normalize the timed segments;
7. return the selected video and caption names alongside their IDs.

The read works for public, private, and unlisted owned uploads when the OAuth
principal has permission to edit the video. Do not add a visibility filter after
ownership has been verified.

`captions.list` costs 50 quota units and `captions.download` costs 200. Both use
`youtube.force-ssl`; download requires edit permission for the video.

Official references:
[captions.list](https://developers.google.com/youtube/v3/docs/captions/list),
[captions.download](https://developers.google.com/youtube/v3/docs/captions/download),
[caption resource](https://developers.google.com/youtube/v3/docs/captions).

## Caption selection and normalization

If `captionId` is supplied, require that exact track. Otherwise rank tracks:

1. `status=serving`, requested language, primary audio, non-draft `standard`;
2. `status=serving`, requested language, primary audio, `ASR`;
3. another serving requested-language track;
4. a serving source track when `translatedLanguage` is requested.

Never silently select a failed, syncing, forced-only, or different-language
track. Return the available track metadata when selection is ambiguous.

Normalize VTT deterministically:

- preserve each cue's start and end milliseconds;
- strip VTT headers, styling, position metadata, and inline markup;
- decode entities and normalize whitespace;
- collapse exact duplicate cues;
- remove repeated rolling-ASR prefixes without deleting new words;
- preserve speaker labels when present;
- keep raw VTT available separately from normalized segments;
- never invent text for gaps, inaudible sections, or failed caption tracks.

## Caching and payload discipline

Cache normalized output by:

```text
accountKey + videoId + captionId + lastUpdated + translatedLanguage + format
```

Use a short metadata TTL before refreshing `captions.list`. A changed caption ID
or `lastUpdated` invalidates the transcript cache. Store large VTT and normalized
segment artifacts outside chat/session rows; keep only the artifact reference,
caption metadata, and compact derived results in ordinary conversation state.

Do not inject an entire long transcript into every model turn. Retrieve the
transcript once, then select relevant timestamp windows or use a map-reduce
summary for long talks. Every derived claim or quote should retain a timestamp
back to the source segment.

## Baked-in workflows and prompts

Expose these guided modes over `youtube.transcript.get`:

```text
youtube.transcript.summarize
youtube.transcript.viewer_package
youtube.transcript.find_moments
youtube.transcript.pull_quotes
```

These are read-only analysis workflows, not YouTube mutations. A later
description update containing generated chapters remains a separately reviewed
`videos.update` action.

### Detailed summary

```text
Summarize this talk for an informed technical viewer. Preserve the speaker's
actual claims, examples, caveats, and conclusions. Organize the answer into:
1. one-paragraph executive summary;
2. detailed section-by-section notes with source timestamps;
3. key technical takeaways;
4. open questions or limitations stated by the speaker.
Do not infer claims absent from the transcript. Mark uncertain ASR wording
instead of silently correcting specialized names or numbers.
```

### Viewer chapters, pull quotes, and potential titles

```text
Using the timestamped transcript, give detailed timestamps for viewers.

Output a YouTube-ready chapter list first:
- output only one starting timestamp and concise section title per line;
- always start with `0:00`;
- use `M:SS` below one hour and `H:MM:SS` at or above one hour;
- list starting times only, never end times or ranges;
- keep timestamps strictly ascending and inside the video duration;
- include at least three useful chapters;
- keep every chapter at least 10 seconds long;
- prefer meaningful topic transitions over arbitrary fixed intervals.

Then add `Key timestamped pull quotes`:
- include 3-8 short, verbatim, high-signal quotes;
- prefix each quote with its starting timestamp;
- name the speaker when reliably known;
- optimize selection for clarity, surprise, utility, and shareability;
- never fabricate or silently rewrite a quote; mark uncertain ASR wording.

End with `Potential titles`:
- propose 5-10 concise YouTube titles grounded in the talk;
- connect each title to the timestamped claim or quote that supports it;
- do not present a paraphrase as a direct quote.
```

YouTube chapter formatting requires the first timestamp to be `00:00`, at least
three ascending timestamps, and chapters of at least 10 seconds:
[YouTube chapters](https://support.google.com/youtube/answer/9884579).

### Viral clips and moments

```text
Find the strongest self-contained moments for clips. Return a table with:
start, end, duration, speaker, hook, payoff, exact opening words, and why the
moment may travel. Prefer moments understandable without the full talk. Keep
every quoted phrase verbatim and distinguish transcript evidence from editorial
recommendation.
```

### Focused transcript search

```text
Find every substantive passage about QUERY. Return timestamped passages in
chronological order, followed by a synthesis that cites those timestamps.
Exclude incidental keyword matches and say explicitly when the transcript does
not support the requested conclusion.
```

## Failure behavior

When no usable caption track exists, return `status=no_captions` with the video
title and ID. Return bounded track metadata with `ambiguous`, `processing`, and
`failed` states so callers can choose an exact track or retry without treating a
temporary state as permanent. Do not download media, invoke Whisper, scrape a
public transcript, or manufacture a summary.
