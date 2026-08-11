# Recursive map/reduce implementation

Read this reference when the source does not fit comfortably in one verified
model context, when a direct summary loses sections, or when implementing a
repeatable large-document pipeline.

## Plan from the real budget

Measure the source and obtain the selected model's current tokenizer/context
information when available. A rough fallback is useful for routing, not billing
or hard admission control:

```bash
words=$(wc -w < input.txt | tr -d ' ')
rough_tokens=$((words * 4 / 3))
printf 'words=%s rough_tokens=%s\n' "$words" "$rough_tokens"
```

Use a direct call only when source plus instructions, focus, metadata, and
expected output fit with comfortable headroom. Otherwise map/reduce. If the
combined map notes still do not fit, recursively map/reduce the notes.

## Chunking contract

- Split on document structure—headings, paragraphs, transcript turns, or code
  units—before using a raw token boundary.
- Give every chunk a stable index and source range.
- Use a small overlap only when context can genuinely cross the boundary.
- Preserve source timestamps, headings, speaker labels, page numbers, and line
  ranges as metadata rather than flattening them away.
- Never split a quotation, table row group, code block, or speaker turn when a
  nearby safe boundary exists.
- Record a manifest so failed chunks can be resumed and merged deterministically.

Illustrative paragraph-aware splitter:

```python
from pathlib import Path
import re

text = Path("input.txt").read_text()
paragraphs = re.split(r"\n\s*\n", text)
target_words = 20_000
overlap_words = 1_000
chunks, current, current_words = [], [], 0

for paragraph in paragraphs:
    size = len(paragraph.split())
    if current and current_words + size > target_words:
        chunks.append("\n\n".join(current))
        overlap, count = [], 0
        for prior in reversed(current):
            prior_size = len(prior.split())
            if count + prior_size > overlap_words:
                break
            overlap.insert(0, prior)
            count += prior_size
        current, current_words = overlap, count
    current.append(paragraph)
    current_words += size

if current:
    chunks.append("\n\n".join(current))

out = Path("chunks")
out.mkdir(exist_ok=True)
for index, chunk in enumerate(chunks):
    (out / f"chunk_{index:04d}.txt").write_text(chunk)
```

Tune target size to the selected model and output requirement; the numbers are
examples, not universal thresholds.

## Map phase

The map output is evidence-bearing notes for the final format, not a generic
mini-summary. Include the user's focus in every map request.

```text
Summarize this source section for a later whole-document synthesis.

Preserve:
- claims and qualifiers;
- names, dates, numbers, short exact quotes, and timestamps;
- the section's role in the larger argument or narrative;
- contradictions, uncertainty, and unresolved questions; and
- facts needed for the requested final output.

Return the source chunk ID and do not add external knowledge.
FOCUS: {user focus, if supplied}
```

Persist each map result separately with provider, model, prompt version, chunk
hash/range, duration, and terminal status. Use bounded concurrency. Retrying one
transient failure must not discard successful chunks.

## Reduce phase

Merge notes in source order. The reduce prompt should synthesize, not append:

```text
Produce the requested final output from ordered source-section notes.

- Remove duplication caused by overlap.
- Preserve chronology or argument structure where it matters.
- Reconcile repeated claims without counting them twice.
- Surface contradictions and missing context instead of smoothing them away.
- Preserve supported names, dates, numbers, quotes, and timestamps.
- Use no facts that are absent from the notes.
- Apply the same focus used during mapping.
```

If ordered notes exceed the real reduce budget, group adjacent notes and run an
intermediate reduce with the same evidence contract. Repeat until the final
reduce fits. Do not combine branches in completion order.

## Multiple output formats

One final call can generate a small related package efficiently. Separate calls
usually produce better results when formats have conflicting voice, length, or
evidence needs—for example, exact pull quotes versus promotional social copy.
Read [output-formats.md](output-formats.md) and the exact prompt source only for
the requested formats.

## Validation

Before delivery:

- compare selected names, dates, numbers, and quotations with source passages;
- verify timestamp/chapter order and source range;
- ensure every source chunk has a successful or explicitly failed outcome;
- inspect boundary regions for omitted or duplicated claims;
- distinguish absent source material from model uncertainty; and
- retain map artifacts when auditability or recovery matters.
