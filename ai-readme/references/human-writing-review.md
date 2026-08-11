# Human-centered README review

Use this reference to keep a repository explanation both executable and worth
reading. The goal is not to imitate a named author's punctuation or persona. It
is to recover the editorial decisions that their writing makes visible.

## What the AI-written blogs already do well

The Forge and OverGrid posts demonstrate useful discipline:

- They preserve failed assumptions and unfavorable measurements instead of
  turning every change into a victory.
- They distinguish implementation, deployment, observation, and inference.
- They often attach an artifact or concrete number to a claim.
- They expose real mechanisms and limitations instead of relying on product
  adjectives.
- Their strongest passages give a technical distinction a compact phrase.

Keep those habits. A README should be at least as honest about what was run,
what remains experimental, and where a fast path stops matching its reference.

## What to tone down

The same publications show recurring AI-writing failure modes:

- **Compliance before comprehension.** The prose proves that work happened
  before telling a newcomer what the system is or why they should care.
- **Internal nouns too early.** Readers meet product names, infrastructure
  boundaries, policy labels, and acronyms before they have a mental model.
- **One grammar everywhere.** Titles and headings repeatedly use `We did X`,
  `X is not Y`, or reversal-shaped slogans until genuine surprise feels
  templated.
- **Evidence vocabulary as atmosphere.** Words such as `exact`, `durable`,
  `contract`, `authority`, `receipt`, and `boundary` recur even when they do not
  clarify the reader's decision.
- **Symmetry mistaken for structure.** Uniform sections, triads, bold lead-ins,
  and repeated conclusions make the document scan neatly without making its
  causal path easier to follow.
- **Nothing is allowed to be merely useful.** A small fact becomes a grand
  principle; every paragraph tries to sound final or quotable.
- **The source dump wins.** Architecture inventories, proposal schemas, or
  benchmark ledgers remain in the main path because they are available, not
  because a first-time reader needs them.

Do not remove rigor. Move detail to the point where it answers a reader's next
question, or link it from a deeper document.

An adopter-facing README is not improved by including every available workflow.
Once the reader can identify the project, obtain a result, understand the
minimum model, and judge the important limits, route operator recipes,
experiment ledgers, and contributor internals elsewhere. Reserve h3.c-scale
length for repositories whose primary README job really is progressive
experiment and performance documentation.

## Lessons from h3.c

The [h3.c README](https://github.com/antirez/h3.c) works best as an executable
engineering notebook:

- It gets the reader from inspection to a fast first video before explaining
  every implementation detail.
- A stable fox prompt carries several comparisons; a separate surfer prompt
  checks that the result is not unique to one fixture.
- Reference, default, fast, and aggressive paths remain visibly distinct.
- Optimizations retain diagnostic switches or oracles that let readers restore
  the known path.
- Failed schedules are described through visible symptoms such as woven
  texture, clipped color, or ghosted limbs.
- Commands, public parameters, tests, benchmarks, and implementation notes tell
  one connected story.

Do not copy its weaknesses. The implementation ledger assumes substantial
knowledge of BF16, DiT, VAE, AdaLN, QKV, RoPE, MPSGraph, and TensorOps. A
progressive heading structure does not by itself bridge that vocabulary.

## Lessons from Simon Willison

Simon Willison's strongest project notes usually begin with an ordinary task or
curiosity, move quickly to a small experiment, and show the artifact that
changed his mind. Useful models include:

- [Video scraping](https://simonwillison.net/2024/Oct/17/video-scraping/): a
  human problem, one experimental question, and the result arrive before the
  implementation expands.
- [Building a SQLite C extension with Code Interpreter](https://simonwillison.net/2024/Mar/23/building-c-extensions-for-sqlite-with-chatgpt-code-interpreter/):
  model failures and repairs remain part of the explanation.
- [What to blog about](https://simonwillison.net/2022/Nov/6/what-to-blog-about/):
  small discoveries, project descriptions, and substantial essays deserve
  different weights.

Transfer these habits:

- show prompts, commands, output, errors, screenshots, versions, time, and cost
  at the moment they answer a question;
- explain the concept inline even when a link provides deeper background;
- use a candid reaction sparingly to mark genuine surprise;
- state uncertainty in ordinary language;
- stop after the useful implication instead of inflating every discovery into
  a complete theory.

Do not copy chronological sprawl, transcript dumps, topical chatter, or a
first-person voice unsupported by repository evidence.

## Human-interest test

Before keeping a section, identify which reader need it serves. The strongest
README material usually contains at least one of:

- a real job the reader wants to complete;
- the concrete reason the project had to exist;
- a smallest working example that makes an abstraction graspable;
- a surprising output, reversal, or visible failure;
- a useful contrast between the reference path and a practical shortcut;
- an honest limitation that changes how the reader should use the project.

If a section contains only taxonomy, process ceremony, exhaustive inventory, or
status proof, move it deeper or remove it.

## Cold-reader prompt

Use a fresh reviewer with no private repository history:

> Read this README as the stated target reader. Without guessing from outside
> knowledge, explain what the project is, who it is for, its current status,
> what the first command should accomplish, how the central mechanism works,
> and its most important limitation. List undefined terms, missing
> prerequisites, unsupported promises, confusing transitions, and the exact
> point where you would stop or become lost.

Compare that response with the intended reader contract. Fix the README, not
the reviewer.
