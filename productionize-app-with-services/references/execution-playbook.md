# Execution Playbook

## Discovery Commands

Prefer `rg`/`rg --files` and run these in parallel when possible:

- `git status --short`
- `git log --oneline -n 10`
- `rg --files | rg '(package.json|pyproject.toml|Gemfile|go.mod|Cargo.toml|docker|railway|vercel|fly|render|compose|drizzle|prisma|schema|migration|openapi|swagger)'`
- `rg -n 'auth|role|permission|audit|api[_-]?key|webhook|feature flag|posthog|healthz|readyz|rate limit|encrypt|idempotency|OpenAPI|cmd\\+k|command palette' .`
- Largest files by LOC using local shell tooling.

## Plan Template

Select only relevant sections; do not expand the task to fill this template:

- Goal
- Current State
- Non-Goals
- Assumptions
- Risk Register
- Workstreams
- Concurrency Map
- Data/Migration Plan
- API/Agent Plan
- Admin/Product UX Plan
- Observability/PostHog Plan
- Test Plan
- Deploy And Smoke Plan
- Rollback Plan
- Final Audit Microsite Plan

## Subagent Workstreams

When the user explicitly requests parallel work, subagents can cover independent surfaces:

- API inventory and OpenAPI/agent docs.
- Auth/permissions/API-key review.
- Audit-log and migration review.
- Observability/PostHog/dashboard/event taxonomy.
- UI/admin/long-running UX review.
- Test gap analysis and characterization tests.
- Security review.
- Migration audit microsite metrics.

Give each worker explicit no-touch files and a narrow output format. One owner integrates.

## Action Layer Pattern

When actions are duplicated across UI RPC, REST, command palette, jobs, and webhooks, extract:

- `actions/<domain>.ts` or local equivalent for core product mutations.
- Explicit context object: actor, actor type, team/org, request metadata, idempotency key, logger.
- Runtime input schema and typed result.
- Single place to emit audit logs, webhooks, and analytics.
- Thin adapters for REST/tRPC/jobs/UI.

Avoid making the frontend local sync layer the programmatic API. Server APIs should be stateless and database-backed.

## API Requirements

For a programmatic API with named consumers, consider only the requirements those consumers need:

- Bearer API-key auth or equivalent.
- Key hashing/storage, prefix display, last-used metadata, scopes, revocation.
- Per-key and per-user/team rate limits.
- Filtering, pagination, sorting, and bulk endpoints for common automation flows.
- Idempotency key support for retryable mutations.
- Consistent error shape with request ID.
- OpenAPI or equivalent generated from schemas.
- Public unauthenticated docs and `skill.md`/agent guide.

## Validation Checklist

Choose proportionally; this is not a mandatory minimum:

- Lint/typecheck.
- Unit tests for schemas, action functions, permission gates, idempotency, audit emission, and provider parsers.
- API tests for member/admin/API-key access, filtering, bulk ops, and auth failures.
- Migration tests or a ledger audit for schema changes.
- UI tests or browser smoke for login, admin settings, API-key page, audit viewer, docs page, key product workflow, and disabled/enabled AI states.
- Deploy smoke for health/readiness, auth/API routes, temp admin create/delete, PostHog smoke event, logs, and cleanup.

## Cleanup Rules

- Prefix temp production records with `codex-smoke-*`.
- Delete temp users, API keys, feature flags, webhooks, rules, labels, and audit rows only when safe and clearly temporary.
- Verify cleanup with direct API/database reads where available.
- Never delete user-owned production data to make a smoke pass.
