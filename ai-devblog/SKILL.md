---
name: ai-devblog
description: Turn interesting coding, debugging, research, architecture, migration, or deployment work into a dated, high-quality technical devblog within an existing publishing system. Use when an agent should reconstruct work from code and coding-agent threads, decide whether findings merit a post, offer angles, write or revise a structured site-native explanation, select claim-fit evidence, design purposeful article-specific visuals, inspect the rendered result, and publish it publicly or internally. Pair with blog-system-design when work changes the shared index, post shell, typography, navigation, search, responsive behavior, or reusable components.
---

# AI Devblog

Write a technical account grounded in work the agent performed or can fully
reconstruct from primary artifacts. Capture what changed, why it mattered, the
evidence behind the conclusion, and what remains uncertain. Prefer a concise,
useful field report over polished but generic content marketing.

Use `blog-system-design` together with this skill whenever the task creates or
changes the shared blog index, taxonomy, article shell, typography, search,
navigation, TOC, responsive behavior, or reusable presentation components. A
single post must not silently redesign the publication. Keep article angle,
prose, and evidence here; keep the shared reading system there.

## Entry contract

- Use this skill after technical work produced inspectable artifacts: code,
  diffs, commits, logs, traces, benchmarks, screenshots, tests, deployments, or
  operational receipts.
- Apply an interestingness gate before proposing a post. Continue only when the
  work contains at least one of:
  - a non-obvious finding;
  - a meaningful design decision or tradeoff;
  - a measurable improvement or shipped capability;
  - a surprising failure or corrected assumption;
  - a reusable technique, tool, or operating lesson.
  If none applies, recommend a changelog entry, commit message, or internal
  status note instead of manufacturing a devblog.
- Do not invent a post from memory or plans alone. Inspect the current evidence.
- For every substantial post, complete the mandatory angle review in
  [references/angle-review.md](references/angle-review.md) before drafting.
  Present 3-5 materially different story packages with explicit pros, cons,
  and a recommendation. Wait for the user's choice unless they explicitly say
  to skip angle review. A request to “write now” does not itself waive review.
- When the user asks to write a post, default to carrying it through publication
  unless they set a narrower boundary. In the first progress update, remind them
  that the planned endpoint includes preview, commit, push, deployment, and live
  publication at the selected visibility. Give them a clear chance to request a
  draft-only or preview-only handoff before publication work begins.

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
2. Inspect screenshots and other media the user supplied in the coding thread.
   Reuse them when they are primary evidence for the problem, diagnosis, or
   shipped result. Preserve provenance in the caption, sanitize browser chrome,
   identifiers, and private data, and distinguish a diagnostic snapshot from
   production proof. Do not substitute a reconstructed mockup when an authentic
   supplied screenshot tells the story accurately.
3. Identify exact versions: commit SHA, package/model/runtime version, dataset,
   configuration, date range, and environment where material.
4. Re-run or read the most relevant tests and measurements when reasonably
   cheap. Do not convert stale or unavailable evidence into a current claim.
5. Separate these boundaries explicitly:
   - local source changed;
   - committed;
   - pushed or merged;
   - deployed or migrated;
   - verified on the live user-facing surface.
6. Preserve failed attempts, reversals, and uncertainty when they explain the
   final design. Do not edit the causal history into a clean fictional path.

Distinguish what this agent directly executed or observed from repository
history, another agent's work, and human decisions. Attribute material ideas,
discoveries, and playbooks. Use the project's editorial voice where
appropriate, but do not imply sole authorship or first-hand observation that
the evidence does not support.

Link claims to primary evidence whenever possible. Prefer exact-SHA source
links, official documentation, original issues or papers, test output,
deployment receipts, and public URLs over secondary summaries. Use inline
links where they read naturally; use footnotes or a references section for
supporting material. Keep quotations short.

### Reconstruct the lived story

When coding-agent threads exist, use them to recover the real prompt, surprise,
failed assumption, and decision sequence instead of writing from the final diff
alone. Search Codex, Claude Code, Devin, and other available thread formats.
Match threads to the work by exact commit, changed file, command, and timestamp
before falling back to keyword search.

- Use private threads to reconstruct causality, but publish a direct excerpt
  only after checking disclosure, secrets, identities, private paths, customer
  data, and internal architecture.
- Quote only a short decisive exchange. Preserve the original wording; mark
  omissions and light trimming, name the agent or source type, and never
  silently rewrite a quotation for polish.
- Pair an authentic screenshot with a compact semantic transcript excerpt when
  the visual context matters. Use transcript text alone when a screenshot would
  be inaccessible, illegible, or mostly browser chrome.
- Use first person only when the trace establishes who acted or observed the
  event. Otherwise use a transparent project or agent voice.

Open with the strongest real artifact: an incident, surprising prompt exchange,
diagnostic screenshot, failed assumption, or observed user consequence. Use two
to four short paragraphs and at most one compact artifact before the mechanism.
State the technical BLUF by the third paragraph. Adapt the artifact to the story
instead of forcing every post into a conversation cold open.

### Select evidence by support, not abundance

Use the minimum sufficient proof for each important claim. Weigh candidate
evidence by:

1. **fit** — it directly supports the claim being made;
2. **directness** — it observes the result rather than relying on a loose proxy;
3. **scope** — its environment and sample match the stated conclusion;
4. **freshness** — it describes the relevant implementation;
5. **explanatory value** — it helps the reader understand or trust the result.

Do not list numbers because they are available. Do not repeat one result as a
metric card, paragraph, table, and chart. Put detailed receipts in an appendix
or durable linked artifact when they matter for audit rather than explanation.

Match numeric precision to the claim and the reader's decision. Do not copy
machine precision into prose by default. For human-scale durations, normally
round to whole seconds; use tenths when that precision changes the comparison,
and milliseconds for genuinely subsecond behavior. Keep extra decimal places
in linked receipts or raw evidence when auditability requires them. Apply the
same judgment to percentages, byte counts, and other measurements: use
appropriate significant figures, keep compared values at compatible precision,
and avoid three-decimal-place figures unless the distinction is material.

Reject proof theater. For each material claim, record the claim, the evidence
that directly changes a skeptical reader's belief, and the evidence boundary or
limitation. Remove an evidence block when it only demonstrates that normal
delivery machinery ran.

- Treat HTTP 200 as reachability evidence only. It does not prove the requested
  source, behavior, bindings, migration, performance, or user outcome.
- Do not promote CI success, a green build, an uploaded artifact, or a public
  URL into article proof unless the article's actual claim concerns that exact
  boundary.
- Keep publication chain-of-custody in the release handoff, a compact provenance
  line, or a linked receipt. Do not turn it into a large in-article pipeline or
  set of ornamental proof cards by default.
- Prefer one compact comparison table or sentence over a sequence of status
  badges. A visual must compress and clarify evidence, not enlarge ceremony.
- If removing a proof graphic leaves the argument unchanged, remove it.

## Write the title and front matter

Start every title with a straightforward summary that tells the reader what
actually happened: the concrete change, result, incident, or finding. Put the
general lesson, principle, or opinion in the subtitle or body unless that
principle is itself the demonstrated result. Optionally follow the title with
a subtitle that adds mechanism, context, evidence, or stakes.

Good shapes:

- `Exact-SHA Archives Cut Checkouts 89%`
- `Repository Agents Stay Scoped`
- `Durable Events Replaced Polling`

Avoid vague titles such as `Some Thoughts on Agents` or hooks that conceal the
actual result. Also reject post-hoc principle titles that abstract away a
concrete implementation story—for example, prefer `We Split Forge's API Into
Five Workers` over `Release Authority Follows Ownership` for a large runtime
refactor. Before publication, repeat the title-to-story audit from
[references/angle-review.md](references/angle-review.md).

Adapt to the destination's established metadata or front-matter schema. Do not
add fields or redesign the site's content model merely to satisfy this skill.
When the site has no convention yet, prefer:

```yaml
title: "Short result — optional hook"
description: "One concrete sentence about the result and why it matters."
date: "YYYY-MM-DD"
tags: ["specific-topic", "system-or-tool"]
visibility: "public"
```

Use a real publication date. Choose a few specific, reusable tags rather than
an exhaustive keyword list.

### Byline and opening

Follow the destination's established author and avatar conventions. Reuse an
existing author identity or explicit AI-assistance label rather than adding a
one-off persona or hardcoding a project-specific name into the article. When
the post is materially AI-written, prefer a convention that makes that clear;
do not hide AI authorship behind an invented “the team” byline or an ambiguous
institutional voice. If the site has no applicable convention and authorship is
required, ask the user or use the smallest transparent AI attribution the
content model already supports.

The rendered post must move directly from its title, optional subtitle/deck,
and compact author byline into the article prose. Do not insert a metrics grid,
implementation-evidence scorecard, validation-receipt card, ship-receipt
sidebar, or other dashboard-like summary between the headline and the writing.
Place important proof in the narrative at the point where it supports a claim;
link a longer receipt naturally from that passage or from a restrained endnote.

## Shape the article

Use the site's native human-editable format. Use MDX when the destination
already supports it and the article benefits from components or interaction.
Discover and reuse the site's content directories, layouts, components,
typography, metadata, citation style, and build pipeline. Do not introduce a
new blog framework merely to enable one article without the user's approval.
If the article needs a new shared component or presentation convention, load
`blog-system-design` and make that system change explicitly.

Orient the reader within the first two or three paragraphs. Assume they are
broadly familiar with the technical area but do not know this project, incident,
architecture, experiment, or prior argument. Spend two to four sentences naming
the relevant system, the situation before this work, why the problem matters,
and the specific question the post answers.

A catchy opener is optional. When one genuinely helps, use it briefly and put
the orienting context immediately after it. When there is no strong opener,
begin directly with the context rather than manufacturing a slogan, dramatic
anecdote, or mystery. A concrete incident may supply the hook, but readers
should not have to infer the surrounding system or stakes from that incident.

Be engaging to technical readers in the way the material earns. Preserve a
weird failure, funny constraint, surprising reversal, vivid debugging moment,
or unusual mechanism when it is authentic and helps explain the work. Do not
flatten an interesting story into a formal report, but do not invent personality
or suspense for routine work.

Within that opening, deliver a two-part BLUF:

1. what changed or was learned;
2. the most important evidence or consequence.

Then adapt the structure to the story. A substantial devblog usually needs:

- the problem and why it mattered;
- the prior design or failed assumption;
- the key mechanism or decision;
- evidence that supports the result;
- alternatives considered and why they lost;
- limitations, unresolved questions, and the next test.

Prefer more visible structure than an average essay, but make every device
earn its place:

- use section headings for real transitions in the argument;
- use bullets for sets, sequences, criteria, and alternatives;
- use **bold** for conclusions, named concepts, and useful scan targets;
- use *italics* sparingly for contrast or a newly defined term;
- use quotations only for authentic statements or unusually concise language;
- use tables, charts, code, and interactive playgrounds only when their form
  explains the point more clearly than prose.

Before drafting the body, write a private one-sentence thesis and a short causal
outline. The thesis must state the non-obvious conclusion, not merely the work
completed. The outline should connect the starting condition, mechanism,
consequence, evidence, and limitation. Remove it from the finished post unless
it also works naturally as reader-facing prose.

Explain at the reader's altitude:

- introduce project-specific nouns before relying on them;
- separate what happened, why it happened, how the mechanism works, and what
  proves it;
- use concrete subjects and verbs instead of vague abstractions such as
  “improved the architecture” or “leveraged the platform”;
- make causal transitions explicit when one decision or observation leads to
  another;
- keep one primary idea per paragraph and cut repeated conclusions, ceremonial
  setup, and exhaustive inventories that do not advance the argument;
- name the strongest counterargument or tradeoff instead of presenting the
  chosen design as inevitable;
- preserve technical precision, but define uncommon terms and give a small
  example when a mechanism is otherwise difficult to picture.

Stay close to ASD-STE100 Simplified Technical English without making the prose
mechanical. Prefer short direct sentences, active voice, one main idea per
sentence, consistent terminology, defined abbreviations, and concrete verbs.
Avoid idioms, inflated metaphors, vague intensifiers, marketing language, and
clickbait that hides the technical result.

After the first draft, perform an editorial pass independently from factual
verification. Check whether the opening earns attention, each section advances
the thesis, examples arrive near the concepts they explain, and the ending adds
a durable lesson rather than repeating the introduction.

Keep implementation inventories, long logs, and exhaustive methods behind a
details block, appendix, linked receipt, or sidebar. Use asides for caveats,
definitions, operator notes, and surprising secondary observations without
breaking the main narrative.

Avoid “AI report” furniture: front-loaded KPI tiles, three-number summary
strips, evidence tables that merely restate the deck, and ornamental receipt
cards. A table is appropriate only when exact row/column comparison is
materially easier to understand than prose. Never add one just to make a post
look rigorous.

Prefer small exact code excerpts over large dumps. Explain why each excerpt is
present. Use a focused code diff when the change itself tells the story. Use
tabbed examples when readers benefit from comparing before/after code,
alternative implementations, languages, frameworks, or configuration modes;
do not hide the only complete example behind interaction. Link to the exact
source revision when readers need the full context. When reproducibility is
part of the value, give readers the minimum prerequisites, commands, expected
result, and safe cleanup needed to follow along. Do not turn every devblog into
a start-to-finish tutorial.

## Make the mechanism visible

Strongly prefer purposeful visuals when they expose a mechanism or relationship
faster than prose. For every substantial post, look for the clearest opportunity
to show the mechanism, comparison, or proof. There is no fixed quota: publish
without a visual when every candidate would be decorative, misleading, or
require disproportionate new infrastructure. Every included visual must make a
relationship faster to understand than prose alone.

Plan visuals before polishing the prose. List the two or three relationships a
reader most needs to understand—such as structure, causality, sequence,
comparison, or proof—and choose a visual form only when it improves one of
them. Treat the visual and its nearby explanation as one unit: the prose should
interpret the graphic, not transcribe every label in it.

Treat visual quality as part of editorial quality, not decoration. When a
substantial visual needs art direction, use an image-generation model for two
to four initial studies and iterate between image generation, deterministic
code, and human feedback until the visual carries the story at its rendered
size. Start from a text brief, or pass an existing screenshot, SVG, chart, or
code-generated diagram back through image generation to explore hierarchy,
texture, composition, and publication identity. Use `align-me` when several
materially different visual directions are plausible or the user's taste is
the deciding constraint; show concrete passes rather than asking abstract
style questions.

Choose the strongest final form instead of forcing every exploration back into
code:

- publish a generated image directly when it is intentionally editorial,
  coherent with the article, accessible, and free of unsupported factual
  detail;
- use image generation to stylize a deterministic chart or diagram, then
  compare it with the source and restore exact labels, scales, measurements,
  and topology in a deterministic overlay when needed;
- rebuild the selected direction in HTML, SVG, CSS, Mermaid, or plotting code
  when precision, interaction, responsiveness, or accessibility requires it.

Generated visual studies may become final assets; they are not automatically
disposable moodboards. However, never treat generated pixels as evidence, and
never trust a model to preserve factual labels, measurements, screenshots, or
topology without verification. For a prominent or technically consequential
visual, take a few review passes with the user when practical and obtain clear
approval before publication.

Choose the smallest useful form:

- diagram for architecture, authority, or data flow;
- timeline for an incident, migration, or changing state;
- table for exact mappings or alternatives that genuinely need two-dimensional comparison, never as a decorative metrics summary;
- chart for measured comparisons with units and sample boundaries;
- annotated screenshot for user-visible or operational proof;
- code diff for a small decisive implementation change;
- syntax-highlighted code sample for the key technique;
- tabbed code examples for meaningful before/after or cross-stack comparisons;
- interactive demo, calculator, explorer, or stepper when readers benefit from
  changing inputs or walking a causal sequence.

Match the visual's semantics to its claim:

- An architecture or data-flow diagram must label the meaningful entities and
  relationships. Show direction, boundaries, ownership, protocol, or lifecycle
  distinctions when they affect the conclusion. A collection of boxes without
  relationships is an inventory, not an architecture diagram.
- A comparison graphic must use a truthful common scale where comparison is
  intended. Show units, totals or denominators, the baseline, and the sample or
  measurement boundary. Do not imply that a proxy metric measures more than it
  does.
- A timeline or sequence must show state transitions and the event that moves
  the system between them, including retries, branches, or ambiguity when those
  are central to the lesson.
- A screenshot must prove a user-visible or operational claim. Crop it to the
  relevant surface and annotate the evidence when the reader would otherwise
  have to hunt for it.
- A code visual must be small enough to read and must call attention to the
  decisive behavior, not merely demonstrate that code exists.

Prefer deterministic HTML, SVG, Mermaid, plotting code, or site-native
components when exact technical relationships must remain inspectable.
Generated or hybrid editorial illustrations are welcome when they add a useful
idea, memorable context, or publication identity and survive factual review.
Do not let a low-information illustration dominate the initial viewport. Prefer
an information-dense SVG diagram, chart, annotated screenshot, or compact mixed
media treatment above the fold. Create a strong `og:image` when the publication
supports social cards; it may be more expressive because it does not displace
article content. Do not add decorative hero art by reflex; use it when the
article's story and publication direction justify it. Generative imagery can
support attention and explanation, but cannot substitute for a labeled
technical diagram, measured chart, authentic screenshot, or other evidence.

For performance work, use a before/after visual, timing waterfall, flame chart,
or stacked stage diagram only when it supports a distinct claim. Do not show
the same result in several forms by default. Keep comparisons on a common scale,
show units and totals, identify the exact environment or sample boundary, and
provide an accessible table or textual equivalent. If timing attribution is
incomplete, label the remainder as overhead or unmeasured time; never invent a
stage breakdown. Use supplied screenshots when they show the original symptom
or operational surface better than reconstructed UI.

Heavily favor an interactive visual when manipulating inputs, replaying a
sequence, exploring an artifact, or switching implementations reveals the
finding better than a static image. Do not add interaction solely as polish.

For interactive visuals or MDX components:

- reuse existing components before creating new ones; if the destination has
  no component system, ask before expanding the publishing stack;
- keep data and logic in feature-owned, reusable components;
- make the central claim visible without interaction;
- provide a static or textual fallback;
- support keyboard and touch use, reduced motion, and narrow screens;
- avoid client-side weight that is disproportionate to the lesson.

When an interactive visual establishes a reusable site convention or requires
shared responsive infrastructure, use `blog-system-design` for the component
system and keep only article-specific data and interpretation in this skill.

Every figure needs a concise caption, units or provenance where applicable,
and meaningful alt text or an adjacent textual equivalent. Do not use a chart,
diagram, screenshot, or decorative card merely to satisfy a quota.

Apply a visual explanation test before keeping a figure:

1. State the exact question the figure answers.
2. Confirm that a reader can identify the answer without relying on the
   surrounding paragraph.
3. Confirm that labels, scales, arrows, colors, and grouping have declared
   meanings rather than decorative meanings.
4. Confirm that the adjacent prose explains why the answer matters.
5. Remove or redesign the figure if it could be exchanged for an unrelated
   illustration without changing the argument.

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
6. inspect every explanatory figure at its rendered size: labels must be
   legible, relationships unambiguous, scales truthful, colors distinguishable,
   and content unclipped without requiring unexplained interaction;
7. test visual components through meaningful rendered or structural assertions.
   String-presence checks alone do not prove that a chart, diagram, or fallback
   works;
8. commit only the intended files;
9. push and use the owning deployment path;
10. verify the final URL and any binding-dependent or interactive behavior.

When the post changes shared layout, navigation, search, typography, or reusable
components, also complete the `blog-system-design` verification checklist.

Do not call a visual article complete when the preview is unavailable or when
its explanatory figures have not been inspected in the rendered page. Report
that state as an incomplete handoff even if content tests and the production
build pass.

Report source, commit, push/merge, deployment, and live verification as
separate facts. A public devblog handoff should end with a verified public URL;
an internal devblog should end with the authorized internal preview or URL.
