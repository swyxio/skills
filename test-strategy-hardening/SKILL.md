---
name: test-strategy-hardening
description: Write, review, refactor, consolidate, select, and debug software tests and test infrastructure so tests carry their weight. Use whenever Codex adds or changes tests, fixes flaky or nondeterministic tests, evaluates coverage, creates fixtures or mocks, removes duplicated tests, improves test runtime or CI selection, or audits a repository before refactors, releases, security work, or production hardening. Correct common LLM testing failures such as assertion inflation, copy-pasted cases, over-mocking, broad snapshots, wall-clock dependence, random fixtures, arbitrary sleeps, and running every test for every edit.
---

# Test Strategy Hardening

Make each test prove a meaningful behavioral contract with the smallest faithful setup. Optimize for confidence per minute, diagnostic clarity, and determinism—not test count or coverage theater.

## Establish the contract

Before writing or changing a test:

1. Read repository instructions, test commands, nearby tests, and existing fixtures.
2. State the behavior that could regress and who observes it.
3. Search for coverage of that behavior.
4. Choose the lowest boundary that can prove it faithfully.
5. Identify clocks, randomness, concurrency, storage, networks, globals, and cleanup.

Do not add a test merely because a source line changed. A useful test must fail for a plausible defect and pass for the intended behavior.

## Choose the boundary deliberately

- Use pure tests for transformations, validation, reducers, parsers, policies, and invariants.
- Use module or component tests for real framework behavior.
- Use integration tests for storage, protocols, processes, concurrency, or multi-module contracts.
- Use end-to-end tests for a small number of critical user journeys and owning-runtime proofs.
- Use property tests when many inputs share a crisp invariant.

Prefer the lowest faithful boundary, not the lowest possible boundary. Do not mock away the database, browser, protocol, or race that defines the behavior under test.

## Make assertions carry weight

Assert stable, externally meaningful outcomes: domain values, persisted state, ownership, error codes, protocol messages, user-visible behavior, accessibility, retries, rollback, authorization, and cleanup.

Reject tests that:

- return exactly what was programmed into a mock;
- copy production logic into the expected value;
- assert incidental ordering, generated IDs, timestamps, or private call sequences;
- replace semantic assertions with broad snapshots;
- update expected output without confirming intended behavior;
- would still pass if the feature returned a constant.

Use snapshots only when the representation itself is the contract and its diff remains reviewable. Use mutation reasoning: name one plausible incorrect implementation the test must catch.

## Keep tests deterministic

- Inject or freeze time. Never depend on today remaining before a hard-coded expiry.
- Seed or inject randomness and ID generation.
- Isolate environment variables, globals, storage, providers, ports, and caches.
- Await background work and close resources in teardown.
- Synchronize concurrency through observable events or barriers.
- Replace sleeps with state, events, or bounded polling against a real condition.
- Keep real-network tests behind explicit integration commands.

Do not treat larger timeouts, retries, global serialization, skipped tests, or weaker assertions as flake fixes.

## Consolidate without hiding behavior

Compare setup, action, and invariant before adding another case.

- Use table-driven cases when one contract varies only by input and expected outcome.
- Extract repeated realistic setup into feature-owned fixtures.
- Keep scenario-specific decisions visible at the call site.
- Avoid test-framework abstractions harder to understand than the duplication.
- Split large files by behavior or boundary.
- Retain focused tests when they localize failures that broad tests cannot.

Delete or merge a test only after naming its replacement coverage. “The integration test touches this code” is not replacement evidence unless it asserts the same invariant.

## Diagnose flakes instead of masking them

1. Reproduce without editing assertions.
2. Run the smallest failure repeatedly and capture seed, order, timing, and environment.
3. Classify the cause as test state, fixture design, infrastructure, or product behavior.
4. Fix the source of nondeterminism.
5. Add or tighten the regression assertion.
6. Repeat the repaired test enough to exercise the former failure mode.
7. Run neighboring and affected suites.

Treat exposed races, rollback failures, authorization gaps, and stale-state bugs as product defects. Quarantine only through an explicit repository mechanism with an owner, evidence, and removal condition. Never silently skip or delete a flaky test.

## Control fixture and suite cost

- Measure setup, imports, execution, and teardown before optimizing.
- Share immutable baseline construction while preserving isolated mutable state.
- Key generated fixtures by every relevant input and fail closed on mismatch.
- Separate migration/setup verification from product tests that only need a current baseline.
- Keep one canonical path that rebuilds state from source.
- Prefer small representative fixtures unless scale is the behavior under test.

Do not cache test results by default. Cache dependencies, transforms, and immutable fixture inputs only with complete invalidation and a correct miss path.

Run tests proportionally during implementation:

1. changed or nearest focused test;
2. tests related to changed modules;
3. affected package tests and typecheck;
4. cross-package contracts when shared boundaries change;
5. the full release suite when risk or repository policy requires it.

For CI, prefer explicit tiers:

- **affected:** change-aware package tests for normal changes;
- **contracts:** migrations, persistence, protocols, authorization, provider, and cross-package behavior;
- **full:** all tests, builds, audits, and end-to-end release gates.

Keep routing repository-owned and tested. Treat lockfiles, schemas, shared contracts, test configuration, generated code, and routing rules as broad invalidation triggers. Fall back wider when dependency analysis is ambiguous or dynamic. Never report a focused suite as proof that the full suite passed.

## Audit an existing suite

For a suite-wide hardening pass:

1. Inventory commands, layers, fixtures, mocks, snapshots, skips, CI, runtime, and current failures.
2. Map critical behaviors and missing failure paths.
3. Produce a keep, rewrite, merge, delete, quarantine, and add plan before broad edits.
4. Harden in green, behavior-preserving slices.
5. Measure confidence and runtime before and after.

Read [checklist.md](references/checklist.md) for the audit checklist.

## Preserve behavior and finish with evidence

Do not reshape production code solely for shallow tests. Introduce clocks, ID sources, provider interfaces, or pure seams when they also clarify the production design. Keep behavioral fixes, test consolidation, and CI routing in separate commits when practical.

Report:

- contracts added or strengthened;
- tests merged or removed and their replacement coverage;
- flaky-test causes and deterministic fixes;
- focused, affected, contract, and full suites actually run;
- runtime or fixture-cost changes;
- suites not run and why;
- remaining gaps or quarantine.

The final result must answer: “What bugs would this suite catch that it used to miss?”
