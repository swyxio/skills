# Existing Face-Matching Implementation and Operations

Paths, numbers, and commands in this reference describe one concrete face-matching implementation: the `aiDotEngineer/aietools` World’s Fair 2026 system inspected on 2026-08-24. Use it as an operational example for that repository, not as a required architecture for every face-matching product. Inspect current repository state before assuming these specifics remain unchanged.

## Repository ownership

Primary repository:

`/Users/swyx/Work/aietools`

Typical owning paths:

- `src/photos/`: Photo Finder frontend and browser-side upload matching.
- `src/photos/facePipeline.ts`: browser SCRFD detection, SFace alignment, quality checks, ONNX/WASM inference.
- `src/photos/faceMatching.ts`: browser identity matching, event exemplar policy, gallery consensus, upload results.
- `src/photos/components/PhotoGallery.tsx`: per-person gallery, nearby photos, similarity presentation.
- `scripts/lib/face-pipeline.mjs`: offline Node/WASM implementation using the same models; keep math aligned with browser behavior.
- `scripts/refresh-photo-face-index.mjs`: canonical aliases, reviewed corrections, exact-only exclusions, trusted exemplars, gallery consensus, neighboring-frame propagation, manifest/index refresh.
- `scripts/enrich-photo-participant-evidence.mjs`: event-scope validation and schedule-derived people, company, title, session day, room, co-speakers, and missing-speaker evidence.
- `scripts/discover-photo-speaker-references.mjs`: deterministic source plan, vetted public references, optional reviewed authenticated portraits, source provenance, image materialization.
- `scripts/lib/speaker-reference-sources.mjs`: social URL normalization, GitHub/X evidence, named-image extraction, JSON-LD, alias corroboration, bounded public-page search.
- `scripts/enroll-scheduled-photo-speakers.mjs`: exact scheduled identity validation, trusted source rules, SHA verification, real face-quality gates, descriptor generation, and enrollment.
- `public/photos/data/wf26/photos-manifest.json`: canonical speaker galleries and unknown bucket.
- `public/photos/data/wf26/face-descriptors.json`: enrolled identity descriptors, reference provenance, and trust/quarantine state.
- `public/photos/data/wf26/unknown-descriptors.json`: indexed event-face descriptors, including known assignments and unassigned faces.
- `public/photos/data/wf26/participant-evidence.json`: scheduled participants, per-person confirmed session evidence, and missing people.
- `public/photos/data/wf26/speakers/by-id/`: approved speaker reference images.
- `tests/photo-finder.test.ts`, `tests/photo-participant-evidence.test.ts`, `tests/photo-scheduled-enrollment.test.ts`, `tests/photo-speaker-reference-discovery.test.ts`, and `tests/photo-speaker-reference-sources.test.ts`: primary regression suites.

The authoritative public event schedule historically lived in the neighboring repository:

`/Users/swyx/Work/aiecode2025/apps/main/src/data/worldsfair/schedule.json`

Only read or modify a different repository if the user-authorized task actually requires it. A dirty checkout or an active parent worktree belongs to the user; do not modify, switch, rebase, reset, or clean it merely to investigate photo matching.

## Existing model and quality gates

At the documented snapshot:

- Face detection: SCRFD ONNX model, `scrfd_10g.onnx`.
- Face embedding: SFace ONNX model, `sface_int8.onnx`.
- Execution: `onnxruntime-web` with the existing WASM provider; offline Node path used a single WASM thread.
- SCRFD model input: 640×640 letterboxed image.
- Detector feature strides: 8, 16, 32.
- Face alignment: standard five-point SFace/ArcFace landmark template.
- Aligned face input: 112×112.
- Identity descriptor: 128 finite numeric dimensions.
- Minimum source-image width and height: 128 pixels.
- Required accepted detected face count: exactly one.
- Minimum enrollment detector confidence: 0.80.
- Allowed relative face area: 0.08 through 0.85 of the image.
- Required landmarks: exactly five finite `(x, y)` pairs.
- Quarantined historical identity: `spk_dylan_patel`.

Do not confuse the detector’s internal candidate proposal threshold, often 0.5, with the separate final enrollment acceptance threshold of 0.80. Running proposal variants does not authorize accepting a face below the final policy.

Browser/offline identity policy at that snapshot:

- Basic identity cosine similarity: at least 0.42.
- Basic runner-up identity margin: at least 0.12.
- Trusted event exemplar similarity: at least 0.55.
- Trusted event exemplar margin: at least 0.18.
- Trusted event detection score: at least 0.80.
- Maximum trusted event prototypes per identity: 2.
- Augmented identity similarity: at least 0.60.
- Augmented identity margin: at least 0.18.
- Gallery consensus similarity: at least 0.60.
- Gallery consensus margin: at least 0.12.
- Explicit human-reviewed event reference similarity: at least 0.70.
- Corroborated neighboring-frame descriptor similarity: at least 0.80.
- Corroborated neighboring-frame weaker individual margin: at least 0.08, backed by independent same-identity sequence evidence.
- Neighboring camera-frame maximum numeric gap: 25.

These are implementation parameters, not universal biometrics guidance. Re-read current code and benchmark before changing them.

## Identity and review invariants

Historical canonical aliases:

```text
spk_bereket_engida  -> spk_bereket_habtemeskel
spk_dominic_kundel  -> spk_dominik_kundel
spk_microsoft       -> spk_idan_gazit
spk_andon_labs      -> spk_lukas_petersson
```

Explicitly reviewed exclusions:

```text
19397164505.webp
19397329061.webp
19397356736.webp
```

Exact-only reviewed image that must not become a reusable person anchor:

```text
19397302476.webp -> spk_thais
```

Human-reviewed Peter Steinberger cluster photos are bounded corrections to the former Dylan gallery, not independently reviewed reusable seed faces. Preserve the distinction between:

- Official or verified public headshot reference.
- Independently trusted event exemplar.
- Exact human-reviewed event photo.
- Explicit human-reviewed cluster membership.
- Inferred gallery consensus.
- Corroborated neighboring-frame sequence.
- Quarantined, exact-only, or explicitly excluded image.

## Source safety and evidence

Accept canonical HTTPS source/profile URLs only. Remove signed query strings and fragments from public identity URLs. Never persist signed LinkedIn media URLs, auth cookies, browser storage, access tokens, private profile HTML, or unrelated attendee PII.

Use source-specific evidence:

- LinkedIn: exact public profile URL, exact or explicitly corroborated name, matching employer or equivalent independent context, human-reviewed or otherwise authorized image bytes, SHA-256.
- X/Twitter: organizer- or otherwise trusted-linked exact handle, corroborated profile name, public `pbs.twimg.com/profile_images/` avatar, no banners or unrelated post media unless separately authorized and attributed.
- GitHub: stable profile URL, exact displayed name or strong organizer/project/employer corroboration, account avatar, and rejection of cartoons/illustrations by actual face validation.
- Employer/team pages: exact named image `alt`, `title`, `aria-label`, nearby identity evidence, JSON-LD `Person.image`, or safe first-party profile linkage; reject generic OG images, logos, and group/team banners.
- Personal sites: corroborated personal identity and matching project/employer where available; do not accept a visually attractive image solely because a domain contains a similar name.
- Reviewed aliases: short-name/full-name relationships are allowed only with the same surname and independent corroboration. `Leo/Leonard`, `Alex/Alexander`, `Jeff/Jeffrey`, and `Jess/Jessica` are examples, not an open-ended fuzzy match policy.

An identity-verified social profile and its current avatar may still fail detection. Track `identity_verified` separately from `image_usable` and retain each attempted candidate’s actual detector result.

## Framing-repair decision tree

Keep original image bytes and source hash unchanged for provenance. Perform bounded preprocessing in memory:

1. Decode image to sRGB, remove alpha, and verify dimensions.
2. Run the ordinary detector and unchanged quality validation.
3. If a single confidently detected face is rejected only as `face-too-small`, center a bounded approximately 2.4× padded crop on that face and rerun every original validation.
4. If a trusted image returns `no-face`, `low-face-confidence`, or an excessively edge-filled face, add an approximately 20% constant neutral border and rerun the same detector.
5. If padding produces one face but its relative area is now too small, feed that detection into the same bounded centered-face crop and rerun complete quality validation.
6. Accept only if the final result still has exactly one face, detector score at least 0.80, valid bounds/area, five valid landmarks, and a finite 128-dimensional descriptor.
7. Reject multi-face, low-confidence, wrong-person, invalid-landmark, undersized-image, ambiguous-profile, or uncertain evidence cases. Do not bypass minimum dimensions by merely upscaling an 80×80 or 100×100 source.

Run expensive variants only for unresolved last-mile references. Keep bulk event-photo scanning on its existing fast path.

## Typical operation sequence

Read-only inventory first:

```bash
git status --short --branch

node scripts/refresh-photo-face-index.mjs
```

An index refresh without `--write` should be used to inspect convergence. Do not assume all scripts are read-only; inspect CLI options and repository authorization before running them.

When a user has authorized rebuilding reviewed event data, the historical sequence was:

```bash
node scripts/discover-photo-speaker-references.mjs \
  --schedule /Users/swyx/Work/aiecode2025/apps/main/src/data/worldsfair/schedule.json \
  --seed-profiles /private/tmp/approved-speaker-seeds.json \
  --reviewed-headshots /private/tmp/reviewed-speaker-headshots.json \
  --reviewed-headshots-root /private/tmp/reviewed-speaker-headshots \
  --output /private/tmp/speaker-reference-discovery.json \
  --headshots /private/tmp/approved-speaker-reference-headshots \
  --write --no-search --concurrency 4 --timeout-ms 8000 --max-retries 1

node scripts/enroll-scheduled-photo-speakers.mjs \
  --discovered-references /private/tmp/speaker-reference-discovery.json \
  --headshots /private/tmp/approved-speaker-reference-headshots \
  --write

node scripts/enrich-photo-participant-evidence.mjs \
  --schedule /Users/swyx/Work/aiecode2025/apps/main/src/data/worldsfair/schedule.json \
  --write --write-manifest

node scripts/refresh-photo-face-index.mjs --write
node scripts/refresh-photo-face-index.mjs
```

These commands mutate files when `--write` is present and are examples, not blanket authorization. Avoid committing private temporary evidence manifests or unapproved image captures. If reusing an earlier discovery report after participant evidence changed, ensure its exact speaker roster still matches the evidence input; otherwise validation should fail closed rather than silently associate stale identities.

## Required assignment-preservation audit

Group photographs can belong to multiple real people, so compare full `(image, speaker)` pairs:

```js
const assignments = manifest => new Set(
  manifest.speakers
    .filter(speaker => !speaker.isUnknown)
    .flatMap(speaker => speaker.photos.map(photo => `${photo.img}::${speaker.id}`))
);

const previous = assignments(previousManifest);
const current = assignments(currentManifest);
const lost = [...previous].filter(pair => !current.has(pair));
```

Any unintended `lost` assignment blocks the release. Independently check:

- Reviewed Peter/Dylan gallery separation.
- Human-confirmed John, Addy, Erik, Raouf, Zain, Joanne, Thais, Brian, and Daniel galleries.
- Explicit exclusions and Thais’s exact-only rule.
- New people versus people with at least one newly identified photo.
- Unknown-photo delta versus named face-assignment delta; they differ for group photos.
- Missing scheduled speakers and source-provenance statuses.
- SHA-256 match between approved persisted headshot and descriptor metadata.
- Absence of signed URLs or private media tokens in generated data and diffs.
- A second non-writing refresh reports zero newly recovered faces.

## Tests and release checks

Typical minimum local validation:

```bash
npm run test:relevant -- --files <changed-photo-paths...>
npm run typecheck
npm run build
npm run test
git diff --check
```

Actual-image detector tests are essential when changing preprocessing. Synthetic JPEG headers, a mocked detector, or source-ranking assertions do not prove a real headshot can be embedded.

For a production-scoped task, verify separately:

1. Intended source commit and reviewed diff.
2. Successful release workflow for that exact commit.
3. Correct deployed Pages version; a Worker deployment alone does not update Photo Finder.
4. Live `photos-manifest.json`, `face-descriptors.json`, and `participant-evidence.json` fetched after release.
5. Live assignment-preservation, unknown-count, missing-speaker, and safe-URL audits.
6. Real browser galleries displaying the expected name, headshot, and event-photo count.

A green test suite, merged pull request, submitted deploy, or healthy unrelated route is not proof that the intended photo data is live.
