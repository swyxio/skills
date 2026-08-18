---
name: github-cloudflare-delivery
description: Audit, optimize, harden, or explain a GitHub Actions pipeline that builds pull-request previews and deploys applications to Cloudflare Workers or Pages. Use for slow or flaky checkout/install/browser steps, affected-app detection, isolated PR previews, exact-SHA production proof, release timing comparisons, or proposals to split build/upload/promote across jobs. Emphasizes measured tail reduction and warns against distributed release complexity without evidence.
---

# GitHub to Cloudflare Delivery

Improve the delivery loop in small, independently provable layers. Optimize
measured bottlenecks; do not turn CI cleanup into a deployment-platform rewrite.

Pair with `cloudflare-production-builder` when changing production upload,
traffic, rollback, binding, route, or migration behavior. Keep provider-specific
release mechanics there rather than universalizing one repository's topology.

## Preserve the proof boundaries

Report these as separate facts:

1. Required checks passed for the intended PR head.
2. A preview built the intended PR or merge context.
3. The preview is isolated from production routes, secrets, and bindings.
4. Production built and uploaded the exact merged SHA.
5. Provider readback verified the intended version and configuration.
6. Traffic changed to that version.
7. The owning public hostname passed stable live smoke checks.

Never infer a later fact from an earlier one.

## Workflow

### 1. Measure a distribution

Inspect recent successes and failures. Measure median, p90/p95, and maximum for
checkout, setup/cache restore, install, tests, build, upload, and smoke. Separate
deterministic work from network or provider tails.

Read [case-study.md](references/case-study.md) for a calibrated example of honest
before/after reporting. Do not reuse its timings as universal targets.

### 2. Map scope and trust

Identify affected-path ownership, shared dependency closures, full-tree test
requirements, secret-bearing jobs, protected environments, trusted versus forked
PRs, required-check behavior, and the production source SHA.

Keep detection and a required aggregator present even when no target is affected.
Avoid workflow-level path filters that can leave required checks pending.

### 3. Remove avoidable I/O first

Apply only patterns justified by the repository:

- Use an installed runner browser when the real test passes with its supported
  channel; preserve a suitable local default.
- Use target-specific sparse/blobless checkouts and verify the fetch behavior.
- Install only the selected workspace closure and exercise every matrix target.
- Skip unrelated apps and Workers through conservative affected-target detection.
- Remove package-manager setup from jobs that use only built-in runtime modules.
- Replace obsolete cron work with authoritative path triggers and manual dispatch.
- Add timeouts from healthy-tail evidence and instrument time and size before
  proposing caches or orchestration.

Do not weaken a full-tree contract to advertise a faster checkout. Retain the
full tree or create a separately reviewed authoritative inventory.

### 4. Isolate PR previews

For trusted same-repository collaboration, prefer dedicated preview Workers or
projects with no production routes, secrets, data/service bindings, or promotion
command. Tie the preview identity to PR, SHA, run, and attempt, and comment the
usable URL and source identity on the PR.

Treat fork previews as an adversarial execution problem requiring a separate
design. Never expose protected credentials to arbitrary fork code.

### 5. Validate the real matrix

Run contract tests, the actual browser assertion, and representative app builds.
Exercise every app and small Worker on a real runner when ordinary change
detection would otherwise select only one target.

Check for undeclared workspace dependencies, runtime-resolution changes after
filtered installs, missing sparse paths or manifests, partial-clone commands that
lazy-fetch omitted blobs, rename detection that hydrates media, and divergent
nested lockfiles. Preserve correctness when an optimization fails one of these
checks.

### 6. Prove production proportionately

Keep the existing per-target release serialized unless evidence justifies a new
coordination model. Build the exact merged SHA once, upload through the provider's
supported immutable boundary when available, verify identity/configuration before
traffic, and prove the owning live path afterward. Preserve a precise rollback
target and fail closed on provider drift.

Use `cloudflare-production-builder` for topology-specific staging, version
override, migration, promotion, and rollback choices.

### 7. Compare honestly

Show the before median and tail, the new measured run, absolute delta, percent
delta, and sample size. Mark a new preview capability as `new`, not infinitely
faster. Call out regressions and unchanged deterministic floors.

Distinguish wall-clock latency, runner minutes, tail reliability, review
capability, and production safety. A scoped optimization can succeed while a
separate full-tree job remains slow; report both facts.

## Architecture brake

Do not split build, upload, stage, and promote across jobs merely because it is
possible. First verify whether production already builds the exact merge SHA once.
If so, a split does not reduce healthy-path build count.

A distributed release adds artifact/receipt handoff, concurrency gaps, resume
states, protected-environment behavior, retention limits, and rollback branches.
Large framework outputs may cost more to transfer than to rebuild. Prefer better
step timing, logs, and small non-secret receipts inside the serialized release.

Reconsider only when frequent post-upload failures make rebuild waste material,
artifact transfer is benchmarked, provider retention and approvals are suitable,
and cross-run ownership can be fenced. Define the failure-state matrix first.

## Hand off

Report the preview identity and isolation proof, before/after timing table, exact
merged and deployed identities, live-host smoke, skipped targets, remaining
bottleneck, and any disproportionate architecture deliberately rejected.
