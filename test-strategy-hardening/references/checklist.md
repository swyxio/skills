# Test Strategy Hardening Checklist

## New or changed tests

- Name the behavioral contract and a plausible regression.
- Search for existing equivalent coverage.
- Choose the lowest faithful boundary.
- Prefer semantic assertions over implementation shape or broad snapshots.
- Control time, randomness, IDs, global state, storage, networks, and teardown.
- Keep mocks smaller than the real contract they replace.
- Run focused, related, affected, and full suites proportionally.

## Suite inventory

- Commands: unit, typecheck, build, contract, integration, e2e, visual, smoke, load, migration.
- Runtime: cold and warm time by setup, imports, execution, and teardown.
- Flakes: skips, retries, sleeps, timeouts, order dependence, clock and network dependence.
- Fixtures: size, ownership, determinism, invalidation, and hidden coupling.
- Mocks: where they isolate safely and where they conceal the real boundary.
- CI: change routing, parallelism, cache correctness, and release gates.

## High-value coverage

- Domain invariants and past regressions.
- API, protocol, and provider contracts.
- Schema migrations and compatibility behavior.
- Auth, permissions, tenancy, and ownership.
- Critical create, edit, delete, retry, rollback, and recovery flows.
- Error, empty, loading, cancel, timeout, and partial-success states.
- Browser journeys and real viewport checks when UI matters.

## Dedupe or removal signals

- Multiple cases assert the same behavior with different prose.
- Snapshots generate churn without explaining a product regression.
- Tests duplicate framework behavior.
- Mocks merely replay the implementation.
- Assertions cover private structure rather than observable outcomes.
- Setup dominates the behavior without a boundary-based reason.
- A stronger test asserts the same invariant with comparable diagnostics.

## Flake repair

- Reproduce the smallest failure repeatedly before editing.
- Capture seed, execution order, wall clock, environment, and resource state.
- Replace sleeps and retries with explicit synchronization.
- Freeze time and seed randomness.
- Isolate state and close every resource.
- Separate product races from test-harness defects.
- Record quarantine ownership and removal criteria when repair is blocked.

## Output

- Keep, rewrite, merge, delete, quarantine, and add list.
- Replacement coverage for every removed test.
- Suite map and change-routing rules.
- Before and after runtime and flake evidence.
- Focused and full commands actually run.
- Remaining blind spots and next highest-value target.
