# Deployments and migrations

Use this reference for Cloudflare-specific deployment, binding, D1, and Durable
Object behavior. Apply only the sections relevant to the requested change. This
is not a prescribed release architecture or mandatory checklist.

Cloudflare behavior changes over time. Retrieve current first-party docs and
inspect the installed Wrangler schema before relying on command syntax,
lifecycle rules, limits, or retention.

## Worker configuration and deployment

Resolve the account, Worker name, Wrangler environment, routes or domains, and
resources affected by the change. A Wrangler Worker configuration minimally
needs a name, entry point, and compatibility date.

Check each target environment directly. Bindings, variables, and secrets are
non-inheritable Wrangler fields and are not automatically copied from the
top-level configuration into an environment.

For affected configuration, verify:

- required binding names and resource kinds;
- referenced resources in the target account;
- compatibility date and flags; and
- intentional repository- versus dashboard-managed values.

Do not put secret values in checked-in variables or diagnostic output.

Workers Versions and Deployments can separate uploading a version from
assigning traffic. Use that separation when useful, but do not assume every
topology provides a pre-traffic runtime probe. A successful upload proves only
that Cloudflare accepted a version.

When diagnosing a release, distinguish `version uploaded`, `traffic assigned`,
`expected version active`, and `live route works`. Source SHAs, build digests,
receipts, generations, and external release state machines are optional
application concerns rather than Cloudflare requirements.

## Bindings

Bindings are part of a Worker's runtime contract, but Cloudflare does not know
which ones the application requires. Validate application-required names and
inspect each environment independently. For service bindings and Durable
Objects, check the target Worker or class as well as the local binding name.

A declaration does not prove the application path works. Exercise an affected
binding through its owning path after deployment. Diagnostics may report
missing binding names, but must not expose secrets.

## D1 migrations

Wrangler orders D1 migration files and records applied migrations in D1's
migration table. Keep them under version control and inspect the pending list
before applying migrations remotely.

D1 uses SQLite semantics with foreign-key enforcement during migrations.
`PRAGMA foreign_keys = OFF` is not a general escape inside the migration
transaction. Use `PRAGMA defer_foreign_keys = ON` when documented ordering
requires deferred checks; it does not disable cascade actions.

Test in proportion to risk. Additive changes usually need representative data
and application queries. Rebuilds, renames, drops, or constraint changes should
also cover populated relationships, indexes, triggers, and views. Verify the
resulting schema and affected live query path.

Old and new Worker versions can overlap during rollout. Keep both compatible
with the intermediate schema when that overlap matters. Expand/contract is a
useful technique for such changes, not a Cloudflare requirement for every
migration.

### Recovery and ambiguous results

D1 Time Travel is enabled automatically on supported production-backend
databases, with retention depending on the plan. Record a suitable bookmark or
other recovery point before a destructive or difficult-to-repair migration.
Restoring production data is a separate destructive operation requiring clear
authorization.

A timeout does not prove a write failed. Inspect the migration list, schema, or
affected application state before retrying. The exact idempotency design belongs
to the application.

`wrangler d1 export` has important limits:

- it blocks other database requests while running;
- full export does not support virtual tables such as FTS5; and
- numeric values are subject to documented JavaScript precision limitations.

Prefer Time Travel for routine short-term recovery. Use export only when its
limitations fit the database and operational window.

## Durable Object lifecycle

Durable Object lifecycle configuration is distinct from ordinary Worker code
upload. Check current documentation before changing class names, storage
backends, ownership, or lifecycle declarations.

Under the current `exports` model:

- `exports` and the legacy `migrations` array are mutually exclusive;
- after adopting `exports`, a Worker cannot return to legacy migrations;
- `wrangler versions upload` cannot apply lifecycle changes;
- lifecycle changes require `wrangler deploy`;
- gradual deployments do not support `exports` lifecycle changes;
- rollback cannot cross a Durable Object lifecycle change; and
- an existing namespace's storage backend cannot change in place.

Existing legacy configurations should follow the current Cloudflare migration
guide rather than mechanically replacing their lifecycle declarations.

Durable Objects can restart during deployments and ordinary runtime operation.
A new calling Worker may also temporarily reach an older Durable Object
instance. Code should tolerate documented restarts and mixed-version behavior.
Exercise the object when a release changes its interface, storage behavior, or
binding.

## Rollback

A Worker rollback sends traffic to a previously published Worker version. It
does not rewind D1, KV, R2, Queues, Durable Object data, or other resources.

Cloudflare may reject rollback across a Durable Object lifecycle change or when
an older version's required resource no longer exists. Published rollback
history is finite, so check current limits and target availability.

For stateful changes, determine whether the older Worker can use the current
schema and resources, whether lifecycle changes prohibit rollback, and whether
separate data recovery would be required. Retain old resources only when an
explicit rollback plan depends on them.

## Proportional verification

After a production mutation, verify:

1. the intended Worker and environment changed;
2. the expected deployment or version is active;
3. the affected live route behaves correctly; and
4. any binding, schema, or Durable Object path changed by the release works.

Add DNS, TLS, redirects, authorization, asynchronous-consumer, log, or rollback
checks only when the operation touches those surfaces or the risk justifies
them. Report only what was actually verified.

## Current first-party sources

- [Wrangler configuration](https://developers.cloudflare.com/workers/wrangler/configuration/)
- [Wrangler environments](https://developers.cloudflare.com/workers/wrangler/environments/)
- [Workers Versions and Deployments](https://developers.cloudflare.com/workers/versions-and-deployments/)
- [Worker rollbacks](https://developers.cloudflare.com/workers/versions-and-deployments/rollbacks/)
- [D1 migrations](https://developers.cloudflare.com/d1/reference/migrations/)
- [D1 foreign keys](https://developers.cloudflare.com/d1/sql-api/foreign-keys/)
- [D1 Time Travel](https://developers.cloudflare.com/d1/reference/time-travel/)
- [D1 import and export limitations](https://developers.cloudflare.com/d1/best-practices/import-export-data/)
- [Durable Object class lifecycle](https://developers.cloudflare.com/durable-objects/reference/durable-objects-migrations/)
- [Durable Object runtime lifecycle](https://developers.cloudflare.com/durable-objects/concepts/durable-object-lifecycle/)
