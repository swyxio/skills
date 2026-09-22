"""Exercise scope, budget, idempotency and concurrent reservations without provider calls."""
import copy
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch
import datetime as dt

from authorization import Denied, evaluate


class AuthorizationTests(unittest.TestCase):
    def setUp(self):
        self.grant = {
            "id": "test", "status": "active",
            "approval": {"quote": "synthetic test approval", "source": "test fixture only"},
            "expires_at": "2099-01-01T00:00:00Z", "repo_owner": "owner", "repos": ["*"],
            "environments": ["dev"], "providers": [{"provider": "openrouter", "account_id": "acct"}],
            "destinations": ["store/dev/key"],
            "actions": ["setup", "increase_budget", "rotate_key"],
            "budget_period": "monthly", "per_app_cap_cents": 500,
            "aggregate_cap_cents": 500,
        }
        self.policy = {"schema_version": 1, "grants": [self.grant]}
        self.ledger = {"schema_version": 1, "reservations": []}
        self.request = {
            "reservation_id": "first", "grant_id": "test", "repo": "owner/app",
            "environment": "dev", "provider": "openrouter", "account_id": "acct",
            "destination": "store/dev/key", "action": "setup", "additional_cents": 500,
        }

    def test_scope_and_revocation(self):
        for field, value in (("repo", "other/app"), ("environment", "prod"),
                             ("account_id", "other"), ("destination", "other"),
                             ("provider", "openai"), ("additional_cents", -1),
                             ("additional_cents", True), ("additional_cents", 1.5)):
            with self.subTest(field=field, value=value), self.assertRaises(Denied):
                evaluate(self.policy, self.ledger, {**self.request, field: value})
        for status in ("proposed", "revoked"):
            self.grant["status"] = status
            with self.assertRaises(Denied):
                evaluate(self.policy, self.ledger, self.request)
        self.grant["status"] = "active"
        self.grant["expires_at"] = "2000-01-01T00:00:00Z"
        with self.assertRaises(Denied):
            evaluate(self.policy, self.ledger, self.request)

    def test_retry_and_conflicting_id(self):
        self.ledger["reservations"] = [self.request]
        result, fresh = evaluate(self.policy, self.ledger, self.request)
        self.assertFalse(fresh)
        self.assertEqual(result["app_total_cents"], 500)
        with self.assertRaises(Denied):
            evaluate(self.policy, self.ledger, {**self.request, "additional_cents": 100})

    def test_destination_template_is_bound(self):
        self.grant["destinations"] = []
        self.grant["destination_templates"] = ["cloudflare/account/workers/{app}-{environment}/MODEL_API_KEY"]
        request = {**self.request, "destination": "cloudflare/account/workers/app-dev/MODEL_API_KEY"}
        self.assertTrue(evaluate(self.policy, self.ledger, request)[0]["allowed"])
        with self.assertRaises(Denied):
            evaluate(self.policy, self.ledger, {**request, "destination": "cloudflare/other/workers/app-dev/MODEL_API_KEY"})
        self.grant["destination_templates"] = ["cloudflare/*/workers/{app}-{environment}/MODEL_API_KEY"]
        with self.assertRaises(Denied):
            evaluate(self.policy, self.ledger, request)

    def test_cross_grant_budget_and_rotation(self):
        self.ledger["reservations"] = [{**self.request, "grant_id": "older"}]
        with self.assertRaises(Denied):
            evaluate(self.policy, self.ledger, {**self.request, "reservation_id": "second"})
        result, _ = evaluate(self.policy, self.ledger, {
            **self.request, "reservation_id": "rotate", "action": "rotate_key", "additional_cents": 0})
        self.assertEqual(result["app_total_cents"], 500)
        self.grant.update(per_app_cap_cents=2000, aggregate_cap_cents=2000)
        result, _ = evaluate(self.policy, self.ledger, {
            **self.request, "reservation_id": "raise", "action": "increase_budget", "additional_cents": 1500})
        self.assertEqual(result["app_total_cents"], 2000)

    def test_action_evidence_and_aggregate(self):
        for mutate in (lambda g: g.update(actions=[]),
                       lambda g: g.update(approval={"quote": "", "source": ""}),
                       lambda g: g.update(budget_period="total"),
                       lambda g: g.update(repos=["specific"])):
            policy = copy.deepcopy(self.policy)
            mutate(policy["grants"][0])
            with self.assertRaises(Denied):
                evaluate(policy, self.ledger, self.request)
        self.ledger["reservations"] = [self.request]
        with self.assertRaises(Denied):
            evaluate(self.policy, self.ledger, {**self.request, "repo": "owner/second", "reservation_id": "second"})

    def test_month_rollover_keeps_recurring_commitments(self):
        self.ledger["reservations"] = [self.request]
        second = {**self.request, "repo": "owner/second", "reservation_id": "second"}
        parse_timestamp = dt.datetime.fromisoformat
        for date in (dt.datetime(2027, 1, 31, tzinfo=dt.timezone.utc),
                     dt.datetime(2027, 2, 1, tzinfo=dt.timezone.utc)):
            with patch('authorization.dt.datetime') as clock:
                clock.fromisoformat.side_effect = parse_timestamp
                clock.now.return_value = date
                with self.assertRaisesRegex(Denied, 'Monthly portfolio ceiling'):
                    evaluate(self.policy, self.ledger, second)
                result, fresh = evaluate(self.policy, self.ledger, self.request)
                self.assertFalse(fresh)
                self.assertEqual(result['grant_total_cents'], 500)
                self.assertEqual(result['budget_period'], 'monthly')

    def test_cli_readonly_concurrency_and_private_ledger(self):
        script = str(Path(__file__).with_name("authorization.py"))
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / "authorization.json").write_text(json.dumps(self.policy))
            first, second = root / "first.json", root / "second.json"
            first.write_text(json.dumps(self.request))
            second.write_text(json.dumps({**self.request, "reservation_id": "second", "repo": "owner/second"}))
            before = {p.name: p.read_bytes() for p in root.iterdir()}
            command = [sys.executable, script, "check", "--state-dir", directory, "--request", str(first)]
            self.assertEqual(subprocess.run(command, capture_output=True).returncode, 0)
            self.assertEqual(before, {p.name: p.read_bytes() for p in root.iterdir()})
            processes = [subprocess.Popen([sys.executable, script, "reserve", "--state-dir", directory,
                                           "--request", str(path)], stdout=subprocess.PIPE)
                         for path in (first, second)]
            for process in processes:
                process.communicate()
            self.assertEqual(sorted(p.returncode for p in processes), [0, 1])
            ledger_path = root / "allocations.json"
            self.assertEqual(len(json.loads(ledger_path.read_text())["reservations"]), 1)
            self.assertEqual(ledger_path.stat().st_mode & 0o777, 0o600)


if __name__ == "__main__":
    unittest.main()
