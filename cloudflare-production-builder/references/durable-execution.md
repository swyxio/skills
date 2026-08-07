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
- Keep steps granular. Do not wrap source preparation, multiple commands,
  publication, and cleanup in one retriable step.
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

## Workflow interruption and external execution

A Workflow step is an individually retriable orchestration unit, not a durable
process supervisor. Its callback, response stream, RPC, or foreground command
wait can disappear while an external system has accepted work or while a
Sandbox process is still running. Unlimited Workflow wall time does not prove
that one callback or connection will survive infrastructure interruption.

Require the following pattern whenever a step starts arbitrary code, a deploy,
or another long-running or non-replayable external effect:

1. Split source preparation, cache restore, each external command, publication,
   and cleanup into deterministic semantic steps.
2. Derive an immutable execution identity from the logical operation, exact
   source/input generation, command or request digest, job/step identity, and
   relevant policy/toolchain version.
3. Persist a fenced execution record containing that identity, the external
   process/job ID, owner generation, phase, heartbeat, log cursor, and cleanup
   state. If start and record cannot be atomic, the external substrate must
   accept a deterministic idempotency key or make the execution discoverable
   and adoptable by that exact identity.
4. Supervise long-running Sandbox work as a named process rather than making a
   foreground stream the only proof it exists. Retain a process ID and use
   process status, accumulated logs, and exit waiting for reattachment. Treat
   `keepAlive` as lifecycle assistance, not proof against container loss.
5. Have the external wrapper atomically publish an immutable terminal receipt.
   Bind it to the exact execution identity and include start/completion times,
   exit status, output/log digests, and produced artifact identities.
6. Flush bounded log chunks incrementally with idempotent sequence numbers.
   Never buffer the only diagnostic copy until command completion.
7. Fence monitoring, finalization, cancellation, process termination, and
   Sandbox destruction. A superseded callback must not clean up work owned by a
   newer valid attempt.

On every retry, reconcile before executing:

- valid terminal receipt: verify it and finalize without replay;
- matching process/job still running: acquire the current fence and reattach;
- deterministic process exists but acknowledgement was interrupted: adopt it;
- stale owner or mismatched source/command digest: refuse adoption; permit
  cleanup only through a separately fenced repair path;
- process/job and receipt both missing after side effects may have started:
  record an ambiguous terminal outcome and require explicit repair. Do not
  silently replay arbitrary commands.

Direct `step.do` retry remains appropriate for bounded operations that are
provably idempotent through a conditional write, provider idempotency key,
unique constraint, or equivalent receipt. Granularity alone does not make a
side effect safe to repeat.

### Interruption evidence

Preserve the original attempt when the engine starts another attempt. Do not
overwrite its only diagnosis with `superseded`. Record:

- Workflow name, instance, step, attempt, and deployed Worker version;
- exact input/source generation and execution identity;
- external process/job and Sandbox identity;
- last heartbeat, last output, log cursor, and phase;
- provider/runtime error and whether it originated before or after side effects;
- reconciliation result: reattached, receipt-recovered, missing, cancelled, or
  ambiguous;
- fence generation and the actor that finalized or cleaned up.

A characteristic ambiguous-interruption signature is: the orchestration attempt
ends with an internal/infrastructure error while a recent external heartbeat or
output exists, then a retry observes an in-progress command. That is evidence to
reconcile, not evidence that the command stopped and not permission to rerun it.

Test interruption before start, after external acceptance but before recording
the ID, while running, after receipt publication, during log flushing, during
cancellation, and during cleanup. Assert one external execution, exact input
identity, lossless deduplicated logs, one terminal transition, and cleanup by
only the current fenced owner.

Current first-party references:

- [Rules of Workflows](https://developers.cloudflare.com/workflows/build/rules-of-workflows/)
- [Workflow limits](https://developers.cloudflare.com/workflows/reference/limits/)
- [Workflow retries](https://developers.cloudflare.com/workflows/build/sleeping-and-retrying/)
- [Sandbox command and process API](https://developers.cloudflare.com/sandbox/api/commands/)
- [Sandbox background processes](https://developers.cloudflare.com/sandbox/guides/background-processes/)

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

Persist dispatch failures before returning from `waitUntil`; console output is
not a recovery mechanism. Alert on age and convergence, not only error counts.
For example: page when the oldest eligible outbox row exceeds 5 minutes or when
two reconciliation passes leave the same row pending. Test repeated dispatch
and reconciliation calls and assert one external job, one domain transition,
and a stable idempotency receipt.

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
