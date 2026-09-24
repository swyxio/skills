---
name: keep-it-simple
description: Review a diff, design, execution path, or subsystem for unnecessary complexity and propose concrete simplifications. Use during code review or independently when the user is concerned about overengineering, excessive coordination, or code that has become hard to understand or operate.
---

# Keep It Simple

Find the simplest implementation that meets the actual requirements. Ask what
concrete requirement justifies each additional mechanism. Simplicity includes
runtime behavior and operational burden, not just source length.

## Review the requested surface

Establish the intended behavior, explicit constraints, and demonstrated failure
modes. Distinguish these from hypothetical future needs and conventions inherited
from templates or other skills. Inspect the relevant callers and execution path;
do not turn a focused review into a repository cleanup.

Trace what a reader must understand and what the system must execute. Look for:

- duplicate state, validation, projections, or sources of truth;
- pass-through layers, speculative interfaces, and configuration with no real use;
- repeated remote calls, per-item bookkeeping, and unnecessarily small work units;
- independent operations serialized without a correctness reason;
- optional work coupled to user-visible completion or the critical path;
- fallback, compatibility, and recovery machinery without a named consumer or
  demonstrated failure it addresses.

Treat file size, module count, and test count as clues rather than targets. A
cohesive large function can be simpler than several indirections. More batching
code can make the overall execution simpler and cheaper.

## Propose fewer mechanisms

For each useful finding, name the concrete cost and offer a specific deletion,
consolidation, direct implementation, batch, or deferred operation. Explain which
behavior remains equivalent and which tradeoff needs a user decision. Mark
unmeasured performance claims as hypotheses.

Preserve necessary guarantees with the smallest sufficient mechanism. Consider
whether a transaction, unique constraint, conditional write, or existing durable
boundary can replace repeated coordination. Separate execution granularity from
accountability: work can run in batches while retaining individual provenance and
completion status. Distinguish reconstructible derived work from irreversible
external effects before choosing retry and recovery machinery.

Keep extra structure when it prevents a real race, isolates a volatile boundary,
or makes the intended behavior easier to understand. Do not remove safeguards,
error handling, or authorization checks merely to shorten code. When reviewing a
performance concern, distinguish computation, remote-call latency, queue wait,
and contention before choosing more concurrency or a rewrite.

## Finish proportionally

In review mode, report only actionable findings: the unnecessary mechanism, its
cost, the simpler alternative, and material tradeoffs. Say when no worthwhile
simplification is supported. A short list or comparison table is sufficient;
avoid mandatory scores, audit artifacts, or a migration program.

When implementation is requested, make the smallest coherent change within the
authorized scope and verify the affected behavior with existing checks or a
focused regression where needed. For performance changes, measure the relevant
capacity or overhead rather than treating fewer lines or higher concurrency as
proof. Do not add a framework, service, abstraction, test suite, or permanent
documentation simply to complete this review.
