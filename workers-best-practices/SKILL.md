---
name: workers-best-practices
description: Review or author Cloudflare Workers code for current runtime, binding, configuration, streaming, promise, secret, and security behavior. Use when Workers-specific code or wrangler configuration is in scope; do not trigger for generic TypeScript or architecture advice.
---

# Workers best practices

Retrieve the current [Workers best-practices documentation](https://developers.cloudflare.com/workers/best-practices/workers-best-practices/),
installed Workers types, and the Wrangler config schema before flagging an API,
binding, config field, limit, or lifecycle rule. Keep this file as the review
contract; load the copied examples only when the finding needs them:

- [references/rules.md](references/rules.md) for the relevant rule and pattern;
- [references/review.md](references/review.md) for types, config, and review
  procedure.

## Review contract

1. Read the full touched files and current config, not only the diff.
2. Verify generated `Env`/binding types against the actual Wrangler config.
3. Check the affected request/response bodies, streaming and backpressure,
   `await`/`return`/`ctx.waitUntil` handling, and module-level state.
4. Check secret storage, cryptographic randomness/comparisons, input parsing,
   error responses, and serialization boundaries.
5. Validate only relevant type, lint, test, build, or runtime checks. Report
   evidence and uncertain provider claims separately.

## High-value failure modes

- Do not buffer unbounded request/response bodies.
- Do not leave promises floating or destructure execution-context methods.
- Do not use request-scoped mutable module state or `Math.random()` for secrets,
  tokens, or security identifiers.
- Do not hardcode secrets or hand-maintain binding interfaces when generated
  types are available.
- Use platform bindings/service bindings for in-process resources when the
  product and current docs support them; do not add a REST hop by habit.
- Use explicit error handling and safe, bounded error responses. Treat remote
  text and parsed external payloads as untrusted data.

For Durable Objects, Workflows, or Wrangler command syntax, hand off to the
narrower skill after establishing the Workers-specific boundary.
