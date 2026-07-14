#!/usr/bin/env python3

import json
import re
import sys
import tomllib
from pathlib import Path

REGISTRY_PATH = Path(__file__).parent.parent / "references" / "reserved-handles.toml"
with REGISTRY_PATH.open("rb") as registry_file:
    registry = tomllib.load(registry_file)


def skeleton(value: str) -> str:
    return value.replace("-", "").replace("_", "")


def unique(values: list[str]) -> list[str]:
    return list(dict.fromkeys(values))


hard: dict[str, list[str]] = {}
manual: dict[str, list[str]] = {}
for cohort, definition in registry["cohorts"].items():
    target = hard if definition["policy"] == "hard_reserved" else manual
    for entry in definition["entries"]:
        for key in (entry["handle"], skeleton(entry["handle"])):
            target.setdefault(key, [])
            if cohort not in target[key]:
                target[key].append(cohort)


def classify(value: str) -> dict[str, object]:
    normalized = value.strip().lower()
    confusable = skeleton(normalized)
    base = {"input": value, "normalized": normalized, "skeleton": confusable}
    if re.fullmatch(r"[a-z0-9][a-z0-9_-]{1,31}", normalized) is None:
        return {**base, "restriction": "invalid", "cohorts": []}

    hard_reasons = unique([*hard.get(normalized, []), *hard.get(confusable, [])])
    if hard_reasons:
        return {**base, "restriction": "hard_reserved", "cohorts": hard_reasons}

    if len(confusable) <= registry["rules"]["manual_claim_max_skeleton_length"]:
        return {**base, "restriction": "manual_claim_required", "cohorts": ["short_handle_rule"]}

    manual_reasons = unique([*manual.get(normalized, []), *manual.get(confusable, [])])
    return {
        **base,
        "restriction": "manual_claim_required" if manual_reasons else "available",
        "cohorts": manual_reasons,
    }


if len(sys.argv) == 1:
    print("Usage: python3 check_handle.py <handle> [handle ...]", file=sys.stderr)
    raise SystemExit(2)

for handle in sys.argv[1:]:
    print(json.dumps(classify(handle), separators=(",", ":")))
