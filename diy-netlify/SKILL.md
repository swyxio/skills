---
name: diy-netlify
description: Build, simplify, audit, or optimize a Netlify/Vercel-style pull-request preview workflow using GitHub Actions and the project's own hosting provider, especially Cloudflare Workers or Pages. Use when every PR should receive an isolated live URL, GitHub status and preview comments, affected-project builds, fast checkout/install/browser steps, safe fork handling, and an uncomplicated merge-to-production path.
---

# DIY Netlify

Reproduce the useful product contract of Netlify Deploy Previews and Vercel
Preview Deployments without recreating either platform.

Optimize for one sentence a reviewer can understand:

> Open a PR, wait for the preview link, review it, merge when green, and let the
> exact merge commit deploy to production.

## Deliver the preview product contract

For each eligible PR:

1. Detect the affected deployable targets.
2. Build each affected target from the intended PR or merge context.
3. Publish it into a preview environment isolated from production.
4. Expose a stable PR-scoped URL that updates only after a successful deployment.
5. Preserve an immutable deployment identity or URL for the exact build.
6. Report pending, success, or failure through a required GitHub check.
7. Create or update one concise PR comment with the URL, target, source SHA, and
   deployment status.
8. Cancel superseded work for the same PR when the provider and workflow make
   cancellation safe.

Make preview links shareable with the intended reviewers and add `noindex` where
the hosting layer does not already do so. Add an optional changed-route entry
link only when the repository can derive it reliably.

## Keep previews separate from production

For trusted same-repository PRs, use dedicated preview Workers, projects, or
namespaces with no production routes, domains, secrets, or data/service bindings.
Use explicit preview-safe configuration rather than filtering production config
at runtime.

Require authorization or a separately sandboxed design for forks. Never run
untrusted fork code with protected credentials merely to match the convenience
of a hosted preview platform.

Treat preview source, preview deployment, merged source, production deployment,
traffic state, and live behavior as separate facts. Never infer production from
a successful preview.

## Make GitHub Actions boring and fast

Measure recent median, p90/p95, and maximum step times before editing. Optimize
the demonstrated bottleneck, usually in this order:

- Keep affected-target detection fast and conservative for shared code and locks.
- Keep one required aggregator terminal even when every target is skipped.
- Use target-specific sparse/blobless checkouts where tests do not require the
  full tree.
- Install only the selected workspace dependency closure.
- Use an installed runner browser when the real test supports it; retain a
  suitable local default.
- Remove package-manager setup from runtime-only scripts.
- Replace obsolete reconciliation cron jobs with authoritative path triggers and
  manual dispatch.
- Bound jobs with timeouts derived from healthy tail evidence.
- Record step time and relevant directory size before adding caches.

Do not weaken a test to improve its graph. Keep a full checkout when a contract
really validates the complete media or source tree, or replace it with a
separately reviewed authoritative inventory.

Exercise every matrix target on a real runner after changing sparse paths or
filtered installs. Check for missing manifests, undeclared workspace
dependencies, runtime-resolution changes, partial-clone lazy fetches, rename
detection that hydrates blobs, and divergent nested lockfiles.

## Keep production simple

On the production branch, build and deploy the exact merged SHA through one
existing per-target release authority. Verify provider identity/configuration and
the owning live hostname. Preserve the current rollback boundary.

Do not introduce build/stage/promote jobs, artifact handoff, receipt protocols,
or resumable release states merely because previews now exist. First prove that
production rebuild waste is frequent and material, artifact transfer is cheaper,
and cross-run ownership can be fenced. Prefer clearer in-job timing and small
non-secret receipts.

Pair with `cloudflare-production-builder` only when changing material production
traffic, binding, route, migration, promotion, or rollback behavior.

## Verify the reviewer loop

Use a small visible canary change and prove:

1. the correct targets were selected and unrelated ones skipped;
2. required source checks passed;
3. the PR comment points to the latest successful preview;
4. the preview renders the canary on desktop and mobile without production
   bindings or routes;
5. merging triggers the exact merge SHA production workflow;
6. provider readback and the public hostname report that SHA;
7. production smoke checks pass;
8. the repository returns to a clean synchronized state.

Report a timing table with baseline median/tail, canary time, absolute and percent
delta, and sample size. Mark preview creation as a new capability rather than an
infinite speedup. Distinguish wall time, runner minutes, tail reliability, review
experience, and production safety.

## Resist platform creep

Do not build a deployment dashboard, collaboration drawer, branch-environment
framework, generalized preview database, or multi-provider abstraction until a
real user need exceeds what GitHub checks, one PR comment, provider URLs, and
workflow artifacts already provide.

Read [aiecode2025-case-study.md](references/aiecode2025-case-study.md) for the
measured rollout that motivated this skill, including the intentionally retained
full-tree test and the rejected distributed stage/promote redesign.

Product inspiration:

- [Netlify Deploy Previews](https://docs.netlify.com/deploy/deploy-types/deploy-previews/)
- [Vercel for GitHub](https://vercel.com/docs/git/vercel-for-github)
