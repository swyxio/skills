#!/usr/bin/env python3
"""Yield complete items from a named top-level JSON array as chunks arrive.

The input may split anywhere, including inside strings or nested objects. The
parser buffers until Python's JSON decoder can close one array item. It does
not treat arbitrary network chunks as complete JSON documents.

Example:
    printf '%s' '{"observations":[{"id":"o1"},{"id":"o2"}]}' \
      | python3 incremental_json.py --array observations
"""

from __future__ import annotations

import argparse
import json
import sys
from typing import Any


class TopLevelArrayParser:
    """Incrementally parse items from one top-level JSON array."""

    def __init__(self, array_name: str):
        if not array_name:
            raise ValueError("array_name must not be empty")
        self.array_name = array_name
        self.decoder = json.JSONDecoder()
        self.buffer = ""
        self.started = False
        self.closed = False

    def feed(self, chunk: str) -> list[Any]:
        if self.closed:
            # The enclosing response may contain fields after the target array.
            # This parser is scoped to that array and intentionally ignores the
            # remainder of the response.
            return []
        self.buffer += chunk
        return self._drain()

    def finish(self) -> list[Any]:
        items = self._drain()
        if not self.started:
            raise ValueError(f'top-level array "{self.array_name}" was not found')
        if not self.closed:
            raise ValueError(f'target array "{self.array_name}" was truncated')
        return items

    def _drain(self) -> list[Any]:
        items: list[Any] = []
        if self.closed:
            return items
        if not self.started:
            array_start = self._find_root_array_start()
            if array_start is None:
                # Keep the buffer intact because the property name may be split
                # across chunks. This is suitable for model responses, where
                # the object is normally bounded by a request-sized buffer.
                return items
            self.buffer = self.buffer[array_start:]
            self.started = True

        while True:
            self.buffer = self.buffer.lstrip()
            if not self.buffer:
                return items
            if self.buffer[0] == "]":
                self.buffer = self.buffer[1:]
                self.closed = True
                return items

            try:
                value, end = self.decoder.raw_decode(self.buffer)
            except json.JSONDecodeError:
                # The JSON value may be incomplete because the next network
                # chunk has not arrived. finish() turns a permanently incomplete
                # response into an explicit error.
                return items

            remainder = self.buffer[end:]
            stripped = remainder.lstrip()
            if not stripped:
                # Keep the decoded value in the buffer until the next chunk
                # supplies a comma or closing bracket. A model stream often
                # ends a network chunk exactly after the final character of an
                # object, and consuming it here would lose the item.
                return items
            if stripped[0] not in ",]":
                raise ValueError("target array contains invalid separator")

            items.append(value)
            self.buffer = stripped
            if self.buffer[0] == ",":
                self.buffer = self.buffer[1:]
                continue
            self.buffer = self.buffer[1:]
            self.closed = True
            return items

    def _find_root_array_start(self) -> int | None:
        """Return the opening array position for a root-object property."""
        depth = 0
        index = 0
        while index < len(self.buffer):
            char = self.buffer[index]
            if char == '"':
                try:
                    value, end = self.decoder.raw_decode(self.buffer, index)
                except json.JSONDecodeError:
                    return None
                if depth == 1 and value == self.array_name:
                    cursor = end
                    while cursor < len(self.buffer) and self.buffer[cursor].isspace():
                        cursor += 1
                    if cursor >= len(self.buffer) or self.buffer[cursor] != ":":
                        return None
                    cursor += 1
                    while cursor < len(self.buffer) and self.buffer[cursor].isspace():
                        cursor += 1
                    if cursor >= len(self.buffer) or self.buffer[cursor] != "[":
                        return None
                    return cursor + 1
                index = end
                continue
            if char in "{[":
                depth += 1
            elif char in "}]":
                depth -= 1
            index += 1
        return None


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--array", required=True, help="top-level array property name")
    parser.add_argument("--chunk-size", type=int, default=4096)
    args = parser.parse_args()
    if args.chunk_size < 1:
        parser.error("--chunk-size must be positive")

    stream_parser = TopLevelArrayParser(args.array)
    while True:
        chunk = sys.stdin.read(args.chunk_size)
        if not chunk:
            break
        for item in stream_parser.feed(chunk):
            sys.stdout.write(json.dumps(item, ensure_ascii=False, separators=(",", ":")) + "\n")
            sys.stdout.flush()
    for item in stream_parser.finish():
        sys.stdout.write(json.dumps(item, ensure_ascii=False, separators=(",", ":")) + "\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
