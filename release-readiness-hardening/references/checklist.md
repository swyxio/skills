# Release Readiness Hardening Checklist

Apply only relevant checks. `Not applicable` is a valid result. Before adding a
new control, name the uncovered material failure mode and confirm an existing
provider, source, traffic, health, or rollback fact does not already cover it.

## Complexity check

- Existing gates, identities, queues, receipts, and manual steps have named callers and durable readers.
- Redundant controls are deleted or consolidated before new controls are added.
- No bookkeeping PR, proof PR, smoke commit, or known-impossible release attempt is required.
- Trusted end-to-end stages do not exchange artificial signatures or admission evidence.
- Self-hosting workflow changes validate against trusted base configuration and reload merged configuration after merge.
- A typed pre-mutation failure stops the attempt without inline patching or synthetic source changes.

## Pre-Deploy

- Git status clean or intended dirty files documented.
- Focused typecheck, lint, unit, and build checks selected in proportion to touched risk.
- E2E or visual checks run when a touched user journey requires them.
- Migrations reviewed when schema or stored data changes.
- Required environment is documented and validated when configuration changes.
- Feature flags or kill switches exist only when they materially reduce rollout risk.

## Deploy

- Preview or staging deploy used only when available and risk-reducing.
- Production deploy command documented.
- Health/readiness route checked.
- Critical route/API status checked.
- Auth, session, and persistence checked when affected.
- Provider integrations checked when affected, or safely mocked with clear limits.
- Production mutation is explicitly authorized by the active request.

## Post-Deploy

- Smoke data is created only when needed and is cleaned up.
- Relevant logs reviewed for boot errors, 4xx/5xx spikes, or provider failures.
- Relevant metrics and dashboards checked where available.
- Rollback command/path documented.
- Known risks and watch items listed.

## Output

- Commit/deployment URL.
- Gate table: passed/skipped/failed.
- Smoke evidence.
- Rollback plan.
- Post-deploy monitoring plan.
- Controls deleted or consolidated, plus remaining compatibility debt.
