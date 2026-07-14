#!/usr/bin/env python3

import csv
import json
import re
import tomllib
from pathlib import Path

REFERENCE_DIRECTORY = Path(__file__).parent.parent / "references"
with (REFERENCE_DIRECTORY / "reserved-handles.toml").open("rb") as registry_file:
    registry = tomllib.load(registry_file)

syntax = re.compile(r"^[a-z0-9][a-z0-9_-]{1,31}$")
exact: dict[str, set[str]] = {}
counts: dict[str, int] = {}

for cohort, definition in registry["cohorts"].items():
    if definition["policy"] not in {"hard_reserved", "manual_claim_required"}:
        raise ValueError(f"{cohort}: invalid policy {definition['policy']}")
    seen: set[str] = set()
    for entry in definition["entries"]:
        handle = entry["handle"]
        if syntax.fullmatch(handle) is None:
            raise ValueError(f"{cohort}: invalid handle {handle}")
        if handle in seen:
            raise ValueError(f"{cohort}: duplicate handle {handle}")
        seen.add(handle)
        exact.setdefault(handle, set()).add(definition["policy"])
    counts[cohort] = len(seen)

expected_unique = registry["summary"]["unique_exact_handles"]
if len(exact) != expected_unique:
    raise ValueError(f"expected {expected_unique} unique handles, found {len(exact)}")

with (REFERENCE_DIRECTORY / "reserved-handles.csv").open(newline="") as csv_file:
    csv_rows = sum(1 for _ in csv.DictReader(csv_file))
if csv_rows != expected_unique:
    raise ValueError(f"expected {expected_unique} CSV rows, found {csv_rows}")

print(json.dumps({
    "policy_version": registry["policy_version"],
    "unique_exact_handles": len(exact),
    "cohorts": counts,
}, indent=2))
