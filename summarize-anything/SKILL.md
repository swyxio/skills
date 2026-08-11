---
name: summarize-anything
description: Summarize a supplied long document, transcript, article, codebase excerpt, or other plaintext input, including a requested focus or output format. Use for condensation, chapters, titles, descriptions, outlines, or pull quotes from source material; do not trigger for transcription or unsupported factual research.
license: MIT
compatibility: Requires an available local or hosted LLM backend. Keep credentials in environment variables or a secret manager.
metadata:
  author: swyxio
  version: "1.0"
  last-updated: "2026-03-28"
  primary-tools: curl, jq, or the user's existing LLM client
---

# Summarize Anything

Produce a source-grounded condensation of the supplied material. Ask for or
infer the desired audience, focus, length, and format, but do not turn a
summary into independent research. Preserve important facts, names, numbers,
timestamps, uncertainty, and the source's chronology or argument.

## Choose the strategy

1. Read enough of the source to estimate size and structure. Use a direct call
   when the input fits comfortably in the selected model's context.
2. For larger input, split on paragraph/section boundaries with a small overlap;
   map each chunk into factual notes, then reduce those notes in order. Repeat
   only while the combined notes still exceed the context budget.
3. Select a backend already available to the user. Verify current model IDs,
   context limits, token parameters, and endpoint shape at action time. Do not
   install every provider or rely on a stale cost table.

## Map/reduce contract

Map prompts should preserve:

- claims and qualifiers, names, dates, numbers, quotes, and timestamps;
- the section's role in the larger argument or narrative; and
- facts needed by the requested final format.

Reduce prompts should synthesize rather than concatenate, remove overlap, keep
the source order where it matters, and label contradictions or missing context.
Do not let a chunk boundary turn a repeated claim into two separate facts.

A compact shell shape is enough when a client is unavailable:

```bash
WORDS=$(wc -w < input.txt | tr -d ' ')
# Choose direct or map/reduce from the source size and the selected model's
# verified context limit. Send the source and prompts through the existing
# provider client; never interpolate secrets into logs or committed scripts.
```

## Output contract

Honor the requested format rather than loading a fixed catalog. Common outputs
include an executive summary, key takeaways, transcript chapters, a description,
title options, a blog outline, a newsletter blurb, a thread, or pull quotes.

- Mark generated copy as based on the supplied source.
- Do not fabricate links, quotes, speakers, timestamps, metrics, or conclusions.
- Keep exact quotations short and verify them against the source.
- For timestamps, use source timestamps and place chapters at real topic
  transitions; the first chapter is `0:00` only when the target platform
  requires it.
- For titles/social/thumbnail copy, preserve the source's claims and avoid
  clickbait that the material cannot support.
- If the source is too incomplete, say what cannot be established.

## Focus and validation

Apply a user-supplied focus directive to every map and reduce prompt without
silently dropping material outside that focus. When no focus is given, produce
a balanced result.

Before delivery, compare names, numbers, chronology, and quoted language in the
result with the source. If the output is truncated, reduce the requested scope,
increase the verified output budget, or make separate calls; do not invent a
missing ending. If a long summary is incoherent, increase chunk size/overlap or
use a stronger available backend and report the tradeoff.
