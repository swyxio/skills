---
name: forge
description: Use when a task involves SmolForge (forge.smol.ai) as a Git repository host, collaboration surface, CI/CD system, or Forge Deploy/Sites host. Covers migration from GitHub or Vercel-style hosting and Forge's exact-SHA release workflow; do not use for generic Cloudflare work or a different hosting provider.
---

# Forge

Treat Forge as two related product surfaces, not as a replacement for every
tool underneath it:

- **SmolForge repositories** are a GitHub-like source and collaboration host:
  ordinary Git Smart HTTP, repositories, branches, issues, pull requests,
  Actions, transcripts, and repository agents.
- **Forge Deploy / Sites** is a Vercel-like, Git-native release control plane:
  it turns one pushed Git SHA into an immutable preview and, after its own
  gates, a production application.
- **Cloudflare remains the runtime/provider layer.** Forge is the release and
  audit control plane; do not describe it as replacing Cloudflare or assume a
  direct Cloudflare Access/SSO integration for a hosted application.

Use this skill when the desired destination is `forge.smol.ai` or
`*.sites.smol.ai`. Do not substitute an OpenAI Sites connector, a generic
Cloudflare deployment, or another Git host for Forge without the user's
direction.

## Establish the current contract

Forge is evolving, so use the installed CLI, the target repository, and the
current first-party sources rather than remembering field names or limits.

1. Identify the intended Forge account, repository, default branch, and (for
   Deploy) project root. Preserve an existing GitHub remote unless the user
   explicitly asks to migrate or replace it.
2. Read the small, relevant slice of the source router in
   [Forge source map](references/forge-source-map.md). `llms.txt` is the
   canonical agent entry point; `forgeBuild.ts` v1 is the build contract.
3. Inspect the local CLI before relying on syntax:

   ```sh
   sf help
   sf commands --json
   sf schema --json
   ```

   Then use `sf <command> --help` with the actual command selected for the
   task (for example, `sf deploy status --help`).

4. For dynamic availability, eligibility, limits, or release status, inspect
   the current Forge UI/API/CLI result. Source documentation explains the
   contract; it is not proof that this account or project is presently enabled.

## Use Forge as a GitHub alternative

Use normal Git workflows once the repository exists: clone, branch, commit,
push, review pull requests, and inspect Actions. Prefer adding a separate
`forge` remote during a staged migration; do not overwrite `origin`, force-push
over an existing repository, or change repository visibility without explicit
authorization.

### Authentication boundary

A signed-in Forge browser session is **not** a local Git credential. For local
Git work, use Forge's scoped credential flow and verify it without exposing a
token:

```sh
sf auth login --username <username>
sf auth status
sf auth git-credential <owner>/<repo>
git ls-remote <forge-remote> HEAD
```

- Create or use a short-lived, repository-scoped credential with only the
  necessary scopes. Keep `credential.useHttpPath` enabled.
- Never read browser storage or another application's keychain to recover a
  session/PAT. Never put a token in a Git remote URL, source file, shell
  history, or chat output.
- For browser-only work, reuse the user's signed-in Forge tab if available;
  verify the active account before a write. Do not sign the user out or ask for
  their password when the session is usable.

For a GitHub migration, use Forge's current import/migration flow rather than
inventing an importer. Preserve the existing package manager and inspect Git
LFS pointers separately: Git history import does not imply hosted LFS-object
copying.

## Use Forge Deploy as a Vercel-style host

Forge Deploy is source-driven but does **not** deploy whatever happens to be
in a local checkout. It freezes an exact pushed SHA, its static
`forgeBuild.ts`, source/build inputs, preview, provider publication, and
production activation into one release record.

### Author the checked-in contract

Each Deploy project needs a data-only `forgeBuild.ts` in its configured project
root. Install the authoring package locally for types and validation:

```sh
npm install --save-dev @smolai/forge
npx smolforge deploy check
```

For a built static SPA, explicitly declare the build when `dist` (or another
output directory) is generated rather than committed:

```ts
import { defineForge } from "@smolai/forge/config";

export default defineForge({
  version: 1,
  name: "my-app",
  build: { command: "npm run build" },
  app: {
    assets: { directory: "dist", fallback: "index.html" },
  },
  routes: [{ pattern: "/*", to: "app.assets" }],
});
```

- Omitting `build` means Forge runs **no repository build command**. That is
  appropriate only for committed artifacts or a self-contained buildless
  application; Forge does not infer a Vercel-style build command.
- `forgeBuild.ts` is statically evaluated as a small data-only TypeScript
  subset. Do not add executable configuration, dynamic imports, or
  `forge.yml`/`forge.yaml` (the YAML files are rejected).
- An `app` needs an HTTP entrypoint, assets, or both. Routes target
  `app.http` and/or `app.assets`; use an SPA fallback only when browser-side
  routing needs it.
- In a monorepo, configure each project root deliberately. A root
  `.forge/config.json` can map projects and propose bindings, but it does not
  create projects, apply Cloudflare state, or grant DNS authority.
- Keep `provider.cloudflare.wrangler` imports deliberately scoped: connected
  previews can share existing production bindings and therefore may read or
  mutate the same resources.

### Configure, release, and verify

After validating and pushing the exact source, use the repository's **Sites**
page to create/configure the Deploy project, choose its root and production
branch, and enable it. A `forgeBuild.ts` commit and a passing local validation
do not create or activate a hosted project.

- If the UI presents Forge Deploy Terms, stop at the acceptance control and
  ask the user to review/accept them. Do not accept terms on their behalf.
- Treat a project slug as durable: resolve it in the UI before creation instead
  of guessing/retrying names.
- Choose automatic versus manual publication with the user’s release intent in
  mind. A manual promotion, disablement, rollback, route, or provider-apply is
  an external state change and needs the appropriate authorization.
- A production-branch push schedules eligible work, but a successful build is
  not proof that traffic changed. A preview is also not production.
- Inspect the release ledger/Sites state (`sf status`, current Deploy status,
  or the Sites UI) to distinguish source, build, preview, provider target,
  activation, and the authoritative production pointer. When a live URL
  matters, open the actual preview and production hostname and verify behavior
  separately.

Forge normally publishes hosted applications at `{project}.sites.smol.ai` in
the current Alpha. Treat preview URLs as unlisted and `noindex`, not private;
do not put secrets or private data in them. Public-source eligibility, Alpha
access, project enablement, and the current service terms may all gate hosting.

## Troubleshoot without hiding state

Use the status/readiness workflow and the release record before retries. State
the precise fact that is known: manifest valid, source pushed, build passed,
preview ready, provider published, production pointer moved, or live endpoint
verified. These are intentionally separate Forge states.

When a release is blocked or ambiguous:

1. Check the exact source SHA, configured project root and branch, effective
   build/asset/fallback settings, and current Deploy/Sites evidence.
2. Read the targeted diagnostic reference rather than blindly rebuilding or
   re-promoting. A retry may be safe only when Forge reports the same immutable
   target and its idempotency conditions.
3. Do not use a direct provider deploy as a normal workaround. Cloudflare is
   the independent break-glass layer, but bypassing Forge changes the release
   evidence and can cause the next Forge activation to fail closed.

## References

Read [Forge source map](references/forge-source-map.md) for the maintained
`llms.txt`, root README, Deploy index, manifest, migration, limits, and
diagnostic sources. Load only the document needed by the task.
