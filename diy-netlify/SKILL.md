---
name: diy-netlify
description: Build or audit an isolated Netlify/Vercel-style pull-request preview workflow using GitHub Actions and the project's existing hosting provider. Use when eligible PRs need separate live preview environments, stable and immutable URLs, GitHub reporting, affected-target builds, and safe fork handling. Do not use for production-bound staged versions, artifact promotion or reuse, or generalized release-platform design.
---

# DIY Netlify

Deliver the reviewer loop people expect from hosted deploy previews without
recreating a deployment platform:

> Open a PR, wait for the preview link, review it, merge when green, and let the
> exact merge commit deploy to production.

## Preview contract

For each eligible PR:

1. Detect affected deployable targets conservatively, including shared code and
   lockfile changes.
2. Build the intended PR or merge context.
3. Publish to an environment isolated from production.
4. Preserve both a stable PR URL and an immutable deployment identity or URL.
5. Maintain one required GitHub check, including a terminal skipped state.
6. Create or update one concise PR comment with target, URL, source SHA, and
   status.
7. Prevent superseded or stale-head work from replacing a newer preview.

Add `noindex` when the hosting layer does not already provide it. Add a
changed-route entry link only when it can be derived reliably.

## Trust boundary

For same-repository PRs, use dedicated preview Workers, projects, namespaces,
and preview-safe configuration. Do not give preview code production routes,
secrets, data, or service bindings.

Exclude forks unless they have a separately authorized, sandboxed publication
path. Never expose protected credentials to untrusted workflow code.

Treat source checks, preview deployment, merged source, production deployment,
traffic, and live behavior as separate facts. A successful preview is not
production proof.

If the requested design intentionally uses production configuration or reuses a
staged version for production, this skill no longer applies. Use the relevant
production-release and provider guidance instead.

## Implementation

Start from the repository's existing CI and release authorities. Add the
smallest affected-target, build, publication, check, and comment changes needed
for the preview contract.

Measure current job and step times before optimizing. Optimize demonstrated
bottlenecks without weakening tests. Sparse checkout, filtered installs,
runner-provided browsers, caching, and tighter timeouts are optional techniques,
not required architecture; exercise every affected matrix target after changing
checkout or dependency boundaries.

For Cloudflare-backed previews, consider provider-native hot paths before
starting Wrangler once per item: direct R2 REST uploads with an existing
preview-scoped token or an R2 binding, D1 batches, KV bulk writes, Queue
`sendBatch()`, and direct Workers API readbacks. Use bounded concurrency and
retries; preserve immutable identities, publication ordering, and preview-only
credentials. Do not add S3 credentials or broaden permissions merely to upload
objects.

Keep production independent: deploy the exact merged SHA through the existing
release authority, then verify provider identity and the owning live hostname.
Pair with `cloudflare-production-builder` when changing production traffic,
bindings, routes, migrations, promotion, or rollback.

## Verification

Use a small visible canary and prove:

1. affected targets were selected correctly;
2. required source checks passed;
3. the PR check and comment point to the latest successful preview;
4. the preview renders on the required browser and viewport surfaces;
5. merging triggers production for the exact merge SHA; and
6. provider readback, the public hostname, and production smoke agree.

When performance is part of the request, report baseline sample size and
median/tail timing alongside the canary result. Distinguish wall time, runner
minutes, reliability, review experience, and production safety.

Do not add a deployment dashboard, generalized preview database,
branch-environment framework, multi-provider abstraction, or resumable release
controller without a demonstrated product requirement.
