# Primitive selection

Choose from workload shape, not keyword association.

## Request lifecycle

### Inline request

Use the request itself when the caller needs the result and the operation fits
the current CPU, subrequest, memory, and client-lifetime constraints. Stream
when that improves time-to-first-byte or bounds memory, but remember that phases
completed after headers are committed cannot be added accurately to response
headers.

### `waitUntil`

Use for short, best-effort post-response work such as bounded log delivery,
metrics, or cache insertion. It extends the request lifetime only for the
documented window and does not provide durable job state, checkpoints, arbitrary
resumption, or a product-level completion surface.

Cloudflare's Context documentation may direct work exceeding the `waitUntil`
window to Queues. Read that as request-lifecycle escape guidance, not as a
universal choice between Queues and Workflows.

## Durable execution

### Workflows

Default candidate for one logical, ordered, stateful, resumable operation:

- multiple named steps;
- persisted step results;
- per-step retries and timeouts;
- sleeps or external events;
- instance lifecycle and observability;
- compensation/rollback handlers;
- execution that may span minutes, days, or longer.

Do not put large mutable datasets into step results by habit. Store large
artifacts in R2 or authoritative state in a database and persist stable keys.
Check current result-size, total-state, retention, concurrency, creation-rate,
step-count, CPU, pricing, and Workers-for-Platforms support before committing.

Workflows do not eliminate application-level idempotency. A retried step can
repeat external effects. Use stable operation IDs, provider idempotency keys,
preconditions, and desired-generation checks.

### Queues

Default candidate for many independent messages where buffering, batching,
throughput, backpressure, service decoupling, or fan-out dominates:

- email and notification delivery;
- ingestion buffers;
- webhook delivery;
- independent media or data items;
- smoothing traffic to downstream APIs;
- cross-service messaging.

Queues are at-least-once and do not promise publication order. Consumers must
deduplicate effects. Batch retry semantics can repeat already-processed
messages; acknowledge or retry messages deliberately. Own job state elsewhere
if users need progress, cancellation, or an ordered phase timeline.

Do not choose Queue plus a hand-built D1 lease/checkpoint/retry engine when a
Workflow already expresses one ordered job more directly.

### Hybrid Workflows + Queues

Use a Workflow as the control plane and Queues as the data plane when one
observable job fans out over many independent items:

1. Workflow validates inputs and creates the job/read model.
2. Queue distributes independent work.
3. Idempotent consumers record per-item outcomes.
4. Workflow waits, polls bounded aggregate state, or receives an event.
5. Workflow finalizes or compensates.

Define who owns cancellation, timeouts, partial failure, dead letters, and
finalization. Do not leave two competing job-state machines.

## Coordination and scheduling

### Durable Objects

Use when work has a natural coordination key and requires single-location
serialization, strict ordering, low-latency stateful logic, WebSockets, or
transactional state beside compute. Examples include a room, repository, game,
document, account, or shard.

Keep object identity stable and opaque. Bound cardinality before creating cold
objects. Avoid exhaustive work in a request handler; process bounded chunks or
move bulk compute outside the object and commit with an expected revision.

### Durable Object alarms

Use for per-object scheduled wakeups and resumable bounded maintenance. Each
object has one scheduled alarm; store multiple due items in object storage and
reschedule the next wakeup. Alarm delivery is at-least-once, so handlers must be
idempotent. Good for per-key repair, compacting, expiry, and page-by-page scans.

### Cron Triggers

Use for periodic global reconciliation, audits, cleanup, and repair. Cron is an
excellent backstop for outbox drift or expired leases. It is usually a poor
low-latency continuation mechanism for a specific user request.

## Serving and deployment surface

- Use Pages when the requested product and deployment workflow are Pages.
- Use Workers for programmable request handling, APIs, streaming, routing, and
  Workers-native bindings.
- Use Workers for Platforms when running isolated customer Worker code is truly
  required and its current binding/isolation model fits.
- Use a dedicated serving Worker for immutable multi-tenant assets when routing,
  eligibility, access, or pointer resolution must remain under platform control.
- Do not substitute one surface silently because the deploy command is easier.

## Decision checklist

Ask:

1. Is this one job or many independent messages?
2. Is order meaningful?
3. Must execution survive the request, a Worker restart, or days of waiting?
4. Are checkpoints and retries part of the domain?
5. Does the UI need partial progress or cancellation?
6. Is there a natural serialization key?
7. Is throughput/batching more important than phase-level orchestration?
8. What is the idempotency key?
9. What repairs a lost handoff?
10. What are the current limits, retention, cost, and deployment constraints?

## Current first-party sources

- [Workers Context and waitUntil](https://developers.cloudflare.com/workers/runtime-apis/context/)
- [Workflows overview](https://developers.cloudflare.com/workflows/)
- [Workflows Workers API](https://developers.cloudflare.com/workflows/build/workers-api/)
- [Workflows limits](https://developers.cloudflare.com/workflows/reference/limits/)
- [Queues delivery guarantees](https://developers.cloudflare.com/queues/reference/delivery-guarantees/)
- [How Queues works](https://developers.cloudflare.com/queues/reference/how-queues-works/)
- [Durable Object alarms](https://developers.cloudflare.com/durable-objects/api/alarms/)
- [Workers and Durable Objects wall-time limits](https://developers.cloudflare.com/durable-objects/platform/limits/)
