---
name: cloudflare-email-service
description: Build or review transactional email sending or inbound email routing with Cloudflare Email Service, including the Workers Email binding, REST API, or `email()` handler. Use when Cloudflare email configuration or code is the task; do not trigger for general email marketing, unrelated SMTP, or ordinary Workers work.
---

# Cloudflare Email Service

Retrieve current [Cloudflare Email Service documentation](https://developers.cloudflare.com/email-service/)
before relying on command syntax, fields, limits, domain onboarding, or
deliverability behavior. Load only the relevant reference:

- [sending.md](references/sending.md) for the Workers binding and send options;
- [rest-api.md](references/rest-api.md) for the account REST endpoint;
- [routing.md](references/routing.md) for inbound `email()` handling;
- [cli-and-mcp.md](references/cli-and-mcp.md) for first-time setup; and
- [deliverability.md](references/deliverability.md) for authentication,
  bounces, suppression, and transactional-email policy.

## Sending boundaries

Prefer the Workers Email binding for a Worker. Use the REST API when the app is
outside Workers or the user explicitly needs that interface; the request and
response shapes differ. Verify the sender domain is onboarded before sending.

Include both plain text and HTML when appropriate, use a real reply-to address
for conversational mail, and test only with addresses the user controls. Email
Service is for transactional messages, not a general marketing/newsletter
platform.

## Receiving boundaries

The `email()` handler receives a single-use raw stream. Buffer or clone it once
before parsing and validate sender, recipient, size, content type, and any
signature/authentication evidence before acting. Make inbound processing
idempotent; acknowledge quickly and hand long work to the appropriate durable
workflow rather than relying on handler lifetime.

## Secrets and verification

Keep API tokens, domain credentials, private content, and raw message data out
of source, logs, screenshots, and prompts. After a send or route change, verify
the exact domain/address, accepted/queued/bounced result, and the recipient path.
Report deliverability as an observed result, not as a promise from a successful
API call.
