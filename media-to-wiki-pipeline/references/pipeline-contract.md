# Stage and release contracts

```text
MP3/MP4 + recording/event metadata
  -> preserved source -> raw captions/ASR -> timestamped transcript
  -> early recording/event/person/org resolution
       -> essay + selective figures -> accepted reader
       -> person research -> accepted bio
       -> organization research -> accepted guide
  -> rich-content enrollment -> immutable release + conditional pointers
  -> affected cache invalidation -> sampled desktop/mobile checks -> ledger recap
```

The arrows describe dependencies, not serial scheduling. Metadata and research can start before media acquisition finishes. An unsupported org identity need not block a supported talk: retain the documented credit without inventing a canonical org link. Provisional entities stay private until their content and identity are accepted.

## Source and transcript

Identify recordings through stable internal/external IDs and event/session bridges, not mutable filenames or titles. Different renditions of one recording are not different talks.

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

Readers preserve progression, mechanisms, examples, quantities, disagreements, and endings. Follow `video-talk-to-essay` for writing and review. Bind figures to media hash, original clock, caption, and reading-order position. Inspect new/changed visuals for unsupported associations or exposed redactions; reuse unchanged accepted visual evidence. Audio-only input does not establish slide contents.

Person research supports chronology, contributions, authored work, projects, ideas, and dated roles; talks alone are not a full biography. Org guides establish exact identity and useful context for its work and the collection. Source-poor content should be concise, not padded with invented facts. Preserve approved photos, aliases, unrelated fields, and private/public boundaries.

Accept rich new bios/guides before public enrollment; enrollment and content may ship together. Missing enrollment is an explicit error with a research/repair disposition, not silent success. Existing accepted pages remain visible while proposed replacements are held.

## Incremental change rules

| Change | Work |
|---|---|
| Unchanged accepted source/text; model or prompt version only | Reuse; no new model call |
| Transcript punctuation/timing | Affected transcript/clock references; no unrelated bio review |
| Transcript meaning/coverage | Affected reader claims, media, summaries |
| Recording/event credit | Identity, bylines, links, membership, caches; bio only if its claims change |
| Current employment evidence | That field and affected prose; retain historical credit |
| Canonical identity/alias | Identity proof and affected routes/links/membership |
| Substantive bio/guide replacement | Replacement review; retain accepted prior content until publication |
| Renderer/cache repair | Focused regression and live samples; no content regeneration |

Review substantive new writing and changed meaning. Deterministic formatting or metadata repairs do not inherently require a whole-article model review. Repair the smallest faulty unit. A stale fingerprint schedules work; it does not suppress accepted content. Missing receipts do not establish missing writing or no execution.

## Ledger and interrupted attempts

One record per recording/person/org holds:

- Identity, aliases, batch, dependencies, dated relations, current source versions/hashes.
- Accepted content hash/version and actual review scope/evidence; proposed changes and field-level holds.
- Published projection/version, canonical URL, attempt, pointer readback, cache outcome.
- Individual versus sampled live coverage, pages/viewports, observed versions, outcome/proofs.
- Reserved/reconciled costs and preserved original attempt references.

Keep full-source hashes distinct from actual native request hashes. Raw requests/results/deliveries and receipts support the ledger rather than competing with it.

Before adopting an interrupted run, inspect actual owner/process and stage evidence. Reconcile unknown model or publication delivery before a justified retry. Preserve originals; do not mint new fingerprints to bypass ambiguity.

## Publication and live acceptance

Assemble immutable accepted snapshots with required enrollments, retaining unrelated records and media. Validate affected identity/content/route joins and preservation before publishing. Use one exclusive publisher per shared pointer, conditional writes against the observed prior version/ETag, and persisted actual readback. Reconcile every pointer after a partial multi-pointer delivery; do not replay settled writes.

Invalidate affected page/data/directory caches as part of the release, including speaker/org membership. Repair failed invalidation without republishing accepted content.

Sample desktop/mobile across distinct changed behaviors, new route types, and flagged risks. Check accepted visible text, bylines, dated affiliation distinctions, canonical/alias routes, speaker/org links and membership, figures, loaded images, overflow, and runtime errors. Inspect changed visuals; reuse unchanged component checks. Record inspected pages and sampling limits. Diagnose failures and perform bounded readonly rechecks rather than redelivery or blanket error suppression.

Successful batch completion requires settled required work and passing sampled release checks. After bounded recovery, a batch with held/unreviewed/unpublished items is `finished with unresolved items`, not wholly completed. Report frozen scope, unchanged/amended/completed counts, transcript recoveries, entity changes, public versions/links, available actual costs, sampled coverage, and unresolved dispositions. Do not equate textual review with acoustic certification or a frozen batch with all newly arriving recordings.
