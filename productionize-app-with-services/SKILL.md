---
name: productionize-app-with-services
description: Productize a working prototype by adding a bounded set of explicitly requested operational or product services. Use only when the user asks for a broad productization pass or names product-service gaps such as permissions, API access, audit history, admin operations, or production operability as the primary task. Do not trigger for ordinary feature work, a single service integration, generic "make this production ready" phrasing without concrete scope, or routine security, observability, testing, and release tasks covered by narrower skills.
---

# Productionize App With Services

Use this skill when a working prototype needs a specific, user-selected set of product services. Productization is not a checklist of everything a mature SaaS might contain.

Use this skill to coordinate several named product-service gaps. For one narrow capability, use ordinary implementation or the corresponding narrower skill.

## Counterweight: earn every service

- Start from users, callers, incidents, and operating constraints. Name the concrete need before adding a service or control.
- Prefer the repository's existing stack and provider capabilities. Do not introduce Postgres, hand-rolled auth, PostHog, OpenAPI, API keys, feature flags, audit logs, admin UI, dashboards, or a public agent guide by default.
- Add the smallest service that closes the named gap. Avoid building extension points, bulk APIs, role systems, or management surfaces for hypothetical consumers.
- Use one authoritative identity and action path where practical, but do not create a shared action layer merely to satisfy the pattern.
- Prefer deletion, configuration, or a provider-native feature over a new subsystem.
- Do not treat security, observability, auditability, API access, and agent friendliness as inseparable. Select only the requested dimensions.
- Do not create synthetic users, records, migrations, PRs, deployments, or audit microsites solely to prove productization machinery.
- Production mutation, commits, external services, and subagents require the active request to include them or clearly authorize them.
- Stop when the selected product need is met and proportionally verified; report deferred dimensions without implementing them.

## Stack selection

Prefer the repo's existing stack and managed provider capabilities. When a selected capability requires a choice, compare the smallest viable options against current scale, ownership, portability, cost, and migration burden. Do not introduce a preferred database, auth model, analytics vendor, schema library, or documentation format without evidence from the task.

## Operating Principles

- Ground everything in repo facts before planning: current scripts, deployment topology, database schema, auth model, API routes, frontend state model, tests, recent commits, and dirty worktree.
- Preserve working product behavior unless the user explicitly asks for breaking changes.
- Keep existing UI and API architecture unless a selected caller exposes a concrete mismatch.
- Consolidate a product action only when it is already duplicated across meaningful callers.
- Add user or admin visibility only for state someone must actually operate.
- Make agent-facing surfaces only for named agent consumers.

## Workflow

### 1. Discover The Product Boundary

Run a non-mutating discovery pass:

- Current git status and only the entrypoints, data, providers, tests, and operations relevant to the selected services.
- Named users, operators, or programmatic callers and the workflows they need.
- Existing framework or provider capabilities that may already satisfy the need.
- Product behavior and compatibility that must remain intact.

Read only the relevant sections of [product-principles.md](references/product-principles.md) for capabilities the user selected.

### 2. Select Productization Slices

Write a plan the user can modify before or during execution. Include:

- Product goal, explicit non-goals, assumptions, and risk posture.
- Current-state findings with file/schema references.
- Requested workstreams and explicit non-goals; omit unrelated maturity dimensions.
- A concurrency map only when the user requested parallel work.
- API plan only when named programmatic clients require one.
- Proportional validation for the selected slices.
- Rollback and compatibility plan for migrations, env changes, provider changes, and user-visible workflow changes.

The plan should be complete, but not frozen. Update it as facts change.

### 3. Build The Safety Net

Before broad edits:

- Run focused existing checks or record why they cannot run.
- Add a characterization test only when fragile behavior cannot otherwise be preserved confidently.
- Add runtime schemas only at changed untrusted boundaries.
- Add health checks only when deployment or operations are selected slices and existing signals are insufficient.
- Capture screenshots only for changed visual behavior.

### 4. Execute Only Selected Slices

Implement only the selected capabilities. Typical slices are a data or permission contract, one shared operation used by named callers, its required UI or API adapter, and focused verification. Security, observability, audit, admin UX, documentation, and deployment are separate slices only when explicitly in scope.

For detailed execution rules and worker prompts, read [execution-playbook.md](references/execution-playbook.md).

### 5. Coordinate Large Work When Requested

Use subagents only when explicitly requested and the selected slices are independent.

Do not let multiple workers edit the same hot files. Keep one integration owner responsible for proportional verification and any explicitly requested merge or deploy.

### 6. Validate Proportionally

At the end of each slice:

- Run narrow tests for touched code.
- Add focused tests when they prove a plausible defect in a changed contract.
- Expand to broad checks only when shared boundaries or repository policy require them.
- Run e2e/browser/screenshot checks for changed user/admin flows.
- Deploy only when the active request includes deployment.
- If deployment is explicitly requested and smoke data materially reduces risk, use clearly temporary records and clean them up.
- Check only logs or dashboards relevant to selected and deployed capabilities.

### 7. Report The Result

Summarize selected capabilities, evidence, deletions, remaining risks, and deliberately omitted maturity dimensions. Create a static review microsite only when explicitly requested; then read [audit-microsite.md](references/audit-microsite.md).

## Quality Bar

A successful run satisfies the named users or operators, reuses existing product and provider capabilities, introduces no hypothetical services, keeps one clear source of truth, and provides proportional verification.
