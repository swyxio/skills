---
name: ai-devblog
description: Turn completed coding, debugging, research, migration, or deployment work into a dated technical devblog. Use when an agent should offer blog angles, write or revise an evidence-backed MDX post, add purposeful diagrams or interactive demonstrations, cite exact technical receipts, preview the result, and publish it publicly or internally.
---

# AI Devblog

Write the technical account that only the agent who did the work could write.
Capture what changed, why it mattered, the evidence behind the conclusion, and
what remains uncertain. Prefer a concise, useful field report over a polished
but generic content-marketing article.

## Entry contract

- Use this skill after technical work produced inspectable artifacts: code,
  diffs, commits, logs, traces, benchmarks, screenshots, tests, deployments, or
  operational receipts.
- Do not invent a post from memory or plans alone. Inspect the current evidence.
- Unless the user already chose an angle or explicitly asks to write
  immediately, first offer 2-4 possible directions. For each, give:
  - a bottom-line title;
  - the primary reader and question;
  - the evidence available;
  - the strongest useful illustration;
  - any important caveat.
- Wait for the user's choice or approval before drafting. If the user says to
  proceed autonomously, choose the clearest evidence-backed angle.

## Choose visibility

Respect an explicit visibility choice:

- **Public**: suitable for the open web, with durable public links and all
  sensitive information removed.
- **Internal**: employees-only detail may include private architecture and
  operational context, but never secrets, credentials, raw personal data, or
  unnecessary customer content.

Default to **public** when visibility is unspecified. Record visibility in
front matter when the site's schema supports it. Never publish internal
material to a public target merely because public is the default.

## Establish the evidence boundary

Before writing:

1. Inspect the relevant source, diff, issue, transcript, experiment, or incident.
2. Identify exact versions: commit SHA, package/model/runtime version, dataset,
   configuration, date range, and environment where material.
3. Re-run or read the most relevant tests and measurements when reasonably
   cheap. Do not convert stale or unavailable evidence into a current claim.
4. Separate these boundaries explicitly:
   - local source changed;
   - committed;
   - pushed or merged;
   - deployed or migrated;
   - verified on the live user-facing surface.
5. Preserve failed attempts, reversals, and uncertainty when they explain the
   final design. Do not edit the causal history into a clean fictional path.

Link claims to primary evidence whenever possible. Prefer exact-SHA source
links, official documentation, original issues or papers, test output,
deployment receipts, and public URLs over secondary summaries. Use inline
links where they read naturally; use footnotes or a references section for
supporting material. Keep quotations short.

## Write the title and front matter

Start every title with a straightforward 2-8 word summary that puts the bottom
line up front and names the main technical achievement. Optionally follow it
with a subtitle that adds the learning, opinion, or hook.

Good shapes:

- `Cut Build Time in Half — Why the Cache Wasn't the Bottleneck`
- `Repo-Scoped Agents Are Live`
- `We Replaced Polling with Durable Events`

Avoid vague titles such as `Some Thoughts on Agents` or hooks that conceal the
actual result.

Adapt to the destination's established front-matter schema. When the site has
no convention yet, prefer:

```yaml
title: "Short result — optional hook"
description: "One concrete sentence about the result and why it matters."
date: "YYYY-MM-DD"
tags: ["specific-topic", "system-or-tool"]
visibility: "public"
```

Use a real publication date. Choose a few specific, reusable tags rather than
an exhaustive keyword list.

## Shape the article

Use MDX when the destination supports it; otherwise use the site's native
human-editable format. Discover and reuse the site's content directories,
layouts, components, typography, metadata, citation style, and build pipeline.
Do not force a new blog framework into an established site.

Open with a two-part BLUF:

1. what changed or was learned;
2. the most important evidence or consequence.

Then adapt the structure to the story. A substantial devblog usually needs:

- the problem and why it mattered;
- the prior design or failed assumption;
- the key mechanism or decision;
- evidence that supports the result;
- alternatives considered and why they lost;
- limitations, unresolved questions, and the next test.

Keep implementation inventories, long logs, and exhaustive methods behind a
details block, appendix, linked receipt, or sidebar. Use asides for caveats,
definitions, operator notes, and surprising secondary observations without
breaking the main narrative.

Prefer small exact code excerpts over large dumps. Explain why each excerpt is
present. Link to the exact source revision when readers need the full context.
When reproducibility is part of the value, give readers the minimum
prerequisites, commands, expected result, and safe cleanup needed to follow
along. Do not turn every devblog into a start-to-finish tutorial.

## Illustrate the reasoning

Use frequent purposeful visuals because the agent can produce them from the
underlying artifacts. A substantial article should normally contain 2-4 visual
beats; a short release note may need only one. Every visual must explain a
relationship that prose alone would make slower to understand.

Choose the smallest useful form:

- diagram for architecture, authority, or data flow;
- timeline for an incident, migration, or changing state;
- table for exact mappings or alternatives;
- chart for measured comparisons with units and sample boundaries;
- annotated screenshot for user-visible or operational proof;
- code diff for a small decisive implementation change;
- interactive demo, calculator, explorer, or stepper when readers benefit from
  changing inputs or walking a causal sequence.

For interactive MDX:

- reuse existing components before creating new ones;
- keep data and logic in feature-owned, reusable components;
- make the central claim visible without interaction;
- provide a static or textual fallback;
- support keyboard and touch use, reduced motion, and narrow screens;
- avoid client-side weight that is disproportionate to the lesson.

Every figure needs a concise caption, units or provenance where applicable,
and meaningful alt text or an adjacent textual equivalent. Do not use a chart,
diagram, screenshot, or decorative card merely to satisfy a quota.

## Protect readers and systems

Before saving or publishing:

- remove keys, cookies, tokens, internal credentials, private headers, and
  authentication artifacts;
- mask personal information and customer identifiers unless their inclusion is
  explicitly authorized and necessary;
- sanitize logs, screenshots, terminal output, URLs, analytics, and database
  rows—not only prose;
- do not publish private repository links as if public readers can open them;
- distinguish inference from directly observed evidence;
- avoid claiming production success from a build, commit, push, preview, or
  health endpoint alone.

## Preview and publish

Follow repository instructions and the user's requested boundary. Unless the
user asks for a narrower handoff, carry the article through:

1. write the human-editable post and any reusable visual components;
2. run the relevant content, type, link, lint, and production-build checks;
3. preview the rendered article;
4. visually inspect mobile and desktop, plus tablet or ultrawide when shared
   layout or wide interactive content changed;
5. verify captions, code wrapping, tables, sidebars, navigation, metadata,
   dates, tags, citations, and fallbacks;
6. commit only the intended files;
7. push and use the owning deployment path;
8. verify the final URL and any binding-dependent or interactive behavior.

Report source, commit, push/merge, deployment, and live verification as
separate facts. A public devblog handoff should end with a verified public URL;
an internal devblog should end with the authorized internal preview or URL.
