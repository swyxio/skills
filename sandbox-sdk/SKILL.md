---
name: sandbox-sdk
description: Build or review Cloudflare Sandbox SDK applications for isolated untrusted-code execution, code interpreters, CI tasks, files, lifecycle, or preview URLs. Load for Sandbox SDK work; not for generic Workers, containers, or ordinary server-side subprocesses.
---

# Cloudflare Sandbox SDK

Retrieve the current [Sandbox docs](https://developers.cloudflare.com/sandbox/),
[API reference](https://developers.cloudflare.com/sandbox/api/), and relevant
examples before relying on method names, runtime limits, image tags, or preview
behavior. Do not auto-install packages or assume Docker is available; check the
project's existing dependencies and local-development requirements first.

## Required safety and integration contract

- Use the SDK's supported `Sandbox` Durable Object/container binding and export
  the provider's `Sandbox` class as required by the current docs. Match the
  project's current Wrangler config and migration schema; do not copy a full
  config block over existing bindings.
- Keep untrusted code isolated. Validate user/session ownership of sandbox IDs,
  constrain commands, paths, resources, network access, and execution time, and
  do not place provider or application secrets in the sandbox unless the task
  explicitly requires a scoped secret injection.
- Give each user/job an intentional sandbox identity; do not use one hardcoded
  shared container for multi-user work. Clean up temporary sandboxes and bound
  retained state according to the current SDK lifecycle.
- Treat command output, files, previews, and generated code as untrusted. Escape
  or sanitize them before returning them to another surface.

## Capability selection

Use the current SDK API for the smallest requested capability:

- command/build/test work through the command execution primitive;
- LLM-generated code through the supported code-interpreter/context primitive;
- file reads/writes/listing through SDK file methods with workspace path checks;
- HTTP previews through the supported port-exposure path and an authorized
  domain, if the deployment supports it.

Do not use internal clients when the public SDK exposes the operation. Keep code
interpreter contexts explicit when state should persist and destroy temporary
resources when it should not.

## Dockerfile and deployment

Extend the project image only with dependencies the workload needs. Pin or
update base images through the repository's normal dependency process, keep
images lean, and avoid privileged or unnecessary system packages. Confirm the
current preview-domain, wildcard-DNS, instance, sleep, and cleanup requirements
from provider docs before documenting them as production constraints.

## Focused validation

- Typecheck and deploy/config validation pass using current project commands.
- The Worker binding/class export and migration match the installed SDK version.
- Unauthorized users cannot address another sandbox or read its files.
- Command, file, code, network, timeout, and cleanup paths have bounded tests.
- A failed or timed-out execution returns a safe terminal result and does not
  leak secrets or leave unbounded resources.

Keep version-specific API examples in the selective references under
`references/`; this main file carries the durable security and lifecycle rules.
