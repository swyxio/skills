---
name: ai-devblog
description: Turn coding, debugging, research, architecture, migration, deployment, or product work into a clear, evidence-backed technical post in an existing publishing system. Use when Codex should reconstruct primary evidence, decide whether the material deserves a note or article, align on the intended reader, choose among field-report, explainer, reversal, origin-story, hands-on, or evidence-led argument forms, write and edit the piece, inspect its rendered presentation, and publish it at the requested visibility. Pair with blog-system-design for changes to the shared blog system.
---

# AI Devblog

Write a technical story that changes what a particular reader understands,
believes, or can do. Keep the empirical honesty of a good engineering report,
but make comprehension and human interest the organizing priorities.

Use this order of attention:

> route the genre → align with the reader → choose the angle → explain →
> support with evidence → edit → cold-read → present → publish

For substantial work, read
[the human-writing review](references/human-writing-review.md) and
[the story modes](references/story-modes.md) before proposing an angle. Use
these writers as structural inspiration, not as personas to imitate.

Use `blog-system-design` with this skill when the task changes the shared blog
index, taxonomy, article shell, typography, navigation, search, responsive
behavior, or reusable components. A post must not silently redesign its
publication.

## Route the material

First decide whether a devblog is the right container:

- Put a routine shipped fact in a changelog or release note.
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

Before a standard or feature post, determine what the skill user expects the
reader to **be**, **know**, and **want**. If this is not already explicit, ask
one compact batch in the `align-me` shape:

1. State each belief as a numbered decision.
2. Give lettered, mutually exclusive choices with concrete consequences.
3. Recommend one choice for each decision.
4. End with `Reply approve all to accept 1A, 2B, 3A, or give changes such as
   2C.` Then wait.

Use [the reader-and-angle checkpoint](references/angle-review.md) for the exact
questions. Default to a smart adjacent engineer who knows the domain but not
the project and wants a useful mental model or decision. Do not ask what the
user has already answered. For a short note with an obvious readership, state
the inferred assumptions briefly and proceed.

Then write privately:

- **Before:** what the reader probably believes or cannot yet do.
- **After:** what the evidence should make them believe, understand, or try.
- **Spine:** the one question the post answers.
- **Not this post:** two or three tempting facts that belong elsewhere.

For a standard or feature post, offer two or three genuinely different angles
unless only one honest angle exists. Keep each option compact: title, promise,
and tradeoff. Recommend one and wait. Never hide a single thesis behind cosmetic
title variants.

## Establish the evidence boundary

Reconstruct the work before writing:

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

Use the minimum proof that changes a skeptical reader's mind. Judge evidence by
fit, directness, scope, freshness, and explanatory value. Link exact source,
official documentation, original issues or papers, tests, deployment records,
and public results near the claim they support. Put exhaustive logs, methods,
and provenance in a linked artifact or appendix.

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

Build a private causal outline that connects the starting condition, mechanism,
consequence, evidence, objection, and limitation. Let the selected story mode
determine the public section order. Add a heading when the argument turns, not
because a fixed number of paragraphs elapsed.

## Sound like a thoughtful person

Use plain technical prose: concrete subjects, active verbs, consistent terms,
and one main idea per sentence. Analogy, contrast, parallelism, humor, and
first-person reaction are welcome when they clarify a real mechanism and the
evidence supports the voice. Remove them when they merely decorate the prose or
widen the claim.

Preserve what Forge and OverGrid do well: empirical honesty, real limitations,
unfavorable measurements, exact artifacts, and corrected assumptions. Tone
down their recurring AI-shaped habits:

- internal nouns and architecture before the reader knows the concrete system;
- repeated `not X, but Y`, `X is not Y`, and perfectly balanced reversals;
- titles that default to `We`, a product name, a percentage, or a slogan;
- `authority`, `boundary`, `contract`, `receipt`, `durable`, `surface`, and
  `exact` used as atmosphere instead of necessary terms;
- uniform triads, bold thesis restatements, symmetrical sections, and compulsory
  recaps;
- exhaustive evidence promoted into the main narrative;
- every observation enlarged into a principle and every paragraph polished into
  an aphorism;
- a suspiciously clean causal history or a plan narrated as an accomplished
  result.

Prefer `the release controller deploys the Worker` to `authority flows through
the release boundary`. Earn one or two memorable sentences by compressing a
true and useful distinction. Do not impose a slogan quota.

## Make artifacts and visuals earn their place

Use small exact code excerpts, focused diffs, authentic screenshots, commands,
measured comparisons, and brief quotations only when they advance the chosen
angle. Give readers prerequisites, expected results, and safe cleanup when
reproducibility is part of the value. Never dump a full transcript or
implementation inventory into the story merely because it exists.

Use a visual only when it answers an important question faster than prose.
Plan it around the relationship being explained, not decoration. Before
producing or reviewing article visuals, read
[the visual-language reference](references/visual-language.md). Generated
pixels may illustrate an idea but never establish technical evidence. Keep the
central claim available in accessible text.

## Review in three editorial passes

1. **Developmental:** check the angle, belief change, order, deliberate
   omissions, strongest objection, elephant in the room, and whether the ending
   earns its lesson.
2. **Explanatory:** check assumed knowledge, undefined nouns, jargon, missing
   causal steps, the recurring example, artifacts without interpretation, and
   concepts introduced too late.
3. **Line:** check concrete verbs, sentence rhythm, noun piles, repeated
   antithesis, duplicated conclusions, ordinary proofreading, and title/deck
   accuracy. As the final step, sharpen the thesis, minimum-model, and
   consequence sentences where they can become easier to remember without
   becoming less true.

Factual verification remains a separate evidence check, not a fourth editorial
pass.

Then run a mandatory context-isolated cold read for every standard or feature
post. Give a fresh subagent or uninvolved reader only the draft and public
links—not the task thread, repository history, intended thesis, or angle notes.
Ask:

1. What is this about?
2. What changed, or what is the author arguing?
3. How does the central mechanism work?
4. What evidence supports it?
5. What remains uncertain?
6. Which terms, transitions, or assumed facts block understanding?

Compare the answers with the approved reader beliefs. If the cold reader misses
the subject, thesis, mechanism, or evidence limit, revise and repeat. Fix the
post; do not coach the reviewer. Use the same check in abbreviated form for a
note when confusion risk is high.

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
