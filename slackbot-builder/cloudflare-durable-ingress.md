# Cloudflare durable Slack ingress

Use this reference for Slack Events API, slash-command, or interaction ingress
on Cloudflare Workers when the real work may outlive the request. Verify current
Cloudflare API signatures against first-party docs before copying code: Agents,
managed fibers, Workflows, Queues, and bindings can evolve.

## State machine

Treat these as distinct facts:

1. `seen`: the signed Slack envelope and its `event_id` were recorded.
2. `accepted`: one durable execution primitive accepted the work.
3. `running`: the durable owner began the core turn.
4. `delivered`: Slack received a result or a visible terminal error.

Do not use one boolean for all four. In particular, recording `event_id` before
durable dispatch is necessary for dedupe, but it is not permission to ack a
retry as complete.

A minimal D1 ledger carries:

```sql
CREATE TABLE slack_events (
  event_id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  payload_digest TEXT NOT NULL,
  received_at INTEGER NOT NULL,
  accepted_at INTEGER,
  run_id TEXT
);

CREATE TABLE runs (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  surface TEXT NOT NULL,
  trigger_id TEXT NOT NULL,
  status TEXT NOT NULL,
  phase TEXT NOT NULL,
  thread_key TEXT NOT NULL,
  UNIQUE (tenant_id, surface, trigger_id)
);
```

Use a tenant-scoped installation lookup and include tenant identity in the run,
Durable Object name, artifact keys, logs, and repair queries.

## Ingress algorithm

1. Read the untouched body once. Verify Slack's `v0` HMAC and five-minute replay
   window before JSON or form parsing, including `url_verification`.
2. Resolve the non-revoked installation by `team_id`/`enterprise_id`; drop bot,
   self, and irrelevant subtype events.
3. Insert `event_id`, tenant, and a payload digest with `INSERT OR IGNORE`.
   Reject a reused `event_id` whose digest differs.
4. If `accepted_at` is present, return `200`: this is an acknowledged retry.
5. Create or reuse a run with unique `(tenant_id, surface, trigger_id)` and
   enforce tenant/global budgets before dispatch.
6. Derive the durable coordination key from tenant + workspace + channel +
   `thread_ts`. Enqueue before loading thread context.
7. Submit to one durable primitive with `event_id` as its idempotency key:
   a managed Agent fiber for one stateful owner, a Workflow for a durable
   multi-step process, or a Queue when independent workers/backpressure matter.
8. Set `accepted_at` only after the primitive reports durable acceptance (or
   reports the same idempotent job already pending/running/completed).
9. Return `200` inside Slack's three-second window. Use `waitUntil` only for
   best-effort reactions/status—not for the agent loop.
10. The durable owner paginates the complete Slack thread, applies a strict
    `message.ts < trigger.ts` cutoff, preserves root + newest bounded tail, and
    invokes the channel-neutral core.
11. Persist the terminal run state and deliver either the answer or a sanitized,
    actionable failure. A terminal job never disappears silently.

Representative shape:

```ts
const event = await recordOrLoadEvent(db, tenant.id, envelope.event_id, digest);
if (event.acceptedAt) return ok();

const run = await createOrLoadRun(db, {
  tenantId: tenant.id,
  surface: "slack",
  triggerId: envelope.event_id,
  threadKey
});

const result = await durableOwner.startTurn(input, {
  idempotencyKey: envelope.event_id,
  waitForCompletion: false
});

if (!result.accepted && !["pending", "running", "completed"].includes(result.status)) {
  return retryableFailure();
}

await markAccepted(db, envelope.event_id, run.id);
return ok();
```

The method names are illustrative. Use the currently supported API and preserve
the state transitions.

## Ambiguous handoffs and repair

- **D1 committed, durable RPC failed:** leave `accepted_at` empty. Slack retry or
  a repair scan may dispatch the existing run.
- **Durable RPC accepted, D1 update failed:** repeat the same idempotency key.
  The durable owner returns the existing job; then repair `accepted_at`.
- **Ack was lost:** Slack retries; `accepted_at` makes the retry a cheap `200`.
- **Execution was interrupted:** use the durable recovery hook to reconcile
  provider state. Do not blindly replay an external mutation. Deliver a visible
  failure when safe reconciliation is impossible.
- **Budget/concurrency rejected:** durably mark the event handled and arrange a
  visible Slack explanation; do not generate an endless `429` retry loop.

Run a scheduled repair query over old `seen`/unaccepted events and accepted runs
without terminal delivery. Bound attempts and preserve the last error code.

## Tests that must exist

- Valid, tampered, missing, and stale raw-body signatures.
- Same `event_id`/same digest, same `event_id`/different digest, and lost-ack
  retries.
- Failure between event insert, durable acceptance, and `accepted_at` update.
- Two rapid sibling mentions proving enqueue-before-context serialization.
- Multi-page causal context excluding the trigger and later replies.
- Durable interruption producing one result or one visible error.
- Tenant A unable to resolve Tenant B installation, run, thread, token, or
  artifact.
