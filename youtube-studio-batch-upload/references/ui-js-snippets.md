# YouTube Studio UI Snippets

Use these only after the user has authorized uploads and you have confirmed the active Chrome tab is the correct YouTube Studio upload/edit page. Prefer official APIs if already configured; otherwise these snippets are practical for the Studio UI.

## Execute JavaScript In Chrome

```bash
osascript -e 'tell application "Google Chrome" to execute active tab of window id <WINDOW_ID> javascript "<JS_HERE>"'
```

If AppleScript hangs, interrupt it and use Computer Use state/clicks. Avoid long-running polling scripts that buffer output.

## Set Title And Description

```javascript
(() => {
  const title = "__TITLE__";
  const desc = "__DESC__";
  function setCE(el, text) {
    el.focus();
    document.execCommand("selectAll", false, null);
    document.execCommand("insertText", false, text);
    el.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: text }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  }
  const boxes = [...document.querySelectorAll("[contenteditable=true], #textbox")]
    .filter(e => e.offsetParent !== null || e.getClientRects().length);
  const modalBoxes = boxes.filter(e => {
    const r = e.getBoundingClientRect();
    return r.width > 100 && r.height > 10;
  });
  const titleBox = modalBoxes.filter(e => /title/i.test(e.getAttribute("aria-label") || "")).pop() || modalBoxes[0];
  const descBox = modalBoxes.filter(e => /description|tell viewers/i.test(e.getAttribute("aria-label") || "")).pop() || modalBoxes[1];
  if (!titleBox || !descBox) return JSON.stringify({ result: "missing fields" });
  setCE(titleBox, title);
  setCE(descBox, desc);
  return JSON.stringify({
    result: "metadata set",
    title: titleBox.innerText,
    descLen: descBox.innerText.length,
    sourceUrl: /drive\.google|loom\.com|youtu\.be|youtube\.com|we\.tl|wetransfer/i.test(descBox.innerText)
  });
})()
```

Replace `__TITLE__` and `__DESC__` with JSON-escaped strings from metadata. A `sourceUrl: true` result is a stop sign unless the URL is intentionally public channel/link content.

## Select Playlist

Open the picker:

```javascript
(() => {
  const controls = [...document.querySelectorAll("button, ytcp-button, ytcp-dropdown-trigger")];
  const picker = controls.find(e =>
    ((e.innerText || e.textContent || e.getAttribute("aria-label") || "").includes("Select playlists")) ||
    (e.innerText || e.textContent || "").trim() === "Select"
  );
  if (!picker) return "no playlist control";
  picker.scrollIntoView({ block: "center" });
  picker.click();
  return "opened playlist";
})()
```

Select and close:

```javascript
(() => {
  const target = "__PLAYLIST_NAME__";
  const rows = [...document.querySelectorAll("tp-yt-paper-item, ytcp-checkbox-lit, [role=checkbox], .row-container, div")];
  const row = rows.find(e => (e.innerText || e.textContent || "").includes(target));
  if (!row) return JSON.stringify({ result: "no row", text: document.body.innerText.slice(-2500) });
  const root = row.closest("tp-yt-paper-item") || row.closest(".row-container") || row;
  const cb = root.querySelector("ytcp-checkbox-lit,[role=checkbox],tp-yt-paper-checkbox,#checkbox") ||
    row.querySelector?.("ytcp-checkbox-lit,[role=checkbox],tp-yt-paper-checkbox,#checkbox") ||
    row;
  const checked = cb && (cb.checked || cb.getAttribute("aria-checked") === "true" || cb.hasAttribute("checked") || cb.classList.contains("checked"));
  if (cb && !checked) cb.click();
  const done = [...document.querySelectorAll("button, ytcp-button")]
    .filter(e => (e.innerText || e.textContent || "").trim() === "Done")
    .pop();
  if (done) done.click();
  return JSON.stringify({ result: "playlist selected/done", wasChecked: !!checked });
})()
```

## Advance Steps

Run this up to three times, waiting between calls:

```javascript
(() => {
  const b = [...document.querySelectorAll("button, ytcp-button")]
    .filter(e => ((e.innerText || e.textContent || e.getAttribute("aria-label") || "").trim() === "Next" || e.getAttribute("aria-label") === "Next"))
    .pop();
  if (!b) return "no Next";
  if (b.disabled || b.getAttribute("aria-disabled") === "true") return "Next disabled";
  b.click();
  return "clicked Next";
})()
```

## Select Unlisted And Save

```javascript
(() => {
  const radios = [...document.querySelectorAll("tp-yt-paper-radio-button, ytcp-radio-button, [role=radio]")];
  const unlisted = radios.find(e => (e.innerText || e.textContent || e.getAttribute("aria-label") || "").trim().startsWith("Unlisted"));
  if (!unlisted) return JSON.stringify({ result: "no unlisted", body: document.body.innerText.slice(-1200) });
  unlisted.click();
  const saves = [...document.querySelectorAll("button, ytcp-button")]
    .filter(e => ((e.innerText || e.textContent || e.getAttribute("aria-label") || "").trim() === "Save") || e.getAttribute("aria-label") === "Save");
  const save = saves.pop();
  if (!save) return JSON.stringify({ result: "no save" });
  if (save.disabled || save.getAttribute("aria-disabled") === "true") return JSON.stringify({ result: "save disabled" });
  save.click();
  return JSON.stringify({ result: "unlisted/save clicked" });
})()
```

If Save is disabled and a processing dialog says SD must finish, wait. Close the processing dialog only after it reports processing complete, then verify the row appears as `Unlisted`.

## Verify Row State

```javascript
(() => JSON.stringify({
  text: document.body.innerText.slice(0, 3000),
  matches: [...document.querySelectorAll("a[href], div, span")]
    .map(e => ({ text: (e.innerText || e.textContent || "").trim(), href: e.href || "" }))
    .filter(x => x.text.includes("__TITLE_PART__") || x.href.includes("__VIDEO_ID__"))
    .slice(0, 20)
}))()
```
