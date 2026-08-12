# Output formats and prompt catalog

Read this reference when the user requests publishing copy, a content package,
or a format whose requirements need more detail than the main skill provides.
For a plain summary, use the main skill without loading this catalog.

The exact executable templates live in
[`../playground/src/prompts.ts`](../playground/src/prompts.ts). Treat that file as
the source of truth for the playground and edit it when changing a template;
do not maintain a second verbatim prompt catalog here.

## Available formats

| ID | Output | Default shape |
|---|---|---|
| `executive_summary` | Executive summary | 1–3 paragraphs led by the main takeaway |
| `bullet_points` | Key takeaways | 8–12 standalone factual bullets |
| `timestamps` | Timestamped sections | Detailed table of contents using source timestamps |
| `youtube_chapters` | YouTube chapters | Compact chapter markers beginning at `0:00` when required |
| `youtube_description` | YouTube description | Hook, summary, topics, and identifiable speakers |
| `youtube_tags` | YouTube tags | Ordered mix of broad and specific search terms |
| `tweet_single` | Single post for X/Twitter | Three short angles that each fit the platform limit |
| `twitter_thread` | X/Twitter thread | A short hook-led sequence with one point per post |
| `linkedin_post` | LinkedIn post | Concise professional post with a clear opening |
| `title_options` | Title options | Varied descriptive, curiosity, quote, and search-led options |
| `thumbnail_prompts` | Thumbnail concepts | Distinct visual concepts plus short overlay copy |
| `blog_outline` | Blog outline | Title, deck, introduction, sections, conclusion, and metadata |
| `pull_quotes` | Pull quotes | Short source-verified excerpts with speaker and context |
| `logline` | Logline | Several one-sentence angles, each under 30 words by default |
| `newsletter_blurb` | Newsletter blurb | Short conversational recommendation and reader value |
| `show_notes` | Show notes | Summary, topics, quotes, people, resources, and timestamps |
| `all_in_one` | Content package | A coordinated subset of summary and promotional outputs |

These are defaults, not universal requirements. Follow the user's requested
length, voice, channel, and number of variants. Platform conventions and limits
can change; verify them when compliance matters.

## Choosing calls

Generate a small group of closely related outputs in one final call when the
source fits comfortably and consistency matters. Use separate calls when:

- the requested package is likely to exceed the output budget;
- one output must be exact and another is creative;
- formats require substantially different voices or audiences; or
- a weak result should be retried without regenerating the whole package.

For map/reduce inputs, map once into evidence-bearing notes that retain facts
needed by every requested format. Then produce each final format from the
ordered notes. Do not map the source independently seventeen times.

## Format-specific evidence rules

- **Chapters and timestamps:** use only timestamps present in or reliably
  aligned to the source. Put boundaries at real topic transitions and preserve
  chronological order.
- **Descriptions, titles, tags, and social posts:** promotional phrasing may be
  new, but every factual claim must remain supported by the source.
- **Pull quotes:** copy exact wording and verify it against the source. If exact
  wording is unavailable, label the result as a paraphrase rather than placing
  it in quotation marks.
- **People and resources:** include only identifiable names and referenced
  resources. Never infer a URL, handle, affiliation, or biography.
- **Thumbnail concepts:** distinguish facts in the source from proposed visual
  metaphor. Do not portray a real person doing something the source does not
  support.
- **All-in-one packages:** omit irrelevant sections and split the generation if
  truncation would make the package unreliable.

## Focus wrapper

Apply the same focus during mapping and final generation:

```text
FOCUS: {what the user wants emphasized}

Preserve important context outside this focus when omitting it would distort
the source. Do not introduce external facts to make the focus look stronger.
```

When no focus is supplied, keep the result balanced. A requested format changes
the presentation, not the evidence standard.
