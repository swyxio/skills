# AI Engineer GitHub-to-Cloudflare case study

Use this case only as calibration and as an example of honest reporting. The
numbers describe one media-heavy pnpm monorepo in August 2026, not general SLOs.

## Starting evidence

The tracked working tree was about 720 MiB; the main app was about 529 MiB.
Recent jobs showed stable application work but highly variable checkout and
browser installation.

| Surface | Before median | Before tail | Observed maximum |
|---|---:|---:|---:|
| PR main build job | 4m42s | p90 6m08s | 10m13s |
| PR test job | 2m49s | p90 7m40s | 12m30s |
| PR sponsorship job | 1m37s | p90 7m58s | 8m23s |
| Main-job checkout | 15s | p90 2m02s | 6m35s |
| Test-job checkout | 15s | p90 5m55s | 7m44s |
| Sponsorship checkout | 16s | p90 7m01s | 7m24s |
| Chromium installation | 25s | p95 2m46s | 10m34s |
| Browser assertion itself | 22s | p90 23s | 29s |
| Production source-test job | 1m24s | p90 4m33s | 10m13s |
| Production main deploy job | 6m27s | p90 7m21s | 10m45s |

The deterministic main build command was roughly 3m17s median and about 3m38s
maximum. That was the compute floor; checkout was the dominant reliability tail.

## Changes that earned their complexity

- Added a 15-minute test timeout after checking healthy historical outliers.
- Used runner-installed Chrome through Playwright's browser channel and retained
  bundled Chromium as the local default.
- Removed the Chromium/apt installation and updated contract tests accordingly.
- Added a same-repository, non-draft, route-less Cloudflare PR preview with a PR
  comment and no production bindings or routes.
- Added affected-target detection, target-specific sparse/blobless checkout, and
  filtered pnpm installs for build, preview, production, and the small Worker.
- Kept the repository-wide test checkout full because its asset contracts
  genuinely scanned the complete public trees.
- Converted a daily PDF job to path-triggered generation using installed Chrome.
- Removed workspace installation from a Node-only Search Console job.
- Removed a dead workflow and disabled rename detection in sparse stale guards.
- Fixed the production authorization gate to accept multiple successful required
  checks for the same exact PR head.

## Canary after the changes

| Surface | Before comparison | Canary | Delta | Interpretation |
|---|---:|---:|---:|---|
| PR main build | median 4m42s | 4m16s | 26s faster, 9% | Modest median improvement |
| PR Cloudflare preview | unavailable | 5m14s | new capability | Reviewability, not a speedup |
| Target checkout | p90 2m02s main | 16–17s | about 1m45s faster, 86% vs p90 | Tail reduction; similar to old median |
| Filtered install | about 30–38s | 20–23s | about 7–18s faster | Smaller closure and less I/O |
| Chromium install | median 25s, max 10m34s | 0s | step eliminated | Largest reliability win |
| Chrome browser assertion | median 22s | 26s | 4s slower | Browser behavior unchanged |
| Production source test | median 1m24s | 1m50s | 26s slower | One run; still far below old tail |
| Production main deploy | median 6m27s | 5m52s | 35s faster, 9% | Build floor still dominates |

The canary's repository-wide test job took 11m24s because its intentionally full
checkout stalled for more than ten minutes. Report this plainly: the scoped jobs
improved, but the full-tree test remained an unresolved tail.

## Rejected redesign

A proposed split into build, immutable stage, and resumable promotion jobs was
stopped before merge. Production already built the exact merged SHA once and
uploaded an immutable Cloudflare Worker version before promotion. The redesign
would mainly have avoided rebuilding after a rare post-upload failure.

The measured main outputs were roughly 1.4 GiB for `.next` and 630 MiB for the
OpenNext Worker output. Moving them through GitHub artifacts risked slowing every
healthy release. Using the Cloudflare version as the handoff still required a
receipt protocol, cross-job concurrency fencing, baseline/0%-staged/already-active
resume states, and additional rollback reasoning.

The safer decision was to retain one serialized production job and improve its
step timings and receipts. Revisit only if post-upload failures become common
enough that measured rebuild waste exceeds the new state-machine risk.

## Reporting lesson

The improvement was primarily:

1. automatic, isolated PR review;
2. removal of browser-install failure tails;
3. smaller checkouts and installs for scoped jobs;
4. exact-SHA production verification and clearer operator proof.

It was not a universal multi-fold wall-clock speedup. Median build and production
release improvements were about 9%; the dramatic gains were in p90/max behavior
and in capabilities that previously did not exist.
