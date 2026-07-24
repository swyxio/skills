# Durable execution

## The handoff rule

If an accepted user mutation must cause later work, do not rely only on
`waitUntil`, a response stream callback, an in-memory promise, or an
unacknowledged provider call.

Use a transactional outbox when acceptance and work creation share a database:

1. Apply the authoritative mutation and insert an outbox row in one transaction.
2. Derive a stable idempotency key from resource, operation, exact generation,
   trigger type, and relevant configuration.
3. A dispatcher claims rows with a bounded lease/fencing token.
4. It creates the Workflow instance or sends the Queue message idempotently.
5. It records the external instance/message identity and delivery state.
6. A scheduled reconciler repairs pending rows, expired leases, and eligible
   mutations missing their derived work.
7. Retain delivered and dead-letter rows long enough for support and audit, then
   compact deliberately.

If the initiating request disconnects after the transaction commits, the work
must still converge.

## State machine rules

Model phases explicitly. A durable operation commonly needs:

- `accepted`
- `queued`
- `running`
- named phase states
- `waiting`
- `retrying`
- `succeeded`
- `failed`
- `cancelled`
- `superseded`

For each transition retain:

- timestamp;
- attempt;
- idempotency key;
- exact input generation;
- execution/runtime version;
- bounded diagnostic;
- external operation ID;
- lease/fencing token where applicable.

Do not let a stale attempt publish success over a newer generation. Recheck
desired generation, exact source, current eligibility, and authorization before
irreversible publication or activation.

## Retry taxonomy

Classify before retrying:

- retryable infrastructure/transient errors;
- throttling with provider-directed delay;
- stale/superseded input;
- invalid user configuration;
- authorization or policy denial;
- permanent provider rejection;
- operator-cancelled work.

Retry only deliberate, idempotent, visible operations. Use exponential or
provider-directed backoff with jitter and a bounded budget. Surface exhaustion
as a real state; do not hide it behind infinite retries or require users to
trigger meaningless mutations.

External side effects need at least one of:

- provider idempotency key;
- conditional write/precondition;
- compare-and-swap;
- unique database constraint;
- desired-generation fence;
- compensating action.

## Workflow design

- Give steps stable semantic names.
- Make step inputs/outputs serializable and bounded.
- Keep large artifacts in R2 and pass keys/digests.
- Use exact input generations so replay cannot silently target newer state.
- Configure retry and timeout per step, not as one undifferentiated policy.
- Use compensation only when it is safe and truthful; rollback of code is not
  rollback of mutable data.
- Persist a separate small read model when users need live partial progress,
  searchable history, support diagnostics, or domain-specific cancellation.
- Treat Workflow instance retention as an operational convenience, not the only
  durable business record.

## Queue consumer design

- Assume duplicate and out-of-order delivery.
- Deduplicate with a stable message ID and a unique write or idempotency ledger.
- Understand batch retry behavior; acknowledge successful messages explicitly
  when partial batch success is allowed.
- Configure dead-letter handling, retention, delay, and retry budgets.
- Bound consumer concurrency against downstream rate limits.
- Separate queues when workloads need different failure isolation, batching,
  or service-level objectives.
- Keep messages small; store large payloads in R2 and send immutable references.

## Durable Object job design

Durable Objects are well suited to serialized per-key jobs:

- store the cursor and expected source revision transactionally;
- process one bounded page/chunk per alarm or request;
- commit progress before scheduling the next wakeup;
- use compare-and-swap against the revision observed at job start;
- restart rather than overwrite if concurrent authoritative state changed;
- expose status through an authenticated endpoint;
- stop only when queued/running/failed counts and domain invariants converge.

Do not execute arbitrary untrusted code inside a state-owning Durable Object.
Keep trusted state transitions small, deterministic, and bounded.

## Reconciliation

Add a periodic repair loop for:

- accepted mutations without work;
- pending outbox rows;
- expired dispatch/operation leases;
- Workflow/Queue identity missing from the domain record;
- work terminal in one system but not the other;
- live resource state drifting from desired generation;
- stale resource reservations;
- incomplete cleanup.

The reconciler must use the same idempotency keys and authorization rules as the
primary path. Repair must not create an alternative semantics.

## User-visible progress

Users should never infer progress from placeholder skeletons that may never
resolve. Return:

- current phase;
- exact input generation;
- last successful checkpoint;
- attempts and next retry when useful;
- whether data is partial, stale, or complete;
- cancellation/repair action where supported;
- bounded error without secrets.

The orchestrator's internal status and the product's read model can coexist.
Choose one authoritative owner for each field.
