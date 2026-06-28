# YouTube Studio DOM Patterns

## Target The Right Chrome Tab

When the user may be using Chrome too, avoid active-tab assumptions. Prefer a known Studio tab:

```applescript
tell application "Google Chrome" to execute tab 1 of window 1 javascript "<js>"
tell application "Google Chrome" to set URL of tab 1 of window 1 to "https://studio.youtube.com/video/VIDEO_ID/edit"
```

If the tab/window is not known, enumerate windows/tabs and select the tab whose URL starts with `https://studio.youtube.com/video/`.

## Wait For Edit Page Readiness

```js
(() => JSON.stringify({
  ready:
    location.href.includes("/video/VIDEO_ID/") &&
    document.body.innerText.includes("Video details") &&
    document.body.innerText.length > 1000 &&
    [...document.querySelectorAll("button, ytcp-icon-button, [role=button]")]
      .some(e => (e.innerText || e.textContent || e.getAttribute("aria-label") || "")
        .includes("Edit video visibility status")),
  url: location.href
}))()
```

## Async JS Must Be Start-And-Poll

Chrome AppleScript does not reliably await Promises. Start the async work in-page:

```js
(() => {
  window.__codexResult = null;
  (async () => {
    try {
      // async browser work
      window.__codexResult = { ok: true };
    } catch (err) {
      window.__codexResult = { ok: false, error: String(err && err.message || err) };
    }
  })();
  return JSON.stringify({ ok: true, started: true });
})()
```

Then poll:

```js
(() => JSON.stringify(window.__codexResult || { ok: null, pending: true }))()
```

## Thumbnail Injection

Wait for the file input:

```js
(() => {
  const label = [...document.querySelectorAll("*")]
    .find(e => (e.innerText || e.textContent || "").trim() === "Thumbnail");
  if (label) label.scrollIntoView({ block: "center" });
  const input = document.querySelector("input[type=file]#file-loader") ||
    document.querySelector("input[type=file]");
  return JSON.stringify({ ready: !!input });
})()
```

Inject a local file via localhost:

```js
(() => {
  window.__codexThumbResult = null;
  (async () => {
    try {
      const input = document.querySelector("input[type=file]#file-loader") ||
        document.querySelector("input[type=file]");
      if (!input) throw new Error("missing file input");
      const res = await fetch("http://127.0.0.1:PORT/thumb?path=ENCODED_PATH", { cache: "no-store" });
      if (!res.ok) throw new Error("fetch " + res.status);
      const blob = await res.blob();
      const file = new File([blob], "thumbnail.jpg", { type: blob.type || "image/jpeg" });
      const dt = new DataTransfer();
      dt.items.add(file);
      input.files = dt.files;
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
      window.__codexThumbResult = { ok: true, size: file.size, type: file.type };
    } catch (err) {
      window.__codexThumbResult = { ok: false, error: String(err && err.message || err) };
    }
  })();
  return JSON.stringify({ ok: true, started: true });
})()
```

Use a threaded localhost server with `Access-Control-Allow-Origin: *`; slow single-thread servers can make async fetches appear stuck.

## Visibility And Schedule

Open popup:

```js
(() => {
  const button = [...document.querySelectorAll("button, ytcp-icon-button, [role=button]")]
    .find(e => (e.innerText || e.textContent || e.getAttribute("aria-label") || "")
      .includes("Edit video visibility status"));
  if (!button) return JSON.stringify({ ok: false, error: "missing visibility button" });
  button.scrollIntoView({ block: "center" });
  button.click();
  return JSON.stringify({ ok: true });
})()
```

Then poll for the popup before selecting Schedule. A click can succeed without the
popup being ready yet:

```js
(() => {
  const popup = document.querySelector("ytcp-video-visibility-edit-popup");
  const text = popup ? (popup.innerText || popup.textContent || "") : "";
  return JSON.stringify({
    ready: !!popup && /Save or publish|Schedule|Public|Unlisted/.test(text),
    text: text.slice(0, 1000)
  });
})()
```

Select schedule:

```js
(() => {
  const popup = document.querySelector("ytcp-video-visibility-edit-popup") || document;
  const el = [...popup.querySelectorAll("tp-yt-paper-radio-button, [role=radio], #second-container, div, p")]
    .find(e => (e.innerText || e.textContent || "").includes("Schedule as public"));
  if (!el) return JSON.stringify({ ok: false, error: "missing schedule", text: popup.innerText });
  el.click();
  return JSON.stringify({ ok: true });
})()
```

Select time from the dropdown option, not by assigning the input:

```js
(() => {
  const input = [...document.querySelectorAll("input")]
    .find(i => /AM|PM/i.test(i.value || ""));
  input.click();
  return JSON.stringify({ opened: true });
})()
```

Then:

```js
(() => {
  const targets = ["9:00 AM", "9:00\u202fAM"];
  const option = [...document.querySelectorAll("[role=option], tp-yt-paper-item, div")]
    .filter(e => !!(e.offsetParent || e.getClientRects().length))
    .find(e => targets.includes((e.innerText || e.textContent || "").trim().replace(/\s+/g, " ")));
  if (!option) return JSON.stringify({ ok: false, error: "missing time option" });
  option.click();
  const done = [...document.querySelectorAll("button, ytcp-button")]
    .filter(e => (e.innerText || e.textContent || e.getAttribute("aria-label") || "").trim() === "Done")
    .pop();
  return JSON.stringify({
    ok: !!done && !(done.disabled || done.getAttribute("aria-disabled") === "true"),
    doneDisabled: done ? (done.disabled || done.getAttribute("aria-disabled")) : "missing"
  });
})()
```

## Save Verification

After `Done`, click page-level `Save`; verify:

```js
(() => JSON.stringify({
  saved: document.body.innerText.includes("All changes saved."),
  saving: document.body.innerText.includes("Saving..."),
  scheduled: document.body.innerText.includes("Visibility\nScheduled")
}))()
```
