---
name: github-cloudflare-delivery
description: Audit, optimize, harden, or explain a GitHub Actions pipeline that builds pull-request previews and deploys applications to Cloudflare Workers or Pages. Use for slow or flaky checkout/install/browser steps, affected-app detection, isolated PR previews, exact-SHA production promotion, release timing comparisons, rollback proof, or proposals to split build/upload/promote across jobs. Emphasizes measured tail reduction and warns against distributed release-state complexity without evidence.
---

# GitHub to Cloudflare Delivery

Improve the delivery loop in the smallest independently provable layers. Optimize
measured bottlenecks; do not turn CI cleanup into a new deployment platform.

Pair this skill with `cloudflare-production-builder` only when changing material
production upload, traffic, rollback, binding, route, or migration behavior. This
skill owns GitHub workflow shape, preview isolation, performance evidence, and the
decision about whether more release machinery is justified.

## Preserve the proof boundaries

Report these as separate facts:

1. Source and required checks passed for the PR head.
2. A preview built the intended PR or merge context.
3. The preview uses an isolated Worker with no production routes, secrets, or
   bindings.
4. Production built and uploaded the exact merged SHA.
5. Provider readback verified version identity and bindings.
6. Traffic changed to that version.
7. The owning public hostname passed stable live smoke checks.

Never infer a later fact from an earlier one.

## Workflow

### 1. Establish a distribution, not one anecdote

Inspect recent successful and failed runs. Measure median, p90/p95, and maximum
for checkout, toolchain/cache restore, dependency install, tests, application
build, upload, preview smoke, promotion, and live smoke. Separate deterministic
work from long-tail network or provider stalls.

Read [case-study.md](references/case-study.md) when calibrating expected numbers
or communicating before/after results. Do not copy its timings as universal
targets.

### 2. Map scope and trust before editing

Identify:

- which paths affect each app, Worker, and shared package;
- which tests truly require the full repository or media tree;
- which jobs receive secrets or a protected environment;
- whether PRs are same-repository, forked, draft, or untrusted;
- which required check must always report a terminal conclusion;
- the exact merge SHA that production must deploy.

Keep detection and the required aggregator present even when no target is
affected. Avoid workflow-level `paths-ignore` when it could leave a required
check pending.

### 3. Remove avoidable I/O first

Prefer these changes in order, verifying each one independently:

1. Use the browser already installed on the runner when Playwright supports the
   required channel. Keep local development on bundled Chromium when the channel
   environment variable is absent. Remove browser and apt installation only
   after the real browser test passes.
2. Use target-specific sparse, blobless checkouts for app builds, previews, and
   small Workers. Verify the checkout log actually uses blob filtering.
3. Install the selected workspace closure with `pnpm --filter '<package>...'`
   rather than the entire workspace. Exercise every matrix target on Ubuntu.
4. Skip unrelated app, archive, and Worker work through affected-target
   detection. Keep conservative shared-manifest and lockfile behavior.
5. Remove package-manager setup from Node-only jobs. Replace obsolete cron jobs
   with authoritative path triggers plus manual dispatch where reconciliation is
   still useful.
6. Add bounded job timeouts based on healthy tail evidence, with enough headroom
   for known legitimate outliers.
7. Add step timings and size measurements before considering caches or new
   orchestration.

Do not weaken a full-tree contract merely to advertise a faster checkout. If a
test recursively validates every public asset, either keep its full checkout or
design a separately reviewed authoritative inventory.

### 4. Build a safe PR-preview boundary

For ordinary trusted collaboration, allow only same-repository, non-draft PRs.
Build into dedicated preview Workers or projects that have:

- no production routes or custom domains;
- no production service, database, bucket, or secret bindings;
- no promotion command;
- deterministic names and receipts tied to PR, SHA, run, and attempt;
- a PR comment containing the usable preview URL and source identity.

Treat fork previews as an adversarial execution problem requiring a separate
design. Do not expose protected credentials to arbitrary fork code.

### 5. Validate the optimization on the real matrix

Run repository contract tests, the actual browser assertion, and the selected
app build locally where practical. Then exercise all matrix apps and small
Workers on a real runner, because an ordinary workflow-change PR may select only
the main app.

Check for:

- undeclared workspace dependencies hidden by a previous full install;
- duplicate React or runtime resolution after filtered installs;
- missing sparse paths, generated config, or workspace manifests;
- partial-clone commands that lazy-fetch omitted media;
- stale guards using rename detection and unexpectedly hydrating blobs;
- nested lockfiles that resolve different deployment tooling versions.

### 6. Keep production serialized by default

The default safe shape is one per-target production job that:

1. authorizes the exact merged source and required checks;
2. builds that exact SHA once;
3. performs a dry compile and immutable version upload;
4. verifies preview identity, hostname, bindings, and source metadata;
5. checks the active rollback baseline and stale-head guard;
6. stages the candidate at 0% when supported and runs an override smoke;
7. promotes it to 100%;
8. verifies provider state and stable public-hostname behavior;
9. rolls back only from a precisely run-owned traffic state.

Accept multiple successful instances of the same required source check for the
exact PR head when manual all-target validation creates them. Cardinality alone
must not reject an otherwise valid release.

### 7. Compare honestly

Show before median and tail, the new measured run, absolute delta, and percent
delta. Mark a new capability such as PR preview as `new`, not infinitely faster.
Call out regressions and unchanged deterministic floors.

Distinguish:

- wall-clock latency;
- runner-minute consumption;
- tail reliability;
- review capability;
- production safety.

A canary that encounters an unrelated full-checkout stall does not disprove a
targeted checkout optimization, but it does prove the repository still has a
remaining tail.

## Architecture brake: do not distribute the release casually

Do not split build, upload, stage, and promote across jobs merely because
immutable versions make it possible. First verify whether the current production
job already builds the exact merge SHA once. If it does, a split does not reduce
healthy-path build count.

A distributed stage/promote design adds receipt schemas, artifact handoff,
cross-job concurrency gaps, resume classifiers, possible duplicate protected
environment approvals, version-retention concerns, and more rollback states.
Large Next/OpenNext artifacts may also make upload/download slower than a
rebuild.

Prefer step-level timing, clearer logs, small non-secret receipts, and preserving
the existing serialized rollback fence.

Reconsider a split only when evidence shows frequent post-upload failures whose
rebuild cost dominates, artifact transfer has been benchmarked, provider version
retention is sufficient, protected-environment behavior is acceptable, and an
external lease or equivalent fence prevents cross-run interleaving. Document the
new failure-state matrix before implementation.

## Hand off

Report:

- merged PR and exact merge SHA;
- preview URL, Worker/version identity, and isolation proof;
- before/after timing table with sample sizes and percentile labels;
- production run, uploaded and active version IDs, binding verification, and
  live hostname smoke result;
- skipped targets and why;
- remaining bottleneck and the safest next experiment;
- any proposed architecture deliberately rejected as disproportionate.
