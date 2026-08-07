---
name: database-migration-hardening
description: Plan, validate, and execute safe database migrations and cutovers with explicit data-parity evidence. Use when migrating across runtimes, cutting over identity/auth stores, replaying production data, backfilling schemas, or splitting shared schema domains.
---

# Database Migration Hardening

Use this skill when correctness depends on persisted data after schema changes, backfills, or production cutovers. It is especially useful for credential stores, identity ownership boundaries, and multi-runtime platforms.

## Workflow

1. **Classify migration domain**
   - Define affected services, data owners, and trust boundaries (auth, billing, content, logs).
   - Map every table/column touched to an owning domain.
   - Mark which columns carry security-critical invariants and whether they can ever be synthesized.
   - Decide migration contract: expand/contract, blue-green, or one-shot cutover.

2. **Capture source and intent**
   - Freeze or snapshot source DB state for the exact planned cutover window.
   - Export and hash the migration plan, fixtures, and source row counts.
   - Require explicit migration intent:
     - backward compatibility expected/unexpected,
     - destructive operations and irreversible steps,
     - fallback window and rollback owner.

3. **Stage migration in isolation**
   - Run schema migration only in a staging DB and validate by replaying a full production-like fixture.
   - Keep migration scripts deterministic and idempotent.
   - Prohibit inline mutable defaults that can diverge silently (for example random seeds without canonical seeds).
   - Run migration and replay with exactly one canonical owner/process.

4. **Run data parity gates before cutover**
   - Compute row and invariant parity per domain:
     - row counts by table,
     - per-column constraints and domain-specific business rules,
     - canary user checks (for example, known valid passwords are still valid and valid-looking hashes decode/verify consistently),
     - checksum/hash comparisons on non-PII projections as available.
   - Distinguish "schema deployed", "data replayed", "semantic parity", and "cutover complete" in evidence.
   - Do not expose cutover signal until parity is green.

5. **Cut over with minimal blast radius**
   - Prefer read-only old DB and write guardrail during verification.
   - Use deterministic component-to-input hashes for routing/selection instead of “since last source commit” deltas.
   - Freeze unrelated deployment channels while cutover validation is running.
   - Record a manifest with pre/post commit hashes, scripts executed, and rollback recipe.

6. **Post-cutover validation**
   - Verify critical login/auth/integrity flows in a production-shaped environment.
   - Run tenant/service smoke tests for newly migrated and untouched domains.
   - Validate that stale source artifacts cannot reintroduce old migration debt.
   - Keep rollback plan executable and tested with a small-scale rehearsal if possible.

## Quality bar

- No migration step modifies rows or hashes without a domain-appropriate transformation contract.
- Schema installs and data replay are decoupled, and both are independently proven.
- A parity manifest exists for every production cutover and is retained with release evidence.
- Known-good account canaries are checked as first-class migration invariants.
- Rollback criteria, owner, and owner confirmation are explicit.
- If one domain fails parity, no cross-domain deployment proceeds as green.

For the practical migration checklist, read [checklist.md](references/checklist.md).
