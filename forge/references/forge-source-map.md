# Forge source map

Use these first-party sources to resolve current Forge behavior. Forge is an
active Alpha product; do not treat this reference as a copied API manual.

## Canonical entry points

| Need | First source | Read this part |
| --- | --- | --- |
| Agent orientation, auth, CLI/API, Git, Deploy | [`llms.txt`](https://forge.smol.ai/llms.txt) | “Start here,” “Agent Git Authentication Quickstart,” “Migrate an existing repository to Forge Deploy,” and “Forge Deploy” |
| Product boundary: GitHub-like host plus Forge/Cloudflare architecture | [Forge root README](https://forge.smol.ai/swyx/forge/blob/main/README.md) | “What This Is,” “Forge Deploy preview,” “AI Agent Integration,” and “CLI” |
| Deploy maturity, product vocabulary, service boundaries | [Deploy overview](https://forge.smol.ai/swyx/forge/blob/main/docs/deploy/README.md) | “Current behavior and roadmap,” “Decisions already made,” and “Product vocabulary” |
| `forgeBuild.ts` syntax, static evaluation, build/asset/route semantics | [Manifest v1](https://forge.smol.ai/swyx/forge/blob/main/docs/deploy/manifest-v1.md) | “Fields,” “Project-scoped build context,” “UI overrides,” and “Deployment identity” |
| Configure a project, preview/promotion lifecycle, Alpha limitations | [Forge Deploy Alpha builder guide](https://forge.smol.ai/swyx/forge/blob/main/docs/deploy/forge-deploy-preview.md) | “Configure a repository,” “Overrides and publication,” “Enrollment and lifecycle,” and “Preview security and current limits” |
| Existing-project migration/import | [Migration guide](https://forge.smol.ai/swyx/forge/blob/main/docs/deploy/migrating-an-existing-repository.md) | preserve package manager, migration scope, Git LFS, and Cloudflare boundaries |
| Build/reconciliation failures | [Failure diagnostics](https://forge.smol.ai/swyx/forge/blob/main/docs/deploy/failure-diagnostics.md) | exact failure code before retrying |
| Static/site artifact limits and LFS/asset handling | [Forge Assets v1](https://forge.smol.ai/swyx/forge/blob/main/docs/deploy/assets-v1.md) and [Deploy limits](https://forge.smol.ai/swyx/forge/blob/main/docs/deploy/limits.md) | output size, file count, asset adoption, and retention constraints |
| Monorepo project mapping or Cloudflare binding proposals | [Repository configuration](https://forge.smol.ai/swyx/forge/blob/main/docs/deploy/repository-config.md) | `.forge/config.json` is static proposal/config, not a deploy or provider apply |

When the source checkout is present locally, the corresponding maintained files
are normally at:

```text
/Users/swyx/Work/forge/llms.txt
/Users/swyx/Work/forge/README.md
/Users/swyx/Work/forge/docs/deploy/
```

Use the live URLs when the local checkout is unavailable or when current
availability, terms, limits, account eligibility, or deployed behavior matters.

## Source precedence

1. The current Forge UI/API result and the installed `sf` CLI define the
   active account/project state.
2. The live `forgeBuild.ts` v1 specification and schema define deploy syntax.
3. A current implementation-status statement in the applicable Deploy document
   takes precedence over older design/roadmap language.
4. `llms.txt` is the primary agent-oriented map, not a reason to skip the
   narrower document that owns the question.

## Useful read-only checks

```sh
sf auth status
sf help
sf commands --json
sf schema --json
sf status
npx smolforge deploy check
```

Use command-specific `--help` before constructing mutations. A repository-scoped
Git PAT may be sufficient for Git but insufficient for account-level Deploy
control; do not broaden scopes or bypass the signed-in control plane merely to
avoid an authorization boundary. This customer/application rule is distinct
from an authorized Forge operator's direct-Wrangler break-glass repair of Forge
infrastructure; use the release-lane decision and bounded dossier in
`../SKILL.md` for that case.
