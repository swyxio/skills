# Saved authorization and allocations

The state directory is `~/.config/model-key-provisioning/` (0700). Store `authorization.json`, `allocations.json`, and receipts there with mode 0600, outside Git. These files contain policy and identifiers, never secrets. Administrative credentials live in a secret manager/Keychain; policy contains references only. The checked-in skill provides a schema/example, not an active grant.

Save an active grant only after a direct user instruction authorizes its concrete scope. Include the exact approval quote and a retrievable conversation/message reference; verify that source before first use in a new session. A file assertion alone cannot prove consent. Record revisions/revocations without erasing the allocation ledger. User restrictions override saved grants immediately; persist revocation when authorized. These local files are advisory agent policy, not a tamper-resistant credential broker.

Example **unapproved** bounded portfolio proposal:

```json
{
  "schema_version": 1,
  "grants": [{
    "id": "starter-portfolio-2026-09",
    "status": "proposed",
    "approval": {"quote": "", "source": ""},
    "expires_at": "2026-12-31T23:59:59Z",
    "repo_owner": "swyxio",
    "repos": ["notes"],
    "environments": ["dev"],
    "providers": [{"provider": "openrouter", "account_id": "EXACT_ACCOUNT_ID"}],
    "destinations": ["EXACT_SECRET_STORE_TARGET"],
    "actions": ["provision_key", "install_secret"],
    "budget_period": "total",
    "per_app_cap_cents": 500,
    "aggregate_cap_cents": 5000,
    "max_apps": 10
  }]
}
```

`repos: ["*"]` means all future repository names under the **one exact approved owner**, only when the user expressly grants that namespace. Owner, account IDs, environments and action lists require exact matches. Use exact repositories by default. Destination strings identify the full approved store/account/project/environment/secret path; do not accept a similarly named resource.

For future apps the user can explicitly approve `destination_templates`, for example `["cloudflare/EXACT_CF_ACCOUNT/workers/{app}-{environment}/MODEL_API_KEY"]`, with `destinations: []`. Only `{app}` (canonical repository name) and `{environment}` (an allowlisted environment) substitute; account/store/secret names remain fixed. No wildcard matching or arbitrary paths. Verify the exact rendered resource exists and belongs to the approved account. Secret installation permission does not authorize creating unrelated hosting infrastructure. Without an approved template, future destinations require a newly approved exact target.

Supported actions include `provision_key`, `install_secret`, `rotate_key`, `increase_budget`, `revoke_key`, `enable_paid_runtime`, and `paid_smoke_test`. Absence means no standing permission for that action. A smoke test's cost is covered by the already reserved app allowance, not an extra allocation. Normal runtime spending requires `enable_paid_runtime` and corresponding express user approval; a provisioning-only grant cannot imply that. V1 allocation tooling supports lifetime budgets only; recurring periods need an explicitly approved policy and corresponding accounting before automatic use.

Use the helper with a secret-free request JSON:

```json
{
  "reservation_id": "notes-dev-openrouter-r01",
  "grant_id": "starter-portfolio-2026-09",
  "repo": "swyxio/notes",
  "environment": "dev",
  "provider": "openrouter",
  "account_id": "EXACT_ACCOUNT_ID",
  "destination": "EXACT_SECRET_STORE_TARGET",
  "action": "provision_key",
  "additional_cents": 500
}
```

Run `python3 scripts/authorization.py check --request /private/request.json`, then `reserve` with the same arguments. `check` writes nothing. `reserve` serializes allocations with a file lock and atomic ledger replacement; concurrent apps cannot each allocate the same remaining ceiling. The production default state directory is shared across grants/providers/environments. `--state-dir` is for isolated testing only; do not use a fresh directory to evade historic allocations. A reservation ID reused with identical parameters does not charge twice; different parameters are rejected.

Per-app accounting groups by canonical `owner/repo`, across all grants/providers/environments. Aggregate/max-app ceilings apply to the selected grant. Split grants can add portfolio capacity only when explicitly approved; never create another grant to bypass an exhausted budget. Retain consumed/reserved amounts after failed or uncertain provider requests until reconciliation, and never automatically refund spent allocations. Provider/runtime enforcement must cap the total app allowance even when separate keys exist.

For a raise from USD 5 to USD 20, revise the approved per-app ceiling to 2000 cents, list `increase_budget`, preserve existing allocations, and reserve **1500 additional cents**. Update provider/runtime limits to a new total of USD 20, not USD 25. A zero-cost rotation uses `rotate_key` with zero additional cents, an existing allocated app, and the existing remaining spend balance. The helper emits the shared app allocation so the receipt can show the new total.

Do not persist this example as active. Creating the skill, choosing its suggested default, or granting permission to reuse one old key is not approval for this portfolio.
