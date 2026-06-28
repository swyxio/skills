#!/usr/bin/env python3
"""Small reusable skeleton for YouTube Studio edit-page automation.

Copy this into a task work directory and adapt selectors/queue shape. It is
intentionally a skeleton: live Studio tasks should keep a task-specific ledger
and should be tested on one video before running a batch.
"""

import json
import subprocess
import time
from pathlib import Path


def chrome_js(js: str, window: int = 1, tab: int = 1, timeout: int = 30):
    script = (
        f'tell application "Google Chrome" to execute tab {tab} of window {window} javascript '
        + json.dumps(js)
    )
    result = subprocess.run(
        ["osascript", "-e", script],
        text=True,
        capture_output=True,
        timeout=timeout,
        check=False,
    )
    if result.returncode:
        raise RuntimeError(result.stderr.strip() or result.stdout.strip())
    out = result.stdout.strip()
    try:
        parsed = json.loads(out)
        if isinstance(parsed, str) and parsed[:1] in "[{":
            return json.loads(parsed)
        return parsed
    except json.JSONDecodeError:
        return out


def set_studio_url(video_id: str, window: int = 1, tab: int = 1):
    url = f"https://studio.youtube.com/video/{video_id}/edit"
    script = f'tell application "Google Chrome" to set URL of tab {tab} of window {window} to {json.dumps(url)}'
    subprocess.run(["osascript", "-e", script], check=False, text=True, capture_output=True, timeout=10)


def wait_until(js_probe: str, predicate=lambda x: bool(x.get("ready")), timeout_s: int = 45):
    deadline = time.time() + timeout_s
    last = None
    while time.time() < deadline:
        last = chrome_js(js_probe, timeout=12)
        if isinstance(last, dict) and predicate(last):
            return last
        time.sleep(0.75)
    raise TimeoutError(f"condition did not become true: {last}")


def append_status(path: Path, record: dict):
    data = json.loads(path.read_text()) if path.exists() else []
    data.append(record)
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")


if __name__ == "__main__":
    print("Import and adapt this skeleton for the concrete Studio task.")
