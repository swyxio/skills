---
name: cloudflare-email-service
description: Implement or debug Cloudflare Email Service sending, Email Routing, or an Agents SDK email handler. Use for the Workers email binding, Email Service REST API, SMTP, inbound `email()` handlers, domain onboarding, deliverability, or Cloudflare email tooling. Do not trigger for provider-neutral email design or non-Cloudflare mail services.
---

# Cloudflare Email Service

Retrieve current Cloudflare documentation and installed Workers types before
using API signatures, limits, pricing, or CLI commands. Email Service is evolving
and the Workers binding, REST API, SMTP, and Email Routing have distinct
contracts.

## Choose the surface

| Need | Use | Reference |
| --- | --- | --- |
| Send from a Worker | Email binding | [sending.md](references/sending.md) |
| Send from outside Workers | REST API or SMTP | [rest-api.md](references/rest-api.md) |
| Receive, forward, reject, or parse mail | Email Routing `email()` handler | [routing.md](references/routing.md) |
| Configure domains or agent tooling | Wrangler/API/MCP setup | [cli-and-mcp.md](references/cli-and-mcp.md) |
| Diagnose bounces, authentication, or reputation | Deliverability | [deliverability.md](references/deliverability.md) |

Prefer the Worker binding inside Workers unless the existing application already
has a reason to use another supported surface. Do not invent one request shape
for all surfaces: field names and response envelopes differ.

## Verify prerequisites and boundaries

- Resolve the exact account, domain, environment, and sending or routing
  configuration before changing provider state.
- Confirm the sending domain is onboarded and that the target Worker environment
  has the required binding.
- Keep API tokens and message secrets in the platform's secret mechanism, never
  in source or diagnostic output.
- Treat inbound `message.raw` as a single-use stream; buffer it once when several
  consumers need the content.
- Forward only to destinations allowed by the current Email Routing contract.
- Preserve the existing application handler when adding email; do not expand a
  delivery task into unrelated persistence, marketing, or workflow architecture.

For Agents SDK email, verify the installed Agents SDK version and read both the
Agents and Email Service documentation. Do not assume their release cadence or
types are synchronized.

## Validate the owning path

Use a controlled address and a non-sensitive fixture. Verify the exact sender
domain, recipient handling, text/HTML or raw MIME shape, and the surface actually
used by the application. Distinguish provider acceptance, queueing, delivery,
bounce, forwarding, and application processing; one does not prove the others.
