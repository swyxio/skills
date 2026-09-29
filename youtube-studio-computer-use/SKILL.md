---
name: youtube-studio-computer-use
description: Automate YouTube Studio through tab-bound Chrome control when API access is unavailable, insufficient, or slower for Studio-only edits. Use for editing existing videos, adding thumbnails, changing visibility, scheduling, selecting playlists, and verifying saved Studio state. Prefer API or youtube-studio-batch-upload for pure upload/download/metadata preparation when stable API credentials or batch upload workflows are available.
---

# YouTube Studio Computer Use

## Use This Skill

Use this skill when the task must operate the live YouTube Studio UI in Chrome:

- Add or replace thumbnails on existing videos.
- Schedule or reschedule videos through Studio visibility controls.
- Fix metadata, playlist, audience, visibility, or save states when API setup is missing.
- Batch a series of Studio edit-page operations with a ledger and recovery list.
- Inspect DOM state and use tab-bound controls for fragile UI states.

Use `youtube-studio-batch-upload` instead when the primary job is downloading source videos, staging filenames, building metadata, uploading new videos, or keeping upload ledgers. Use an official YouTube API flow when OAuth/API credentials already exist and the operation is supported cleanly, especially for bulk metadata reads/writes. This skill is for the messy browser path.

## Ground Rules

- Follow [resilient-computer-use](../resilient-computer-use/SKILL.md#chrome-default-bind-to-a-tab). The user and other Codex chats may use Chrome concurrently: bind a dedicated Studio tab by stable ID and keep observations, actions, screenshots, and network inspection scoped to it.
- Inspect fresh state from that tab before UI actions. Do not activate a frontmost window or use AppleScript as the default control path. Coordinate shared focus before any native desktop fallback.
- Keep a local status JSON/CSV ledger with `video_id`, title, action, target time, thumbnail path, `ok`, error, and verification text.
- Save each video before moving to the next. Verify `All changes saved` and the intended side-panel state, such as `Visibility Scheduled`.
- After interruptions, recover the same tab binding and verify channel/video identity and saved state before retrying. Do not take over another chat's tab.
- Do not publish private/internal source URLs or notes while making metadata changes.

## Browser Automation Pattern

Use the documented tab-bound browser adapter for page operations:

1. Bind a dedicated Studio tab and open the edit page: `https://studio.youtube.com/video/<video_id>/edit`. Verify the channel and video ID.
2. Wait for the edit page to be fully rendered. Require body text, a thumbnail/input area when needed, and the `Edit video visibility status` control.
3. Use tab-bound accessibility actions or locators. Use DOM evaluation only within the current adapter's documented capabilities; do not bypass restrictions with AppleScript or injected scripts.
4. Use the adapter's file-chooser interface for uploads. Use native Computer Use only for unsupported native controls after coordinating shared focus, then return to the tab binding.
5. Save, wait, verify, and append to the ledger before continuing.

For detailed snippets and known failure modes, read `references/studio-dom-patterns.md`.

## Thumbnails

Use the documented tab-bound file-chooser flow for thumbnail replacement:

- Inspect the rendered Thumbnail section and identify its upload control.
- Start the chooser wait, click the upload control through the bound tab, and set the local file through the returned chooser. See [browser upload examples](../resilient-computer-use/references/codex-browser-examples.md#browser-file-uploads).
- Verify the new preview and wait for `Uploading...` to clear before saving. Do not substitute localhost fetch or DOM injection when the adapter restricts them.

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
- thumbnail still uploading: inspect the bound tab's upload progress and preview before retrying; reconcile whether the file was already accepted.
- `Done` disabled after setting time: choose the time from the dropdown listbox; do not type or assign the value only.
- `missing schedule`: the visibility popup did not open or is still collapsed. Re-open the visibility control and inspect visible popup text.
- Wrong page or lost binding: recover the exact Studio tab ID and inspect fresh tab state before continuing.

Never bulldoze through failures in a batch. Stop, patch the driver, and resume from the ledger with the next available publish slot.
