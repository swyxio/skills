---
name: youtube-studio-computer-use
description: Automate YouTube Studio through Chrome and Computer Use when API access is unavailable, insufficient, or slower for Studio-only edits. Use for browser-driven YouTube Studio work such as editing existing videos, adding custom thumbnails, changing visibility, scheduling publish times, selecting playlists, saving/verifying Studio state, recovering from disabled buttons, and coordinating DOM injection with Computer Use clicks. Prefer API or the youtube-studio-batch-upload skill for pure upload/download/metadata preparation when stable API credentials or batch upload workflows are available.
---

# YouTube Studio Computer Use

## Use This Skill

Use this skill when the task must operate the live YouTube Studio UI in Chrome:

- Add or replace thumbnails on existing videos.
- Schedule or reschedule videos through Studio visibility controls.
- Fix metadata, playlist, audience, visibility, or save states when API setup is missing.
- Batch a series of Studio edit-page operations with a ledger and recovery list.
- Combine DOM injection with Computer Use for fragile UI states.

Use `youtube-studio-batch-upload` instead when the primary job is downloading source videos, staging filenames, building metadata, uploading new videos, or keeping upload ledgers. Use an official YouTube API flow when OAuth/API credentials already exist and the operation is supported cleanly, especially for bulk metadata reads/writes. This skill is for the messy browser path.

## Ground Rules

- Call `mcp__computer_use.get_app_state` before direct UI actions in a turn.
- Treat Chrome tabs as shared with the user. Before injecting JS, explicitly target or activate the intended YouTube Studio tab; do not rely on “front window active tab” after the user has been browsing.
- Keep a local status JSON/CSV ledger with `video_id`, title, action, target time, thumbnail path, `ok`, error, and verification text.
- Save each video before moving to the next. Verify `All changes saved` and the intended side-panel state, such as `Visibility Scheduled`.
- If the user is also using Chrome, assume focus may move. Re-query app state and retarget the Studio tab after interruptions.
- Do not publish private/internal source URLs or notes while making metadata changes.

## Browser Automation Pattern

Use Computer Use to anchor the session and DOM JS for repetitive page operations:

1. Open or select a YouTube Studio edit page: `https://studio.youtube.com/video/<video_id>/edit`.
2. Wait for the edit page to be fully rendered. Require body text, a thumbnail/input area when needed, and the `Edit video visibility status` control.
3. Run small JS snippets through Chrome AppleScript or a browser tool. For async browser work, start the async task in-page, store the result on `window.__codex...`, then poll it. AppleScript does not reliably await Promises.
4. Use Computer Use clicks for native popups, file pickers, and UI states that DOM JS cannot reach.
5. Save, wait, verify, and append to the ledger before continuing.

For detailed snippets and known failure modes, read `references/studio-dom-patterns.md`.

## Thumbnails

Reliable thumbnail replacement requires the hidden Studio file input:

- Scroll the thumbnail section into view and wait for `input[type=file]#file-loader`.
- Do not click the upload button unless you plan to handle the native file picker.
- A robust DOM route is to serve the local thumbnail file from a tiny localhost server, `fetch` it from the page, create a `File`, set `input.files` with `DataTransfer`, and dispatch `input` plus `change`.
- After injection, wait for the thumbnail control to stop showing `Uploading...`. Large or slow images may need a 60-second poll.

If Studio shows the new thumbnail but the status object still says pending, inspect the page before retrying; retrying may replace the same thumbnail harmlessly, but do not save until Studio is done uploading.

## Scheduling

Scheduling is fragile because YouTube Studio validates hidden component state, not just input text.

- Open the visibility popup using the `Edit video visibility status` control.
- Select `Schedule`, then set the date and time.
- For date, opening the date picker and clicking the visible day is more reliable than assigning text.
- For time, click the time field and choose the visible listbox option such as `8:30 AM`. Merely setting `input.value = "8:30 AM"` can display the right value while leaving `Done` disabled.
- Confirm `Done` is enabled before clicking it.
- Click page-level `Save`, then wait until `All changes saved` and the side panel shows `Visibility Scheduled`.

For spaced launches, generate slot times in the local YouTube timezone, e.g. start at `9:30 AM` and add 30 minutes per video. Record every assigned time in the ledger.

## Recovery

Common recoveries:

- `missing file input`: the thumbnail section has not rendered. Scroll to Thumbnail and wait again.
- thumbnail result `pending`: the in-page async task did not finish in the poll window. Extend the poll, use a threaded local server, and inspect whether Studio is already uploading the thumbnail.
- `Done` disabled after setting time: choose the time from the dropdown listbox; do not type or assign the value only.
- `missing schedule`: the visibility popup did not open or is still collapsed. Re-open the visibility control and inspect visible popup text.
- JS ran on the wrong page: retarget the Studio tab explicitly and re-run `get_app_state`.

Never bulldoze through failures in a batch. Stop, patch the driver, and resume from the ledger with the next available publish slot.
