# Human-writing review for technical posts

Use this reference before angle selection and again during the three editorial
passes. It compares recurring strengths and weaknesses in the existing Forge
and OverGrid output with transferable decisions from human technical writers.
The goal is better editorial judgment, not voice imitation.

## Keep from Forge and OverGrid

The posts at [Forge](https://forge.smol.ai/blog) and
[OverGrid](https://overgrid.swyx.io/blog) already provide a strong factual
foundation:

- failed assumptions and unfavorable measurements remain visible;
- claims often point to concrete code, commands, traces, or numbers;
- implementation, deployment, observation, and inference are distinguished;
- mechanisms and limitations receive more attention than product adjectives;
- the best lines compress a useful technical distinction.

Keep that rigor. It is a comparative advantage over technical marketing.

## Tone down the generated patterns

- **Proof before comprehension.** The article establishes that work happened
  before telling an adjacent engineer what the system is and why it matters.
- **Internal nouns too early.** Product terms, policy names, architectural
  layers, and abbreviations arrive before a concrete model.
- **A repeated headline grammar.** `We…`, the product name, a percentage, or
  `X is not Y` becomes the default even when the story is an explainer or
  argument.
- **Audit language as atmosphere.** `Evidence`, `receipt`, `authority`,
  `boundary`, `contract`, `durable`, `surface`, and `exact` recur where an
  ordinary verb or concrete component would say more.
- **Symmetry mistaken for thought.** Triads, matched sections, bold lead-ins,
  and repeated conclusions make prose look organized while hiding its causal
  path.
- **Aphorism pressure.** Every observation becomes a principle, so no sentence
  feels genuinely surprising.
- **Source-dump gravity.** Architecture inventories, full plans, and validation
  records remain in the narrative because they exist, not because the reader
  needs them.
- **Retrospective neatness.** The causal history becomes cleaner and more
  confident than the work actually was.

Do not answer these problems by removing evidence. Put the definition, example,
and minimum model first; move proof to the claim it supports and exhaustive
detail to a linked artifact.

## Spike the human-interest moves

### Simon Willison: experiment as explanation

Representative pieces such as
[Video scraping](https://simonwillison.net/2024/Oct/17/video-scraping/),
[Prompt injection and jailbreaking are not the same thing](https://simonwillison.net/2024/Mar/5/prompt-injection-jailbreaking/),
and [What to blog about](https://simonwillison.net/2022/Nov/6/what-to-blog-about/)
show these useful habits:

- start with an ordinary task or curiosity and report the result quickly;
- put prompts, commands, output, errors, screenshots, price, and timing beside
  the question they answer;
- define the concept inline even when a link offers deeper background;
- preserve a candid reaction only when the source supports it;
- let small findings remain small, useful notes;
- test the obvious objection and state the practical boundary.

Avoid unedited transcripts, chronological sprawl, and topical chatter that will
age faster than the underlying lesson.

### Dan Luu: evidence-led belief change

Representative essays such as
[Files are fraught with peril](https://danluu.com/deconstruct-files/),
[In defense of simple architectures](https://danluu.com/simple-architectures/),
and [How good corporate engineering blogs are written](https://danluu.com/corp-eng-blogs/)
show these useful habits:

- choose a disputed premise with consequences;
- begin with the simplest concrete case, then accumulate varied evidence;
- explain a hard mechanism from the bottom up;
- include counterexamples, alternative explanations, and sample limits;
- compress the result into a portable model, such as a `complexity budget`;
- widen the conclusion only as far as the cases earn.

Avoid copying dense tables, nested qualifications, long detours, or the surface
cadence. Dan's own [writing note](https://danluu.com/writing-non-advice/)
emphasizes that style should follow goals.

### Fly.io: conviction and editorial compression

Fly.io publishes several different modes, not one house template. Useful
examples include
[I'm All-In on Server-Side SQLite](https://fly.io/blog/all-in-on-sqlite-litestream/),
[You Should Write An Agent](https://fly.io/blog/everyone-write-an-agent/),
[We Were Wrong About GPUs](https://fly.io/blog/wrong-about-gpu/),
[Docker without Docker](https://fly.io/blog/docker-without-docker/), and
[SQLite Internals: Pages & B-trees](https://fly.io/blog/sqlite-internals-btree/).

Transfer these decisions:

- make the stance, reversal, or strange mechanism unmistakable;
- reduce the topic to a minimum model the reader can retell;
- carry one request, row, object, or tiny implementation through the mechanism;
- acknowledge the strongest objection and the company's product interest;
- use titles as honest contracts: stance, imperative, reversal, paradox,
  mechanism, origin, or literal explainer;
- let voice come from a real relationship to the subject.

Do not copy profanity, snark, cultural references, imagined objections, or
overconfidence. Rhetorical heat cannot substitute for evidence.

### antirez/h3.c: executable progression

The [h3.c README](https://github.com/antirez/h3.c) primarily informs
`ai-readme`, but several moves transfer to a devblog:

- use one stable fixture across explanation and comparison;
- let the reader see a result before opening the full implementation ledger;
- vary one control at a time;
- distinguish reference, validated, and aggressive paths;
- describe failed experiments through visible symptoms;
- retain a way to return to the known path.

Do not import h3.c's specialist vocabulary or turn a narrative article into an
operator manual.

## Sentence-level pacing

Illustrative edit, not a sourced anecdote:

> **Before:** The immutability of the initial configuration introduced
> significant migration complexity once the system had active users.
>
> **After:** We picked the wrong setting. By the time we noticed, we had users.
> Fixing it meant moving their accounts.

The revision turns abstractions into actions and lets the mistake, discovery,
and cost arrive in sequence. Preserve the actual facts when applying this
technique: the revised wording is appropriate only if the source establishes
who chose the setting, when they noticed, and what the fix required. Simpler
wording must not invent a more specific history.

## Final human-interest test

Keep a passage in the main story when it supplies at least one of:

- a real job, disagreement, cost, or decision;
- a concrete object that makes the mechanism graspable;
- an authentic surprise, mistake, reversal, or failed alternative;
- voice, pacing, or emotional recognition that helps the reader stay with the
  story;
- evidence that changes the scope or credibility of the conclusion;
- a useful objection or limitation;
- a sentence that compresses a true model the reader can reuse.

Move or cut passages that supply only taxonomy, delivery ceremony, exhaustive
inventory, repeated proof, or a second phrasing of the same conclusion.

A sentence can contribute information, voice, pacing, or emotional recognition.
Cut empty flourish and duplicated meaning, but don't remove a line merely
because its contribution depends on rhythm.
