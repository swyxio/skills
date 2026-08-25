---
name: smart-entity-resolution
description: Resolve uncertain person or organization identities across aliases, duplicate records, conflicting sources, incomplete identifiers, or competing profile and media candidates. Use when reliable matching requires contextual corroboration, candidate discovery, historical reconciliation, or explicit ambiguity handling. Do not use for straightforward joins on established identifiers or ordinary photo, image, and metadata tasks without an identity-resolution problem.
---

# Smart Entity Resolution

Resolve identities at the lowest level of effort that establishes a reliable answer. Escalate only when existing identifiers, mappings, or corroborating evidence are insufficient. This skill applies to genuinely ambiguous person and organization records, including competing profile or media candidates; ordinary image handling and deterministic ID joins do not require it.

## Core Principle

Treat entity resolution as a staged investigation, not a lookup. Exact search, slug lookup, popularity, and LLM judgment are all useful signals, but none should silently dominate the others.

Separate three questions:

- Coverage: did we enumerate all requested entities?
- Identity: does this candidate represent the requested person or organization?
- Utility: is this the best usable record for the task?

A high-utility record with weak identity evidence is a false-positive risk. Identity outranks popularity, profile completeness, image availability, and search ranking.

## Resolution Levels

Choose the lowest sufficient level; a higher level is not a mandatory prerequisite.

- **Level 0 — Direct identification:** Match an authoritative stable ID, canonical URL, or verified account identifier. Stop when that resolves the task.
- **Level 1 — Deterministic reconciliation:** Use explicit crosswalks, reviewed aliases, documented source-specific IDs, or verified identity links. Never invent a mapping.
- **Level 2 — Contextual identification:** Corroborate a name using event, session, time-appropriate affiliation, personal profile, project ownership, or independently verified source identifiers. Escalate when candidates or evidence conflict.
- **Level 3A — Official profile discovery:** Find self-controlled websites and social accounts, official speaker pages, employer directories, or project and author profiles. Prefer profiles linked from another trusted source.
- **Level 3B — Independent corroboration:** Compare identifiers, aliases, events, projects, affiliations, and dates across independent sources. Syndicated copies of one biography do not count as separate confirmation.
- **Level 3C — Alias and historical reconciliation:** Resolve stage names, spelling variants, transliterations, historical employers, acquisitions, and cross-event appearances using explicit mappings or independent corroboration. Keep affiliations time-scoped.
- **Level 3D — Candidate recovery:** Search aliases and contextualized names, probe direct IDs, URLs, and slugs, and use an LLM to suggest targeted retrieval probes only when ordinary lookup misses plausible records. Generated candidates are not verified identities.
- **Level 3E — High-fidelity adjudication:** Compare identity evidence, source authority, historical consistency, conflicting records, and meaningful alternatives. An LLM may summarize or rerank candidates but cannot replace source-backed identification.
- **Level 4 — Sensitive or unresolved:** Require explicit review when identities remain ambiguous, durable merges or publication would be consequential, private information would be exposed, or biometric identification would otherwise be necessary. Return `ambiguous`, `needs_review`, or `unresolved`.

## Preferred Sources

For identity and current self-presentation, prioritize self-controlled sources:

1. Personal website, blog, or verified personal domain.
2. X/Twitter account.
3. LinkedIn profile.
4. GitHub profile.
5. Hugging Face profile.
6. Google Scholar, Semantic Scholar, ORCID, or arXiv author profile.
7. Personal YouTube channel.
8. Substack, Medium, or Dev.to profile.
9. Bluesky or Mastodon account.

Reciprocal links, consistent handles, shared domains, project ownership, and publication history strengthen identity. A matching display name or platform badge alone does not establish account ownership.

Change source priority when the question changes:

- **Event participation and historical affiliation:** Organizer-issued IDs, official speaker pages and schedules, event-specific biographies, Sessionize or Accelevents records, and contemporaneous presentation materials outrank later profiles.
- **Current role or self-presentation:** A recently maintained personal website, verified social account, or current employer page outranks an old conference biography.
- **Canonical profile photo:** Prefer the person's verified self-selected profile image, an approved organizer headshot, or an official event portrait tied to a stable ID. A public URL does not grant image redistribution or training rights.
- **General search:** Use web results to discover candidates or corroborate facts; do not treat search ranking as proof.

Never treat a guessed thumbnail, nearby-session photograph, face similarity, or biometric embedding as verified identity evidence.

## Workflow

1. Classify the query before searching. Detect whether it is a single entity, a list of entities, or a fuzzy group/cast/member/team/org query. Terms like `members`, `cast`, `lineup`, `team`, `company`, `subsidiaries`, and `leadership` usually mean expansion is needed.

2. Parse instruction-like queries before lookup. Users often wrap entity hints in task text such as `find the full profiles for...`, `guess the grouping that includes...`, or `resolve these partial names...`. Extract the entity-hint region, preserve the original instruction as context, and do not send the whole instruction string as a literal database query.

3. Expand fuzzy queries into entity groups only when direct identification or documented mappings are insufficient. Use an LLM or search tools when genuinely needed to enumerate individuals or organizations. Keep aliases grouped under one entity.

4. Search wide per entity group. For each entity, search multiple aliases, cleaned variants, exact slug or direct-id candidates when the target database supports them, and contextualized short-name queries such as `<group> <short name>`. Use local per-entity query tracking; global query de-duping can starve later entities with common aliases.

5. Consider an LLM retrieval planner when deterministic retrieval is empty or weak. Planning is separate from reranking: ask for direct IDs, URL slugs, exact-name probes, aliases, and contextual searches. Keep probes bounded and high precision.

6. Merge candidates by stable record identity. Deduplicate by profile id, slug, canonical URL, database id, or another stable key. Preserve every query and source that found the candidate rather than keeping only the highest-scoring path.

7. Enrich candidates before reranking. Gather conceptual evidence across identity, provenance, utility, ambiguity, and confidence. The reranker should never be asked to choose from names alone.

8. Use bounded LLM reranking only for genuinely competing candidates. Continue only when another pass can materially improve coverage or distinguish likely identities.

9. Show meaningful alternatives when they could change the decision or enable correction; an authoritative exact-ID match does not need manufactured runners-up.

10. Treat unresolved and uncertain as first-class outcomes. Prefer `needs review`, `no plausible match`, or `ambiguous` over silently filling a high-utility false positive.

## Partial Names And Fuzzy Instructions

When a query contains mostly first names, short aliases, initials, or partial organization names, do not treat raw database hits as enough. Expand or classify when grouping terms, full-profile intent, or mostly one-token names make direct results unreliable.

Keep two representations of the query:

- `originalQuery`: the full user instruction and context.
- `entityHints`: the extracted list of candidate names or aliases to resolve.

The expansion model should see both. Ask it to infer the likely shared context and return concrete entities with grouped aliases. For each expanded entity, preserve a label plus aliases, then search those aliases inside that entity branch. The direct-search path can still run for simple exact names, but it should not suppress expansion when coverage depends on inferring full identities from partial hints.

Coverage is separate from result volume. Five requested hints that produce many raw candidates are not resolved until each hint maps to a selected entity or an explicit unresolved/ambiguous outcome. Track `expectedCount`, `resolvedCount`, `ambiguousCount`, and `unresolvedHints` or equivalent fields.

## Retrieval Planning And Gap Repair

Do not rely on a reranker to rescue records that retrieval never returned. Split LLM involvement into separate roles:

- Expansion model: "Who or what are the target entities?"
- Retrieval planner or repair model: "What exact ids, slugs, direct URLs, aliases, and search probes should the retriever try for this target?"
- Reranker model: "Given these enriched candidates, which one is the correct record?"

Use retrieval planning only when direct slugs or IDs may recover a missing record, or when an entity has no candidates, no usable data, or only weak/common-name matches. Give the planner the original query, grouped aliases, attempted probes, source failures, and relevant source constraints. It should return probes, not an identity decision.

Keep repair bounded and proportionate. Run deterministic retrieval on useful probes, merge recovered candidates, and mark an entity unresolved when additional searching is unlikely to change the answer.

## Logging And Fanout

Record source provenance, selected IDs, ambiguity, and coverage in proportion to the task. Avoid raw private payloads. When independent entity groups are already being processed concurrently, keep branch state isolated and merge deterministically; do not introduce fanout, telemetry infrastructure, or retries solely to satisfy this skill.

## Evidence Model

Keep the evidence conceptual and portable. Do not overfit to one site's fields.

- Identity evidence: exact name or id match, aliases, stage names, legal names, romanization variants, shared tokens, missing primary tokens, context match, known organization/group relationship, and conflicting names.
- Provenance evidence: which query found the candidate, whether it came from search, exact slug, direct URL, database id, API lookup, web result, user-provided source, retrieval-planner probe, or a recovery pass.
- Utility evidence: image count, profile completeness, activity, popularity, views, votes, list count, employee count, relationship count, verified status, recency, and whether the record has usable media or metadata for the task.
- Ambiguity evidence: short/common name, surname-only match, initials, duplicate records, group/project pages, "and the" pages, sparse records, conflicting aliases, old names, merged organizations, subsidiaries, or similarly named public figures.
- Confidence evidence: selected candidate, runner-up candidates, reranker reason, unresolved status, needs-human-review flag, and coverage status for the original query.

## Reranking Rules

Use LLM reranking when genuine ambiguity warrants it, constrained by source evidence and a task-appropriate budget.

- Give the reranker the original query, resolved entity label, aliases, candidate names/ids/URLs, provenance, identity evidence, utility evidence, and ambiguity warnings.
- Instruct it to choose identity before utility. It must not pick an image-rich or popular candidate if identity evidence is weak.
- For plausibly same-identity candidates, let utility decide. Public stage-name or brand-name records can be better than legal-name records if they have stronger task-relevant evidence.
- Treat one-token aliases as ambiguous unless supported by context, exact id/slug, richer alias overlap, or strong external evidence.
- Avoid hard accept rules. A direct alias hit is a signal, not proof.
- Avoid hard reject rules. Romanized, rebranded, sparse, or stage-name records can look incomplete but still be correct.
- If an equally well-supported candidate has substantially better task utility, expose it or perform one justified additional comparison rather than silently overriding identity evidence.
- Log or display the reason for the selected candidate and keep alternates visible.

## Failure Modes

Use these as review checks when a resolver "mostly works" but feels wrong.

- Exact database search can miss real records. Probe exact slugs, direct URLs, ids, or alternate endpoints when available.
- Short names create false positives. `Lisa`, `Rose`, `Sunny`, `Tiffany`, `Yuri`, and similar one-token names need contextual searches and ambiguity warnings.
- Legal names can be worse utility records. Public/stage names or brand names may have the fuller profile, more images, or more current metadata.
- Utility signals are powerful but unsafe alone. Counts, votes, views, and popularity should break ties only after identity plausibility.
- Composite aliases are useful context but often poor literal search strings. Split them into aliases while preserving the group identity.
- Hard direct-accept logic is brittle. It can grab a generic duplicate just because one alias matched.
- Hard identity gates are brittle. They can hide correct records when names are sparse, translated, romanized, rebranded, or stage-name-only.
- Coverage count is not correctness. Finding 6 of 6 entities is not success if one selected record is the wrong person or organization.
- Global query de-duping can starve later entities. Common aliases should be tracked per entity group.
- Source flakiness is part of the result. Timeouts, 403s, 404s, retries, and partial data should be surfaced in provenance or debug logs.
- Rerankers cannot fix missing candidates. If a target branch has zero candidates, insert retrieval planning or repair before reranking instead of expecting the reranker to infer a hidden record.
- Instruction text can poison literal search. Strip task phrases from the lookup query while preserving them as context for expansion and reranking.
- Fast direct results can suppress needed expansion. If a query asks for grouping, inclusion, full profiles, or contains mostly short names, expansion should run even when direct search returns candidates.
- Parallel branch completion order can create nondeterministic winners. Branches need local state and deterministic parent-level merging.
- Hidden retries, timeouts, and cancellations make a resolver feel random. Expose them as structural stages and provenance.

## Output Pattern

For each requested entity, prefer an output shape with these concepts:

- Resolved entity label and aliases.
- Selected candidate with stable id/slug/URL.
- Selection reason and confidence or review status.
- Top alternates with enough evidence to compare.
- Coverage state: matched, ambiguous, no plausible match, no usable data, or needs review.
- Provenance: searched queries, source endpoints, retry/recovery attempts, and failure notes.
- Retrieval repair details when a recovery pass was actually required.

For user-facing tools, make manual correction easy. Good controls include `choose this candidate`, `search only this candidate`, `copy id/slug`, `show evidence`, and `mark unresolved`.

Stop when every requested entity has either a reliable match or an explicit unresolved disposition. Validate common-name collisions, rich wrong records, sparse correct records, source conflicts, and direct-ID recovery when those risks are relevant to the change.
