---
name: forge
description: Operate or diagnose SmolForge repositories, pull requests, Actions, and Forge Deploy/Sites when the task requires Forge-specific CLI, authentication, manifest, or release behavior on forge.smol.ai or *.sites.smol.ai. Do not use for generic Git or Cloudflare work, public-page review, product strategy or analytics, or ordinary code changes that do not interact with Forge-hosted state.
---

# Forge

Forge has two surfaces over Cloudflare:

- **Repositories:** Git hosting, issues, pull requests, Actions, transcripts,
  and repository agents.
- **Deploy / Sites:** an exact pushed SHA becomes a preview and can later become
  the production application.

Cloudflare remains the runtime/provider. Do not substitute another Git or
hosting product when Forge is the requested destination, and do not assume a
hosted app inherits Forge or Cloudflare Access authentication.

## Keep the task scoped

Classify the requested outcome before loading more process:

- **Repository operation:** use Git for source and the Forge CLI for pull
  requests and Actions.
- **Customer application deployment:** follow the repository's release
  procedure. For an app on Forge Deploy, use its release ledger.
- **Forge infrastructure repair:** use the smallest healthy release path; the
  control plane being repaired need not deploy its own fix.
- **Source-only, CLI, documentation, analysis, or UI work:** do not add
  production release gates unless the user also requested a deployment.

Thread-local holds and unrelated releases are not global prerequisites. Apply
only the checks that mitigate a concrete risk in the requested action, and stop
when that outcome is proven. Record unrelated findings as follow-ups.

## Resolve current behavior

Forge is evolving. Use the installed CLI, target repository, current UI/API,
and only the relevant first-party source routed by the
[Forge source map](references/forge-source-map.md). Documentation does not prove
current account eligibility, limits, or release state.

Inspect syntax before constructing commands:

```sh
sf --version
sf help
sf commands --json
sf schema --json
sf help pr create
```

If the installed binary lacks a required command, use a pinned package version
that meets the repository's minimum. Smol (`smol-ai/smol2026`) requires
`@smolai/forge` 0.7.0 or later. For example, run
`npm exec --yes --package=@smolai/forge@0.7.0 -- sf help pr create`
and use the same prefix for the task's other Forge commands.

Identify the account, repository, default branch, and, for Deploy, project root.
Preserve an existing GitHub remote unless the user asks to replace it.

## Repository workflow

A signed-in Forge browser is not a local Git credential. Use Forge's scoped
credential flow without exposing its token:

```sh
sf auth status
sf auth git-credential <owner>/<repo>
git ls-remote <forge-remote> HEAD
```

Keep `credential.useHttpPath` enabled. Never extract tokens from browser
storage or another application's keychain, or put them in remotes, source,
shell history, or output. Do not force-push, replace `origin`, change visibility,
or broaden credential scopes without the required authorization.

Read the target repository's `AGENTS.md` and release instructions. Use its
canonical remote for branch pushes, pull requests, and CI. For Smol, that
remote is Forge. GitHub is its mirror.

After pushing the branch, open the pull request on Forge and check its head
against the Actions run:

```sh
sf pr create <owner>/<repo> --head <branch> --base <default-branch> --title "<title>" --body "<description>" --yes
sf pr view <owner>/<repo> <number> --json
sf actions list <owner>/<repo> --branch <branch> --json
sf actions inspect <owner>/<repo> <run-id> --json
```

Verify the run's head SHA and conclusion. Check the target repository's
required checks, reviews, and any hold or release freeze before merging. If
the repository authorizes you to merge, pass the verified PR head:

```sh
sf pr merge <owner>/<repo> <number> --sha <head-sha> --yes
```

Read the PR back to confirm the merge. For Smol, record the run ID, head SHA,
and conclusion on the PR. Agents merge their own Smol PRs after CI passes on
the exact head SHA, subject to holds and freezes. Smol requires a Forge PR for
changes to `main` and reserves production deployment for maintainers.

For GitHub migration, use Forge's current import flow. Preserve the package
manager and handle Git LFS separately; importing history does not copy hosted
LFS objects.

## Forge Deploy contract

Forge releases an exact pushed SHA, not the local checkout. Source, build,
preview, provider publication, production activation, and live verification are
distinct states.

Each project needs a data-only `forgeBuild.ts` v1 in its configured root. Read
the current manifest source from the source map, then validate:

```sh
npx smolforge deploy check
```

- Omitting `build` runs no repository build command.
- `forgeBuild.ts` is statically evaluated; do not use executable configuration,
  dynamic imports, or `forge.yml`/`forge.yaml`.
- An app needs an HTTP entrypoint, assets, or both. Use an SPA fallback only for
  browser-side routing.
- `.forge/config.json` can map projects and propose bindings; it does not create
  projects, apply provider state, or grant DNS authority.
- Imported Wrangler bindings can expose production resources to previews.

Creating or enabling a project, accepting service terms, promotion, rollback,
disablement, routes, and provider apply are separate external state changes.
Preview URLs are unlisted and `noindex`, not private; never put secrets or
private data in them.

## Release and recovery

Follow the application's documented release path. For Forge infrastructure,
prefer the canonical lane while it is healthy and proportionate. Direct
Wrangler is an authorized operator path for an infrastructure repair when that
lane is unavailable, unhealthy, implicated in the incident, or materially
obstructs the bounded repair.

For a direct infrastructure repair, scope one exact component, record the
source SHA, current and rollback versions, and any migration or binding change,
then check traffic, health/dependencies, and one reproduction. Do not require
unrelated previews, portfolio reconciliation, exhaustive proof, or coordination
with tasks that cannot mutate the same component or schema.

Before retrying a blocked release, identify the last proven state and targeted
diagnostic. Check the exact SHA, project root, branch, and effective build/asset
settings. Retry only when the immutable target and idempotency conditions are
clear.

## References

Use the [Forge source map](references/forge-source-map.md) to load only the
first-party document that owns the current question.
