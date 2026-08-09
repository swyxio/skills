---
name: test-strategy-hardening
description: Improve test architecture, diagnose flaky or nondeterministic tests, consolidate duplicated coverage, reduce fixture or suite cost, and design test selection. Use when the user explicitly asks to work on tests as a system. Do not trigger merely because ordinary implementation work needs a regression test.
---

# Test Strategy Hardening

Improve confidence per minute without inflating test count or ceremony.

## Define the contract

Before changing a test suite:

1. Name the behavior that could regress and who observes it.
2. Search for existing coverage of the same invariant.
3. Choose the lowest boundary that can prove the behavior faithfully.
4. Identify time, randomness, concurrency, storage, network, global-state, and teardown dependencies.

Do not add a test merely because a source line changed. A useful test must fail for a plausible defect and pass for the intended behavior.

## Choose a faithful boundary

- Use pure tests for transformations, validation, policies, and invariants.
- Use component or module tests for framework behavior.
- Use integration tests when storage, protocols, processes, or concurrency define the contract.
- Reserve end-to-end tests for critical user journeys and runtime ownership proofs.

Do not mock away the behavior under test. Prefer stable, externally meaningful assertions over private calls, generated values, broad snapshots, or expectations copied from production logic.

## Remove nondeterminism

- Inject or freeze time.
- Seed or inject randomness and ID generation.
- Isolate mutable state, environment variables, ports, providers, and caches.
- Await background work and close resources in teardown.
- Synchronize through observable events or bounded polling against a real condition.

Larger timeouts, retries, global serialization, skipped tests, and weaker assertions are not flake fixes. Reproduce the smallest failure, classify the cause, fix the source, and repeat the repaired test enough to exercise the former failure mode.

## Consolidate deliberately

- Use table-driven cases when one contract varies only by input and outcome.
- Extract repeated realistic setup into feature-owned fixtures.
- Keep scenario-specific decisions visible at the call site.
- Retain focused tests when they materially improve failure localization.
- Delete or merge a test only after naming the replacement coverage.

Measure setup, imports, execution, and teardown before optimizing. Share immutable baseline construction only when mutable state remains isolated and invalidation is complete.

## Validate proportionally

During implementation, expand validation with risk:

1. the changed or nearest focused test;
2. related tests and affected package checks;
3. cross-package contracts when a shared boundary changes;
4. the full suite when repository policy or release risk requires it.

Never report a focused suite as proof that the full suite passed.

## Report

Summarize:

- contracts strengthened;
- tests merged or removed and their replacement coverage;
- flaky-test causes and deterministic fixes;
- commands actually run and suites intentionally omitted;
- runtime changes and remaining blind spots.
