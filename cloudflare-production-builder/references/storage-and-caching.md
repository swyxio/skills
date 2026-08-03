# Storage and caching

## Choose the authoritative store

### D1

Use for relational application/control-plane state, ad hoc queries, indexes,
authorization records, job read models, audit records, and transactional
outboxes. Keep transactions and queries short. A D1 database processes work
serially; long queries directly reduce throughput, and overload is possible.

Prefer multiple naturally partitioned databases when one database becomes a
global write bottleneck or approaches size limits. Verify current limits and
read-replication semantics before designing around them.

### Durable Object SQLite

Use for state with a natural unique coordination key where compute and storage
benefit from colocation and strict serialization. It is a lower-level
distributed-system building block than D1; expect to build more lifecycle,
query, and operational tooling.

### R2

Use for large blobs, immutable artifacts, content-addressed objects, media,
exports, logs, and datasets. Direct R2 operations are strongly consistent, but
an HTTP cache in front of R2 intentionally relaxes what callers observe.
Overwritten or deleted objects and previously cached 404s can remain visible
until eviction, TTL expiry, or purge.

Prefer immutable object keys plus a small mutable pointer in an authoritative
store. Avoid listing R2 on serving paths; read exact paths from a trusted
manifest.

#### Conditional writes can leave streaming bodies unread

Treat a conditional `put()` that loses `If-None-Match: *` as a response that may
arrive without R2 consuming the supplied `ReadableStream`. If a producer is
piping into a `FixedLengthStream` or another backpressured bridge, explicitly
cancel the unread consumer side on both a failed precondition and a thrown
write, then await the producer pipe before continuing. Otherwise duplicate-heavy
uploads can stall until the request or runner times out.

Keep deduplication work proportional to the submitted keys:

- Prefer bounded conditional writes per submitted content-addressed key.
- Use exact-key `head()` checks only when their request count and concurrency
  are bounded.
- Do not enumerate repository- or tenant-wide prefixes to discover duplicates.
  A mixed old/new object set may touch every hash prefix; one new object can
  prevent early exit and turn ingestion into a scan of the entire namespace.
- Publish authoritative refs or pointers only after every required object write
  has settled successfully.

Add regressions for duplicate-only and mixed duplicate/new batches. Make the
fake store reject duplicates before reading their bodies, assert the operation
settles, assert no broad `list()` occurs, and assert refs/pointers remain
unchanged on failure. Preserve a generic client error when needed, but attach a
request/ingest ID and log the bounded internal phase and cause.

Incident signature: authenticated uploads reach the service but fail before
the authoritative pointer changes; pack shape, disabled deltas, smaller
uploads, and alternate refs fail similarly; clients see a generic unpack or
ingest error while queues and runner duration grow. Check unread conditional
write bodies and namespace-wide duplicate scans before blaming historical
content corruption.

### Workers KV

Use for globally read-heavy, infrequently changed, eventually consistent
configuration, routing metadata, personalization, or sessions whose freshness
model accepts propagation delay. Do not use KV for locks, compare-and-swap
coordination, immediate revocation, counters, or authoritative job state.

### Cache API

Use for ephemeral acceleration. Contents are data-center-local and do not
replicate globally. `cache.delete()` is local unless a supported zone-level
purge mechanism is used. `cache.put()` does not participate in tiered caching.
Cache API writes can fail or disappear without affecting correctness.

Never use Cache API as durable progress, a lease, an outbox, or the only copy of
computed metadata.

## Cache-key rules

The safest cache invalidation is making changed data use a new key.

Prefer:

- exact content hash;
- exact object ID;
- exact source/revision SHA;
- exact source/target revision pair;
- normalized query shape plus algorithm/cache-format version;
- stable internal tenant/resource ID rather than user-controlled names;
- a transactionally maintained generation for mutable collections.

Examples of safe reusable computations:

- parsed content-addressed records by object ID;
- directory/tree manifests by exact tree hash;
- derived metadata by exact resolved head plus normalized path;
- diffs and merge calculations by exact source/target IDs;
- generated archives or packs by exact wanted IDs and protocol parameters;
- build artifacts by source, lockfile, image, toolchain, policy, and compiler
  digests.

For request shapes containing client-dependent incremental state, credentials,
or disclosure differences, bypass shared caches unless equivalence is proven.

## Invalidation strategy

1. List every mutation path, including API writes, Git/agent writes, merges,
   imports, administrative changes, default changes, privacy changes, and
   deletion.
2. Centralize the invariant in a transaction, trigger, or shared mutation
   function. Do not rely on every caller remembering to purge.
3. Prefer generation increments or immutable keys to synchronous global purge.
4. Re-resolve mutable references before cache lookup.
5. Check authorization, visibility, access epoch, and suspension before serving.
6. Keep those mutable checks outside immutable artifact caches.
7. Close live synchronization channels when visibility or access is revoked.
8. Use TTL as a bounded cleanup mechanism, not the primary correctness proof.

Cache complete results separately from progress:

- `missing`: no computation known;
- `running`: durable job/read-model state, never a completed cache entry;
- `complete`: keyed by exact input generation and cache format;
- `failed`: bounded diagnostic and retry policy;
- `stale/superseded`: old generation must not overwrite new state.

## Stale-while-revalidate

Use stale data only when the product explicitly permits a freshness lag. Expose
truthful freshness and retain a recovery path. Do not apply stale-while-revalidate
to authorization, suspension, active deployment pointers, billing enforcement,
or other revocation-sensitive decisions.

## Browser and disclosure policy

- Access-controlled responses should generally be `private, no-store`.
- Internal neutral computations can still be cached by immutable identity.
- Resolve access before reading the internal cache.
- Do not put owner names, repository paths, credentials, tokens, or private
  content into public cache keys, headers, or logs.
- Responses with cookies require special care; Cloudflare will not cache
  `Set-Cookie` responses through Cache API by default.

## High-throughput object graphs

For Git-like or content-addressed graphs:

- deduplicate object reads within a request;
- bound graph walking, decompression, and concurrent writes;
- stream output with backpressure instead of retaining the whole result;
- wait for durable object writes before moving authoritative references;
- make the first write failure prevent the reference update;
- cache immutable parsed nodes and bounded reachability results;
- cache complete generated payloads only below a strict size ceiling;
- report HIT, MISS, and BYPASS explicitly;
- never let best-effort cache insertion decide protocol success.

## Current first-party sources

- [Choose a storage product](https://developers.cloudflare.com/workers/platform/storage-options/)
- [Workers Cache API](https://developers.cloudflare.com/workers/runtime-apis/cache/)
- [How Workers cache works](https://developers.cloudflare.com/workers/reference/how-the-cache-works/)
- [R2 consistency](https://developers.cloudflare.com/r2/reference/consistency/)
- [D1 limits](https://developers.cloudflare.com/d1/platform/limits/)
