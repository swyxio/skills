#!/usr/bin/env python3
"""Validate shared Agent Skills metadata (https://agentskills.io/specification)."""
import re
import sys
from pathlib import Path

import yaml

FIELDS = {"name", "description", "license", "compatibility", "metadata", "allowed-tools"}


class UniqueKeyLoader(yaml.SafeLoader):
    """Reject duplicate keys, including inside metadata mappings."""

    def construct_mapping(self, node, deep=False):
        if isinstance(node, yaml.MappingNode):
            seen = set()
            for key_node, _ in node.value:
                key = self.construct_object(key_node, deep=deep)
                try:
                    if key in seen:
                        raise yaml.constructor.ConstructorError(
                            "while constructing a mapping", node.start_mark,
                            f"duplicate key: {key}", key_node.start_mark,
                        )
                    seen.add(key)
                except TypeError:
                    raise yaml.constructor.ConstructorError(
                        "while constructing a mapping", node.start_mark,
                        "unhashable key", key_node.start_mark,
                    )
        return super().construct_mapping(node, deep=deep)


def validate_skill(directory):
    path = Path(directory) / "SKILL.md"
    if not path.is_file():
        return ["SKILL.md not found"]
    match = re.match(r"\A---\r?\n(.*?)\r?\n---(?:\r?\n|$)", path.read_text(), re.S)
    if not match:
        return ["Missing or malformed YAML frontmatter"]
    try:
        data = yaml.load(match.group(1), Loader=UniqueKeyLoader)
    except yaml.YAMLError as error:
        return [f"Invalid YAML: {error}"]
    if not isinstance(data, dict):
        return ["Frontmatter must be a mapping"]
    errors = []
    unknown = set(data) - FIELDS
    if unknown:
        errors.append("Unknown fields: " + ", ".join(sorted(map(str, unknown))))
    name = data.get("name")
    if not isinstance(name, str) or not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", name) or len(name) > 64:
        errors.append("name must be 1–64 lowercase letters/digits with single separating hyphens")
    elif name != Path(directory).name:
        errors.append("name must match the skill directory")
    for field, limit in [("description", 1024), ("compatibility", 500)]:
        if field == "description" or field in data:
            value = data.get(field)
            if not isinstance(value, str) or not 1 <= len(value.strip()) <= limit:
                errors.append(f"{field} must be a nonempty string of at most {limit} characters")
    for field in ["license", "allowed-tools"]:
        if field in data and not isinstance(data[field], str):
            errors.append(f"{field} must be a string")
    if "metadata" in data:
        metadata = data["metadata"]
        if not isinstance(metadata, dict) or any(not isinstance(k, str) or not isinstance(v, str) for k, v in metadata.items()):
            errors.append("metadata must map string keys to string values")
    return errors


if __name__ == "__main__":
    if len(sys.argv) < 2:
        raise SystemExit("Usage: python scripts/validate_skill.py <skill-directory> [...]")
    failed = False
    for directory in sys.argv[1:]:
        errors = validate_skill(directory)
        print(f"{directory}: " + ("; ".join(errors) if errors else "Skill is valid!"))
        failed |= bool(errors)
    raise SystemExit(int(failed))
