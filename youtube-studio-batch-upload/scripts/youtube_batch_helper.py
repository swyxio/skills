#!/usr/bin/env python3
"""Prepare and audit metadata for YouTube Studio batch uploads."""

from __future__ import annotations

import argparse
import csv
import json
import re
from pathlib import Path
from typing import Any


SOURCE_URL_RE = re.compile(
    r"(drive\.google\.com|docs\.google\.com|loom\.com|youtu\.be|youtube\.com|we\.tl|wetransfer)",
    re.I,
)
PLACEHOLDER_RE = re.compile(r"^(waitlisted|wip|to provide|to provide closer|n/?a|none|)$", re.I)


def norm_key(key: str) -> str:
    return re.sub(r"[^a-z0-9]+", "_", key.strip().lower()).strip("_")


def get(row: dict[str, str], *names: str) -> str:
    normalized = {norm_key(k): v.strip() for k, v in row.items() if k is not None and v is not None}
    for name in names:
        value = normalized.get(norm_key(name), "")
        if value:
            return value
    return ""


def clean_notes(notes: str) -> str:
    lines = []
    for raw in notes.splitlines():
        line = raw.strip()
        if not line or SOURCE_URL_RE.search(line):
            continue
        lines.append(line)
    return "\n".join(lines)


def normalize_handle(value: str, base: str) -> str:
    value = value.strip()
    if not value:
        return ""
    if value.startswith("http://") or value.startswith("https://"):
        return value
    value = value.lstrip("@")
    return base.rstrip("/") + "/" + value


def build_description(row: dict[str, str], skip_source_url: bool = True) -> str:
    talk_description = get(row, "Talk Description", "Description", "Abstract")
    speaker = get(row, "Name", "Speaker", "Presenter")
    company = get(row, "Company/Affiliation", "Company", "Affiliation")
    bio = get(row, "One-Sentence Bio", "Bio", "Speaker Bio")
    twitter = normalize_handle(get(row, "Twitter/X Handle", "Twitter", "X Handle"), "https://x.com")
    linkedin = get(row, "LinkedIn URL", "LinkedIn")
    github = normalize_handle(get(row, "GitHub Handle", "GitHub"), "https://github.com")
    notes = clean_notes(get(row, "Additional Notes", "Notes"))

    parts: list[str] = []
    if talk_description:
        parts.append(talk_description.strip())

    speaker_line = speaker or "Speaker"
    if company:
        speaker_line += f" ({company})"
    if bio:
        speaker_line += f": {bio}"
    parts.append("Speakers:\n- " + speaker_line)

    social_lines = []
    if twitter:
        social_lines.append(f"  X/Twitter: {twitter}")
    if linkedin:
        social_lines.append(f"  LinkedIn: {linkedin}")
    if github:
        social_lines.append(f"  GitHub: {github}")
    if social_lines:
        parts[-1] += "\n" + "\n".join(social_lines)

    if notes:
        parts.append("Additional notes/links:\n" + "\n".join(f"- {line}" for line in notes.splitlines()))

    description = "\n\n".join(parts).strip()
    if skip_source_url:
        description = "\n".join(line for line in description.splitlines() if not SOURCE_URL_RE.search(line))
    return description


def title_for(row: dict[str, str]) -> str:
    talk_title = get(row, "Talk Title", "Title")
    speaker = get(row, "Name", "Speaker", "Presenter")
    if talk_title and speaker:
        return f"{talk_title} - {speaker}"
    return talk_title or speaker or "Untitled upload"


def source_for(row: dict[str, str]) -> str:
    return get(row, "Video Link (URL)", "Video Link", "Video URL", "Source URL", "URL")


def read_rows(path: Path) -> list[dict[str, str]]:
    with path.open(newline="", encoding="utf-8-sig") as f:
        sample = f.read(4096)
        f.seek(0)
        dialect = csv.Sniffer().sniff(sample, delimiters=",\t")
        return list(csv.DictReader(f, dialect=dialect))


def build_metadata(args: argparse.Namespace) -> None:
    rows = read_rows(Path(args.input))
    entries: list[dict[str, Any]] = []
    blocked: list[dict[str, str]] = []
    for index, row in enumerate(rows, start=1):
        source = source_for(row)
        title = title_for(row)
        if PLACEHOLDER_RE.match(source.strip()):
            blocked.append({"row": str(index), "title": title, "source": source, "reason": "placeholder or empty source"})
            continue
        entries.append(
            {
                "row": index,
                "title": title,
                "description": build_description(row, skip_source_url=args.skip_source_url),
                "source_url": source,
                "speaker": get(row, "Name", "Speaker", "Presenter"),
                "playlist": args.playlist,
                "status": "ready",
            }
        )

    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(entries, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    if args.blocked_out:
        Path(args.blocked_out).write_text(json.dumps(blocked, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(json.dumps({"metadata": str(out), "ready": len(entries), "blocked": len(blocked)}, indent=2))


def audit_descriptions(args: argparse.Namespace) -> None:
    entries = json.loads(Path(args.metadata).read_text(encoding="utf-8"))
    hits = []
    for entry in entries:
        description = entry.get("description", "")
        if SOURCE_URL_RE.search(description):
            hits.append({"row": entry.get("row"), "title": entry.get("title"), "match": SOURCE_URL_RE.search(description).group(0)})
    print(json.dumps({"checked": len(entries), "source_url_hits": hits}, indent=2))
    if hits:
        raise SystemExit(2)


def update_ledger(args: argparse.Namespace) -> None:
    path = Path(args.ledger)
    path.parent.mkdir(parents=True, exist_ok=True)
    exists = path.exists()
    fieldnames = ["title", "youtube_url", "visibility", "playlist", "restriction", "status", "notes"]
    rows = []
    if exists:
        with path.open(newline="", encoding="utf-8") as f:
            rows = list(csv.DictReader(f))
    rows.append(
        {
            "title": args.title,
            "youtube_url": args.youtube_url,
            "visibility": args.visibility,
            "playlist": args.playlist,
            "restriction": args.restriction,
            "status": args.status,
            "notes": args.notes,
        }
    )
    with path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)
    print(json.dumps({"ledger": str(path), "rows": len(rows)}, indent=2))


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest="command", required=True)

    build = sub.add_parser("build-metadata", help="Build YouTube metadata JSON from CSV/TSV.")
    build.add_argument("input")
    build.add_argument("--out", required=True)
    build.add_argument("--blocked-out")
    build.add_argument("--playlist", default="")
    build.add_argument("--skip-source-url", action="store_true", default=False)
    build.set_defaults(func=build_metadata)

    audit = sub.add_parser("audit-descriptions", help="Fail if descriptions contain source URL patterns.")
    audit.add_argument("metadata")
    audit.set_defaults(func=audit_descriptions)

    ledger = sub.add_parser("ledger", help="Append an uploaded video status row to a CSV ledger.")
    ledger.add_argument("--ledger", required=True)
    ledger.add_argument("--title", required=True)
    ledger.add_argument("--youtube-url", required=True)
    ledger.add_argument("--visibility", default="Unlisted")
    ledger.add_argument("--playlist", default="")
    ledger.add_argument("--restriction", default="None")
    ledger.add_argument("--status", default="uploaded")
    ledger.add_argument("--notes", default="")
    ledger.set_defaults(func=update_ledger)

    args = parser.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
