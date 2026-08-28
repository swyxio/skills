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
| Review | Source and rendered-browser evidence tied to the revisions inspected; code-testing evidence only when explicitly requested. User approval and publication remain distinct. |

Takeaways, thesis images, code, equations and interactive visuals are optional. A resource section is useful when it adds actionable references, not because the schema demands filler.

Private records can contain exact quotations to verify, metric/task/condition checks, research notes and suspected transcription issues. For an ASR lead, retain the exact excerpt, segment/time, proposed reading, basis and audio-verification status. A context-based suspicion must not become a corrected source transcript.

## Validation

Default to light validation, not software certification. For new articles, use one grounding/coverage pass plus checks needed to display the article safely and readably; patches use the affected-only scope in `SKILL.md`. Each category below is not a separate reviewer or model request. Stricter snippet checks require an explicit user request, not a model-generated claim that its code is runnable.

- **Contract/privacy:** reject malformed output, unknown IDs, lost/duplicate blocks, unsafe links, private-field leakage, unresolved markers and clipped sentences. Resolve contradictory prompt/schema requirements before generation.
- **Source/content:** check quotes, identities, metrics, chronology and full-source coverage, including the ending. Count explanations carried by adjacent code/media; do not demand duplicate prose or invent citations to appease a reviewer.
- **Code/math:** code is illustrative content, not executable output. Check legible fencing, highlighting and layout; do not gate on syntax, types, imports, API accuracy, execution or standalone correctness. Ordinary snippet issues are nonblocking editorial suggestions, not repair calls. Grounding still applies to claims about what the speaker said or demonstrated; do not present constructed teaching details as their exact code. Render equations legibly without adding a symbolic-proof gate. Never execute snippets unless the user explicitly requests that scope.
- **Media:** verify source identity, the frame's own exact capture/segment binding, visible content and decoding. A slide may appear before or remain after its spoken explanation; adjacent prose citations are not a hard frame-placement interval. Review relevance from the visible content and explanation, without fabricating citations or shifting capture times to satisfy a range check.
- Isolate optional-media failures: exclude and record an unusable frame while keeping valid frames and letting the article proceed. Do not turn one rejected caption into a whole-article retry; missing media remains absence, not a fabricated substitute. Source identity and artifact-integrity failures still require diagnosis.
- **Browser:** apply the pilot/batch/patch scope in `SKILL.md` and [visual-review.md](visual-review.md). Automated checks and sample inspection do not establish individual visual review of every page.

Keep all source-linked timestamps within the original video's absolute clock. Escape/sanitize untrusted Markdown and generated HTML; do not permit generated code blocks or links to become executable browser content.

Keep validators small and scoped to the outer article contract. Parse content by its role: literal code, nested arrays, generics, example URLs and environment-variable references are not active HTML, private markers or actual secrets merely because they resemble them. Match reserved markers and genuinely sensitive values narrowly. When a gate rejects readable illustrative content, lighten or remove that gate instead of rewriting the content. Report the affected field and rule; verify a shared-gate change on a small representative retained sample, not a new whole-corpus proof exercise.

Distinguish actual private data from its absence: reserved example-domain addresses in snippets and intentional redaction are not leaks. A source-review check may assess whether a masked detail leaves the explanation useful; it must not demand restoring the identifying value or rewriting coherent illustrative code merely to remove the mask.

## Resumability

Key generation checkpoints by source identity/checksums, corrections, prompt/schema versions, exact requested model and reasoning settings. Record an independently observed model only when supplied; `observedModel: null` means unavailable. Keep usage, elapsed time and known failures distinct from actual dollar billing.

Persist completed stages and raw responses atomically. An editorial repair needs its base, change/reason and resulting revision, not a new framework or model call. Keep source/content evidence and renderer checks separable; reuse unaffected proof. Recheck a CSS repair visually, a factual edit against its source, and a changed shared example across prose/code/visuals. A corrected label need not reopen full-article review. Do not silently relabel old output or apply repairs to a different base.

A cached result must match its effective inputs; final acceptance must use current relevant evidence. Do not repeatedly replay all prior articles' proofs at every stage or add independent approvals without a concrete integrity risk or user requirement. Record optional improvements separately and let unaffected work proceed.

Skill prose, model prompts and executable checks are different layers. When applying changed guidance, reconcile the affected prompt and check at the next safe boundary; editing this skill alone does not update frozen run inputs. Preserve completed work and leave a live owner's imported code untouched.

Start with a bounded sample, preserve successful partial results, and distinguish editor-assisted trials from unattended generation. Report the authorized batch's actual coverage and unresolved items. Local composition, upload and publication are separate operations; immutable published content and its mutable pointer must not be confused with a local preview.
