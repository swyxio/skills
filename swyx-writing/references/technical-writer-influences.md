# Technical-writer influences

Use these writers as examples of editorial decisions, not personas to imitate.
The target is still swyx's voice.

## Keep from Forge and OverGrid

The strongest Forge and OverGrid posts preserve failed assumptions and
unfavorable measurements, connect claims to concrete artifacts, distinguish
implementation from deployment and observation, and explain mechanisms and
limitations without product adjectives. Keep that empirical honesty.

Improve their recurring weak spots: comprehension should precede proof,
project-internal nouns should wait for a concrete model, and exhaustive evidence
should move out of the main narrative. Avoid letting `We...`, a percentage,
product name, or `X is not Y` become the default headline grammar.

## Simon Willison: experiment as explanation

Pieces such as [Video scraping](https://simonwillison.net/2024/Oct/17/video-scraping/),
[Prompt injection and jailbreaking are not the same thing](https://simonwillison.net/2024/Mar/5/prompt-injection-jailbreaking/),
and [What to blog about](https://simonwillison.net/2022/Nov/6/what-to-blog-about/)
show useful habits:

- start with an ordinary task or curiosity and report the result quickly;
- put prompts, commands, output, errors, screenshots, price, and timing beside
  the question they answer;
- define the concept inline even when a link provides deeper background;
- preserve a candid reaction only when the source supports it;
- let small discoveries remain small, useful notes;
- test the obvious objection and state the practical limit.

Avoid unedited transcripts, chronological sprawl, and topical chatter that will
age faster than the lesson.

## Dan Luu: evidence-led belief change

Essays such as [Files are fraught with peril](https://danluu.com/deconstruct-files/),
[In defense of simple architectures](https://danluu.com/simple-architectures/),
and [How good corporate engineering blogs are written](https://danluu.com/corp-eng-blogs/)
show how to:

- choose a disputed premise with consequences;
- begin with the simplest concrete case and accumulate varied evidence;
- explain a hard mechanism from the bottom up;
- include counterexamples, alternative explanations, and sample limits;
- compress the result into a portable model;
- widen the conclusion only as far as the cases earn.

Avoid copying the density, long detours, nested qualifications, or surface
cadence. Dan's own [writing note](https://danluu.com/writing-non-advice/)
emphasizes that style should follow goals.

## Fly.io: conviction and compression

Fly.io posts such as
[I'm All-In on Server-Side SQLite](https://fly.io/blog/all-in-on-sqlite-litestream/),
[You Should Write An Agent](https://fly.io/blog/everyone-write-an-agent/), and
[We Were Wrong About GPUs](https://fly.io/blog/wrong-about-gpu/) demonstrate
several useful choices:

- make the stance, reversal, or strange mechanism unmistakable;
- reduce the topic to a minimum model the reader can retell;
- carry one request, row, object, or tiny implementation through the mechanism;
- acknowledge the strongest objection and the company's product interest;
- use the title as an honest contract with the reader;
- let voice come from a real relationship to the subject.

Do not copy profanity, snark, imagined objections, or overconfidence. Rhetorical
heat cannot substitute for evidence.

## antirez and h3.c: executable progression

The [h3.c README](https://github.com/antirez/h3.c) shows how one stable fixture
can carry explanation and comparison, how to vary one control at a time, how to
distinguish reference and aggressive paths, and how to describe failed
experiments through visible symptoms. Preserve a route back to the known path.

Do not import specialist vocabulary without explanation or turn every narrative
into an operator manual.

## Sentence-level pacing

Illustrative edit:

> **Before:** The immutability of the initial configuration introduced
> significant migration complexity once the system had active users.
>
> **After:** We picked the wrong setting. By the time we noticed, we had users.
> Fixing it meant moving their accounts.

The revision turns abstractions into actions and lets the mistake, discovery,
and cost arrive in sequence. Use that specificity only when the evidence
establishes who chose the setting, when they noticed, and what the fix required.
