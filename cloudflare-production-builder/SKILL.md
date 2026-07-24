---
name: cloudflare-production-builder
description: Design, build, review, debug, migrate, or deploy production systems on Cloudflare Workers and related Developer Platform products. Use for Workers, Pages, Workflows, Queues, Durable Objects, D1, R2, KV, Cache API, Cron Triggers, multi-tenant hosting, background jobs, caching, bindings, migrations, release verification, or Cloudflare architecture choices.
---

# Cloudflare Production Builder

Use this skill whenever Cloudflare is an important execution, storage, routing,
or deployment surface. Treat it as production engineering guidance, not a
Wrangler command cheat sheet.

## First principles

1. Identify the authoritative state, coordination key, durability boundary,
   consistency requirement, and user-visible proof before choosing products.
2. Do not map a vague noun directly to a product:
   - "background work" does not automatically mean Queues;
   - "state" does not automatically mean Durable Objects;
   - "cache" does not automatically mean KV or Cache API;
   - "static site" does not automatically mean Pages.
3. Prefer immutable identities and pointer changes over overwriting mutable
   artifacts. Record the exact source, configuration, policy, toolchain, and
   deployed version that produced an outcome.
4. Make every retry idempotent, every external mutation fenced or conditional,
   and every handoff observable and repairable.
5. A local test, successful command, uploaded version, traffic switch, DNS
   route, migration, live response, and browser behavior are separate facts.
6. Re-open current first-party documentation before relying on limits, pricing,
   retention, product availability, compatibility behavior, or deployment
   support. These change.

## Required workflow

### 1. Inspect before designing

- Read `wrangler.toml`, `wrangler.json`, or `wrangler.jsonc`, package scripts,
  deployment workflows, migration directories, binding contracts, and health or
  smoke scripts.
- Confirm the account, environment, Worker name, routes, domains, compatibility
  date and flags, bindings, migrations, and current deployed version.
- Preserve the requested Cloudflare surface. Do not silently replace Pages with
  Workers, Workflows with Queues, or another product because it is familiar.
- Separate current code state from provisioned production state.

### 2. Write the decision sentence

Before implementation, state:

> The authoritative state is ____. Work is partitioned/serialized by ____.
> The operation must survive ____. Users observe completion through ____.
> We choose ____ because ____; we reject ____ because ____.

If that sentence is fuzzy, read
[primitive-selection.md](references/primitive-selection.md).

### 3. Design correctness and repair

- Define an immutable idempotency key from the logical operation and exact input
  generation.
- List every handoff and what repairs it if the initiating request disappears.
- Define retryable, terminal, stale, superseded, and cancelled outcomes.
- Store user-facing job/progress state in a deliberate read model when the
  orchestration primitive does not expose the partial state the UI needs.
- Use scheduled reconciliation as a safety net for missing handoffs, expired
  leases, and drift. It is not a substitute for a durable primary handoff.

Read [durable-execution.md](references/durable-execution.md).

### 4. Design storage and cache keys

- Put authoritative relational state in D1 or another database, coordinated
  per-key state in Durable Objects, large immutable blobs in R2, and globally
  read-heavy eventually consistent configuration in KV.
- Treat Cache API as ephemeral, data-center-local acceleration.
- Prefer cache keys derived from immutable content IDs, exact revisions, or a
  transactionally maintained generation.
- Resolve authorization and current visibility before reading shared internal
  caches. Keep access-controlled browser responses private unless disclosure
  equivalence is proven.
- Never mark partial computation as a complete cache result.

Read [storage-and-caching.md](references/storage-and-caching.md).

### 5. Make deployment a checked contract

- Bindings, environment variables, routes, domains, Durable Object classes,
  migrations, compatibility date, and assets are part of the release.
- Fail closed when a feature is enabled but a required binding is missing.
- Attach source SHA, Worker version, configuration/policy versions, and relevant
  external artifact identities to the release record.
- Record recovery evidence before schema changes. Prefer additive migrations and
  forward fixes; do not make code rollback depend on destructive schema rollback.
- Upload and inspect before switching traffic when the release mechanism allows.

Read [deployments-and-migrations.md](references/deployments-and-migrations.md).

### 6. Protect trust boundaries

- Serve user-controlled content from a registrably separate origin from the
  control plane.
- Never expose raw provider bindings, account identifiers, service bindings, or
  provider credentials to untrusted code.
- Use exact-source builds, restricted egress, bounded output, path containment,
  symlink/special-file rejection, immutable artifact manifests, quotas,
  suspension, and negative cross-tenant tests.
- Keep authorization, access epochs, suspension, and active pointers outside
  immutable artifact caches.

Read
[multitenant-hosting-and-security.md](references/multitenant-hosting-and-security.md).

### 7. Prove the live system

Verify the following separately:

1. intended source and clean build;
2. migration precheck, recovery point, apply, and postcheck;
3. uploaded/deployed Worker version and required bindings;
4. Durable Object class lifecycle and binding path where applicable;
5. route, DNS, certificate, custom domain, and service bindings;
6. live headers and body on the owning hostname;
7. a request that exercises each stateful or asynchronous dependency;
8. logs/metrics without new errors;
9. browser-visible behavior if the user experience matters;
10. rollback and repair behavior.

Read [observability-testing-and-cost.md](references/observability-testing-and-cost.md).

## Stop conditions

Pause and surface the blocker when:

- the target account, environment, hostname, database, bucket, namespace, or
  Worker cannot be resolved exactly;
- production schema is partial or differs from the expected shape;
- the current deployed bindings cannot be inspected;
- a destructive migration lacks recovery evidence;
- a deployment would expose untrusted content on the control-plane origin;
- retry safety, authorization, tenant isolation, or spend bounds are undefined;
- the requested primitive is unsupported in the target deployment model.

## Completion language

Use precise status:

- `implemented locally`
- `tests pass`
- `committed`
- `pushed`
- `migration applied`
- `version uploaded`
- `traffic switched`
- `route/DNS active`
- `live smoke passed`
- `browser verified`

Never compress these into "deployed" unless the owning live surface was checked.
