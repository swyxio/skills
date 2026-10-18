---
name: ai-devblog
description: Turn coding, debugging, research, architecture, migration, deployment, or product work into a clear, evidence-backed technical post or substantive release narrative. Use for researching, writing, editing, or publishing technical articles or rich changelog entries; pair with blog-system-design for the reading and sharing system. Use ai-readme for routine onboarding documentation.
---

# AI Devblog

Write a technical story that changes what a particular reader understands,
believes, or can do. Keep the empirical honesty of a good engineering report,
but make comprehension and human interest the organizing priorities.

Use this order of attention:

> route the genre → align with the reader → choose the angle → explain →
> support with evidence → edit → review → present → publish

Apply `swyx-writing` as the shared voice and editing layer. For substantial
public technical writing, read its
[technical-writer influences](../swyx-writing/references/technical-writer-influences.md)
and [the story modes](references/story-modes.md) before proposing an angle.
Apply `research-grounded-writing` when the post requires external research or
source-backed claims.

Before publishing a new or substantially revised post, inspect the existing
reading experience and social preview. Check for a desktop index rail, a
section TOC, visible-on-hover/focus heading permalinks (visible on touch), and,
for public pages, a working page-specific social card. If these basics
are missing, use `blog-system-design` to implement the smallest coherent shared
fix within the user's scope. Reuse an established system where it already
satisfies the need; do not silently redesign a working publication. Routine
copy edits do not require a site-wide audit.

## Route the material

First decide whether a devblog is the right container:

- Put a routine shipped fact in a changelog or release note. When the user
  wants richer release notes, use `blog-system-design` for a linked changelog:
  explain consequential changes and their evidence, with optional detail.
- Put durable project onboarding, commands, API guidance, and contributor
  instructions in a README; use `ai-readme` when available.
- Put an exhaustive roadmap, product plan, design specification, API reference,
  or component inventory in documentation.
- Continue here for reconstructed technical work, a tested argument, a
  consequential origin story, or a mechanism worth teaching.

Apply an interestingness gate. A shipped capability alone is not enough. The
material needs at least one reader payoff: a non-obvious finding, consequential
decision, useful technique, measurable result, corrected belief, surprising
failure, illuminating mechanism, or reusable model. Recommend a smaller form
when the work does not earn a post.

Choose one primary story mode:

- **Field report:** a change, incident, migration, or measured result.
- **Short lab note:** one useful experiment, release, artifact, or strange fact.
- **Mechanism explainer:** a system made understandable through one example.
- **Incident or reversal:** a reasonable belief that reality disproved.
- **Evidence-led argument:** several concrete cases that revise a common belief.
- **Hands-on argument:** a stance earned through a small reproducible exercise.
- **Origin story:** turning points that explain why a system has its current
  shape.
- **Product announcement:** what changed, why it helps, the hidden hard part,
  and the exact constraint.

A post may borrow a secondary move, but do not turn every available fact into
an omnibus article. See [story modes](references/story-modes.md) for structures,
title families, and Dan Luu/Fly.io-inspired angle prompts.

Choose a weight that fits the idea:

- **Note:** about 300–800 words; one narrow finding and little ceremony.
- **Standard:** about 800–2,000 words; the default for a developed story.
- **Feature:** over 2,000 words only for a stated editorial reason; consider
  splitting work that grows beyond roughly 4,000 words.

These are editing signals, not quotas. Never inflate a useful note or compress
a mechanism until it no longer makes sense.

## Align with the reader

Determine what the reader is likely to **be**, **know**, and **want**, using
the user's instructions and context. Default to a smart adjacent engineer who
knows the domain but not the project and wants a useful model or decision.
Proceed with reasonable assumptions; ask only when an unresolved choice would
materially change the post or the user asks to choose. Use the
[reader-and-angle reference](references/angle-review.md) when useful.

Then write privately:

- **Before:** what the reader probably believes or cannot yet do.
- **After:** what the evidence should make them believe, understand, or try.
- **Spine:** the one question the post answers.
- **Not this post:** two or three tempting facts that belong elsewhere.

Choose the strongest honest angle. If the user requests options or a material
choice cannot be inferred, offer genuinely different angles with a title,
promise, and tradeoff. Never hide a single thesis behind cosmetic title variants.

## Establish the evidence boundary

Apply `research-grounded-writing` for general source selection, attribution,
uncertainty, and claim verification. For a technical field report, also
reconstruct the work itself:

1. Inspect the relevant source, diff, issue, transcript, experiment, incident,
   or primary external research.
2. Identify exact revisions, versions, data, configuration, dates, and
   environment when they affect the claim.
3. Re-run or read the decisive tests and measurements when reasonably cheap.
4. Separate source change, commit, push or merge, deployment or migration, and
   live user-facing verification.
5. Preserve failed attempts, unfavorable results, reversals, and uncertainty
   when they explain the final conclusion.
6. Identify evidence that challenges the preferred thesis, especially for an
   evidence-led argument.

Distinguish what this agent observed from repository history, another agent's
work, human decisions, and inference. Attribute material ideas and firsthand
observations. Do not invent motives, reactions, or a first-person experience.

When coding-agent threads exist, use them to recover the real prompt, surprise,
failed assumption, and decision sequence. Match a thread by commit, file,
command, and timestamp before using keyword similarity. Private threads may
inform causality, but quote or screenshot them only after checking disclosure,
secrets, identities, private paths, customer data, and internal architecture.

Do not promote a green build, HTTP 200, commit, upload, or public URL into proof
of a different claim. Match numeric precision to the decision: round human
durations and measurements unless extra precision changes the conclusion.

## Address the elephant

Treat the title and deck as one honest promise. Choose the family that fits the
story: result, stance, reversal, distinction, paradox, mechanism, imperative,
question, or origin. Between the title, deck, and first paragraph, name the
central subject and stakes plainly.

If the post is about a Program Database, say `Program Database`. If it is about
SQLite, a product failure, a commercial interest, or a controversial
recommendation, say that. Do not bury the lede behind an abstract principle or
mystery hook. Cleverness may sharpen a clear subject; it may not conceal one.

Open according to the mode:

- use an artifact or consequence for a field report;
- use the disputed premise for an argument;
- use the visible result for a tutorial or lab note;
- use the admission and current consequence for a reversal;
- use the present constraint or decisive turn for an origin story.

Name the system and why it matters by the end of the first paragraph. State the
bottom line by the third. Label proposals and unshipped plans explicitly.

Follow the destination's existing front matter, author, avatar, and AI
assistance conventions. Do not invent a persona or add a new metadata model for
one post. Use a real publication date and a few durable, specific tags.

## Explain at the reader's altitude

Default to a smart adjacent engineer. Declare at most three concepts the post
may assume. Define project-specific nouns on first use and give plain behavior
before an abbreviation or formal term. A link may deepen an explanation; it
cannot replace one.

When the mechanism is unfamiliar or the draft makes a causal jump, use as many
of these rungs as the reader needs:

1. observable consequence;
2. smallest concrete example;
3. plain-language model;
4. precise technical term;
5. implementation detail;
6. important edge case.

The first three are the usual minimum. Skip a later rung when it does not help
the intended reader. Prefer one recurring request, row, trace, failure, or
fixture that gains detail over several disconnected examples. Before a command,
code excerpt, table, transcript, or screenshot, tell the reader what question
it answers; afterward, interpret what matters.

While outlining a mechanism, ask: **What should the reader be able to see that is hard to understand from sentences?** Plan the representation alongside the explanation, using [the visual-language reference](references/visual-language.md). Do not postpone this decision until presentation polish.

Build a private causal outline that connects the starting condition, mechanism,
consequence, evidence, objection, and limitation. Let the selected story mode
determine the public section order. Add a heading when the argument turns, not
because a fixed number of paragraphs elapsed.

## Make artifacts and visuals earn their place

Use small exact code excerpts, focused diffs, authentic screenshots, commands,
measured comparisons, and brief quotations only when they advance the chosen
angle. Give readers prerequisites, expected results, and safe cleanup when
reproducibility is part of the value. Never dump a full transcript or
implementation inventory into the story merely because it exists.

When the user wants original video, look for the project's existing capture
and publishing workflow and run it autonomously within the authorized scope.
For games or canvas content, capture rendered pixels rather than assuming a
DOM replay contains them. When the source has game audio, capture it too;
verify a non-silent track and check synchronization against a visible cue.
Use original or licensed audio and document any sources excluded from capture. Prefer an isolated test environment and fresh test
identity; inspect footage for private material, retain the run's provenance,
and publish the video with the article using the established site workflow.
Include native controls, a poster, descriptive text and a fallback link;
verify playback, seeking, and deployed byte-range responses. If the site's
asset host cannot serve byte ranges, use an immutable, range-capable media
source and retain the site asset as a download. A capture alone does not
prove a frame rate, representative play or physical-device performance.

Use a visual when it makes an important relationship easier to inspect or understand. Plan it around timing, topology, data movement, state or a comparison—not decoration. Tables and numbered text boxes are not substitutes for showing those relationships. Separate static explanation, interactive exploration and assessment; rejecting low-value controls is not a reason to omit a useful static diagram. Before
producing or reviewing article visuals, read
[the visual-language reference](references/visual-language.md). Generated
pixels may illustrate an idea but never establish technical evidence. Keep the
central claim available in accessible text.

## Review in three editorial passes

Run the three passes in `swyx-writing`. During the developmental pass, also
check the selected story mode, angle, deliberate omissions, title/deck promise,
and interestingness gate. During the explanatory pass, check whether a central
technical relationship remains buried in prose and whether each visual reveals
it. Factual verification remains a separate evidence check.

Read the draft for whether its subject, argument, mechanism, evidence, and
limits are clear to the intended reader. An independent cold read can help for
complex or easily misunderstood work when available or requested; it is not a
prerequisite for an ordinary post.

## Protect readers and publish deliberately

Remove secrets, credentials, private headers, personal data, customer
identifiers, private paths, and inaccessible links from prose and media.
Distinguish inference from observation. Respect an explicit public or internal
visibility choice; default to public only when the evidence is safe for the
open web.

When the user asks for a finished post, default to carrying it through preview,
commit, push, deployment, and final URL verification unless they request a
draft-only or preview-only handoff. State that intended endpoint in the first
progress update so the user can narrow it. Follow repository instructions and
read [the publishing checklist](references/publishing-checklist.md) before
publication work.

Report source creation, commit, push or merge, deployment, and live verification
as separate facts. Never call a preview, build, health check, or URL alone proof
that the article's technical claim is true.
