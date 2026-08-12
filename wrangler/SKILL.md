---
name: wrangler
description: Write, review, or run Cloudflare Wrangler commands and configuration for a named Worker or Cloudflare resource. Use when the task depends on Wrangler CLI syntax, wrangler.jsonc, bindings, local/remote development, secrets, migrations, or a Wrangler deployment; do not trigger for generic Cloudflare architecture or ordinary application code.
---

# Wrangler CLI

Use the installed Wrangler version, its config schema, and current
[Wrangler documentation](https://developers.cloudflare.com/workers/wrangler/)
as the command contract. Do not rely on this file for flags, limits, product
availability, or pricing that may have changed.

## Before a command

1. Check whether the project already has Wrangler and which version it uses:
   `npx wrangler --version` or the repository's package script.
2. Inspect the target `wrangler.jsonc`/`wrangler.toml`, environment name,
   account/project identity, and the resource or Worker named by the task.
3. Read `node_modules/wrangler/config-schema.json` when configuration fields or
   binding shapes matter. Run `wrangler types` after a binding/config change.
4. Classify the command as local, remote read, remote write, deployment, or
   destructive. Remote writes and deletes require an exact target and explicit
   authorization from the active request.

Do not install or upgrade Wrangler just to answer a question. If it is absent,
use the project's documented runner or report the missing prerequisite; add a
dependency only when the user asks to set up the project.

## Core commands

| Need | Command family |
| --- | --- |
| initialize | `wrangler init` or the selected project scaffold |
| local development | `wrangler dev [--env NAME] [--local]` |
| config validation/deploy preview | `wrangler deploy --dry-run` |
| deploy | `wrangler deploy [--env NAME]` |
| generated bindings | `wrangler types [PATH]` / `wrangler types --check` |
| auth and diagnostics | `wrangler whoami`, `wrangler tail`, `wrangler check startup` |
| secrets | `wrangler secret put/list/delete`, `wrangler secret bulk` |
| versions | `wrangler versions list/view`, `wrangler rollback` |
| scheduled local test | `wrangler dev --test-scheduled` |

Confirm exact flags against the installed CLI before executing a command.

## Configuration boundaries

Keep non-secret settings in the versioned project config. Treat each `env.*`
environment as a separate target: names, bindings, variables, routes, and
resources may differ. Inspect the selected environment instead of assuming
top-level values are inherited or that a dashboard value is repository-managed.

Bindings are runtime contracts. After changing one, regenerate types and test
the owning application path. A declared binding does not prove that its target
resource exists or that the live path works.

Local development normally uses local storage simulation. Use a remote binding
only for the specific resource that needs real Cloudflare behavior, and label
the operation as a remote read/write. Never put secret values in `.dev.vars`,
checked-in config, command arguments, logs, or generated diagnostics.

## High-risk command families

Use the product-specific current docs for exact syntax, but keep these
boundaries:

- KV, R2, D1, Vectorize, Queues, Containers, Workflows, Pipelines, Pages, and
  Secrets Store commands all need the correct account/environment and resource
  identity. Treat delete, overwrite, remote SQL, migration apply, workflow
  termination, and secret removal as destructive operations.
- D1 migrations are ordered files with recorded application state. Inspect
  pending migrations and use the selected local/remote flag explicitly before
  applying one. Do not retry an ambiguous remote write without reading
  authoritative state.
- Upload/deploy success means the provider accepted an artifact; it does not by
  itself prove that the expected version serves the intended route. Use the
  production-builder skill for cross-surface rollout, rollback, or live-path
  reasoning.
- `wrangler tail` and diagnostic output must be filtered so secrets, tokens,
  private payloads, and unnecessary personal data are not exposed.

## Focused verification

Run only checks relevant to the changed surface. Typical choices are:

```bash
npx wrangler deploy --dry-run
npx wrangler types --check
npx wrangler dev --local
npx wrangler tail --status error
```

After an authorized remote mutation, verify the exact Worker/environment or
resource changed and test the affected binding or route. Report what the CLI
proved versus what still needs live verification.

For product commands, configuration fields, compatibility dates, limits, and
current resource lifecycle rules, retrieve the relevant primary Cloudflare
documentation at action time.
