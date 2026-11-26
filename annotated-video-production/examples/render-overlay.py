#!/usr/bin/env python3
"""Illustrate a single image or video overlay. Adapt to the actual production."""
import argparse
import subprocess
from pathlib import Path


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input", type=Path)
    parser.add_argument("overlay", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--start", type=float, required=True)
    parser.add_argument("--duration", type=float, required=True)
    parser.add_argument("--x", type=int, default=40)
    parser.add_argument("--y", type=int, default=40)
    parser.add_argument("--width", type=int, default=700)
    parser.add_argument("--video", action="store_true", help="overlay is a video, not a still")
    args = parser.parse_args()
    if args.start < 0 or args.duration <= 0.64 or args.width < 2:
        parser.error("start must be nonnegative, duration > 0.64, and width >= 2")
    if args.output.exists():
        parser.error("output exists; choose a new versioned path")

    fade = 0.32
    overlay_input = [] if args.video else ["-loop", "1", "-framerate", "30"]
    filters = (
        f"[1:v]scale={args.width}:-2,format=rgba,"
        f"trim=duration={args.duration},setpts=PTS-STARTPTS,"
        f"fade=t=in:st=0:d={fade}:alpha=1,"
        f"fade=t=out:st={args.duration-fade}:d={fade}:alpha=1,"
        f"setpts=PTS+{args.start}/TB[insert];"
        f"[0:v][insert]overlay=x={args.x}:"
        f"y='{args.y}+30*(1-min(max((t-{args.start})/{fade},0),1))':"
        f"eof_action=pass:repeatlast=0:enable='between(t,{args.start},{args.start+args.duration})'[v]"
    )
    subprocess.run([
        "ffmpeg", "-hide_banner", "-loglevel", "error", "-n", "-i", str(args.input),
        *overlay_input, "-i", str(args.overlay), "-filter_complex", filters,
        "-map", "[v]", "-map", "0:a?", "-map", "0:s?", "-c:v", "libx264",
        "-pix_fmt", "yuv420p", "-c:a", "copy", "-c:s", "copy", str(args.output),
    ], check=True)


if __name__ == "__main__":
    main()
