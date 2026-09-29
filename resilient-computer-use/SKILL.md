---
name: resilient-computer-use
description: Operate desktop applications and browsers reliably through Computer Use, with proactive state tracking and recovery from common automation failures. Use for any multi-step or consequential UI workflow, especially when app focus moves, multiple monitors or windows are present, accessibility state is empty or stale, element indices change, screenshots and accessibility disagree, dialogs or file pickers appear, a browser upload chooser or native picker fails, a local artifact is prepared but not attached, buttons remain disabled, typing submits unexpectedly, a user interrupts or concurrently uses the app, an action may already have completed, a browser tab or extension binding appears lost, or a dedicated browser tool fails and Computer Use should recover the same live session.
---

# Resilient Computer Use

Run UI automation as a repeated **observe → identify → act → re-observe → verify** loop. Never equate tool context with application reality: a lost binding, empty accessibility tree, or stale element index does not prove the app, window, tab, or user state disappeared.

## Chrome default: bind to a tab

The user keeps using Chrome while agents work and runs multiple Codex browser sessions concurrently. Default to tab-bound Chrome control by stable tab ID. Keep observations, screenshots, clicks, typing, navigation, and any network/CDP capture scoped to that tab handle. Do not use the frontmost Chrome window, active tab, window position, or global keyboard shortcuts as the target for ordinary browser work.

- Give each chat its own named browser session and dedicated tab; reuse that chat's binding throughout the task. Claim an existing tab only when it is the intended target and another chat is not operating it. Do not take over another chat's tab.
- A separate tab or window does not isolate cookies, login, or account state within the same Chrome profile. Coordinate account switches and sign-outs that could affect other work; do not change profiles silently.
- If the binding fails, refresh the tab inventory, recover the exact tab, and read the adapter's troubleshooting before switching to desktop control. A failed create-tab command does not prove existing tabs cannot be claimed.
- Native desktop control is a fallback for unsupported native dialogs or a binding that cannot be recovered. Before using it, explain that it requires shared focus and coordinate a brief exclusive interval with the user or other authorized chats. Stop if focus changes, then return to the tab handle as soon as possible. Do not repeatedly steal focus to continue a background task.

## Model the layers separately

Diagnose the failing layer before changing anything:

1. **Tool transport** — Computer Use or a dedicated plugin can communicate.
2. **Application process** — the intended app is running.
3. **Window and focus** — the intended window, monitor, sheet, or popup is active.
4. **Document or tab** — the exact file, record, URL, browser tab, or account is selected.
5. **UI snapshot** — accessibility text, screenshot, and element indices describe the current state.
6. **Operation state** — the intended action is pending, in progress, completed, failed, or ambiguous.
7. **Persisted state** — the external system actually saved the result.

Do not repair a higher layer until the lower layers are known. For example, do not reopen a URL because a tab binding was lost, and do not repeat Submit because the local click response was missing.

## Keep a target identity capsule

Before a multi-step workflow or write, retain the strongest available identity:

```js
var uiTarget = {
  app: "Google Chrome",
  bundleId: "com.google.Chrome",
  windowTitle: "Channel content - YouTube Studio",
  tabId: "684841213",
  providerTabId: '["browser-instance","684841213"]',
  urlOrDocument: "https://studio.youtube.com/channel/...",
  resourceId: "channel-or-video-id",
  accountMarker: "expected account or channel",
  expectedState: "editing one unlisted video"
};
```

Use only fields that exist. Prefer stable resource IDs over titles and titles over window order. Treat tab IDs as stable for the life of that tab/browser instance, not across an actual browser restart.

## Select the control surface

Use the narrowest reliable surface that preserves the user's intended session:

1. Use a purpose-built connector, API, or CLI for semantic operations when available and when the user did not explicitly request visible UI interaction.
2. Use a dedicated app/browser plugin when the task depends on its live authenticated context.
3. For Chrome, recover the tab binding first. Use native Computer Use on the **same app and profile** only under the shared-focus fallback rule above.
4. Prefer accessibility actions. Use screenshots and coordinates only when accessibility is incomplete or incorrect.
5. Do not use AppleScript, shell-driven UI automation, or another automation technology unless the user explicitly requests it.
6. Ask the user to intervene only after supported state refresh, identity recovery, same-app fallback, and tool-specific troubleshooting fail.

Never silently switch browser family, browser profile, desktop app, account, or authenticated destination.

## Finish the requested UI outcome

Treat local preparation as an intermediate checkpoint, not completion. If the user asked to attach, upload, save, publish, submit, or otherwise finish a UI workflow, do not stop at “the file is ready,” “select it manually,” or “the browser binding cannot handle the picker” while a supported Computer Use path remains.

- At a native-control boundary, first use the documented tab-bound chooser or download interface when available. If native Computer Use is required, coordinate shared focus as described above before operating it.
- Continue in the same turn through attachment and post-action verification when authorization permits.
- Do not merely promise to use the fallback later. Invoke it and report observed results.
- If a named Computer Use tool is not visible, check the current agent's supported desktop interfaces before calling the capability unavailable. Do not assume another agent's runtime or package is installed.
- If the first fallback attempt fails, re-observe and try the next supported same-app path. Escalate only with the exact attempted methods and current UI state.
- During a stalled or long handoff, provide a concrete progress update within 60 seconds and keep working.

The fallback changes the control surface, not the task scope, destination, account, or confirmation requirements.

## Reliable operating loop

### 1. Initialize or reuse

- Reuse persistent tool and app bindings when valid.
- For Chrome, initialize the documented browser adapter and bind the exact tab first. For native applications, initialize Computer Use and inspect the named app.
- If a display-name lookup fails, retry with the bundle identifier before broader discovery.
- Do not reset the JavaScript session as a first-line recovery; resets destroy useful identity and operation state.

### 2. Observe fresh state

- Fetch state from the bound tab before browser actions; fetch app state before native actions.
- Use the accessibility tree for identity and controls; inspect the screenshot when layout, focus, overlays, canvas content, native dialogs, or multiple monitors matter.
- If the returned accessibility text is only a diff and earlier state is unavailable or suspect, request a fresh full state.
- Treat empty or partial accessibility text as incomplete evidence, not proof that the UI is blank.

### 3. Verify the target

Confirm the app, window/document/tab, resource ID or URL, account, and current operation state. When multiple candidates exist, do not choose by first match, visual order, frontmost monitor, or approximate title.

### 4. Perform the smallest action

- Prefer one semantic accessibility action at a time.
- Re-fetch state after focus changes, navigation, modal transitions, file selection, user interruption, or any action that can rerender the UI.
- Never reuse an `element_index` after refreshing state.
- Avoid typing text containing newlines into controls where Return may submit. Use `set_value` when appropriate, or enter multiline content only after verifying the editor behavior.

### 5. Verify the result

Check an observable postcondition: changed value, URL, selected state, enabled button, progress indicator, saved banner, resulting record, or external readback. A successful click or lack of an error is not completion evidence.

### 6. Checkpoint long workflows

After each item, record target identity, intended action, completion evidence, and next item. Resume from persisted evidence rather than memory or screen position.

## Recovery matrix

| Symptom | Likely layer | Recovery | Do not assume |
|---|---|---|---|
| App lookup fails | Tool/app identity | Retry exact bundle ID, then inspect running apps | App is not installed or closed |
| Accessibility tree is empty | Snapshot/focus | Request full state, inspect screenshot, activate intended window | UI is blank |
| Element index fails | Snapshot | Re-fetch state and derive a new index | Control disappeared permanently |
| Click has no visible effect | UI/operation | Re-observe; check overlays, disabled state, focus, and persisted result | Click failed or should be repeated |
| Wrong window receives input | Focus/identity | Stop typing, fetch full state, identify exact window/document | Frontmost window is the target |
| Button remains disabled | UI validation | Inspect required fields and select real UI options that update internal state | Setting displayed text is sufficient |
| Browser upload opens a native picker | Browser/file chooser | Cancel the picker, reacquire the exact tab, and use the browser `filechooser` plus `setFiles` flow first | Native picker automation is required |
| File is highlighted but Open stays disabled | Native picker/validation | Cancel the picker and use the browser chooser flow; inspect the site's accepted types only if that fails | The local file is invalid |
| Loading appears stuck | Operation | Recheck progress, network/error UI, and persisted state with bounded waits | Timeout means failure |
| User interrupts or uses the app | Focus/operation | Stop, re-observe from scratch, verify whether the last action completed | Focus and form contents are unchanged |
| Browser tab list is empty | Tab binding | Enumerate user-visible tabs, claim stable ID, then verify URL/account | Browser or tab closed |
| Screenshot and AX disagree | Snapshot/rendering | Trust neither alone; inspect both after activating the target | One surface is authoritative everywhere |
| Tool disconnects | Transport | Read tool troubleshooting, reacquire the same explicit app/browser, then restore identity | Switching surfaces/accounts is safe |

## Browser and tab recovery

When a dedicated Chrome binding fails, preserve the same live Chrome session:

1. Reuse the existing browser binding unless an explicit disconnect occurred.
2. Distinguish claimed tabs from user-visible tabs. `tabs.list() === []` can mean only that no tabs are claimed.
3. Use the adapter's user-visible tab inventory and match a saved stable ID, URL/resource ID, or exact title plus origin/account marker.
4. Bind or claim the existing tab through the adapter's documented interface when necessary.
5. Verify URL/resource and account markers after claiming.
6. Read Chrome-specific troubleshooting before declaring the binding unavailable.
7. If enumeration or claim remains unavailable, coordinate shared focus, inspect `com.google.Chrome` with native Computer Use, activate the verified tab, then retry tab-bound control.

Do not reload, duplicate, or recreate the tab until the user-visible inventory and same-Chrome recovery path are exhausted. Say “tab binding was lost,” not “the tab was closed,” unless closure was observed.

## Focus, windows, and monitors

- Treat monitor choice as part of target identity only when the user specifies it or the same title appears in multiple windows.
- Inspect screenshots before coordinate actions; coordinates without current visual evidence are invalid.
- Prefer activating a window by accessible title or document identity. Re-check the screen after activation.
- Account for sidebars, browser tab groups, sheets, popovers, permission dialogs, download panels, and native file pickers that may own focus.
- If two windows contain the same app and title, require a stronger marker such as URL, document path, resource ID, account, or visible content.

## Forms and hidden application state

- Do not assume changing visible text updates framework state. Dropdowns, date/time pickers, editors, and custom controls may require selecting a real option or dispatching the UI's expected event.
- When a button is disabled, inspect validation text, required fields, selected options, uploads in progress, and hidden modal state before retrying.
- For file uploads, verify the selected filename, upload completion, and resulting preview before saving.
- For multiline input, protect against Return-triggered submission.
- Before saving, compare the intended payload with visible fields and destination identity.

## Browser file uploads and native pickers

Use the current browser adapter's documented file-chooser API when available.
Verify the exact tab, destination, accepted file type, and local path. Catch chooser
failures, then check the filename, preview, and upload completion before saving.

If that API is unavailable or fails, inspect the native picker through a supported
Computer Use interface in the same app and session. Confirm focus before entering
the path; re-observe before activating Open/Choose, then verify the parent page's
upload and saved state. Do not repeatedly press Return or switch accounts to recover.

Adapter-specific examples are in [Codex browser examples](references/codex-browser-examples.md).
Use them only when the current tool documentation supports those interfaces.

## Interruptions and ambiguous completion

After any cancellation, timeout, focus theft, user action, tool exception, or context compaction:

1. Stop issuing writes.
2. Reacquire the exact app/window/tab/document.
3. Read current form and persisted destination state.
4. Classify the previous action as completed, pending, failed, or ambiguous.
5. Repeat only when duplication is ruled out or the operation is known idempotent.
6. Continue from the checkpoint, not from the beginning of the batch.

For uploads, sends, publishes, saves, deletions, purchases, or submissions, absence of a local success response is never enough reason to retry.

## Waiting and progress

- Prefer fresh state checks over fixed sleeps.
- Keep waits bounded and communicate during long operations.
- Distinguish loading, processing, disabled, blocked, failed, and completed states.
- If progress is asynchronous, verify through a durable status page, resulting record, download, or saved marker.
- Do not abandon a live operation solely because one poll returned no change.

## Safety and confirmation

- Apply the active Computer Use confirmation policy at the consequential action, not during harmless recovery.
- Recovery and inspection are read-only unless they change app state beyond focus or navigation.
- Before a write, verify exact destination, account, payload, current state, and whether the user already performed the action.
- Save and verify one item before advancing a fragile batch.
- Never use recovery as permission to bypass authentication, CAPTCHAs, browser security warnings, or approval boundaries.

## Escalation report

When blocked, report:

- the last verified app/window/tab/document identity;
- which layer failed;
- current observable state from accessibility and screenshot evidence;
- recovery paths attempted;
- whether the previous consequential action completed;
- the smallest user intervention required.

Avoid claims such as “Chrome crashed,” “the tab closed,” “the click failed,” or “nothing saved” unless directly verified.
