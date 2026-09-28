# Codex browser and Computer Use examples

These examples apply only when the installed adapter documents the APIs shown.
Do not assume these APIs, runtime packages, or extension settings exist in other agents.
Use current tool documentation when interfaces differ.

## Browser file uploads

Prefer the dedicated browser's file-chooser API over operating the native macOS picker. A native picker showing the expected file while Open remains disabled is a routing failure, not evidence that the file is invalid.

1. Verify the exact tab, destination account or record, visible upload control, accepted file type, and absolute local path.
2. Start the chooser wait and click the visible upload control concurrently. Click the visible button or label instead of a hidden `input[type="file"]`; extensions may augment or intercept the hidden input.
3. Set the file through the returned chooser and catch asynchronous failures so a timed-out chooser cannot reset the persistent browser session:

```js
var chooser;
try {
  var [openedChooser] = await Promise.all([
    tab.playwright.waitForEvent("filechooser", { timeoutMs: 10000 }),
    tab.playwright.getByRole("button", { name: "Upload file" }).click()
  ]);
  chooser = openedChooser;
  await chooser.setFiles([absoluteFilePath], { timeoutMs: 15000 });
} catch (error) {
  nodeRepl.write(`File chooser failed: ${error.message}`);
}
```

4. Re-observe the page and verify the exact filename, preview, upload completion, and enabled Save/Submit state. Save only when authorization permits, then verify the saved state.
5. If `setFiles` fails in Chrome, read the browser's file-upload troubleshooting documentation. A common prerequisite is enabling **Allow access to file URLs** for the ChatGPT browser extension in `chrome://extensions`.
6. Fall back to the native picker through Computer Use only when the supported chooser flow is unavailable or fails. Keep the same browser, profile, tab, account, and destination.

If a native picker is already open from an earlier attempt, cancel it before starting the browser chooser flow. Reacquire the exact user-visible tab by its fresh stable identity and verify its URL/account before retrying.

## Native file-picker handoff

Use this sequence only after the browser file-chooser flow above is unavailable or has failed:

1. Verify the exact app, stable browser tab or document, destination account, upload field, and absolute local file path.
2. Click the upload control with the dedicated plugin when possible. If that cannot open the picker, inspect the same app with Computer Use and click the control there.
3. Bootstrap Computer Use directly when needed:

```js
globalThis.sky = globalThis.sky ?? (await import("@oai/sky")).sky;
var pickerState = await sky.get_app_state({
  app: "com.google.Chrome",
  disableDiff: true
});
nodeRepl.write(pickerState.text);
```

4. Confirm from fresh accessibility or screenshot evidence that the native picker or sheet is active. Do not send path keystrokes before confirming picker focus.
5. Use the macOS Go to Folder command, enter the exact absolute path without a newline, and re-observe between steps:

```js
await sky.press_key({ app: "com.google.Chrome", key: "super+shift+g" });
var goState = await sky.get_app_state({ app: "com.google.Chrome" });
await sky.type_text({ app: "com.google.Chrome", text: absoluteFilePath });
await sky.press_key({ app: "com.google.Chrome", key: "Return" });
var selectedState = await sky.get_app_state({ app: "com.google.Chrome" });
```

6. If the picker now highlights the file but remains open, verify the filename and activate the visible Open/Choose control or press Return once. Never press Return repeatedly without re-observing; it can submit the parent page after the dialog closes.
7. Reacquire the parent app or stable browser tab. Verify the picker closed, the expected filename/preview appeared, upload processing completed, and no error is shown.
8. Complete the requested Save/Publish step only under the active confirmation policy, then verify persisted state.

If accessibility does not expose the picker, inspect the current screenshot and use current coordinates against the same app. Do not fall back to AppleScript or a different browser unless the user explicitly requests it. A plugin's inability to set native file input is a routing signal to Computer Use, not a blocker.

