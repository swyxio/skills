---
name: ai-blog-writing
description: Write, revise, or publish public AI/game-research blog posts. Use for research updates, AI release notes, strategy explainers, autoresearch retrospectives, or any request to turn experimental work into an MDX-first, evidence-led, visually interactive article with a working preview or deployed URL.
---

# AI Blog Writing

Create posts that let a game player and a technically curious reader understand
what changed, why it matters, and what remains unknown. The voice is an
articulate, enthusiastic ML graduate student who loves the game: candid about
mistakes, precise about evidence, and sparingly funny. The post is an editorial
artifact, not a source-code handoff.

## Authoring contract

- Put every post body in one human-editable MDX file per slug, normally
  `content/blog/<slug>.mdx`. Keep front matter with title, description, date,
  and eyebrow in that file.
- Use route files only for metadata and shared layout. Do not store prose as
  TypeScript arrays, JSX data structures, or hard-coded page components.
- Compile MDX at build time. On a Worker/Vite stack, prefer the native
  Rollup/Vite MDX integration and compiled front matter; do not parse files at
  request time.
- Reuse one dense article shell with a persistent desktop Field Notes index.
  On narrow screens, retain it as a compact horizontal note strip.
- Make a public series discoverable outside its own shell: link its collection
  landing page from the product homepage navigation or footer, and from other
  durable guide footers where readers finish adjacent material. Do not make a
  single article URL the only global entry point.
- When a research series starts with an implementation-heavy note, add a
  `00 · Start here` primer ahead of it. In plain language, explain the game or
  product, the questions the series will answer, the reading contract, and the
  next note. Register it first in both the post index and the reading rail.
- Build small, feature-owned, data-driven visual components rather than a new
  one-off SVG or CSS invention for every post. Reuse evidence badges, chart
  anatomy, 3D board reconstruction tabs, and result panels across the blog,
  Strategy Guide, and AI Lab.

## Audience ownership

- Give each post exactly one primary reader and declare it in front matter:
  **strategy** for a player trying to make a better move, or **development**
  for a reader following the AI research and engineering process.
- Do not use sections such as “At the table” and “In the lab” to make one post
  serve both audiences. When both stories are worth telling, split them into
  two linked posts. The strategy post owns the playable lesson; the
  development post owns the mechanism, evidence, and uncertainty.
- Make the two paths visually unmistakable in the index, reading rail, topic
  pages, eyebrows, and tags. Dates should carry more visual weight than an
  arbitrary sequence number. Use lighter, highly readable typography rather
  than dense all-caps display type for navigation and article metadata.
- Strategy posts should read like expanded, memorable chapters of the
  Strategy Guide. Development posts should read like dated laboratory notes.
  Cross-link the paired article when the same finding has both a player and a
  research story.

## Evidence and voice

1. Start with the reader’s question or a surprising observed failure, not an
   implementation inventory.
2. Distinguish **rule fact**, **activation/behavior result**, **discovery
   evidence**, and **held-out strength claim** in the prose and chart labels.
3. Never turn a single playtest, margin shift, or activation count into a
   win-rate claim. Name the next test that would justify the stronger claim.
4. Write the causal chain: prior policy or belief → observed failure →
   mechanism → measured change → remaining uncertainty.
5. Turn AI findings into table advice only when the mapping is concrete. Use
   prompts such as “what exactly changes?”, “what is the best public reply?”,
   and “does this close safely?” rather than vague advice to play aggressively.
6. Keep references to hidden state, player labels, future deals, RNG, and
   evaluation harnesses precise. If the policy cannot use something, say so.
7. Treat a post as a dated, fixed research snapshot. State the dataset/version
   in the evidence layer. If later evidence materially reverses a conclusion,
   add a dated correction note to the original post where possible.
8. Name the player whose playtest observation motivated a finding when that
   attribution is available.

## Search-complexity reporting

- Say **raw placement triples**, **traversal paths**, or **distinct legal
  constructions**—not an undifferentiated “permutation” count. Label whether a
  number is pre-legality geometry, an exhaustive census, or the live bounded
  budget.
- Pair any complexity example with its exact conditions: map dimensions,
  terrain/height context, dealt hand, and board state. Explain separately what
  scoring changes (candidate value) and what it does not (the raw
  orientation/origin space). If the game ends on a territory target rather
  than a score target, say so before listing point values.

## Evidence structure

- Put a short evidence badge on each material result: `PLAYTEST`,
  `PRELIMINARY`, `PAIRED RESULT`, `PROMOTED`, `DISCARDED`, or `INVALID`.
  The caption must still say in plain language what was measured and why the
  evidence is limited.
- Use **match-point win rate** as the headline KPI for strength claims. Show
  score margin and compute only when they alter the interpretation.
- Show raw cluster dots and confidence whiskers for comparative results; do
  not hide uncertainty simply because an experiment is preliminary.
- Lead with the aggregate result, but visibly flag a map/home/starter slice
  that could reverse the interpretation. Put exact schedules, source
  fingerprints, and promotion thresholds in a compact methods expansion.
- A focused AI post should compare only relevant opponents. Use a shared
  reference opponent when an overview genuinely needs all profiles on one
  scale.
- Include preliminary, discarded, and invalid trials in a single candid
  timeline, visually distinct from retained work. A clean-looking silent
  failure is still a failure.

## Visual standard

Lead with one straightforward visual that gives the reader confidence, then
use frequent compact evidence figures where they carry a number, a board
decision, or a causal comparison:

- funnel for opportunity → gate → activation → conversion;
- before/after bar chart with real counts and an evidence boundary;
- compact board reconstruction for a tactical choice;
- two-lane or timeline diagram when a process is the claim.

Use captions that name the sample, unit, and limitation. Use neutral chart
styling; reserve named-character styling for gameplay examples. Use the game’s
real full-3D isometric tile, height, and piece visual language; never
substitute generic dots or unrelated icons.

For a substantial position, provide tabs:

- **Teaching position** is the default: a simplified legal state that isolates
  the lesson.
- **Played position** is the accompanying real reconstruction.

Both are interactive on desktop and touch-first on mobile. Keep coordinates
and score deltas quiet until a tile or turn is selected. Default to a guided
walkthrough; expose free alternate-move exploration only when it proves a
lesson the walkthrough cannot. A chart should explain a relationship, not
decorate.

### Teaching-board grammar

A board illustration must explain a sequence, not merely display a small board
beside a detached paragraph. Prefer the Strategy Guide's scenario data and
renderer so the blog and guide teach with the same visual language.

- Show the smallest useful chain: **before → candidate move → strongest public
  reply → surviving result**. Omit a state only when the relationship remains
  unambiguous without it.
- Keep a persistent legend. Put the important labels, rings, arrows, contested
  regions, and continuation markers on or immediately beside the relevant
  board state; do not make the reader translate a prose paragraph back onto
  anonymous tiles.
- Attach state-specific metrics and short captions to the state they describe.
  End with a plain-language **Read this as** receipt that states the reusable
  lesson.
- State the provenance boundary: identify an exact recorded position as such;
  otherwise call it a simplified teaching position and never imply that it is
  a replay.
- Interaction is optional. The base claim must be visible without clicking.
  Use a stepper, hover, or animation only when it reveals a real dependency;
  provide touch controls, reduced-motion behavior, and a static fallback.

### Research-figure grammar

For non-board research, organize the visual as **question → observation or
control → falsification or intervention → verdict**. Let the figure carry the
causal comparison; do not dress up four paragraphs as decorative cards. An
evidence badge labels the confidence boundary but does not count as an
illustration by itself.

## Visual coverage is a publishing requirement

- Every substantive research post must carry at least three purposeful visual
  beats: (1) one lead evidence figure, (2) one causal or tactical explainer,
  and (3) one compact supporting visual such as a timeline, comparison, or
  annotated receipt. A short correction may use fewer only when it says why.
- At least one substantial tactical post in a series should include an
  interactive full-3D isometric board reconstruction with a guided turn or
  choice sequence. When the article has a real source position, pair it with
  the simpler teaching position rather than making readers infer a lesson from
  a dense screenshot.
- Motion is optional, but when sequence is the claim, prefer a short
  replay-like GIF or a stepper over prose describing successive board states.
  It must be controllable, respect reduced motion, and have a static fallback.
- Use visual insets deliberately: a small left/right evidence inset for a
  local claim, a half-width reconstruction for a single tactical decision,
  and a wide figure only for a multi-series comparison or board sequence that
  cannot fit the reading column. Do not default every figure to a full-width
  block.
- Before publishing an older post in a growing series, audit it against this
  standard. Mark the remaining gap explicitly in the visual-backfill ledger;
  do not silently leave a text-only early epoch beside later interactive work.
- Prefer reusable, data-driven pieces (evidence card, cluster-dot bar,
  3D board sequence, timeline, funnel, result ledger) over one-off artwork.
  Reusable does not mean identical: vary the teaching position and annotation
  to fit the claim.
- Inspect the rendered result, not only the source. Capture and review mobile,
  desktop, tablet, and ultrawide screenshots for site-wide or shared-component
  changes. Check annotations at their actual reading size and explicitly test
  for horizontal overflow.

## Workflow

1. Inspect the actual result artifacts, source fingerprint, and prior context.
   Do not write a research conclusion from memory alone.
2. Choose exactly one audience and one job for the post. A strategy post helps
   a player recognize and use a mechanism. A development post explains why the
   research changed direction, including its schedule and uncertainty. Split
   the material into linked posts if both jobs are substantial.
3. Draft the MDX body and front matter first. Add a short prior-context section
   before describing the latest patch.
4. Build only the visuals required to make the measured evidence legible.
   Place small figures as deliberate left/right insets, use wide figures only
   when their structure needs it, and keep the main reading measure dense.
   Keep them accessible: semantic figures, captions, text equivalents, and
   touch controls.
5. Build and visually inspect desktop and mobile or a narrow viewport.
   For site-chrome or reading-layout changes, also check tablet and ultrawide
   viewports; confirm that navigation remains visible, the mobile rail stays
   usable, and wide tables remain horizontally accessible.
6. End every handoff with either:
   - a verified production URL after deployment, or
   - a running local preview URL.

Never make source-file links the primary handoff. State clearly whether the
post is local-only, committed/pushed, or deployed.

## Release checklist

- MDX body is in the content directory and metadata comes from front matter.
- Claims match the actual experiment scope and uncertainty.
- Main chart reports its sample, evidence tier, and limitation.
- Player-facing advice is updated in the Strategy Guide in the same release
  when the finding changes practical play.
- Links, build, and readable preview pass.
- The user receives a browser URL they can read immediately.
