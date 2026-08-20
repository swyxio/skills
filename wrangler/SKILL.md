---
name: wrangler
description: Resolve, construct, review, or run an exact Cloudflare Wrangler command or `wrangler.jsonc` change. Use when the user names Wrangler, asks for a Cloudflare CLI operation, or needs environment, binding, authentication, secret, migration, deployment, or resource-management syntax. Do not trigger for general Cloudflare architecture or application code that does not require Wrangler.
---

# Wrangler CLI

Wrangler commands and configuration evolve quickly. Use the installed version,
its help output, the local configuration schema, and current first-party docs as
the contract; do not rely on a copied command catalog.

## Resolve the local contract

1. Inspect the project package manager, installed Wrangler version, config file,
   selected environment, and relevant package scripts.
2. Prefer the project-local Wrangler invocation (`npx`, `pnpm`, `yarn`, or an
   existing script) over an unrelated global installation.
3. Read `wrangler <command> --help` and the installed
   `node_modules/wrangler/config-schema.json` for exact syntax.
4. Retrieve current docs for commands, flags, lifecycle rules, limits, or product
   behavior that can change.

Start at:

- [Wrangler documentation](https://developers.cloudflare.com/workers/wrangler/)
- [Commands](https://developers.cloudflare.com/workers/wrangler/commands/)
- [Configuration](https://developers.cloudflare.com/workers/wrangler/configuration/)
- [Environments](https://developers.cloudflare.com/workers/wrangler/environments/)

Install or upgrade Wrangler only when the requested command requires it and the
user's project dependency policy permits the change.

## Resolve the target before mutation

For a write, identify the account, Worker or resource, environment, config file,
and whether the command addresses local or remote state. Environment bindings,
variables, and secrets are not automatically inherited, so inspect the selected
environment explicitly.

Distinguish read-only inspection, local development, upload, traffic deployment,
resource mutation, data mutation, and deletion. The user's request must authorize
the mutation actually performed. Use dry-run or readback when supported, but do
not represent dry-run as live success.

After an ambiguous response to a write, inspect provider state before retrying;
the operation may have completed.

## Handle credentials and secrets

- Prefer scoped API tokens or the project's established authentication profile.
- Never print credentials or place secret values in command arguments, source,
  checked-in config, or shell history.
- Use interactive secret input, supported bulk-secret input, or the existing CI
  secret mechanism.
- Keep local `.dev.vars*` and `.env*` files out of version control.

## Configuration changes

Use the format already established by the repository unless a current feature
requires migration. After changing bindings or configuration, regenerate types
when the project relies on generated environment types and run the narrow build
or typecheck that consumes them.

Do not invent resource IDs, binding names, compatibility dates, routes, or
environment inheritance. Resolve them from current project and provider state.

## Verify precisely

Report the facts separately: command validated, local behavior passed, resource
created or changed, version uploaded, traffic deployed, migration applied, and
live application verified. Include exact non-secret resource or version identity
when it matters to the user's operation.
