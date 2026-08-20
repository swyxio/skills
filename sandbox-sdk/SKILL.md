---
name: sandbox-sdk
description: Build or debug applications that specifically use Cloudflare Sandbox SDK (`@cloudflare/sandbox`) for isolated command execution, code interpretation, files, processes, sessions, or preview URLs. Do not trigger for generic container design, local shell scripting, or unrelated sandbox products.
---

# Cloudflare Sandbox SDK

Use current Cloudflare docs and the installed package as the API contract. The
SDK and its container topology evolve quickly; inspect package exports, types,
Wrangler schema, and generated configuration before coding.

## Establish the isolation contract

Identify:

- who chooses the sandbox ID and how it is scoped to a tenant or session;
- which code, files, environment variables, and network access are untrusted;
- what must survive container sleep or recreation;
- which operations need a shared session versus isolated execution; and
- whether an exposed service is private, temporary, or public.

A Sandbox is backed by a Durable Object and its container starts lazily. The
same ID selects the same logical Sandbox, but container-local files, processes,
and shell state can be lost after sleep or restart. Put durable application state
outside the ephemeral container filesystem.

## Configure from current docs

Verify the exact container, Durable Object binding, and class lifecycle required
by the installed SDK. Re-export the SDK's `Sandbox` class from the Worker when
the current integration requires it. Do not copy a pinned image tag, lifecycle
declaration, instance type, or preview-domain configuration from this skill.

Use [api-quick-ref.md](references/api-quick-ref.md) only after checking installed
types. Use [examples.md](references/examples.md) to locate a relevant upstream
example rather than combining several patterns speculatively.

## Choose execution deliberately

- Use command/process APIs when exit status, streams, or process lifecycle is the
  contract.
- Use code-interpreter APIs when structured rich results or a deliberate session
  is required.
- Disable or avoid shared default sessions when calls must be isolated.
- Scope IDs and credentials so one tenant cannot address another tenant's
  sandbox.
- Bound input, runtime, output, files, processes, and cleanup according to the
  untrusted-code threat model.
- Treat preview URLs as public capabilities unless an owning authentication layer
  proves otherwise. Check current custom-domain and tunnel requirements.

## Verify the real lifecycle

Test the exact package version and generated Worker bundle. Exercise creation,
one representative command or code run, expected file/session behavior,
sleep/recreation when persistence matters, cleanup, and any exposed route.
Successful object creation alone does not prove container execution or preview
routing.
