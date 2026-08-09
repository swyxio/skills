---
name: antislop-codebase
description: Diagnose or execute an explicit repository-wide maintainability cleanup while preserving behavior. Use only when the user asks to antislop a codebase, clean up an overgrown repository, plan or run a substantial structural migration, or audit maintainability across a repo. Do not trigger for ordinary feature refactors, a single large file, routine type improvements, adding regression tests, or broader production-readiness work.
---

# Antislop Codebase

Use this skill to reduce demonstrated maintenance cost while keeping current behavior essentially as-is. Do not impose a universal "product-shaped" architecture.

## Boundary

This skill is for demonstrated structural maintainability problems such as unclear ownership, harmful coupling, repeated logic, or repository-wide migration debt.

Do not expand the scope into a full production-readiness initiative. Observability/logging programs, security reviews, compliance, incident response, SLOs, runbooks, secrets posture, penetration testing, and deep reliability engineering belong in separate follow-on skills unless the user explicitly asks to include a small enabling change.

## Operating Principles

- Preserve behavior first. Improve architecture in thin, reversible slices.
- Ground every decision in repo facts: file sizes, dependency graph, tests, runtime shape, API surfaces, user workflows, deployment limits, and current dirty worktree.
- Prefer deletion and direct code over new layers. Add an abstraction only when it removes demonstrated duplication, isolates a volatile boundary, or clarifies ownership.
- Treat file size, folder shape, type coverage, and test count as clues, not targets. A cohesive large file may be better than several pass-through modules.
- Preserve compatibility only for a named live reader. Do not add barrels, facades, aliases, or migrations speculatively.
- Never rewrite active user-owned areas without permission. If other agents/users are editing a surface, audit or work around it.
- Use subagents, commits, deployments, screenshots, and audit artifacts only when the user requests them or the migration's scale clearly justifies them.

## Counterweight: stop before cleanup becomes architecture production

- Scope the smallest set of hot paths that causes the reported maintenance pain. Do not clean adjacent code for consistency alone.
- Name the concrete cost before changing structure: repeated defects, conflicting ownership, duplicated logic, unsafe coupling, or slow comprehension.
- Reuse the repository's existing conventions unless they are the demonstrated problem.
- Do not add feature folders, shared action layers, runtime schemas, tests, docs, or compatibility surfaces as a completeness checklist.
- Do not turn a local refactor into a repository migration, productization program, release exercise, or audit presentation.
- A concise diff and verification summary is the default finish. Produce a microsite only when explicitly requested.

## Workflow

### 1. Identify The Maintenance Cost

Run a quick non-mutating discovery pass before planning:

- Find only the entrypoints, callers, tests, and configuration relevant to the reported problem, plus current git status.
- Measure size or dependency shape only when it helps test the maintenance hypothesis.
- Identify user-critical workflows and constraints only insofar as they affect safe refactoring.
- Read recent commits and docs to avoid undoing active work.

If the repo is live or user-facing, preserve compatibility for named live readers and keep changes reversible.

For deeper discovery prompts and commands, see [analysis-checklist.md](references/analysis-checklist.md).

### 2. Choose A Bounded Migration

Produce a plan that can evolve, but is complete enough for another agent to execute:

- Goal, success criteria, explicit non-goals, active no-touch areas, and risk posture.
- Staged slices ordered by blast radius and verification confidence.
- Public interfaces and compatibility promises.
- Proportional verification for the changed behavior.
- Concurrency and checkpoints only when the work is large enough to need them.

Use `request_user_input` only for product tradeoffs that cannot be discovered from the repo.

### 3. Build The Baseline Safety Net

Before broad edits:

- Run the narrowest existing checks that establish a useful baseline.
- If behavior cannot otherwise be preserved confidently, add the smallest high-value characterization test.
- Add only minimal diagnostics or recoverable error handling needed to make the refactor safe; defer comprehensive logging/observability programs to a separate production-readiness skill.
- Capture screenshots only for changed visual behavior that cannot be verified more cheaply.

### 4. Execute In Green Slices

Process the migration methodically:

- Change the highest-cost hot paths first; do not split files solely by line count.
- Extract pure models/helpers before UI shells.
- Convert untyped or ad hoc boundaries to shared domain types and runtime validation where API/provider data crosses a trust boundary.
- Consolidate duplicated server/API functions only after response shapes are pinned by tests.
- Migrate styling surface-by-surface; remove legacy selectors only after screenshot checks.
- Keep each slice small enough to test, review, and revert.

If the user explicitly requests parallel work, assign independent surfaces and keep hot files single-owner.

For execution rules and worker prompts, see [execution-playbook.md](references/execution-playbook.md).

### 5. Validate Proportionally

At each checkpoint:

- Run the narrow tests for the touched surface.
- Expand to broader checks only when shared boundaries or repository policy require it.
- Run e2e/visual smoke before deploy when UI or production flows changed.
- Preserve unrelated dirty user work.
- Commit or deploy only when the active request includes those actions.

### 6. Report The Result

Summarize the concrete maintenance cost reduced, changed structure, behavior preserved, checks run, deletions, and remaining costs. If the user explicitly requests a migration audit microsite, use [audit-microsite.md](references/audit-microsite.md).

## Quality Bar

A successful run reduces the named maintenance cost, preserves intended behavior, avoids speculative architecture and compatibility, and provides proportional evidence with honest residual risks.
