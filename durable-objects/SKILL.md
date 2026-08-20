---
name: durable-objects
description: Design, implement, debug, or test Cloudflare Durable Objects when the task specifically involves per-key coordination, strongly consistent object-owned state, RPC or HTTP interfaces, alarms, WebSocket hibernation, bindings, or class lifecycle. Do not trigger for ordinary stateless Workers or Cloudflare Agents SDK work already owned by the `agents-sdk` skill.
---

# Durable Objects

Use Durable Objects when one named object should serialize access to its own
state. Retrieve current Cloudflare documentation for APIs, bindings, storage,
class lifecycle, limits, and pricing.

Load only the relevant reference:

- [rules.md](references/rules.md) for partitioning, storage, concurrency, RPC,
  alarms, and WebSockets.
- [testing.md](references/testing.md) for Workers Vitest and alarm tests.
- [workers.md](references/workers.md) for bindings, lifecycle configuration,
  generated types, and observability.

## Design contract

1. Name the coordination key and deterministic object ID. Avoid a global object
   unless deliberate low-volume global serialization is the requirement.
2. Identify object-owned persistent state. Treat caches and external stores as
   separate consistency boundaries.
3. Prefer typed RPC for new internal interfaces; retain `fetch()` when HTTP
   semantics or a live compatibility contract requires it.
4. Keep state transitions deterministic. External I/O can interleave, so fence,
   serialize, or reconcile the affected transition.
5. Use `blockConcurrencyWhile()` for bounded initialization, not routine requests
   or slow external work.
6. Remember that one object has one alarm. Persist progress, make the handler
   idempotent, and define bounded failure handling.
7. Design for constructor reruns and eviction. In-memory state is not durable.

Verify the exact class export, binding target, lifecycle declaration, and live
path touched by the change. Test only the relevant concurrency, restart, alarm,
or WebSocket behavior.
