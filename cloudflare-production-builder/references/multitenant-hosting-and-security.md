# Multi-tenant hosting and security

## Origin boundary

Serve user-controlled content from a registrably separate origin from the
control plane. A sibling subdomain under the same registrable domain is not the
same security boundary.

Treat hosted and preview origins as untrusted:

- never send control-plane cookies or credentials to them;
- use exact CORS allowlists;
- validate OAuth redirects, WebSocket origins, frame ancestors, and
  `postMessage` receivers;
- normalize hostnames and paths before authorization/routing;
- make preview identifiers unguessable;
- enforce shared-domain indexing and abuse policy deliberately.

Do not rely on "static" as a security boundary. User HTML and scripts are active
content.

## Exact-source build contract

- Branches select work; an exact immutable revision identifies execution.
- Freeze and digest the manifest/configuration at that revision.
- Use a detached checkout or verified object walk at the exact revision.
- Recompute and validate content-addressed object identities when bypassing a
  normal checkout.
- Record source, manifest, compiler, policy, image, and toolchain versions.
- Recheck current head, eligibility, and authorization before activation.
- A stale plan must fail or become superseded, never silently publish.

## Build isolation

Untrusted builds require:

- no Cloudflare/provider credentials in the sandbox;
- separate build, runtime, and agent images/caches/networks;
- deny-by-default egress with explicit dependency-source policy;
- redirect revalidation and protection from DNS rebinding;
- blocking private, metadata, internal, raw-IP, and unsafe-port targets;
- CPU, wall time, memory, process, filesystem, output byte/file, bandwidth,
  concurrency, and spend limits;
- cache isolation by tenant, source inputs, lockfile, image, toolchain, and
  policy;
- no production-deployment authority for repository writers, CI jobs, or agents.

Treat broad public egress as an explicit entitlement with tighter monitoring,
not a harmless default.

## Trusted artifact ingest

Never publish a sandbox output directory directly.

The trusted ingest layer must:

- enforce output-root path containment;
- reject traversal, absolute paths, duplicates, symlinks, hard links where
  unsafe, special files, gitlinks, and unsupported modes/formats;
- derive MIME and routing metadata from trusted policy;
- enforce count and byte limits;
- know or safely stream exact lengths required by provider APIs;
- await both source piping and provider write completion;
- hash every accepted file;
- write under deployment-specific immutable keys;
- produce and sign/digest a complete manifest;
- mark readiness only after every referenced object is durable.

Test zero-byte, small, large, interrupted, duplicate, malformed, and retry cases
against real provider bindings. Local mocks do not prove stream compatibility.

## Immutable serving

- Resolve hostname to an authorized deployment or active pointer.
- Read only exact paths in the trusted manifest; never list object storage to
  serve a request.
- Keep release artifacts immutable and content-addressed.
- Make promotion and rollback pointer operations, not rebuilds.
- Keep access, visibility, suspension, revocation epoch, and active generation
  outside immutable caches and revalidate them on every relevant request.
- Purge or version mutable HTTP cache entries when pointers or access change.
- Reserve historical names so deletion/rename cannot enable hostname takeover.

## Runtime isolation

Trusted wrapper code alone receives raw bindings. Untrusted application code
gets narrow capability methods scoped by:

- tenant;
- project/application;
- environment or exact preview deployment;
- logical resource name;
- release/deployment generation;
- access epoch;
- origin;
- quotas and entitlements.

Never reveal raw account IDs, binding metadata, namespace IDs, Durable Object
stubs/classes, service bindings, deployment APIs, or provider tokens.

If user code needs state or realtime, prefer a managed interface over arbitrary
provider primitives until the isolation, lifecycle, migration, egress, abuse,
and cost model is proven.

## Stateful applications

- Keep production state identity stable across releases.
- Isolate preview state by exact deployment/generation.
- Code rollback changes code/routes/assets, not mutable state.
- Require compatibility acknowledgement or migration design for stateful rollback.
- Bound scope/topic/object cardinality before provider calls.
- Use a stable shard strategy; changing shard count after writes is a migration.
- Bind realtime tickets to origin, tenant, scope, topic, deployment generation,
  access epoch, and release.
- Drain or revoke sockets on activation, rollback, disablement, access changes,
  and suspension.

## Authorization and abuse

Every state-changing operation should carry:

- authenticated actor;
- tenant and resource predicates in the query;
- action and policy decision;
- idempotency key;
- audit record;
- quota/spend checks;
- desired generation or precondition for external mutation.

Add negative tests for cross-tenant reads/writes, binding confusion, stale
grants, hostname takeover, cache poisoning, and suspended-but-cached content.

Plan for:

- rate and concurrency limits;
- storage and bandwidth quotas;
- log/retention limits;
- tenant/provider/global circuit breakers;
- phishing, malware, spam, open-proxy, cryptomining, and anomalous-egress response;
- immediate suspension and credential/token revocation;
- deletion/export/retention lifecycle.

## Graduation gates

Do not call a multi-tenant platform ready until production proves:

1. dedicated serving origin, wildcard DNS/TLS/routing, monitoring, and rollback;
2. exact-source build and stale-plan rejection;
3. trusted ingest and immutable serving;
4. preview, promotion, rollback, disablement, and suspension;
5. authorization and negative cross-tenant tests;
6. build/runtime egress denial and quota enforcement;
7. binding isolation and no provider credentials in untrusted code;
8. state/realtime isolation and revocation;
9. abuse response and denial-of-wallet controls;
10. end-to-end conformance fixtures on the live hostname.
