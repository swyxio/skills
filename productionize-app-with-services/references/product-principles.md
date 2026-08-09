# Product Principles

Use this as a menu only after the user selects a capability. Do not apply every
section as a default productization baseline. Prefer existing framework and
provider features, and add no service without a named caller or operating need.

## Audit Trail — only when named actions require durable accountability

- Record actor type: `user`, `system`, `rule`, and `api` so admins can distinguish human actions, automations, integrations, and background/system actions.
- Make audit logs append-only. Do not expose update/delete operations for audit entries.
- Include IP address and user agent where available and appropriate.
- Restrict audit viewer endpoints and UI to owner/admin roles.
- Add audit entries only for named actions whose accountability or support workflow requires them.

## Permissions

- Centralize permission checks in reusable helpers such as `requireRole(db, userId, teamId, ['owner', 'admin'])`.
- Use the same permission helpers in all mutation surfaces: REST, tRPC/internal RPC, jobs, command actions, and admin UI loaders.
- Members may read configuration that explains product behavior when safe, such as rules or feature status, but cannot create/edit/delete shared configuration.
- UI should be role-aware: show read-only status/help for members instead of allowing them to hit avoidable `FORBIDDEN` errors.

## Security

- Apply security headers to API routes and frontend responses where supported.
- Validate required production env at startup.
- Encrypt provider tokens and API credentials at rest. Prefer modern authenticated encryption such as AES-256-GCM with key derivation; require a dedicated encryption key env var.
- Rate limit auth, API key, public, webhook, and expensive AI/provider routes. In-memory Map limiters are acceptable for single-instance demos; use Redis/database-backed limits for multi-instance production.
- Do not log private user content, secrets, full prompts, full email bodies, or tokens by default.
- Enforce CORS/CSRF/session policies explicitly rather than inheriting framework defaults by accident.

## Feature Flags — only when rollout control is a selected need

- Keep flag evaluation deterministic across requests. A simple default is `hash(subject:key) % 100 < rolloutPercentage`.
- Store flags locally when the app must operate independently; design the interface so it can later swap to PostHog or another flag backend.
- Capture flag exposure and admin changes in analytics/audit logs.
- Surface flag status in admin UI and optionally public diagnostic docs when safe.

## Programmatic APIs — only for named non-UI callers

- Keep browser local sync and programmatic APIs separate. Local-first sync is for UI reads and optimistic UX; external agents want stateless request/response APIs backed by the server database.
- Add a framework-agnostic action layer for core mutations. REST, tRPC/internal RPC, command palette, jobs, and webhooks should call the same action functions where practical.
- Programmatic clients need API keys or bearer tokens, not human session cookies.
- Add scopes/permissions to API keys, rate limit per key, and audit every API-key mutation/action.
- Provide filtering, pagination, and bulk operations so agents do not need N+1 calls for common workflows.
- Add idempotency keys for retried mutations, especially send/create/pay/provider actions.
- Generate OpenAPI or equivalent machine-readable docs from shared schemas/contracts.
- Provide public agent documentation only when named external agents are supported consumers.

## Observability And AI — only for named operational or AI-product questions

- Use PostHog or the local equivalent for product analytics, feature exposure, admin actions, AI events, evaluations, latency/error dashboards, and funnels.
- For AI/LLM features, capture metadata by default: task, model, provider, latency, success/error, error class, confidence, input/output schema status, user apply/ignore. Do not capture raw content unless explicitly enabled.
- Add cost/latency guardrails: timeout, max candidate counts, bounded prompt/input sizes, provider fallback, and per-user/team rate limits.
- Expose useful AI state to users: disabled/configured states, progress/elapsed time, retry, cached results, confidence, and clear apply/ignore actions.

## Product Management Surfaces — only for operations someone must perform

- Add admin UI for API key creation/revocation, webhook delivery status, feature flags, audit logs, AI/provider status, and health/readiness where appropriate.
- Add public docs for API/agent usage that do not require login and do not leak secrets.
- Prefer nonpermanent smoke records with a `codex-smoke-*` naming convention and verify cleanup after every production smoke.
