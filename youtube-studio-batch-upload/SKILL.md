---
name: youtube-studio-batch-upload
description: Batch YouTube Studio upload workflow for videos sourced from Airtable, Google Drive, Loom, YouTube, or local files. Use when Codex needs to download many submitted videos, stage filenames, build YouTube titles/descriptions from table fields, upload through Chrome/Computer Use, set videos Unlisted, add a playlist, save each upload before moving on, track links, and report incomplete or blocked source rows.
---

# YouTube Studio Batch Upload

## Operating Rules

- Use the browser/computer-use skill for live YouTube Studio or Airtable UI work. Call `get_app_state` before direct UI actions in a turn.
- Treat upload as a batch waterfall: download/source recovery, filename staging, metadata staging, upload, per-video titling/playlist/visibility/save, verification, ledger.
- Do not include source video URLs in YouTube descriptions. Strip Drive, Loom, WeTransfer, and source YouTube links from final descriptions unless the user explicitly asks to publish those links.
- Always select the target playlist before advancing to visibility.
- Always choose `Unlisted` and click `Save` before opening or editing the next upload.
- If YouTube blocks saving because SD processing is not finished, wait on the modal and save after processing clears. Do not assume the draft is published.
- Prefer batch file selection where the UI allows it. If selector controls fail, upload smaller batches or one file at a time, but keep download and metadata preparation batched.
- Preserve a clear blocked list for rows like `waitlisted`, `WIP`, `To provide`, private/deleted links, or access-denied Drive files.

## Workflow

1. Export or scrape the source table into CSV/TSV with at least: speaker name, talk title, talk description, video source URL, bio, company, handles, LinkedIn/GitHub, and notes.
2. Build a manifest and metadata JSON:
   - Run `scripts/youtube_batch_helper.py build-metadata presenters.csv --out work/youtube_metadata.json`.
   - Use `--playlist "Playlist Name"` and `--skip-source-url` unless the user says otherwise.
   - Inspect blocked rows and rows with placeholder source values before downloading.
3. Download source videos into `downloads/.../raw`:
   - Drive: prefer `yt-dlp` or direct browser-authenticated downloads if permissions require Chrome cookies/session.
   - Loom: try `yt-dlp`; if it fails, inspect the page for signed HLS manifests and assemble with `ffmpeg`.
   - YouTube source videos: try `yt-dlp` with browser cookies or alternate player clients. Respect access and copyright limitations.
4. Stage upload files under a batch directory with final human-readable names:
   - `Talk Title - Speaker Name.mp4`
   - Keep punctuation YouTube accepts; avoid filesystem-hostile characters.
5. Open YouTube Studio upload in Chrome, select as many staged files as practical, and then complete each upload dialog:
   - Set title and description from metadata.
   - Select the playlist.
   - Advance through Video elements and Checks.
   - Select `Unlisted`.
   - Save and wait until the row appears as `Unlisted / None` or known restriction.
6. Record each YouTube link in a ledger and report:
   - Uploaded count and new links.
   - Any restrictions, especially copyright.
   - Blocked/unavailable source rows with exact reason.

## Metadata Shape

Use this description layout unless the user gives a channel-specific template:

```text
<Talk Description>

Speakers:
- <Name> (<Company>): <Bio>
  X/Twitter: <url-or-handle>
  LinkedIn: <url>
  GitHub: <url-or-handle>

Additional notes/links:
- <notes that are not source video URLs>
```

Keep descriptions factual and avoid inventing missing affiliations. For incomplete presenter names, use available fields and web search if the user asked to fill missing public info.

## UI Automation

Read `references/ui-js-snippets.md` when using Chrome DOM automation for YouTube Studio. These snippets cover setting contenteditable title/description boxes, selecting playlists, clicking through steps, saving unlisted, and verifying row state.

Use direct Computer Use clicks for file pickers and modal buttons when DOM automation cannot reach native UI. Use coordinates only after confirming the screenshot state.

## Verification

- Verify every uploaded row shows `Unlisted` after Save.
- Verify source URL patterns are absent from descriptions using the helper audit or DOM readback.
- Verify playlist selection during the upload modal; YouTube Studio's channel list does not always show playlist membership.
- Check upload processing dialogs: `Video upload complete` is not enough if the dialog still says SD processing must finish before unlisted publication.

## Helper Script

`scripts/youtube_batch_helper.py` provides:

- `build-metadata`: convert Airtable/CSV rows into YouTube metadata JSON and a blocked-row report.
- `audit-descriptions`: scan metadata JSON for accidental source URLs.
- `ledger`: create or update a CSV ledger of uploaded links and statuses.

Run `python3 scripts/youtube_batch_helper.py --help` for command details.
