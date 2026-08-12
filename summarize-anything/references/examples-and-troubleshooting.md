# Examples and troubleshooting

Read this reference when implementing a repeatable workflow, choosing among
direct and recursive strategies in a concrete case, or diagnosing a failed or
low-quality result. Do not load it for a routine summary that already works.

## Example: transcript to video description and chapters

1. Confirm that the transcript contains usable timestamps and identify the
   audience and desired emphasis.
2. If it fits comfortably in the verified context, make one direct call for
   the description and chapters. Otherwise map chunks into ordered notes that
   retain timestamps, topic transitions, speakers, names, and claims.
3. Generate both outputs together if the output budget is ample; otherwise use
   separate final calls over the same evidence notes.
4. Check that chapters are ordered, represent real transitions, and use only
   source-backed timestamps. Check every factual phrase in the description.

The exact starting templates are in
[`../playground/src/prompts.ts`](../playground/src/prompts.ts). Adapt their
length and voice to the user's channel instead of treating defaults as policy.

## Example: very large report collection

1. Inventory files, order them deterministically, and preserve document names,
   headings, dates, and page or section ranges.
2. Chunk at document and section boundaries. Persist a manifest and one map
   result per chunk so interrupted work can resume.
3. Map each chunk into factual notes tailored to the requested final output.
   A fast or local backend may be suitable for this stage if spot checks show
   that it preserves details reliably.
4. Group adjacent notes for intermediate reduction until the evidence fits the
   final context. Use the strongest approved backend where synthesis quality is
   most valuable.
5. Audit names, numbers, chronology, contradictions, and chunk coverage against
   the source before delivery.

Read [map-reduce.md](map-reduce.md) for the detailed pipeline and
[backends.md](backends.md) only if backend setup or selection is also needed.

## Example: podcast content package

For a transcript with timestamps, a useful sequence is:

1. map into speaker-aware notes with quotable exact passages and timestamps;
2. reduce into a neutral episode summary and key-topic outline;
3. create show notes, title options, and promotional copy from the same notes;
4. generate pull quotes in a separate exactness-focused pass; and
5. verify every quote, speaker attribution, resource mention, and timestamp.

Separating exact quotation extraction from creative promotional copy prevents
style instructions from weakening the evidence standard.

## Troubleshooting

### Output stops partway through

- Confirm the provider's current output-token parameter and actual limit.
- Request fewer formats, shorten each format, or generate them separately.
- For a direct summary, reduce source scope or switch to map/reduce so the final
  call has enough output headroom.
- Continue only from structured completed sections; never invent the missing
  ending or silently present a truncated package as complete.

### Long result is repetitive or incoherent

- Check for duplicated overlap and merge repeated claims by source identity.
- Preserve source order during reduce rather than combining chunks in the order
  requests happened to finish.
- Increase semantically useful chunk size or overlap around section boundaries.
- Make map outputs evidence notes rather than polished mini-essays.
- Use hierarchical reduction when the combined notes are still too large.

### Facts, quotes, or timestamps are wrong

- Lower creative freedom for extraction and synthesis stages.
- Require chunk IDs or source ranges in map outputs.
- Verify quotations by exact search and label paraphrases explicitly.
- Use only source timestamps; if none exist, return untimed sections unless the
  user separately authorizes timestamp reconstruction from media.
- Sample weak map outputs before blaming the final reduce step.

### The result ignores the requested focus

- Put the focus in every map and reduce request, not just the final call.
- Ask maps to retain focus-relevant evidence as well as context needed to avoid
  distortion.
- Define ambiguous focus terms with the user when materially different
  interpretations would change the result.

### A local backend is too slow or runs out of memory

- Use smaller chunks and bounded concurrency; excessive parallelism can make a
  local model slower or unstable.
- Choose a smaller capable installed model after a quality spot check.
- Keep mapping local and use an approved hosted backend only for the compact
  final reduce when privacy constraints allow it.
- Resume from persisted map artifacts instead of restarting the entire job.

### A hosted request fails

- Authentication or unknown model errors: verify account, endpoint, and current
  model availability without printing secrets.
- Context errors: measure the complete request, reserve output space, and route
  to map/reduce or a verified larger context.
- Rate limits: honor retry guidance, cap retries, and preserve completed chunks.
- Rejected parameters: compare the request with the provider's native schema;
  OpenAI-compatible endpoints do not support every field identically.

Read [backends.md](backends.md) for adapter examples and provider documentation.
