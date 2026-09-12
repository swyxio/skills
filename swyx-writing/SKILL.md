---
name: swyx-writing
description: Apply swyx's reusable nonfiction writing preferences when drafting or materially revising prose, including technical posts, essays, research memos, reports, documentation, profiles, scripts, announcements, and publishing copy. Use as the shared style and editing layer alongside the skill that owns the subject or format. Do not use for verbatim transcription, code-only work, or fiction unless the user explicitly asks for swyx's nonfiction voice.
---

# swyx writing

Write so a smart reader can understand the point once, remember the useful
model, and decide what to do next. Preserve the author's real judgment and the
messiness that earned it. Do not imitate a generic founder, marketer, or
technical-blog persona.

This skill owns voice, explanation, and editing. Pair it with the skill that
owns the facts or format:

- use `research-grounded-writing` when claims require external or primary
  evidence;
- use `ai-devblog` for technical story selection and publication;
- use `ai-readme` for executable repository documentation;
- use `person-profile-writing` for biographies and identity research;
- use `video-talk-to-essay` for recorded-talk articles.

The genre skill decides what belongs. This skill decides how the prose reads.

## Start with the reader's change

Before substantial drafting, identify privately:

- what the reader currently believes, misunderstands, or cannot do;
- what they should believe, understand, feel, or try afterward;
- the one question the piece answers;
- the strongest fact, example, or tension that earns their attention;
- tempting material that belongs somewhere else.

Name the actual subject and stakes early. Do not hide the lede behind a mystery
hook, abstract principle, slogan, or narration about the research process. A
clever line may sharpen a clear idea; it may not replace one.

Prefer one developing example over a sequence of disconnected examples. Give
the reader the observable consequence, then the smallest concrete example,
then a plain model. Add formal terms, implementation detail, and edge cases only
when they help the intended reader.

## Sound like swyx

Use plain words around precise ideas. Prefer concrete subjects and active verbs:
name the person or system doing the work. Technical terms should earn their
place by naming something accurately, not by making the surrounding prose sound
technical.

Let voice come from real judgment:

- state the useful opinion and the reason for it;
- keep authentic surprise, disagreement, cost, mistakes, and reversals;
- explain tradeoffs without sanding them into neutral mush;
- use humor, analogy, fragments, and asides when they clarify or control pace;
- widen a claim only as far as the evidence or experience earns;
- distinguish shipped behavior, proposals, observations, and inference.

Give the reader one manageable thought at a time. Let longer sentences establish
circumstances or mechanisms. Let short sentences land a discovery or judgment.
Use paragraph breaks where a person would naturally pause. Read the paragraph
aloud: it should sound like someone explaining something they understand.

## Avoid generated prose

Remove patterns that make the writing feel produced by a template:

- repeated `not X, but Y`, `X is not Y`, and perfectly balanced reversals;
- uniform triads, symmetrical sections, bold thesis restatements, and mandatory
  recaps;
- every heading, paragraph, and sentence competing to be an aphorism;
- every observation enlarged into a universal principle;
- fake quotations, invented reactions, and a suspiciously clean causal history;
- generic transitions such as `the broader principle`, `the common thread`,
  `it is worth noting`, `in today's landscape`, or `this underscores`;
- `delve`, `leverage`, `foster`, `robust`, `seamless`, and other prestige words
  when an ordinary verb says more;
- `authority`, `boundary`, `contract`, `receipt`, `durable`, `surface`, and
  `exact` used as atmosphere rather than necessary terms;
- noun piles and internal project vocabulary before the concrete behavior;
- exhaustive evidence, implementation inventories, or caveats in the main
  narrative merely because they are available;
- a second conclusion that repeats the first in summary language.

Do not solve these problems by making the prose flat. Earn one or two memorable
sentences by compressing a true, useful distinction. Keep idiosyncratic phrasing
when it sounds intentional and remains easy to understand.

## Attribute without writing about attribution

Put links and evidence beside the claim they support. Make the person, system,
event, or idea the grammatical subject whenever possible. Prefer `The release
controller deploys the Worker` to `The evidence establishes a release authority
boundary`.

Do not begin sentences with `According to`, `The documentation says`, or `The
available evidence shows` unless the source itself is the subject. State the
supported fact directly and link the useful words. Preserve uncertainty where
the source does not justify a clean assertion.

## Format for the argument

Use connected prose by default. Add headings when the argument turns. Use
bullets for genuinely parallel items, numbered lists for real sequences, tables
for repeated-field comparisons, and visuals when they reveal a relationship
that prose makes hard to inspect.

Before code, a command, a chart, or a screenshot, say what question it answers.
Afterward, interpret what matters. Artifacts should advance the reader's model,
not serve as proof that work happened.

## Edit in three passes

1. **Developmental:** check the reader change, central question, order, strongest
   objection, deliberate omissions, and whether the ending earns its lesson.
2. **Explanatory:** check undefined nouns, assumed knowledge, missing causal
   steps, weak examples, and artifacts without interpretation.
3. **Line:** replace abstractions with actors and verbs, vary rhythm naturally,
   remove repeated antithesis and conclusions, and cut anything that supplies
   neither information, judgment, voice, nor pace.

Factual verification is separate from the editorial passes. When confusion risk
is high, give an uninvolved reader only the draft and ask what it is about, what
changed, how the central mechanism works, what supports it, and what remains
uncertain. Fix the prose rather than coaching the reader.

For substantial public technical writing, read
[technical-writer influences](references/technical-writer-influences.md). Use
the writers' decisions as inspiration; never imitate their surface persona.
