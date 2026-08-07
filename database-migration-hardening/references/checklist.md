# Database Migration Hardening Checklist

## Preflight

- Source/target DB identity, environment, and binding names are confirmed.
- Scope and owner for each affected table/column are documented.
- One migration lead/owner is assigned for schema, replay, verification, and rollback decisions.
- Backup strategy and rollback point-in-time (or equivalent) are confirmed.
- Reversible schema strategy is documented when irreversibility is unavoidable.
- Migration scripts and manifests are versioned and reviewable.

## Schema Stage

- Migrations are staged in isolation and run without production credentials on first pass.
- Add/retain compatibility columns/indexes for backfill and dual-read windows.
- No destructive migration runs on production without explicit pre-check and explicit go/no-go.
- Runtime changes and schema changes are separated in commit history when possible.

## Data Replay and Parity

- Replay fixture/snapshot is derived from the same source point used for migration planning.
- Row counts are compared at coarse and business critical levels.
- Mandatory invariants are tested:
  - identity/auth success for canary credentials,
  - uniqueness and referential integrity,
  - non-null constraints for security-sensitive fields,
  - expected enum/value domain conformance.
- Hash or checksum checks run for high-value immutable projections.
- A small sample and a broad sample are both tested.

## Cutover

- Evidence includes:
  - source manifest hash,
  - schema migration hash,
  - replay manifest (counts + failed rows),
  - parity report.
- Old DB is frozen or read-only for critical domains during final verification.
- Affected services are re-deployed only with scope-limited input trees, not global deltas.
- No release signal is marked green until parity checks pass.

## Post-Cutover

- Smoke test authentication, writes, reads, and one non-primary migration domain immediately after cutover.
- Monitor incident windows for at least one business-relevant cycle.
- Confirm no stale or unrelated prior migrations are reintroduced via stale component baselines.
- Capture and link remediation evidence for any partial failures.
