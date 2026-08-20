---
name: cloudflare
description: Route an ambiguous or cross-product Cloudflare platform request to the appropriate product, documentation, or narrower local skill. Use when the user needs help choosing among Cloudflare compute, storage, AI, networking, security, media, or infrastructure products. Do not trigger when the request already names a specific Cloudflare product or matches a narrower installed skill.
---

# Cloudflare Platform Router

Choose the smallest relevant product surface, then use current first-party
documentation or a narrower skill. This router is not a local copy of the
Cloudflare product manuals.

## Retrieve current facts

- [Cloudflare documentation](https://developers.cloudflare.com/) for supported
  behavior, limits, pricing, and product maturity.
- [Cloudflare changelog](https://developers.cloudflare.com/changelog/) for recent
  launches and breaking changes.
- The installed Wrangler configuration schema and package `.d.ts` files for the
  project's actual build contract.

Do not infer current API signatures, limits, pricing, or availability from this
router.

## Route the request

| Need | Start with |
| --- | --- |
| Stateless edge or full-stack compute | Workers, Pages, or Pages Functions |
| Per-key coordination, realtime state, or alarms | Durable Objects |
| Long-running steps or asynchronous delivery | Workflows or Queues |
| Containers or isolated code execution | Containers or Sandbox SDK |
| Key/value configuration or cache-like data | KV |
| Relational SQLite data | D1 |
| Existing PostgreSQL/MySQL acceleration | Hyperdrive |
| Objects and files | R2 |
| Versioned file trees or Git-compatible artifacts | Artifacts |
| Vector search or model inference | Vectorize or Workers AI |
| Stateful AI agents | Cloudflare Agents SDK |
| AI-provider routing and observability | AI Gateway |
| Feature flags | Flagship |
| Public hostname to a private origin | Cloudflare Tunnel |
| Private access, filtering, or SASE | Cloudflare One skills |
| CAPTCHA or form bot protection | Turnstile |
| Image or video delivery | Images or Stream |
| Browser automation | Browser Rendering |
| Infrastructure as code | Terraform, Pulumi, or Cloudflare API |

When several products appear viable, ask what consistency, latency, lifecycle,
data shape, and operator interface the application actually needs. Do not select
a product merely because it is newer or appears elsewhere in the stack.

## Prefer narrower skills

- `cloudflare-production-builder` for material production architecture,
  migrations, deployment, rollback, or live verification.
- `durable-objects` for Durable Object design and implementation.
- `agents-sdk` for applications using Cloudflare's `agents` package.
- `workers-best-practices` for Workers-specific authoring or review.
- `wrangler` for exact CLI or configuration work.
- `cloudflare-email-service`, `turnstile-spin`, `sandbox-sdk`, and
  `cloudflare-do-turn-based-multiplayer` for their named domains.
- `cloudflare-one` and `cloudflare-one-migrations` for Zero Trust and SASE.

Load only the skill that owns the active decision. A cross-product request does
not require every product skill.
