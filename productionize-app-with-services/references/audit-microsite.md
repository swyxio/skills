# Migration Audit Microsite

Create this optional artifact only when the user explicitly requests it or a
large productization migration genuinely needs a visual review surface. Use a
concise text summary for ordinary work.

## Required Sections

- Hero summary: repo, date, commit/deploy identifiers, status, and one-sentence outcome.
- Workstream status: production boot, auth/permissions, audit, API/agent surface, observability, feature flags, admin UX, tests, docs, deploy.
- Before/after architecture: diagrams or concise cards showing major paths and new shared layers.
- Evidence table: commands run, results, timestamps, links/paths/screenshots.
- Migration ledger: new/changed migrations, ordering expectations, compatibility notes, rollback cautions.
- Security review: secrets, token encryption, headers, rate limits, API keys, role gates, safe logging.
- Audit review: actor types, append-only posture, covered actions, gaps.
- API/agent review: docs, OpenAPI, public `skill.md`, bulk/filter/idempotency, command palette reuse.
- Observability review: PostHog events, dashboards to create/check, health/readiness, logs, AI eval events.
- UX review: admin/member states, long-running progress, empty/error states, viewport screenshots.
- Test/deploy review: local checks, production smoke, temp records created/deleted.
- Residual risks and next slices.

## Metrics To Include

- Files changed, LOC added/removed, test count changes.
- New API routes/actions/docs.
- New audit actions and admin pages.
- New env vars and readiness checks.
- Largest remaining risks by severity.

## Build Guidance

- Use a simple static HTML/CSS/JS artifact in the repo or a clearly named `audit-microsite/` folder.
- Avoid external CDNs unless the repo already uses them.
- Include local screenshots/assets when useful.
- Start a local static server and give the user a `localhost` or `127.0.0.1` URL.
- If a local server cannot run, provide the absolute HTML path and explain the limitation.
