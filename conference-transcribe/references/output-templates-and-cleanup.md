# Transcript output templates and cleanup

Read this reference when writing raw or cleaned talk files or configuring the
optional LLM editing pass. The raw transcript remains the evidence-bearing
artifact; cleanup must never become the only retained version.

## Raw transcript template

```markdown
# Speaker Name: Talk Title

- Source: https://example.test/watch?v=ID&t=1465s
- Source range: 00:24:25–00:42:39
- Duration: 00:18:14
- Transcript source: source auto-captions (`en`)
- Boundary source: chapter metadata
- Processing notes: overlapping rolling captions deduplicated exactly

## Timestamped Transcript

[00:24:26 | +00:00:01] Good morning everyone…

[00:24:54 | +00:00:29] The next passage begins here…
```

If speaker identity is not established, use `Unknown speaker` or a neutral
label. Do not convert diarization labels into real names without evidence.

## Cleaned transcript template

```markdown
# Talk Title

**Speaker:** Speaker Name — Role, Company
**Event:** Event name and date
**Source:** Source URL, 00:24:25–00:42:39
**Transcript basis:** Source captions; model-cleaned for readability

## Key Points

- Four to eight source-supported takeaways when requested.

## Timestamped Reading Transcript

[00:24:26 | +00:00:01] Cleaned paragraph that preserves the speaker's meaning.
```

Key points are optional. Do not force them into a verbatim/legal transcript or
when the user requested transcript text only.

## Cleanup prompt

```text
Edit the supplied raw conference transcript for readability while preserving
its meaning and evidence.

Requirements:
- Keep timestamps in [HH:MM:SS | +HH:MM:SS] form at the requested interval and
  at meaningful transitions.
- Preserve claims, qualifiers, examples, uncertainty, and chronology.
- Correct obvious proper nouns or technical terms only when supported by the
  talk title, source metadata, slides, glossary, or user-provided evidence.
- Add paragraph breaks at natural topic transitions.
- Remove obvious caption artifacts and non-semantic fillers only when doing so
  does not alter emphasis or voice.
- Preserve meaningful repetitions, false starts, corrections, and audience
  interaction.
- For established multiple speakers, use [Speaker Name]: labels. Otherwise use
  neutral diarization labels without inventing identities.
- Do not add external facts, links, quotations, or conclusions.
- Return only the requested Markdown sections.

Optional output sections:
1. Title and source metadata
2. Four to eight source-supported key points
3. Timestamped reading transcript
```

Apply event-specific spelling guidance as a separate glossary, not by changing
the generic prompt.

## Cleanup validation

Before accepting a cleaned file:

- compare names, numbers, technical terms, and quotations with raw captions or
  ASR segments;
- verify timestamps are ordered and remain inside the talk range;
- ensure no section or argument disappeared;
- search for unsupported role/company assignments;
- confirm model-generated key points are supported by transcript passages; and
- retain the raw file and model/backend metadata.

## Talk manifest report template

```markdown
# Conference Transcript Manifest

| # | Talk | Speaker | Source range | Duration | Raw source | Cleaned | Notes |
|---:|---|---|---|---:|---|---|---|
| 1 | Talk title | Speaker | 00:24:25–00:42:39 | 18:14 | captions | yes | — |
```

Use the report to expose missing boundaries, failed talks, inferred speaker
names, or source gaps rather than hiding them inside individual files.

## Directory shape

```text
talks.json
reports/talk-manifest.md
transcripts/raw/<talk-slug>.md
transcripts/asr/<talk-slug>.json       # when hosted/local ASR was used
transcripts/cleaned/<talk-slug>.md     # only when cleanup was requested
clips/<talk-slug>.*                    # optional
```

Do not create empty `cleaned/` or `clips/` artifacts merely to satisfy the
template. The manifest should distinguish skipped, pending, failed, and
complete stages.
