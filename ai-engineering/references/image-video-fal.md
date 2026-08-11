# Image, video, and FAL operation notes

Read this reference for image or video generation, editing, reference-conditioned generation, subjective artifact evaluation, or multi-model FAL experiments. Treat endpoint names, schemas, pricing, limits, and policy behavior as volatile; verify them in current provider documentation before sending billed requests.

## Contents

- [Define success in layers](#define-success-in-layers)
- [Build endpoint-specific capability profiles](#build-endpoint-specific-capability-profiles)
- [Treat references as semantic inputs](#treat-references-as-semantic-inputs)
- [Support blind human evaluation](#support-blind-human-evaluation)
- [Iterate with incumbents and challengers](#iterate-with-incumbents-and-challengers)
- [Make retries and fallbacks explicit](#make-retries-and-fallbacks-explicit)
- [Persist queue work before waiting](#persist-queue-work-before-waiting)
- [FAL-specific guidance](#fal-specific-guidance)
- [Completion handoff](#completion-handoff)

## Define success in layers

Do not collapse artifact delivery and artifact quality into one status. Track at least:

```text
planned
submitted
in_progress
provider_completed
provider_failed
policy_blocked
pending_human_review
human_accepted
human_rejected
```

Interpret these layers separately:

- **Transport success:** the provider accepted or completed the request.
- **Contract success:** the response contains valid artifact references and required metadata.
- **Policy outcome:** the provider allowed, filtered, or refused the request.
- **Artifact integrity:** the image decodes or video is playable when integrity checking is authorized.
- **Human usability:** the named reviewer accepts identity, composition, aesthetics, motion, or other subjective qualities.

An HTTP 200, completed queue state, or valid artifact URL does not establish human usability. Never infer acceptance from provider completion.

## Build endpoint-specific capability profiles

Before a heterogeneous fan-out, record one profile per endpoint:

```text
provider and endpoint
task class: text-to-image, image-to-image, multi-reference, masked edit, text-to-video, image-to-video
required and optional inputs
minimum/maximum reference count
reference roles and ordering
accepted parameter allowlist
documented safety fields and provider defaults
output schema
queue/direct transport
retry and fallback policy
pricing basis
```

Construct payloads through these profiles. Do not send every shared parameter to every model. In particular:

- Omit an undocumented safety field instead of guessing its name or behavior.
- Never send a value that disables or relaxes a provider safety control.
- Omit unsupported `seed`, `negative_prompt`, `num_images`, mask, resolution, or aspect fields.
- Record parameters after endpoint-specific filtering so telemetry describes the effective request.
- Fail configuration errors without replaying the same invalid payload.

Provider and model families often expose materially different contracts. For example, one identity model may accept one face URL, another may accept an ordered image list, and a localized editor may require a base image plus a dimension-matched mask. Verify current schemas rather than generalizing from another endpoint in the same family.

## Treat references as semantic inputs

Reference assets are part of request identity. Record:

```text
stable asset ID or content hash
source/approval status
role: face, full body, wardrobe, location, style, first frame, mask, base
character or scene owner
chapter/era/scope when relevant
array position sent to the provider
```

Changing a reference, its role, or its array order creates a new effective request. Keep reference order stable across models when comparing identity blending, role reversal, or subject omission.

For image workflows:

- Start identity tests from approved, normal canonical references.
- Keep face, full-body, wardrobe, location, and style references distinguishable.
- Verify mask dimensions against the base image before a masked edit.
- Do not claim a multi-character comparison when a model accepts only one independent subject reference.
- Separate a direct compositor test from a staged workflow that edits a previously generated base.

For video workflows:

- Record whether the input is text-only, first-frame, first/last-frame, or reference-conditioned.
- Include duration, resolution, frame rate, aspect ratio, camera/motion controls, audio mode, and loop behavior in request identity.
- Evaluate temporal identity continuity, subject count, motion coherence, camera compliance, flicker, and beginning/end-frame fidelity separately.
- Treat a playable video as contract success, not proof of acceptable motion or continuity.
- Avoid downloading large outputs during blind evaluation or when URL-level persistence is sufficient.

## Support blind human evaluation

When the user asks to judge outcomes themselves, use a black-box mode:

- Submit and poll requests.
- Persist model, endpoint, effective payload, references, request ID, latency, cost, policy/error state, and artifact URLs.
- Do not fetch, open, render, caption, classify, embed, OCR, transcribe, score, or summarize artifact content.
- Mark every provider-completed artifact `pending_human_review`.
- Keep automated metrics empty unless the user explicitly authorizes an evaluator.

Record human adjudication separately from provider results:

```json
{
  "reviewer": "workspace user",
  "result_id": "result-...",
  "verdict": "usable",
  "scores": {
    "identity": 4,
    "scene_fidelity": 3
  },
  "notes": "optional reviewer explanation",
  "reviewed_at": "..."
}
```

Do not overwrite the original provider record with the human verdict. Preserve reviewer identity, cohort, and timestamp.

## Iterate with incumbents and challengers

After a human-reviewed calibration round:

1. Persist accepted incumbents.
2. Record rejected candidates without inferring a reason the reviewer did not provide.
3. Select challengers that differ materially by model generation, family, reference topology, quality tier, latency, or cost.
4. Reuse the same approved prompt template and stable reference ordering when the comparison requires it.
5. Treat a new family member or changed endpoint contract as a new logical item, not a retry.

A human-rejected artifact must not trigger automatic prompt mutation or regeneration. Link later challengers to the prior candidate or family only as evaluation lineage.

## Make retries and fallbacks explicit

Choose retry policy per request class:

- Transient network failure may be retryable when the experiment permits it.
- Configuration errors require a changed endpoint contract or payload.
- Policy refusals are terminal for the effective request; do not rewrite prompts to evade safeguards.
- Exact-model benchmarks may intentionally allow only one provider attempt.

Provider fallback can invalidate a named-model comparison. For exact-model evaluation:

- Disable provider fallback where the current API supports it.
- Record requested and provider-reported actual model separately.
- Mark a fallback completion as a different result rather than satisfying the original candidate.
- Include fallback policy in request/cache identity.

## Persist queue work before waiting

For long-running image or video generation:

1. Submit the request.
2. Atomically persist the provider request ID plus status, response, and cancellation URLs.
3. Treat the durable receipt as the idempotency boundary.
4. Poll the existing receipt; do not resubmit merely because the controlling terminal timed out.
5. Persist each terminal result before polling another item.

Keep pending receipts separate from final results. A restart should resume polling pending receipts and skip logical jobs that already have a pending or terminal record.

If several workers write one manifest, use a real lock or separate result shards followed by a deterministic merge. Do not rely on independent read-modify-write cycles against the same JSON file.

## FAL-specific guidance

Verify all details against current FAL documentation and the selected model's API page.

### Transport and exactness

- Use the queue API for endpoints that may outlive the caller; persist `request_id`, `status_url`, `response_url`, and `cancel_url` immediately.
- Use direct synchronous inference only when bounded latency is acceptable and an interrupted caller cannot lose the canonical result.
- When current FAL documentation supports them, `X-Fal-No-Retry: 1` prevents queue retries and `X-App-Fal-Disable-Fallback: 1` prevents silent model fallback. Use these for exact one-attempt comparisons, not as universal defaults.
- Never store or print `FAL_KEY`/`FAL_API_KEY`. Load credentials at the HTTP boundary and redact authorization headers from telemetry.

### Payloads and safety

- Use each model page's schema; FAL endpoints do not share one universal image/video payload.
- Send `enable_safety_checker: true` only when that endpoint documents the field. When an endpoint instead relies on an implicit provider default or exposes a different moderation field, leave the default intact.
- Never increase `safety_tolerance`, disable a checker, or mutate a refused request to bypass policy.
- Classify `content_policy_violation` as a terminal policy outcome for the effective request.

### Results

FAL response shapes vary. Depending on the endpoint, useful fields may include:

```text
images or video
seed
timings
has_nsfw_concepts
description or expanded prompt
provider request ID
```

Parse only documented fields, retain sanitized raw error detail, and allow absent optional metadata. Do not treat a missing provider cost as zero.

FAL CDN URLs are operational artifact references. Record them durably, but remember that uploading a local reference may make it accessible through a provider-hosted URL. Upload only approved assets and do not put secrets or unnecessary sensitive material into filenames, prompts, or public metadata.

### Pricing and latency

Image/video endpoints may bill per image, megapixel, duration, resolution, generation, or provider credit. Record:

```text
observed provider cost, when returned
pricing source and retrieval date, when derived
billing unit and calculation
whether cost is observed or estimated
queue wait and generation/request latency separately when available
```

Store `null` when cost is unknown. Do not silently calculate cost from an undated remembered price.

## Completion handoff

For a meaningful artifact fan-out, report:

- requested, submitted, pending, provider-completed, failed, and policy-blocked counts;
- human-accepted, human-rejected, and pending-review counts separately;
- exact model/fallback policy;
- reference topology and any non-comparable candidate limitations;
- latency and cost with observed/estimated labels;
- artifact manifest, pending-receipt index, attempt journal, and human-review ledger locations;
- confirmation of whether artifacts were inspected or kept blind.

Do not name a default model until the declared evaluator has reviewed a sufficient comparison cohort.
