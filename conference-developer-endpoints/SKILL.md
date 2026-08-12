---
name: conference-developer-endpoints
description: Add or review public developer/AI-facing conference data endpoints such as llms.txt, sessions.json, speakers.json, and MCP routes in this conference site. Load when exposing or changing machine-readable schedule data; not for ordinary conference UI work.
---

# Conference developer endpoints

Expose a conference's public data through a small, consistent surface while
keeping organizer-only fields private. Inspect that conference's existing source
data and route conventions first; do not assume every conference has the same
schema.

## Public data contract

Create or reuse a conference-specific data utility that returns typed public
talks, speakers, schedule-by-day data, and conference metadata. Strip internal
or sensitive fields before serialization, including email/contact details,
organizer notes, platform IDs, invitation/review state, and CFP submission data.
Never use a public endpoint to expose credentials, private URLs, or internal
workflow metadata.

The usual routes are:

| Route | Purpose |
|---|---|
| `/{conf}/llms.txt` | concise conference and schedule overview |
| `/{conf}/llms-full.txt` | public talk, speaker, and description details |
| `/{conf}/sessions.json` | public session data |
| `/{conf}/speakers.json` | public speaker data |
| `/{conf}/mcp` | read-only JSON-RPC tools over the same public data |

Use the repository's existing rewrites or framework routing. JSON routes need
appropriate cache policy, CORS only when the product requires cross-origin use,
and correct `OPTIONS` handling. Do not copy cache or CORS values blindly if the
deployment has a different policy.

## MCP surface

If MCP is in scope, keep it read-only and backed by the same sanitized utility.
Implement the current transport and JSON-RPC contract supported by the project,
including valid errors, request validation, and the smallest useful tools:
conference info, speaker search, talk search/filtering, and schedule lookup.
Do not create a second source of truth or expose fields absent from the public
HTTP endpoints.

## Developer documentation and CLI

Add documentation only when the site product includes a developer page. Show
real endpoint URLs, minimal curl/JavaScript examples, data privacy boundaries,
and current integration guidance. If the repository has a shared conference CLI,
register the new conference there rather than creating a one-off command.

## Validation

- Typecheck/build using the repository's current command.
- Exercise every route in a local or preview environment.
- Verify JSON and text responses contain no private/internal fields.
- Test malformed requests, CORS/preflight behavior where applicable, and MCP
  JSON-RPC errors/tools using the current implementation.
- Confirm documentation links and examples match the deployed route.

The Europe implementation and repository paths are useful references, not a
universal file layout. Keep conference-specific schemas and examples in a
selective reference or the implementation itself.
