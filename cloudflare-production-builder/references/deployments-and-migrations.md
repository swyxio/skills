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

#### D1 contraction gate

Before removing or renaming any D1 object, write a compatibility matrix for
every active and retained rollback binary. Include API Workers, runners,
Workflows, cron jobs, service bindings, and maintenance tools:

| Binary | Reads | Writes | Candidate schema | Allowed to contract? |
| --- | --- | --- | --- | --- |
| live API `v41` | `deploy_releases` | `deploy_outbox` | passes | yes |
| rollback runner `v39` | `site_deployments` | lock UPSERT | fails | no |

The contraction gate passes only when every listed binary works against the
candidate schema or has been removed from the live and rollback sets. Record a
schema epoch range such as `min_schema=71, max_schema=73` in each release
contract so activation and rollback can reject incompatible combinations.

Compile or prepare every SQL statement from each exact deployed bundle against
a disposable database with the candidate schema. Exercise uncommon and
apparently unreachable branches: SQLite resolves missing tables and columns in
`COALESCE`, subqueries, triggers, and views before runtime branch selection.
Inspect generated columns and hidden columns with `PRAGMA table_xinfo`, not only
`table_info`.

Treat writable bridges as schema dependencies, not harmless compatibility:

```sql
-- Unsafe bridge: reads may work, but the old writer still cannot UPSERT it.
CREATE VIEW site_deployments AS SELECT * FROM deploy_releases WHERE 0;
INSERT INTO site_deployments(id) VALUES (?) ON CONFLICT(id) DO UPDATE SET id=id;
```

SQLite cannot use a normal view as an UPSERT target. Do not add triggers or
dual-write shims to prolong an obsolete writer. Keep the old table through the
activation window, replace the writer, verify the exact new binaries remotely,
then remove the table in a separate contraction migration and release.

Minimum contraction canary:

1. Start from a production-shaped pre-expand fixture.
2. Apply the expand migration and run both old and new binaries.
3. Activate the new binaries; run the real outbox/Workflow/runner path.
4. Apply contraction; prove only the new binaries remain eligible.
5. Exercise release, reconciliation, activation, and compensation through the
   public or service-bound path using exact version IDs.

Do not combine expand and contract in one migration or release. A source build
or local harness is insufficient when a retained live binary executes different
generated SQL, bindings, or asynchronous paths.

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

## Multi-surface rollout and service-binding handoffs

Treat a Cloudflare application release as a state machine across independently
converging surfaces. A Worker version becoming active does not prove that its
container image, toolchain, service-binding target, schema, route, or stateful
instance is ready. Provider traffic percentages and an HTTP 200 are evidence
about only the surface they directly observe.

For every release-sensitive service-binding handoff:

1. Persist expensive or non-replayable input before calling the bound service.
   Prefer immutable R2 objects or a durable operation record over request-local
   memory.
2. Give the logical operation a stable idempotency key derived from its exact
   input generation. Make duplicate execution converge on the same result.
3. Classify transport failures, throttling, and 5xx responses as potentially
   transient. Honor a bounded `Retry-After` when supplied. Treat validated 4xx
   contract or authorization failures as terminal.
4. Retain staged input during transient retries. Delete it only after a receipt
   proves the expected identity, digest, byte count, or generation; after a
   terminal error; or after the explicit recovery window is exhausted.
5. Reconcile before retrying any mutation with an ambiguous outcome. A timeout
   does not prove the callee failed before committing.
6. Mutate authoritative pointers or user-visible state only after the receipt
   validates. Never convert a normal rollout transition into a corruption or
   validation diagnostic.

Do not use one global readiness boolean for every workload. Define admission
classes explicitly, for example:

| Control state | Long-running jobs | Short idempotent ingest | Deep verification |
| --- | --- | --- | --- |
| `ready` with exact identity | admit | admit | available |
| `draining` with exact old identity | reject | admit when safe | available |
| `verifying` successor | reject | caller retains and retries | in progress |
| identity mismatch or `failed` | reject | reject/reconcile | failed |

The exact classes depend on the application, but the distinction must be
deliberate. Draining exists to stop work that would prevent or outlive a safe
cutover; it should not create an unrelated availability outage.

Test the rollout matrix, not only steady state. Include the old exact version
draining, the new version verifying, container/image lag after Worker traffic
activation, transient service-binding 429/5xx/transport failure, retry after an
ambiguous response, rollback, and exact-identity mismatch. Assert that staged
input survives transient attempts and that authoritative state changes once.

Correlate deployment generation, caller request ID, operation/idempotency ID,
target Worker version, observed container/toolchain identity, attempt number,
delay, and sanitized reason. A routine deployment should recover transparently
or return an explicit maintenance diagnostic; it must not masquerade as data
corruption.

### Write-once build artifacts are not another release controller

Do not automatically model every independently created provider resource as a
durable release state machine. For a SHA-derived image, private host Worker,
Durable Object namespace, container application, or zero-traffic Worker
version, use bounded build-time preparation when all of the following hold:

- its name or tag is deterministically derived from the exact source/build
  identity;
- the artifact is write-once after successful creation;
- no user-visible traffic or authoritative application pointer selects it yet;
- provider readback can prove its complete immutable configuration; and
- one later immutable pointer change selects or restores the complete runtime.

For these artifacts, reconciliation means:

1. Attempt creation once.
2. Read authoritative provider state after success or ambiguity.
3. Adopt only an exact match.
4. Fail closed on absence, partial creation, ambiguity that readback cannot
   resolve, or any identity/configuration mismatch.
5. Never modify the conflicting artifact in place or resume it through a new
   controller, current-version pointer, fence exchange, or manual lane-clear
   ceremony.

Keep build-time receipts as evidence attached to the deployable version. They
do not become active-version authority. Publication code should not build an
image, deploy or roll a container application, create a namespace, or repair a
host. It validates the ready immutable target, conditionally changes the one
traffic-owning pointer, runs topology-appropriate generic health, and records
success or restores the recorded prior pointer.

For example, a stable Worker version may bind a Durable Object class to a
private, generation-specific host Worker whose container application is pinned
to an image digest. The private host has no route, workers.dev exposure,
preview URL, or scheduled trigger and is prepared while unreferenced. The
stable Worker deployment is the publication authority. Restoring its prior
version restores the prior binding target; publication and rollback must not
separately mutate the host application or image.

If provider topology cannot exercise a private artifact before publication,
do not expose it publicly merely to manufacture a readiness probe. Prove the
built image/toolchain locally, verify the complete unreferenced provider
configuration, and make the first owning live-path deep probe a post-pointer
health gate with exact rollback on failure. State that evidence boundary
explicitly; application status or CLI success alone is not a live runtime
probe.

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

During a bootstrap or topology cutover, preserve the exact old Worker version,
binding target, Durable Object namespace, container application, and image when
that combination is the recorded rollback target. Do not update the old
application to resemble the successor: doing so destroys the rollback evidence
even if the old Worker version still exists. This preservation is a bounded
compatibility window, not a permanent dual-running design. After the successor
has passed live verification and the agreed rollback proofs, remove obsolete
artifacts in a separate, explicit cleanup that first proves no current, ready,
in-flight, retained rollback, or recovery record references them.

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
