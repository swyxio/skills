# Stage and release contracts

```text
selected source IDs + versions + refresh scope
  -> preserved originals -> normalized evidence (transcript only for recordings)
  -> source/person/organization/topic resolution and dependency links
       -> source reader + useful visuals
       -> person research -> accepted profile
       -> organization research -> accepted profile
       -> cross-source topic synthesis -> accepted topic page
  -> accepted affected-page assembly -> immutable release + guarded activation
  -> affected cache invalidation -> required live checks -> ledger recap
```

The arrows describe dependencies, not serial scheduling. Metadata and research can start before media acquisition finishes. An unsupported org identity need not block a supported talk: retain the documented credit without inventing a canonical org link. Resolve authoritative identity and membership independently of prose. Ambiguous identities stay provisional; accepted identity alone does not establish a complete public page.

## Source and transcript

Use references/source-adapters.md for acquisition and normalization. Identify sources through stable provider IDs and supported cross-source bridges, not mutable filenames or titles. Link alternate renditions without duplicating the work. Apply the transcript rules below only to recordings.

Preserve original media and raw caption/ASR output. Derived audio, normalized transcripts, excerpts, and frames carry parent hashes and transformations. Retain original clocks and livestream offsets; never silently replace a supplied transcript with another track.

Evaluate existing evidence for coverage, timing, language, and gaps before recovery. Use authorized local or paid tooling according to quality, time, privacy, and budget. Transcribe missing intervals where sufficient; no blanket ASR or cosmetic re-transcription. Reserve estimated paid costs, reconcile actual charges, and record unavailable usage as unavailable, not zero. Preserve funds for review and concrete repairs.

Normalized transcript segments contain start/end times, text, supported speaker labels, provenance, and explicit uncertainties. Do not fill unheard gaps. Transcript-source review and full-recording listening are different claims.

## Identity and relations

Join established authoritative IDs directly. For ambiguity, corroborate event records, recording credits, verified accounts, owned projects, official employer/company pages, and dated context. Models suggest candidates; sources establish identity. Scheduled participation alone does not establish who appears in the recording.

Maintain canonical IDs, source-specific IDs, reviewed aliases, and merge history. Name similarity, popularity, face similarity, and a famous company namesake do not justify a match. An org page requires an exact primary identity; never guess a domain.

Keep these relations distinct:

- Recording participation and documented credit.
- Conference organization/title scoped to event/date/source.
- Current employment with its own source and observation date.
- Authorship, ownership, founding, collaboration, sponsorship, and integration.

Collaboration or integration does not imply employment. A public display name need not be a legal name. Research unresolved identities within budget; stop when further attempts cannot usefully distinguish candidates.

## Content and enrollment

Give writers complete relevant current sources and any accepted content being revised. Exclude unrelated historical duplication with provenance rather than truncating relevant evidence to fit a request.

Source readers follow references/page-contracts.md. For recorded read-alongs, preserve progression, mechanisms, examples, quantities, disagreements and endings; apply video-talk-to-essay. Bind recording frames to media hash, original clock, caption and reading order; bind written-source figures to the original source version and figure/page locator. Inspect new/changed visuals for unsupported associations or exposed redactions; reuse unchanged accepted visual evidence. Audio-only input does not establish slide contents.

Person research supports chronology, contributions, authored work, projects, ideas, and dated roles; talks alone are not a full biography. Organization and topic profiles follow references/page-contracts.md, which supplies useful defaults without a pre-existing site contract. A newly supplied source is evidence, not automatically the profile’s organizing subject. Archive guides are a separate, explicitly requested artifact. Source-poor content should be concise, not padded with invented facts. Preserve approved photos, aliases, unrelated fields, and private/public boundaries.

Enroll authoritative identities and memberships during preparation. Accept new person/organization profiles before treating public pages as complete; enrollment and content may ship together. Missing enrollment is an explicit error with a research/repair disposition, not silent success. Existing accepted pages remain visible while proposed replacements are held.

## Resume and subset refresh

Reuse the existing runner and ledger. Freeze an explicit selection of source IDs, entity IDs or topic IDs plus observed versions and an update cutoff. Selection names the refresh boundary, not permission to rewrite the corpus. An affected shared page may use unchanged retained sources outside that selection as context. Supporting research for selected entities proceeds within the existing authorization and budget; do not enroll unrelated sources or expand the refresh target merely because research discovers them. Record coverage and exclusion reasons.

Maintain source-to-claim/page dependencies and entity/topic memberships. Compute the affected closure from changed or added sources and meaningful fields. An added interview can change a source reader, a person's contribution or a topic recommendation; it does not invalidate every page about its employer. Source removal/retraction requires tracing dependent claims and links, not erasing a subject's independently supported history. A refresh restricted to particular output types reports excluded dependent work as pending.

Persist source versions, exact stage inputs/contracts, accepted results, remaining work and attempts in the ledger. Resume at the first incomplete or invalidated stage; adopt valid completed deliveries before new calls. A changed model/prompt alone does not force rewriting unchanged accepted content. Explicit re-evaluation uses the new contract on only the selected outputs, preserving old receipts and accepted versions.

Assemble against the actual current publication baseline, retaining every unrelated entity, relation, portrait and media choice. If the baseline moved, rebase the assembly using accepted results and validate affected joins; do not rerun writers or overwrite newer metadata. Activate with the destination's existing conditional/transactional mechanism and reconcile uncertain outcomes. Interrupted publication resumes unsettled work only.

For a transfer pilot, exercise a representative resume and subset refresh: retained accepted stages are not called again, meaningful source changes invalidate their dependents, and unrelated published content is unchanged. Report subset completion, unresolved work and deferred dependents without claiming the whole corpus is current.

## Incremental change rules

| Change | Work |
|---|---|
| Unchanged accepted source/text; model or prompt version only | Reuse; no new model call unless selected for explicit re-evaluation |
| Article/docs/post/paper body meaning or revision | Affected claims/readers/profiles/topic synthesis; retain version distinctions |
| Source deletion/retraction or newly conflicting evidence | Trace dependent support and qualify/repair affected claims; preserve independently supported content |
| Topic alias/scope or corpus membership | Affected topic synthesis, source recommendations and navigation; no unrelated biography regeneration |
| Transcript punctuation/timing | Affected transcript/clock references; no unrelated bio review |
| Transcript meaning/coverage | Affected reader claims, media, summaries |
| Recording/event credit | Identity, bylines, links, membership, caches; bio only if its claims change |
| Current employment evidence | That field and affected prose; retain historical credit |
| Canonical identity/alias | Identity proof and affected routes/links/membership |
| Substantive entity/topic replacement | Replacement review; retain accepted prior content until publication |
| Renderer/cache repair | Focused regression and required live checks; no content regeneration |

Review substantive new writing and changed meaning. Deterministic formatting or metadata repairs do not inherently require a whole-article model review. Repair the smallest faulty unit. A stale fingerprint schedules work; it does not suppress accepted content. Missing receipts do not establish missing writing or no execution.

## Ledger and interrupted attempts

One record per source/person/organization/topic holds:

- Identity, aliases, batch, dependencies, dated relations, current source versions/hashes.
- Accepted content hash/version and actual review scope/evidence; proposed changes and field-level holds.
- Published projection/version, canonical URL, attempt, pointer readback, cache outcome.
- Individual versus sampled live coverage, pages/viewports, observed versions, outcome/proofs.
- Reserved/reconciled costs and preserved original attempt references.

Keep full-source hashes distinct from actual native request hashes. Raw requests/results/deliveries and receipts support the ledger rather than competing with it.

Before adopting an interrupted run, inspect actual owner/process and stage evidence. Reconcile unknown model or publication delivery before a justified retry. Preserve originals; do not mint new fingerprints to bypass ambiguity.

## QA ownership

Use [QA placement and reuse](qa-contract.md) for preparation, item acceptance,
batch integration and live delivery checks. Separate validators and reviewers are
useful; separate completion databases are not. Their version-bound findings feed
the existing per-entity ledger. Batch scripts select scope and supply evidence;
canonical page contracts and skills own the editorial standards.

## Publication and live acceptance

Assemble immutable accepted snapshots with required enrollments, retaining unrelated records and media. Validate affected identity/content/route joins and preservation before publishing. Use the destination’s existing guarded activation mechanism: for shared pointers, one exclusive publisher with conditional writes against the observed prior version/ETag; for transactional stores, an equivalent revision check. Persist actual readback. Reconcile every pointer after a partial multi-pointer delivery; do not replay settled writes.

Invalidate affected page/data/directory caches as part of the release, including speaker/org membership. Repair failed invalidation without republishing accepted content.

Follow the user/project coverage contract: verify every changed page on desktop/mobile when required. If sampling is permitted, cover distinct changed behaviors, new route types and flagged risks. Check accepted visible text, bylines, dated affiliation distinctions, canonical/alias routes, speaker/org links and membership, figures, loaded images, overflow, and runtime errors. Inspect changed visuals; reuse unchanged component checks. Record inspected pages and sampling limits. Diagnose failures and perform bounded readonly rechecks rather than redelivery or blanket error suppression.

Successful batch completion requires settled required work and passing required release checks. After bounded recovery, a batch with held/unreviewed/unpublished items is `finished with unresolved items`, not wholly completed. Report frozen scope, unchanged/amended/completed counts, transcript recoveries, entity changes, public versions/links, available actual costs, sampled coverage, and unresolved dispositions. Do not equate textual review with acoustic certification or a frozen batch with all newly arriving recordings.
