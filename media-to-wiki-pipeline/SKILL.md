---
name: media-to-wiki-pipeline
description: Design, run, or repair a resumable source-to-wiki publishing workflow across recordings, interviews, articles, documentation, papers or social-post corpora, producing source readers, person/organization profiles and topic pages. Use for connected corpus ingestion, generation and subset refreshes, not isolated transcription or single-page editing.
---

# Media to wiki pipeline

Preserve accepted content, update affected entities, publish once, and verify the release at the required coverage. Use this existing workflow for written and mixed-media corpora too; neither a conference archive nor a particular site's output is a prerequisite.

Read the references relevant to the task:

- [Page contracts and quality](references/page-contracts.md) before selecting page types, drafting or accepting a new corpus. It supplies portable editorial defaults, including organization and topic pages; examples illustrate quality rather than substitute for these criteria.
- [Source adapters](references/source-adapters.md) when selecting or normalizing sources. Recording clocks and media recovery apply only to recorded input.
- [Stage and release contracts](references/pipeline-contract.md) when implementing, operating, resuming or refreshing a corpus. Map actual project drivers before repairing them; intended behavior is not proof of implementation.

## Decisions that govern progression

- Freeze source IDs and versions per batch or subset refresh; queue later arrivals separately.
- Resolve identities early, then let source readers, person, organization and topic work proceed independently where their dependencies permit.
- Enroll supported identities and relations early; public page readiness is a separate content decision. Brief supported writing is valid; placeholder identity pages are not complete profiles.
- Keep dated source/event roles separate from independently sourced current employment. Research disputed identity within budget; do not guess a canonical link.
- Keep accepted writing visible while replacements are reviewed. Holds attach to disputed fields or replacements; correct demonstrated falsehoods or privacy defects locally.
- Reuse accepted stages whose relevant inputs remain valid. Select a corpus subset explicitly and expand only to its affected dependents, not unrelated pages.
- Recover from existing evidence first. Targeted paid transcription requires an authorized provider and available budget; written sources need no ASR.
- Use one per-entity ledger with receipts as evidence. Retain interrupted work and reconcile ambiguous deliveries before retrying.
- Completion requires settled required generation/publication and live checks at the requested coverage. A subset's completion is not whole-corpus completion; sampled verification is not individual proof or full acoustic certification.

Use the project's existing canonical path with the portable page contracts as defaults. Batch scripts select entities and supply evidence, not alternate narrow writing prompts. Projects specialize audience, schemas, presentation and release mechanics without replacing source fidelity or editorial usefulness. Archive guides are a distinct requested artifact, not the default organization profile.

Pair `research-grounded-writing` and `swyx-writing` for evidence and prose, `video-talk-to-essay` for recorded-source readers, `person-profile-writing` for biographies, and `smart-entity-resolution` only for ambiguous identities. Do not copy project-specific routes, models, paragraph counts or examples into unrelated corpora.

Use configured models, concurrency, providers and spending limits. Stream useful ready jobs; concurrency ceilings are not quotas. This skill does not authorize additional providers, spending, cloud services or publication.

Stop when the frozen scope has settled outcomes and required checks pass. Report exact completed and unresolved counts; continue independent work when one entity is blocked. Optional polish or repeated fruitless recovery should not prolong the critical path.
