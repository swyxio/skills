#!/usr/bin/env python3
"""Publish a completed render as an immutable snapshot with an atomic pointer."""

from __future__ import annotations

import argparse
import json
import os
import shutil
import tempfile
from datetime import datetime, timezone
from pathlib import Path


def fsync_directory(path: Path) -> None:
    try:
        descriptor = os.open(path, os.O_RDONLY)
    except OSError:
        return
    try:
        os.fsync(descriptor)
    finally:
        os.close(descriptor)


def publish(source: Path, snapshots: Path, current: Path, label: str) -> dict[str, str]:
    source = source.resolve()
    snapshots = snapshots.resolve()
    current = current.absolute()
    if not source.is_dir():
        raise ValueError(f"source directory does not exist: {source}")
    snapshots.mkdir(parents=True, exist_ok=True)
    destination = snapshots / label
    if destination.exists() or destination.is_symlink():
        raise ValueError(f"snapshot already exists: {destination}")
    if current.exists() and not current.is_symlink():
        raise ValueError(f"current pointer must be a symlink or absent: {current}")

    staging = Path(tempfile.mkdtemp(prefix=".snapshot-", dir=snapshots))
    try:
        staged_tree = staging / label
        shutil.copytree(source, staged_tree)
        manifest = {
            "snapshot_id": label,
            "published_at": datetime.now(timezone.utc).isoformat(),
            "source": str(source),
        }
        (staged_tree / "snapshot-manifest.json").write_text(
            json.dumps(manifest, indent=2) + "\n", encoding="utf-8"
        )
        os.replace(staged_tree, destination)
        fsync_directory(snapshots)

        current.parent.mkdir(parents=True, exist_ok=True)
        temporary_pointer = current.parent / f".current-{os.getpid()}-{label}"
        if temporary_pointer.exists() or temporary_pointer.is_symlink():
            temporary_pointer.unlink()
        os.symlink(destination.name, temporary_pointer)
        os.replace(temporary_pointer, current)
        fsync_directory(current.parent)
    finally:
        shutil.rmtree(staging, ignore_errors=True)

    return {"snapshot_id": label, "snapshot": str(destination), "current": str(current)}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", type=Path, required=True)
    parser.add_argument("--snapshots", type=Path, required=True)
    parser.add_argument("--current", type=Path, required=True)
    parser.add_argument(
        "--label",
        default=datetime.now(timezone.utc).strftime("site-%Y%m%dT%H%M%SZ"),
        help="unique snapshot directory name",
    )
    args = parser.parse_args()
    result = publish(args.source, args.snapshots, args.current, args.label)
    print(json.dumps(result, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
