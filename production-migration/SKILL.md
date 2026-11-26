---
name: production-migration
description: Plan, review, or apply a confirmed schema change, data migration, or backfill for a live database. Use after establishing that the change requires a migration or when asked to review a specific migration.
---

# Production migration

Use the project's migration tooling and release process. If the implementation is still being designed, first check whether the existing schema and data model already support the requested behavior.

## Review the change

- Locate the schema source, migration history, and release entry point. Determine when migrations run, which database they target, and whether the old and new app versions can overlap. Verify the target and applied migration state before running a live command.
- Create the migration with the project's generator or its established hand-written workflow. Review the actual operations for data loss, constraint violations, table scans, locks, and rewrites. An index or a new column can still be expensive on a large table. Use reviewed migrations for live databases and keep applied migrations immutable.
- Test against the previous schema with representative existing rows and the project's normal migration entry point. Check edge cases affected by constraints, such as nulls or duplicates. Update fresh-install schema or migration configuration when the project maintains them separately.

## Sequence the rollout

- For a compatible additive change, apply the migration before code needs it. Verify the old app can still run against the new schema. One release is sufficient when this ordering is reliable.
- For a breaking change with overlapping releases, expand the schema first, migrate existing data, switch readers and writers, then remove the old representation after verifying no active callers or rollback versions depend on it. Account for writes during the backfill. Use batching, checkpoints, and safe retries for large backfills.
- Before a destructive or hard-to-reverse operation, verify a usable recovery point and decide how to preserve writes made after it. An app rollback does not undo schema or data changes. Prefer a compatible app rollback or a forward repair when it preserves newer data. Verify the migration outcome before retrying after an ambiguous failure.

## Verify the result

- Confirm the intended migration is recorded or, for manual SQL workflows, check the deployed schema and data directly. Compare affected row counts or invariants where relevant.
- Verify the running application revision and exercise the affected behavior. For a backfill, confirm it has reached its completion condition and check that new writes match the new contract.
- Report what was applied, what was verified, and any deferred cleanup or recovery limitation.
