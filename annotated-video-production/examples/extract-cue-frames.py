#!/usr/bin/env python3
"""Extract settled and near-exit frames for each cue from an encoded video."""
import argparse
import json
import re
import subprocess
from pathlib import Path


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("video", type=Path)
    parser.add_argument("manifest", type=Path)
    parser.add_argument("output_dir", type=Path)
    args = parser.parse_args()
    cues = json.loads(args.manifest.read_text())["cues"]
    args.output_dir.mkdir(parents=True, exist_ok=True)
    ids = set()
    for cue in cues:
        cue_id = cue["id"]
        start, duration = float(cue["start"]), float(cue["duration"])
        if not re.fullmatch(r"[A-Za-z0-9_-]+", cue_id) or cue_id in ids or start < 0 or duration <= 0:
            parser.error(f"invalid or duplicate cue: {cue_id!r}")
        ids.add(cue_id)
        offsets = (("settled", min(2, duration / 2)), ("exit", max(0, duration - 0.7)))
        for label, offset in offsets:
            output = args.output_dir / f"{cue_id}-{label}.jpg"
            try:
                subprocess.run([
                    "ffmpeg", "-hide_banner", "-loglevel", "error", "-n", "-ss", str(start + offset),
                    "-i", str(args.video), "-frames:v", "1", str(output),
                ], check=True)
            except subprocess.CalledProcessError:
                raise SystemExit(f"Frame extraction failed at {start + offset:g}s for {cue_id}; check FFmpeg output and the timebase")
            if not output.is_file():
                raise SystemExit(f"No frame at {start + offset:g}s for {cue_id}; check the timebase and duration")
    print(f"Extracted {len(cues) * 2} frames for {len(cues)} cues into {args.output_dir}")


if __name__ == "__main__":
    main()
