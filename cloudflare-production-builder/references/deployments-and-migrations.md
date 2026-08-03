# Deployments and migrations

## Release identity

A production outcome should be attributable to an execution tuple, not merely a
source commit:

- exact source SHA;
- manifest/configuration digest;
- build image and toolchain digest;
- compiler, policy, and compatibility versions;
- Worker script/version ID;
- Durable Object class lifecycle state;
- binding manifest;
- migration ledger/schema version;
- R2 artifact/manifest digest;
- route, domain, service, namespace, and provider identities.

Exact-source execution is necessary but insufficient if an old Worker, image,
binding set, or compatibility date actually ran.

## Preflight

Before a production change:

1. Resolve the exact account, environment, script, database, bucket, namespace,
   domain, and route.
2. Verify authentication and least-privilege permissions.
3. Start from a clean checkout of the intended commit and rebuild generated
   assets. Never deploy ignored/stale build output.
4. Inspect current deployed versions and bindings.
5. Compare actual bindings and variables against a checked-in required-binding
   contract.
6. Inspect compatibility date/flags and current product support.
7. Run unit, type, migration, build, and staging/remote integration checks
   appropriate to risk.
8. Capture the rollback target and database recovery evidence.

## Binding contract

Bindings are not incidental environment plumbing. They are part of the program.

- Validate required binding names and kinds before traffic switches.
- Feature-enabled plus missing binding is an outage: fail closed and make it
  observable.
- Wrangler environments do not necessarily inherit bindings. Inspect each target
  environment explicitly.
- Verify service bindings and runtime dispatch paths, not only declarations.
- Health checks should report release identity and missing binding names without
  exposing secrets.
- Keep deployment configuration canonical; avoid divergent manual dashboard and
  repository sources of truth.

## D1 migrations

Use a forward-only, inspectable migration discipline:

- one canonical numbered migration directory;
- reject duplicate numbers and divergent histories;
- test a clean database and realistic populated upgrade fixtures under D1
  transaction semantics;
- prefer additive columns/tables/indexes and compatibility windows;
- precheck exact expected schema before apply;
- stop on partial or unexpected state;
- capture a Time Travel bookmark or independently retained export before writes;
- apply using the resolved production database ID/account;
- verify the migration ledger and exact schema afterward;
- keep every currently live Worker, runner, Workflow, and service-binding
  consumer compatible with each intermediate schema;
- prefer a forward repair to routine destructive rollback.

### D1 execution and test fidelity

D1 runs every query and migration inside an implicit transaction with foreign
keys enabled. `PRAGMA foreign_keys = OFF` cannot disable enforcement inside that
transaction. Use `PRAGMA defer_foreign_keys = ON` only to defer checks until the
transaction ends; it does not suppress `ON DELETE CASCADE` actions.

Before applying a migration:

1. Run the migration as one transaction with foreign keys enabled.
2. Seed a production-shaped fixture with populated parent/child relationships,
   triggers, implicit `UNIQUE` indexes, views, and non-null historical variants.
3. Inspect `pragma_foreign_key_list`, `pragma_index_list`, `sqlite_master`, and
   live query dependencies before dropping or renaming schema.
4. Prove atomic rollback by forcing a late statement to fail and confirming no
   earlier statement persisted.
5. Run `PRAGMA foreign_key_check`, exact schema comparison, and ledger checks
   after success.
6. For high-risk contraction, execute the same migration against a disposable
   remote D1 canary before production.

Do not use SQLite CLI success as D1 proof unless the harness reproduces those
semantics. Do not use D1's `meta.changes` as an exact compare-and-swap result:
it is a total-change indication and can include trigger writes. Read and verify
the authoritative target row, generation, or ref after mutation.

### Runtime/schema compatibility and self-hosting cutovers

Removing obsolete compatibility code from the target architecture does not make
its database schema safe to remove while an older runtime is still live. Use a
bounded expand/activate/contract sequence:

1. Inventory every deployed API, runner, Workflow, cron, service binding, and
   rollback version that reads or writes the affected schema.
2. Expand additively and backfill with fenced, idempotent writes.
3. Release a version that works with the expanded schema and no longer depends
   on the object scheduled for removal.
4. Exercise the owning live path, including service bindings and asynchronous
   work, and verify the exact version and data state.
5. Remove or disable rollback targets that still require the old schema, or
   retain the schema until their compatibility window closes.
6. Contract the obsolete schema in a later migration and prove its absence.

For a self-hosting control plane, add a bootstrap acceptance test: the currently
live version must be able to apply the expand migration and successfully release
its successor. Never apply a contraction that disables the only allowed release
path before that successor is active.

Permanent backward compatibility is not required. Temporal compatibility with
currently live and approved rollback versions is required. An empty read-only
compatibility view may be used only as an explicitly approved incident bridge
when its columns and zero-row behavior are proven sufficient, all writes fail,
and it has an owner, expiry, rollback command, and verified removal gate. Do not
design a normal release around such a view.

If production schema exists but the migration ledger does not, never blindly
replay migrations. Adoption requires:

1. pinned account/database identity;
2. independently retained recovery evidence;
3. exact comparison against the canonical schema;
4. dry-run output;
5. an idempotent ledger-only change;
6. post-read verification.

Any mismatch is an incident, not an invitation to force the ledger.

### D1 command identity and ambiguous outcomes

`wrangler whoami`, database listing, and token scope output do not prove that the
exact target operation will succeed. Before writes, pin the account and database
ID, inspect `d1 info`, and run a harmless query against that database. Treat a
failure of the exact query path as unresolved even if account-level commands
succeed.

Retry read-only probes only with a small bound and preserve the first provider
error. Do not blindly retry a write after a timeout, transport failure, 5xx, or
unexpected response envelope: the write may have committed. Reconcile the
authoritative row, migration ledger, ref, idempotency receipt, and relevant
provider state first. Retry only the same fenced logical operation when that
readback proves it is still pending.

For application mutations that must commit together, use a D1 batch or one
database transaction boundary and test rollback on a failing final statement.
Migration tooling must parse successful result arrays and provider error objects
without converting provider failures into JSON-shape or authentication guesses.

### D1 recovery evidence and the export trap

Prefer a Time Travel bookmark for routine pre-migration recovery evidence. Time
Travel is always enabled on supported production-backend databases, retrieving
a bookmark is non-blocking, and a restore can return the database to the
recorded point if explicitly authorized.

Store a recovery receipt containing the exact account ID, database ID,
bookmark, retrieval time, Wrangler version, and, for timestamp-derived
bookmarks, the exact timestamp string used. Re-query the same timestamp and
require the same bookmark before mutation; do not reconstruct or round the
timestamp later. Treat restore as a separate destructive action requiring
explicit approval and an undo bookmark.

Do not treat `wrangler d1 export` as a harmless backup command:

- a running export blocks other requests to that database;
- full export is unsupported when the database contains virtual tables,
  including FTS5;
- an export may begin blocking queries before the provider reports that a
  virtual table makes it unsupported;
- Wrangler or the API may return an error while the backend export job is still
  cancelling, so require both direct D1 reads and application health to recover
  before continuing.

Before any production export, query `sqlite_master` for virtual tables. If any
exist, prohibit a full export. If an offline archive is truly required, use a
planned maintenance window, export ordinary authoritative tables individually,
and treat FTS indexes as rebuildable derived data. Consider isolating
rebuildable search indexes in a separate D1 database.

Migration automation must parse both successful Wrangler result arrays and
provider error objects. It should stop before writes, report the provider error
directly, and poll bounded health/read checks rather than misreporting a JSON
shape error. Never retry writes merely because an export-related query failed.

## Durable Object lifecycle

Treat Durable Object deployment as a distinct surface:

- class/export declaration;
- storage backend;
- binding name and class name;
- environment-specific binding;
- namespace identity;
- lifecycle migration/export reconciliation;
- referencing scripts;
- endpoint that actually touches the object;
- tail-log evidence.

Check current Cloudflare semantics before editing. Durable Object class lifecycle
configuration has changed over time. Current docs distinguish the newer
`exports` model from legacy migration arrays, constrain version uploads and
gradual deployments around lifecycle changes, and may prevent rollbacks across
those changes.

Deploying new Durable Object or container code can reset active instances.
Classify reset errors, drain or gate new admissions, verify the exact image and
toolchain, and only declare readiness after a deep probe.

## Staged release

When supported:

1. upload without switching traffic;
2. inspect version metadata, bindings, and health;
3. run direct/service staging probes;
4. verify required external resources;
5. switch controlled traffic;
6. run live hostname smoke;
7. observe logs and metrics;
8. expand only after conformance fixtures pass.

Keep permanent fixtures that exercise static serving, dynamic HTTP, state,
realtime, authorization, rollback, and failure paths. Run them after every
control-plane, runtime, edge, image, or provider rollout.

## Rollback

Separate:

- code/version rollback;
- route or active-pointer rollback;
- artifact rollback;
- Durable Object lifecycle rollback;
- schema/data recovery;
- state compatibility;
- cache purge;
- access/suspension propagation.

Pointer rollback to an immutable artifact should not rebuild. Mutable state
usually persists across code rollback; never imply otherwise. A stateful release
needs an explicit compatibility contract.

If a schema change breaks deployment, restore the previous compatible Worker
first when safe. Use the recorded database recovery point only when a true data
restore is required and authorized.

## Live proof

After release, verify:

- expected version metadata;
- health response and required binding set;
- real custom hostname headers and body;
- DNS, TLS, routing, redirects, and service bindings;
- actual database/R2/DO/Workflow/Queue access through the live path;
- expected immutable artifact/source identity;
- access revocation, suspension, preview, promotion, and rollback where relevant;
- no new provider, migration, binding, or 5xx errors.

A CI green check, Wrangler success, and live smoke are separate evidence.

## Current first-party sources

- [D1 Time Travel](https://developers.cloudflare.com/d1/reference/time-travel/)
- [D1 foreign keys](https://developers.cloudflare.com/d1/sql-api/foreign-keys/)
- [D1 database batch API](https://developers.cloudflare.com/d1/worker-api/d1-database/#batch)
- [D1 import and export limitations](https://developers.cloudflare.com/d1/best-practices/import-export-data/)
- [D1 export API](https://developers.cloudflare.com/api/resources/d1/subresources/database/methods/export/)
- [D1 limits](https://developers.cloudflare.com/d1/platform/limits/)
- [Durable Object environments](https://developers.cloudflare.com/durable-objects/reference/environments/)
- [Durable Object class lifecycle](https://developers.cloudflare.com/durable-objects/reference/durable-objects-migrations/)
- [Durable Objects getting started](https://developers.cloudflare.com/durable-objects/get-started/)
