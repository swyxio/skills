# Observability, testing, and cost

## One evidence record

Distributed availability lives in the handoffs. Create one operation/release
record that links:

- actor and request ID;
- tenant/resource;
- exact input/source generation;
- idempotency key;
- outbox/message/Workflow/job IDs;
- phase timeline and attempts;
- API, Worker, Durable Object, runtime, image, toolchain, policy, migration,
  provider, namespace, and artifact identities;
- activation pointer;
- live smoke result.

Each system answers a different question. Do not make operators correlate five
dashboards and guess.

## Logs

Prefer one structured summary per request/job plus bounded phase events.

Useful fields:

- stable operation and phase names;
- status and classification;
- attempt and retry delay;
- duration and CPU where available;
- byte/object/item counts;
- subrequest and provider operation counts;
- cache HIT/MISS/BYPASS;
- exact generation and version IDs;
- missing binding names;
- lease age and backlog depth.

Never log:

- passwords, tokens, cookies, authorization headers, signed URLs;
- prompts, source code, repository contents, object contents;
- private paths or user-controlled full URLs;
- raw provider bindings or credentials;
- per-object noise on high-volume paths.

Use hashes or internal opaque IDs where correlation is necessary. Keep error
messages bounded and scrubbed.

For streaming responses, response headers can only include phases complete when
headers are committed. Put final durations in the structured completion log.

## Metrics and alerts

Measure handoffs and convergence:

- accepted mutation without derived work;
- outbox oldest age and pending/dead-letter count;
- Workflow/Queue start delay, retries, and terminal failures;
- expired leases and stale-generation rejections;
- Durable Object resets/restarts;
- R2/D1 latency, errors, reads, writes, and listings;
- cache hit/miss/bypass and compute avoided;
- deployment/binding drift;
- live endpoint smoke by capability;
- authorization, quota, egress, and suspension denials;
- cost per tenant/job/release.

Alert on user-visible stuckness and global dependency failures, not every
expected retry.

## Privacy-minimal client telemetry

Collect only what directly answers a product/performance question:

- numeric Web Vitals;
- coarse route class;
- navigation type;
- coarse connection class;
- no resource coordinates, paths, URLs, source, content, or identity;
- strict schema allowlist and small payload cap;
- honor Do Not Track when that is the product policy.

Do not let performance work become a shadow content-analytics system.

## Test layers

### Pure/local

- authorization and tenant predicates;
- idempotency and state transitions;
- cache keys and generation changes;
- path normalization and ingest rejection;
- retry classification;
- protocol parsing and backpressure;
- clean migration application and realistic upgrade fixtures;
- build bundle budgets and generated-asset freshness.

### Cloudflare-compatible local runtime

- Worker request/stream behavior;
- Durable Object state and alarms;
- D1 queries/transactions;
- R2 bindings;
- Cache API graceful bypass where unavailable;
- Workflow/Queue integration seams where the local runtime supports them.

Do not assume local mocks reproduce provider streaming, lifecycle, routing, or
consistency behavior.

### Remote staging

- real D1 migration copy;
- real R2 streaming and interrupted writes;
- bindings and service dispatch;
- Workflow/Queue retries and duplicate handling;
- Durable Object lifecycle/reset behavior;
- DNS/TLS/custom domains;
- access, egress, quota, and cross-tenant denial;
- MISS -> HIT and mutation -> MISS/superseded cache paths;
- rollback and repair.

Refuse destructive remote test suites against production by default.

### Production smoke

- live `/health` with version and binding contract;
- exact custom hostname headers and body;
- one request through every important bound service;
- permanent conformance fixtures;
- immutable preview and active production identity;
- access revocation/suspension;
- logs with no new systemic failures.

## Failure injection

Exercise:

- disconnect after authoritative commit but before dispatch;
- duplicate and out-of-order messages;
- expired leases;
- stale desired generation;
- missing required binding;
- Worker/DO/runtime update reset;
- provider throttling and interruption;
- partial R2 upload;
- partial or divergent migration state;
- cached 404 then object creation;
- object overwrite/delete behind HTTP cache;
- access revocation while content/socket is cached or active;
- code rollback with newer mutable state.

The test passes when the system converges truthfully, not merely when an error is
caught.

## Cost review

Model cost from actual billable dimensions and retry amplification:

- Workers requests and CPU;
- Workflow invocations, steps, persisted state, retention, and CPU;
- Queue writes, reads, deletes, message size, retries, and dead letters;
- D1 rows read/written, query duration, database partitioning, and storage;
- R2 storage plus operation classes, listings, multipart work, and HTTP cache;
- Durable Object requests, CPU/duration, storage, alarms, and WebSockets;
- KV reads/writes/lists/storage;
- Analytics Engine or logging volume;
- third-party egress/API/build/runtime costs.

Measure representative fixtures. A cache that saves CPU but multiplies storage
operations, a Queue retrying whole batches, or a Workflow persisting oversized
step results can shift cost unexpectedly.

Put hard per-operation, per-tenant, provider-account, and global budgets around
untrusted or user-triggered work. Add circuit breakers before self-service.

## Current first-party sources

- [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/)
- [Workflows pricing](https://developers.cloudflare.com/workflows/reference/pricing/)
- [Workflows limits](https://developers.cloudflare.com/workflows/reference/limits/)
- [Queues pricing](https://developers.cloudflare.com/queues/platform/pricing/)
- [Queues limits](https://developers.cloudflare.com/queues/platform/limits/)
- [D1 limits](https://developers.cloudflare.com/d1/platform/limits/)
- [Durable Objects limits](https://developers.cloudflare.com/durable-objects/platform/limits/)
