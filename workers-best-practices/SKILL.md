---
name: workers-best-practices
description: Author or review Cloudflare Workers code for Workers-specific runtime, binding, streaming, concurrency, lifecycle, and configuration mistakes. Use when the user explicitly asks for Workers best-practice review or when implementing a new Worker entrypoint or binding boundary. Do not trigger for generic TypeScript review, ordinary application logic, deployment operations, or product selection.
---

# Workers Best Practices

Retrieve current Cloudflare docs, installed Workers types, and the project's
Wrangler schema before asserting an API signature or configuration rule.

Load references selectively:

- [review.md](references/review.md) for a structured Workers review and current
  type/config retrieval.
- [rules.md](references/rules.md) for examples of specific runtime patterns.

## Inspect the Workers boundary

Read the full affected entrypoint, binding types, Wrangler environment, and the
callers of changed handlers. Check only Workers-specific risks supported by the
code:

- binding names and generated types match the selected environment;
- secrets are not stored in source or ordinary `vars`;
- request-scoped mutable state does not leak through module globals;
- request and response bodies are streamed when their size is not safely bounded;
- every promise is awaited, returned, deliberately detached with `waitUntil`, or
  explicitly discarded when safe;
- platform base classes use their current inheritance and `this.env` contract;
- Cloudflare services use bindings or service bindings when those are the
  intended application boundary; and
- cryptographic identifiers and secret comparisons use current Web Crypto APIs.

Do not flag a pattern merely because it differs from a preferred template.
Confirm that it is incorrect for the installed types, compatibility date, and
runtime path.

## Review proportionally

1. Retrieve only the docs and types relevant to the touched APIs.
2. Verify Wrangler configuration and code agree.
3. Trace serialization boundaries, body consumption, and background work.
4. Run the narrow typecheck, test, lint, or local Worker exercise that can falsify
   the finding.
5. Report concrete defects with file/line evidence and the smallest correction.

Route Durable Object design to `durable-objects`, exact CLI work to `wrangler`,
and material production rollout decisions to `cloudflare-production-builder`.
Do not turn a Workers code review into a general architecture or production
readiness program.
