#!/usr/bin/env python3
"""Serve a static site and a local run's status/events over HTTP and SSE."""

from __future__ import annotations

import argparse
import json
import time
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse


class ProgressHandler(SimpleHTTPRequestHandler):
    server_version = "LiveAIPipelineServer/1.0"

    def do_GET(self) -> None:  # noqa: N802 - stdlib handler API
        parsed = urlparse(self.path)
        if parsed.path == "/api/status":
            self.send_json(self.load_status())
            return
        if parsed.path == "/api/events":
            self.stream_events(parse_qs(parsed.query))
            return
        if parsed.path.startswith("/api/artifacts/"):
            self.serve_artifact(parsed.path.removeprefix("/api/artifacts/"))
            return
        if parsed.path == "/api/health":
            self.send_json({"ok": True})
            return
        super().do_GET()

    @property
    def run_dir(self) -> Path:
        return self.server.run_dir  # type: ignore[attr-defined]

    @property
    def events_path(self) -> Path:
        return self.run_dir / "telemetry" / "events.jsonl"

    def load_status(self) -> dict:
        telemetry = self.run_dir / "telemetry"
        for name in ("status.json", "run.json"):
            path = telemetry / name
            if path.exists():
                try:
                    return json.loads(path.read_text(encoding="utf-8"))
                except (OSError, json.JSONDecodeError) as exc:
                    return {"status": "telemetry_error", "error": str(exc)}
        return {"status": "waiting", "run_dir": str(self.run_dir)}

    def load_events(self, after: int) -> list[dict]:
        if not self.events_path.exists():
            return []
        events: list[dict] = []
        with self.events_path.open(encoding="utf-8") as handle:
            for line in handle:
                try:
                    event = json.loads(line)
                except json.JSONDecodeError:
                    continue
                if int(event.get("seq", -1)) > after:
                    events.append(event)
        return events

    def stream_events(self, query: dict[str, list[str]]) -> None:
        try:
            after = int(query.get("after", ["0"])[0])
        except ValueError:
            after = 0
        deadline = time.monotonic() + self.server.sse_seconds  # type: ignore[attr-defined]
        self.send_response(200)
        self.send_header("Content-Type", "text/event-stream; charset=utf-8")
        self.send_header("Cache-Control", "no-cache")
        self.send_header("Connection", "keep-alive")
        self.end_headers()
        try:
            while time.monotonic() < deadline:
                events = self.load_events(after)
                for event in events:
                    seq = int(event.get("seq", after))
                    self.wfile.write(f"id: {seq}\n".encode())
                    self.wfile.write(f"data: {json.dumps(event, ensure_ascii=False)}\n\n".encode())
                    self.wfile.flush()
                    after = max(after, seq)
                self.wfile.write(b": keepalive\n\n")
                self.wfile.flush()
                time.sleep(self.server.poll_seconds)  # type: ignore[attr-defined]
        except (BrokenPipeError, ConnectionResetError):
            return

    def serve_artifact(self, relative: str) -> None:
        candidate = (self.run_dir / relative).resolve()
        root = self.run_dir.resolve()
        if root not in candidate.parents or not candidate.is_file():
            self.send_error(404, "Artifact not found")
            return
        payload = candidate.read_bytes()
        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(payload)))
        self.send_header("Cache-Control", "no-cache")
        self.end_headers()
        self.wfile.write(payload)

    def send_json(self, payload: dict) -> None:
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-cache")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, required=True, help="static site directory")
    parser.add_argument("--run-dir", type=Path, required=True, help="run directory containing telemetry/")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8765)
    parser.add_argument("--poll-seconds", type=float, default=0.5)
    parser.add_argument("--sse-seconds", type=float, default=55.0)
    args = parser.parse_args()
    if not args.root.is_dir():
        parser.error(f"static root does not exist: {args.root}")
    if not args.run_dir.is_dir():
        parser.error(f"run directory does not exist: {args.run_dir}")
    if args.poll_seconds <= 0 or args.sse_seconds <= 0:
        parser.error("poll and SSE durations must be positive")

    handler = lambda *handler_args: ProgressHandler(*handler_args, directory=str(args.root))
    server = ThreadingHTTPServer((args.host, args.port), handler)
    server.run_dir = args.run_dir.resolve()  # type: ignore[attr-defined]
    server.poll_seconds = args.poll_seconds  # type: ignore[attr-defined]
    server.sse_seconds = args.sse_seconds  # type: ignore[attr-defined]
    print(f"Serving {args.root} at http://{args.host}:{args.port}")
    print(f"Run telemetry: {server.run_dir / 'telemetry'}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping")
    finally:
        server.server_close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
