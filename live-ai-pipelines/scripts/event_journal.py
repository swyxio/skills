#!/usr/bin/env python3
"""Append ordered, durable JSONL events for a long-running local run.

This is intentionally small and dependency-free. It assumes one logical writer
per journal; a POSIX file lock protects the sequence sidecar when multiple
threads or cooperating processes happen to append to the same run.

Example:
    python3 event_journal.py run/telemetry/events.jsonl request_completed \
        --field stage=pass1 --field item_id=chunk-0007 --field completed=7
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import threading
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

try:
    import fcntl  # type: ignore
except ImportError:  # pragma: no cover - Windows fallback
    fcntl = None


class EventJournal:
    """Append events with a monotonic sequence and a crash-tolerant sidecar."""

    def __init__(self, path: str | os.PathLike[str], run_id: str | None = None):
        self.path = Path(path)
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self.seq_path = self.path.with_name(self.path.name + ".seq")
        self.run_id = run_id
        self._lock = threading.Lock()

    def append(self, event_type: str, **fields: Any) -> dict[str, Any]:
        """Append one event and return the exact object written."""
        with self._lock:
            with self.seq_path.open("a+", encoding="utf-8") as seq_file:
                self._lock_file(seq_file)
                seq_file.seek(0)
                raw = seq_file.read().strip()
                seq = int(raw) + 1 if raw else 1
                seq_file.seek(0)
                seq_file.truncate()
                seq_file.write(str(seq))
                seq_file.flush()
                os.fsync(seq_file.fileno())

                event: dict[str, Any] = {
                    "seq": seq,
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "type": event_type,
                }
                if self.run_id is not None:
                    event["run_id"] = self.run_id
                event.update(fields)

                with self.path.open("a", encoding="utf-8") as event_file:
                    event_file.write(json.dumps(event, ensure_ascii=False, separators=(",", ":")) + "\n")
                    event_file.flush()
                    os.fsync(event_file.fileno())
                self._unlock_file(seq_file)
                return event

    @staticmethod
    def _lock_file(handle: Any) -> None:
        if fcntl is not None:
            fcntl.flock(handle.fileno(), fcntl.LOCK_EX)

    @staticmethod
    def _unlock_file(handle: Any) -> None:
        if fcntl is not None:
            fcntl.flock(handle.fileno(), fcntl.LOCK_UN)


def parse_field(raw: str) -> tuple[str, Any]:
    if "=" not in raw:
        raise argparse.ArgumentTypeError("fields must use KEY=VALUE")
    key, value = raw.split("=", 1)
    if not key:
        raise argparse.ArgumentTypeError("field key cannot be empty")
    try:
        return key, json.loads(value)
    except json.JSONDecodeError:
        return key, value


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("path", help="events.jsonl path")
    parser.add_argument("event_type", help="event type, e.g. request_completed")
    parser.add_argument("--run-id", help="run ID to include in every event")
    parser.add_argument(
        "--field",
        action="append",
        default=[],
        type=parse_field,
        metavar="KEY=VALUE",
        help="additional field; JSON literals such as 7, true, and [1,2] are decoded",
    )
    args = parser.parse_args()
    journal = EventJournal(args.path, run_id=args.run_id)
    event = journal.append(args.event_type, **dict(args.field))
    json.dump(event, sys.stdout, ensure_ascii=False)
    sys.stdout.write("\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
