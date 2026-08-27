# Output contract and validation

Adapt to the host's existing schema. Do not introduce a new format merely to match this reference, or constrain every genre to the same number of sections and paragraphs.

## Public article and private evidence

Keep the reader payload small; retain detailed grounding and review records separately.

| Concern | Contract |
| --- | --- |
| Source identity | Immutable video/transcript identity, duration and offsets; authoritative speaker names. |
| Article | Complete title/standfirst and ordered sections containing prose, lists, quotations, code or equations as appropriate. |
| Reading order | Explicit placement of media between text blocks; every retained text block appears once and ordered lists continue correctly across interspersed media. |
| Evidence | Exact source segment indices and intervals for claims and blocks; display only useful timestamp links. External additions retain their verified reference separately. |
| Frames | Actual source video, capture time, asset identity, truthful dimensions, inspected caption and alt text. Missing media is absence, not a placeholder. |
| References | Verified URL/identity, meaningful label and relevance; distinguish mentioned work from later related reading and current APIs from historical ones. |
| Shared examples | Private source facts, constructed teaching details, concrete objects, expected transitions and invariants tying prose, code and visuals together. |
| Review | Separate source, code and rendered-browser evidence tied to the exact revisions inspected; user approval and publication remain distinct. |

Takeaways, thesis images, code, equations and interactive visuals are optional. A resource section is useful when it adds actionable references, not because the schema demands filler.

Private records can contain exact quotations to verify, metric/task/condition checks, research notes and suspected transcription issues. For an ASR lead, retain the exact excerpt, segment/time, proposed reading, basis and audio-verification status. A context-based suspicion must not become a corrected source transcript.

## Validation

1. **Contract and privacy:** reject malformed output, unknown IDs, dropped/duplicated blocks, unsafe links, leaked private fields, unresolved citation markers and clipped sentences. Check the prompt and schema for contradictory requirements before generation. Passing a character limit is not proof that a standfirst ends properly.
2. **Grounding and progression:** validate exact quotes, named methods, metrics and source intervals. Review chronology within the actual prose; sorted markers cannot make a backward-jumping paragraph chronological. Do not move evidence timestamps to disguise a source/order mismatch.
3. **Code and equations:** keep provenance independent from verification. A reconstructed example may be runnable, and an exact historical listing may be incomplete. Record which snippet/revision was syntax-checked, type-checked or executed, with environment and observed result. Syntax highlighting is not verification. Run unfamiliar generated code only after inspection, in a suitably isolated environment without unintended credentials or external side effects. Confirm rendered LaTeX parses and retains the intended mathematics.
4. **Media and examples:** a frame may occur anywhere inside the cited interval; it need not be near the segment start. Do not treat the span between disjoint citations as evidence for a frame in the gap. Verify video identity, offsets, asset decoding, caption and example consistency. Frame scores and timestamps alone do not prove the image's content.
5. **Assembled review:** assess the full article with actual visual implementation, helpers and state data. Coverage claims must point to concrete blocks or adjacent media that carry the explanation. Avoid forcing the prose to duplicate a complete visual. Reviewers should identify the smallest unsupported claim, missing dependency or faulty presentation, not insist on obsolete draft layouts.
6. **Rendered review:** inspect desktop/mobile initial and changed states, code/formula rendering, images, errors, overflow and affected player behavior. Use [visual-review.md](visual-review.md). Record what was observed and what remains untested; do not mark a sample accepted based only on model review or source code.

Keep all source-linked timestamps within the original video's absolute clock. Escape/sanitize untrusted Markdown and generated HTML; do not permit generated code blocks or links to become executable browser content.

## Resumability

Key generation checkpoints by source identity/checksums, corrections, prompt/schema versions, exact requested model and reasoning settings. Record an independently observed model only when supplied; `observedModel: null` means unavailable. Keep usage, elapsed time and known failures distinct from actual dollar billing.

Persist completed stages and raw responses atomically. Keep editorial repairs separately bound to the exact base response, with reasons and the resulting revision. Feed accepted repairs and actual implementation back into review; never silently relabel old output as newly generated by an updated prompt.

Invalidate only affected dependencies. A CSS readability repair requires renewed visual review, not automatically a full article rewrite; a changed source example can invalidate prose, code and visuals together. Retain accepted earlier entries and comparison snapshots. Fail closed on stale/mismatched reviews instead of applying a repair to a different base response.

Start with a bounded sample, preserve successful partial results, and distinguish editor-assisted trials from unattended generation. Report the authorized batch's actual coverage and unresolved items. Local composition, upload and publication are separate operations; immutable published content and its mutable pointer must not be confused with a local preview.
