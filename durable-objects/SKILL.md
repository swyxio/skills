---
name: durable-objects
description: Create and review Cloudflare Durable Objects. Use when building stateful coordination, implementing RPC or HTTP interfaces, SQLite storage, alarms, WebSockets, bindings, migrations, or Durable Object tests.
---

# Durable Objects

Use Durable Objects for state that needs single-key coordination, strong
consistency, persistent connections, or scheduled work. Keep the guidance
proportional to the request: a narrow diagnosis does not require a redesign.

## Current documentation

Retrieve current Cloudflare documentation when API, configuration, migration,
or platform behavior matters:

- [Documentation](https://developers.cloudflare.com/durable-objects/)
- [API reference](https://developers.cloudflare.com/durable-objects/api/)
- [Best practices](https://developers.cloudflare.com/durable-objects/best-practices/)

Load local references only when relevant:

- [rules.md](references/rules.md) for storage, concurrency, interfaces, and alarms.
- [testing.md](references/testing.md) for Workers Vitest setup and alarm tests.
- [workers.md](references/workers.md) for bindings, migrations, and observability.

## Design checklist

1. Name the coordination atom and choose a deterministic object ID. A global or
   environment-wide object is valid when deliberate low-volume serialization is
   the requirement; it is a problem only when unrelated high-volume work is
   forced through it.
2. Identify authoritative state and persist it before updating in-memory caches.
   Prefer SQLite for structured object-owned state; external stores remain
   separate consistency boundaries.
3. Prefer typed RPC for new internal interfaces. Keep `fetch()` when HTTP
   semantics, headers, routing, or compatibility require it. Preserve live
   caller compatibility during interface migrations.
4. Keep state transitions small and deterministic. Fence or reconcile external
   I/O because it permits interleaving.
5. Use `blockConcurrencyWhile()` for initialization, not routine requests or
   external I/O.
6. Remember that each object has one alarm. Persist work and progress, make the
   handler idempotent, classify failures, and bound retries.
7. Verify the exact class export, binding, namespace, migration, and live path
   touched by the change. Test only the relevant lifecycle and failure cases.

Avoid Durable Objects for stateless work or high-fan-out independent requests
that do not need serialization.
