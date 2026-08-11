---
name: cloudflare-production-builder
description: Design, review, debug, migrate, or deploy production systems on Cloudflare Workers and related Developer Platform products. Use for material architecture, durability, release, migration, rollback, or live-verification decisions across Workers, Durable Objects, D1, R2, Queues, Workflows, bindings, and routes.
---

# Cloudflare Production Builder

Apply this guidance proportionally. It is a production reasoning aid, not a
mandatory ceremony layer. Stay within the user's requested operation and do not
turn a diagnosis or recovery into an architecture program.

## Choose the operating mode

- **Answer or diagnose:** inspect only the evidence needed to explain the
  behavior. Do not mutate or design a replacement unless asked.
- **Recover:** restore a known-good capability with the smallest supported,
  reversible operation. Preserve evidence and defer refactoring.
- **Change or migrate:** design compatibility, durability, rollout, verification,
  and rollback for the surfaces actually affected.

Do not mix recovery and refactoring in one production operation.

## Core contract

1. Identify authoritative state, the coordination key, the durability boundary,
   and user-visible completion.
2. Treat source, build, upload, configuration, migration, traffic, route,
   stateful lifecycle, and live behavior as separate facts only when the task
   depends on those surfaces.
3. Prefer immutable artifacts and conditional pointer changes. Make external
   mutations idempotent, fenced, conditional, or compensatable.
4. Classify errors before retrying. Persist terminal domain failures; bound
   transient retries; read authoritative provider state after an ambiguous
   mutation before replay. Do not turn artifact verification into a resumable
   controller unless the product operation itself requires durable execution.
5. Preserve accepted work across handoff failures. Use a durable record and a
   repair path when an initiating request can disappear.
6. Verify the owning live path and exact identity after a production mutation.
   Use precise language such as `version uploaded`, `traffic switched`, and
   `live smoke passed`.

For SHA-derived, write-once release artifacts, `reconcile` means bounded
provider readback and a fail-closed decision. Adopt an existing artifact only
when every immutable property matches. Never repair a mismatch in place, add a
durable current-artifact pointer, or create another publication authority merely
to make image, host, application, namespace, or version creation retryable.
Traffic publication and rollback should switch one recorded immutable pointer
when the topology supports it; build-time artifact preparation stays outside
that publication path.

## Proportional workflow

1. Inspect current code and provisioned state for the touched surface. Resolve
   the exact account, environment, resource, bindings, and live version before
   mutation.
2. State the intended authority and repair/rollback path. For simple work, one
   sentence is enough.
3. Run focused local or remote checks that can falsify the change. Do not add
   unrelated global gates.
4. When authorized to deploy, upload and inspect before switching when the
   provider supports it. Use a verification path supported by the topology.
5. After mutation, verify only the affected rollout axes plus the user-visible
   capability. Record exact identities and rollback evidence.

When a cutover temporarily retains an old Worker, Durable Object namespace, or
container application as the exact rollback target, leave it byte-for-byte and
configuration-for-configuration unchanged through the rollback-compatibility
window. Retention is temporary compatibility, not permanent dual-running.
Remove the old artifact only in a separate bounded cleanup after live and
rollback compatibility have been proven; do not hide that deletion inside the
cutover or ordinary artifact garbage collection.

Pause when the exact production target, current state, retry safety, or rollback
target cannot be resolved. A blocker in an unrelated surface is not permission
to broaden the operation.

## Integrate preview and newly launched capabilities safely

When a preview or newly launched Cloudflare capability materially improves the
design, use it deliberately rather than trusting remembered APIs:

1. Retrieve current first-party docs and changelog entries at action time. Note
   the capability's maturity, launch date, documented limits, and production
   support status.
2. Inspect the installed package's `package.json`, README/examples, exports, and
   `.d.ts` files. Installed types are the compilation contract; marketing docs
   are not.
3. Put the preview surface behind a narrow adapter so churn does not spread
   through domain code. Keep a supported fallback or an explicit failure mode
   when the capability is not production-suitable.
4. Pin the exact package version during the proving release. Compile and build
   immediately after wiring each preview primitive; do not defer integration
   feedback until the full system exists.
5. Inspect generated artifacts, not just source: Worker entrypoint, generated
   Wrangler config, asset directories, binding names, Durable Object migrations,
   and the path the release system will actually upload.
6. Scan the final bundle for `.dev.vars*`, `.env*`, credentials, and unexpected
   local files. Fail or scrub the build before packaging; a clean Git ignore is
   not evidence that build output is clean.
7. Record the exact version and local evidence separately from live evidence.
   Do not claim production behavior until the exact uploaded artifact, bindings,
   routes, migrations, and owning live path have passed smoke verification.

Treat type casts between preview packages as an adapter concern and test the
runtime seam. Structurally similar workspace, loader, or RPC types from different
package versions can compile only after a cast while still disagreeing at
runtime.

## Load references selectively

- [primitive-selection.md](references/primitive-selection.md): use when the
  product or coordination primitive is genuinely undecided.
- [durable-execution.md](references/durable-execution.md): use for asynchronous
  handoffs, retries, queues, Workflows, or long-running external work.
- [storage-and-caching.md](references/storage-and-caching.md): use for storage,
  cache, and authorization boundaries.
- [deployments-and-migrations.md](references/deployments-and-migrations.md): use
  for multi-surface rollout, schema or Durable Object lifecycle, and rollback.
- [multitenant-hosting-and-security.md](references/multitenant-hosting-and-security.md):
  use for untrusted code or tenant isolation.
- [observability-testing-and-cost.md](references/observability-testing-and-cost.md):
  use when adding or reviewing telemetry, test layers, or spend controls.

Retrieve current first-party Cloudflare documentation before relying on API
signatures, configuration, limits, pricing, retention, or product support.
