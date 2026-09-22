# Saved grants and monthly commitments

Use `~/.config/model-key-provisioning/` (0700), with `authorization.json`, `allocations.json` and secret-free receipts (0600), outside Git. Credentials belong in the existing secret manager or Keychain. This local policy helps agents reuse consent; it is not a tamper-resistant security boundary.

Record an active grant only after the user approves concrete provider/account IDs, repository owner, environments, destinations and budget. Store the approval quote/source once. Honor the trusted record in subsequent sessions without re-interviewing the user; investigate only ambiguous provenance, scope or revocation. The example below remains proposed until its exact account/store fields are approved:

```json
{
  "schema_version": 1,
  "grants": [{
    "id": "app-starters",
    "status": "proposed",
    "approval": {"quote": "", "source": ""},
    "expires_at": "2026-12-31T23:59:59Z",
    "repo_owner": "swyxio",
    "repos": ["*"],
    "environments": ["dev"],
    "providers": [{"provider": "openrouter", "account_id": "EXACT_ACCOUNT_ID"}],
    "destinations": [],
    "destination_templates": ["cloudflare/EXACT_CF_ACCOUNT/workers/{app}-{environment}/MODEL_API_KEY"],
    "actions": ["setup", "rotate_key"],
    "budget_period": "monthly",
    "per_app_cap_cents": 500,
    "aggregate_cap_cents": 5000
  }]
}
```

`setup` includes dedicated provider scope/key creation, installation, feature permissions, a small synthetic paid test, warning configuration and enabling paid app traffic within the allowance. `rotate_key` includes replacing broken/compromised app keys and disabling the old key after verification. A raise requires `increase_budget` and approval of its delta/new recurring cap. Neither setup nor rotation permits purchases, auto-recharge, unrelated infrastructure or changes to other apps' keys.

`repos: ["*"]` covers future apps the user asks to build under the one exact owner; otherwise list exact repo names. Provider/account and environment match exactly. Destination templates substitute only `{app}` (canonical repo name) and `{environment}` (allowlisted); store/account/secret remain fixed. Verify the rendered resource belongs to the approved account. App feature permissions follow the requested product; admin credentials stay separate.

Canonical provider IDs are `anthropic`, `openai`, `openrouter`, `elevenlabs` and `fal` (fal.ai). New provider support does not expand existing grants: each needs its approved workspace/account identity. For fal, retain the exact personal/team account username; for ElevenLabs, retain workspace and service-account/user IDs in the receipt.

Request example:

```json
{
  "reservation_id": "notes-dev-openrouter-setup",
  "grant_id": "app-starters",
  "repo": "swyxio/notes",
  "environment": "dev",
  "provider": "openrouter",
  "account_id": "EXACT_ACCOUNT_ID",
  "destination": "cloudflare/EXACT_CF_ACCOUNT/workers/notes-dev/MODEL_API_KEY",
  "action": "setup",
  "additional_cents": 500
}
```

`python3 scripts/authorization.py check --request /private/request.json` is optional read-only preflight. Use `reserve` before committing recurring budget. Reservations use a file lock/atomic write; identical IDs are idempotent, conflicting reuse is rejected. The helper checks scope and committed capacity, not actual usage or authenticity of consent. `--state-dir` is for isolated testing; production uses the shared default ledger.

Amounts are **recurring monthly commitments**, not charges already incurred. A USD 5 app continues to consume USD 5 of portfolio capacity every month while its keys remain enabled; do not clear reservations at rollover. Per-app totals span providers/environments/grants. Aggregate capacity applies to the approved portfolio grant; never split grants to evade it. Divide limits among simultaneous keys or use a shared gate. Provider billing windows must match the recorded window, or report the mismatch. Soft enforcement can exceed the target; configure warnings and label this explicitly.

Reserve only a raise's delta; rotation reserves zero additional cents and preserves usage. Retain uncertain/failed allocations until exact-key disposition is verified. Reclaim capacity only after confirming the corresponding recurring limits/keys are reduced or disabled, under user authorization. Expiring a provisioning grant alone does not disable installed keys or release their commitments. Once setup and its control/warning path work, finish; do not add adjacent hardening projects.
