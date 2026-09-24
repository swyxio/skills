---
name: media-to-wiki-pipeline
description: Design, run, or repair a connected audio/video-to-wiki pipeline spanning transcripts, essays, researched speaker profiles, organization guides, and incremental publication. Not for isolated transcription, article editing, or profile research.
---

# Media to wiki pipeline

Preserve accepted content, update affected entities, publish once, and verify the release with sampled live checks.

Read [references/pipeline-contract.md](references/pipeline-contract.md) for stage contracts and change handling. This describes intended behavior, not proof that an existing implementation meets it. When adapting a project, map its actual acquisition, transcript, identity, writing, ledger, enrollment, publishing, and cache drivers; label verified defects separately from proposed improvements.

## Decisions that govern progression

- Freeze recording IDs per batch; queue later arrivals separately.
- Resolve identities early, then let essay, person, and organization work proceed independently.
- Accept substantive bios and guides before enrolling new public entity pages. Brief source-backed writing is valid; placeholder name/affiliation pages are not. Attempt research and repair within budget, then report unresolved enrollment explicitly.
- Keep historical conference affiliation separate from independently sourced current employment.
- Keep accepted writing visible while replacements are reviewed. Holds attach to disputed fields or replacements; correct demonstrated falsehoods or privacy defects locally.
- Reuse unchanged approvals. Review affected meaning and dependencies rather than every downstream artifact.
- Recover from existing evidence first; automatic targeted paid transcription may use an authorized provider within the explicit available batch budget.
- Use one per-entity ledger, with receipts as evidence beneath it.
- Batch completion uses settled generation/publication and sampled desktop/mobile checks. Held items remain unresolved; sampling does not establish individual live verification or full acoustic certification.

Use `video-talk-to-essay` for reader craft, `person-profile-writing` for biographies, and `smart-entity-resolution` for ambiguous identities. Their defaults do not override these decisions or the user's instructions.

Use configured models, concurrency, providers, and spending limits. Parallelize useful ready jobs; concurrency ceilings are not quotas. This skill does not authorize extra providers, spending, cloud services, or external publication.

Stop when the frozen scope has settled outcomes and the release's sampled checks pass. Report exact completed and unresolved counts; continue independent work when one entity is blocked. Do not add optional polish or repeated fruitless recovery to the critical path.
