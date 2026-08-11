---
name: smart-entity-resolution
description: Design, debug, or review named-entity search and resolution for people or organizations in messy data with aliases, duplicates, sparse records, common names, candidate reranking, or misleading search results. Load for entity matching; not for ordinary exact lookup.
---

# Smart Entity Resolution

Treat resolution as a transparent investigation, not one string query. Keep
coverage, identity, and task utility separate:

- **Coverage:** did every requested hint receive a result or an explicit
  unresolved/ambiguous outcome?
- **Identity:** does the candidate represent the requested person or
  organization?
- **Utility:** is it the most usable record for the task after identity is
  plausible?

## Retrieval and resolution

1. Preserve the original instruction as context, but extract entity hints before
   searching. Classify single entities, lists, and group/cast/team/org requests;
   partial or mostly one-token names require expansion.
2. Group aliases per entity (stage/legal name, romanization, slug, or known
   context). Search several aliases, cleaned variants, exact IDs/slugs, and
   contextual queries per group. Do not let global query deduplication starve a
   later common alias.
3. If a branch has no candidates or only weak/common-name matches, use a bounded
   retrieval-repair step to propose direct IDs, URLs, slugs, aliases, or focused
   probes. A planner proposes retrieval probes; it does not select the answer.
4. Merge by stable record identity while preserving every useful query/source.
   Enrich candidates with identity, provenance, ambiguity, and task-utility
   evidence before reranking. Names alone are insufficient.
5. Rerank with a hard budget (normally no more than three loops). Identity wins
   over popularity, profile richness, image count, or other utility signals.
   Use utility only among plausibly same-identity candidates. Avoid brittle
   hard-accept and hard-reject rules for sparse, translated, rebranded, or
   stage-name records.
6. Return the selected candidate, reason, confidence/review state, and useful
   runner-ups. Allow `ambiguous`, `needs review`, `no plausible match`, and
   `no usable data` as first-class outcomes; never fill a false positive just to
   satisfy a count.

## Evidence and provenance

Record, in a privacy-appropriate form, which searches and sources found each
candidate, stable IDs/URLs, aliases and conflicting names, contextual identity
evidence, utility signals, retries, failures, and repair probes. Sanitize logs
and avoid raw private text unless the view is intentionally local-only.

For independent entity groups, use bounded concurrency and isolated branch
state. Merge results deterministically in input order or by an explicit ranking
rule. Make retries, timeouts, cancellations, partial source failures, and
fallback paths visible in the final summary instead of making the result appear
randomly successful.

## Review checklist

- Every requested entity is resolved, ambiguous, or explicitly unresolved.
- Instruction text is not sent as a literal search query.
- Aliases remain grouped, common names receive context, and exact ID/slug
  recovery is attempted when appropriate.
- Retrieval repair happens before reranking when candidates are missing.
- The reranker sees provenance, identity evidence, ambiguity, and utility—not
  names alone—and cannot silently choose a rich but wrong record.
- Selected records and alternates are visible and manually overridable.
- Coverage, identity, and utility are reported separately.
- Tests cover common-name false positives, sparse correct records, rich wrong
  records, duplicates, search misses, direct-ID recovery, cancellation, retries,
  and deterministic fanout merging.
