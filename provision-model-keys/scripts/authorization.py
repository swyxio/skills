#!/usr/bin/env python3
"""Check or reserve lifetime app allocations. No provider calls or secret handling."""
import argparse
import datetime as dt
import fcntl
import json
import os
from pathlib import Path
import re
import tempfile


class Denied(ValueError):
    pass


def require(condition, reason):
    if not condition:
        raise Denied(reason)


def cents(value):
    require(type(value) is int and value >= 0, "Amounts must be nonnegative integer cents")
    return value


def load(path):
    with path.open() as stream:
        return json.load(stream)


def evaluate(policy, ledger, request):
    require(all(isinstance(value, dict) for value in (policy, ledger, request)), "Invalid state objects")
    require(policy.get("schema_version") == 1 and ledger.get("schema_version") == 1,
            "Unsupported state schema")
    fields = {"reservation_id", "grant_id", "repo", "environment", "provider",
              "account_id", "destination", "action", "additional_cents"}
    require(set(request) == fields, "Request fields do not match the documented schema")
    require(all(isinstance(request[k], str) and request[k].strip()
                for k in fields - {"additional_cents"}), "Missing request identifier")
    amount = cents(request["additional_cents"])
    repo = request["repo"]
    require(re.fullmatch(r"[a-z0-9][a-z0-9-]*/[a-z0-9][a-z0-9._-]*", repo),
            "Use canonical lowercase owner/repo")
    owner, name = repo.split("/")
    require(name not in (".", ".."), "Invalid repository name")
    matches = [g for g in policy["grants"] if g["id"] == request["grant_id"]]
    require(len(matches) == 1, "Grant missing or ambiguous")
    grant = matches[0]
    require(grant["status"] == "active", "Grant is not active")
    require(all(isinstance(grant["approval"].get(k), str) and grant["approval"][k].strip()
                for k in ("quote", "source")), "Missing approval evidence")
    expires = dt.datetime.fromisoformat(grant["expires_at"].replace("Z", "+00:00"))
    require(expires.tzinfo is not None and expires > dt.datetime.now(dt.timezone.utc),
            "Grant expired or missing timezone")
    require(grant["budget_period"] == "total", "Only lifetime budgets are supported")
    require(owner == grant["repo_owner"] and (name in grant["repos"] or grant["repos"] == ["*"]),
            "Repository outside grant")
    require(request["environment"] in grant["environments"], "Environment outside grant")
    require({"provider": request["provider"], "account_id": request["account_id"]}
            in grant["providers"], "Provider/account outside grant")
    require(request["provider"] in ("openai", "anthropic", "openrouter"), "Unsupported provider")
    destinations = list(grant["destinations"])
    for template in grant.get("destination_templates", []):
        require(isinstance(template, str), "Invalid destination template")
        expanded = template.replace("{app}", name).replace("{environment}", request["environment"])
        require("{" not in expanded and "}" not in expanded and "*" not in expanded,
                "Only app/environment destination substitutions are supported")
        destinations.append(expanded)
    require(request["destination"] in destinations, "Destination outside grant")
    require(request["action"] in grant["actions"], "Action outside grant")
    require(request["action"] in ("provision_key", "increase_budget", "rotate_key"),
            "This helper reserves provisioning, increases, and zero-cost rotations only")
    require((request["action"] == "rotate_key" and amount == 0)
            or (request["action"] != "rotate_key" and amount > 0), "Invalid action allocation")
    rows = ledger["reservations"]
    require(isinstance(rows, list), "Invalid allocation ledger")
    require(len({r["reservation_id"] for r in rows}) == len(rows), "Duplicate ledger IDs")
    for row in rows:
        cents(row["additional_cents"])
    existing = [r for r in rows if r["reservation_id"] == request["reservation_id"]]
    if existing:
        require(existing[0] == request, "Reservation ID already used with different parameters")
        delta = 0
    else:
        delta = amount
    app_total = sum(r["additional_cents"] for r in rows if r["repo"] == repo)
    require(request["action"] == "provision_key" or app_total > 0,
            "Increase/rotation requires an existing app allocation")
    selected = [r for r in rows if r["grant_id"] == grant["id"]]
    aggregate = sum(r["additional_cents"] for r in selected)
    apps = {r["repo"] for r in selected} | {repo}
    require(app_total + delta <= cents(grant["per_app_cap_cents"]), "Per-app ceiling exceeded")
    require(aggregate + delta <= cents(grant["aggregate_cap_cents"]), "Aggregate ceiling exceeded")
    require(type(grant["max_apps"]) is int and 0 < grant["max_apps"] >= len(apps),
            "App count ceiling exceeded")
    result = {"allowed": True, "reservation_id": request["reservation_id"],
              "already_reserved": bool(existing), "app_total_cents": app_total + delta,
              "grant_total_cents": aggregate + delta}
    return result, not existing


def save(path, value):
    fd, temporary = tempfile.mkstemp(prefix=".allocations-", dir=path.parent)
    try:
        with os.fdopen(fd, "w") as stream:
            json.dump(value, stream, indent=2)
            stream.write("\n")
            stream.flush()
            os.fsync(stream.fileno())
        os.replace(temporary, path)
    finally:
        if os.path.exists(temporary):
            os.unlink(temporary)


def run(args):
    root = Path(args.state_dir).expanduser()
    require(root.is_dir(), "Authorization state directory missing")
    request = load(Path(args.request))
    policy_path, ledger_path = root / "authorization.json", root / "allocations.json"

    def operation():
        policy = load(policy_path)
        ledger = load(ledger_path) if ledger_path.exists() else {"schema_version": 1, "reservations": []}
        result, fresh = evaluate(policy, ledger, request)
        if args.mode == "reserve" and fresh:
            ledger["reservations"].append(request)
            save(ledger_path, ledger)
        return {**result, "reserved": args.mode == "reserve"}

    if args.mode == "check":
        return operation()
    fd = os.open(root / "allocations.lock", os.O_CREAT | os.O_RDWR, 0o600)
    with os.fdopen(fd, "r+") as lock:
        fcntl.flock(lock.fileno(), fcntl.LOCK_EX)
        return operation()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("mode", choices=("check", "reserve"))
    parser.add_argument("--request", required=True)
    parser.add_argument("--state-dir", default="~/.config/model-key-provisioning")
    args = parser.parse_args()
    try:
        print(json.dumps(run(args)))
        return 0
    except (ValueError, KeyError, TypeError, OSError):
        # Don't echo file contents or provider error payloads.
        print(json.dumps({"allowed": False, "reason": "Authorization denied or invalid state; inspect scope and ceilings"}))
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
