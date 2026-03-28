#!/usr/bin/env python3
"""
upload_video.py — Upload a video to YouTube via the Data API v3.

Usage:
  python upload_video.py --file /path/to/video.mp4
  python upload_video.py --file /path/to/video.mp4 --privacy unlisted
  python upload_video.py --file /path/to/video.mp4 --title "Custom Title" \
    --description "Optional description" --tags "tag1,tag2"
"""

import argparse
import mimetypes
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from yt_auth import CONFIG_DIR, DEFAULT_CREDENTIALS, build_youtube_client


def default_title_for(path: Path) -> str:
    title = path.stem
    title = re.sub(r"\s*\[\d+\]\s*$", "", title)
    return title.strip()


def validate_video(path: str) -> Path:
    p = Path(path).expanduser().resolve()
    if not p.exists():
        raise FileNotFoundError(f"Video not found: {p}")
    if not p.is_file():
        raise ValueError(f"Not a file: {p}")
    return p


def upload_video(youtube, video_path: Path, title: str, description: str,
                 privacy: str, tags: list[str]) -> dict:
    from googleapiclient.http import MediaFileUpload

    mime_type = mimetypes.guess_type(str(video_path))[0] or "application/octet-stream"

    body = {
        "snippet": {
            "title": title,
            "description": description or "",
            "tags": tags or [],
        },
        "status": {
            "privacyStatus": privacy,
            "selfDeclaredMadeForKids": False,
        },
    }

    media = MediaFileUpload(str(video_path), mimetype=mime_type, resumable=True)
    request = youtube.videos().insert(
        part="snippet,status",
        body=body,
        media_body=media,
    )

    response = None
    while response is None:
        status, response = request.next_chunk()
        if status is not None:
            print(f"  Upload progress: {int(status.progress() * 100)}%")

    if "id" not in response:
        raise RuntimeError(f"Upload finished without a video ID: {response}")

    return response


def main():
    parser = argparse.ArgumentParser(
        description="Upload a video to YouTube via the Data API v3"
    )
    parser.add_argument("--file", required=True, help="Path to video file")
    parser.add_argument("--title", help="Video title (defaults to filename)")
    parser.add_argument("--description", default="", help="Video description")
    parser.add_argument("--tags", help="Comma-separated tags")
    parser.add_argument(
        "--privacy",
        default="unlisted",
        choices=("private", "unlisted", "public"),
        help="YouTube privacy status (default: unlisted)",
    )
    parser.add_argument(
        "--credentials",
        default=str(DEFAULT_CREDENTIALS),
        help=f"Path to OAuth client_secret.json (default: {DEFAULT_CREDENTIALS})",
    )

    args = parser.parse_args()

    video_path = validate_video(args.file)
    title = args.title or default_title_for(video_path)
    tags = [t.strip() for t in args.tags.split(",")] if args.tags else []

    print(f"Config directory: {CONFIG_DIR}")
    print(f"Video file: {video_path}")
    print(f"Title: {title}")
    print(f"Privacy: {args.privacy}")

    youtube = build_youtube_client(Path(args.credentials))
    response = upload_video(
        youtube,
        video_path=video_path,
        title=title,
        description=args.description,
        privacy=args.privacy,
        tags=tags,
    )

    video_id = response["id"]
    print()
    print("Upload complete.")
    print(f"  Video ID: {video_id}")
    print(f"  URL: https://www.youtube.com/watch?v={video_id}")
    print(f"  Studio: https://studio.youtube.com/video/{video_id}/edit")


if __name__ == "__main__":
    main()
