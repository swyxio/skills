---
name: ai-readme
description: Create or substantially revise repository README files that help a specific reader understand a technical project, reach a verified first result, and progress into realistic use, evaluation, debugging, or contribution. Use for project landing READMEs, CLI and library quickstarts, experimental or research repositories, executable engineering notebooks, and contributor-facing repository guides when Codex should reconstruct behavior from code, tests, commands, examples, and history rather than write generic documentation.
---

# AI README

Write a repository-native explanation that earns trust by working. Lead with
what the project is, who it helps, and the shortest verified path to an
observable result. Then reveal the mechanism, tradeoffs, diagnostics, and
internals at the reader's pace.

Combine two complementary habits:

- use an executable, progressive spine: one stable example, working commands,
  expected results, controlled variants, visible failure modes, and a reference
  path when correctness or quality can vary;
- write like a public technical notebook: begin from a real task or curiosity,
  show the decisive artifact near the claim, explain what happened in ordinary
  language, preserve surprise and uncertainty, and stop when the reader's job
  is complete.

For substantial README work, read
[the human-writing review](references/human-writing-review.md) before drafting
and use it again during final review.

## Choose the README's job

Identify the primary job before choosing sections:

- **Project landing page:** help a newcomer understand, evaluate, and try the
  project.
- **CLI or library guide:** get an adopter from installation to one useful call,
  then document common recipes, errors, and the deeper reference.
- **Experiment or research repository:** state the question, setup, runnable
  experiment, observed result, uncertainty, and reproduction boundary.
- **Executable engineering notebook:** preserve a working reference path,
  controlled optimizations, benchmarks, diagnostics, and failed trials beside
  the code they describe.
- **Contributor guide:** explain architecture, invariants, ownership, tests,
  development commands, and safe extension points after the user path is clear.

A README may serve several jobs, but choose one primary reader path. Split a
large implementation ledger, benchmark history, API reference, or contributor
manual into linked documents when keeping it inline would bury first use.

## Keep the front door small

Default to a focused project README of roughly 600–1,500 words. Treat that
range as an editing signal, not a quota. A new evaluator usually needs one
plain definition, honest status, one verified first result, the minimum model,
the limitations that affect adoption, and a short route into deeper material.

Do not draft complete evaluator, operator, researcher, and contributor paths in
the same file. When the chosen reader is an evaluator or adopter, route adapter
catalogs, backup and recovery recipes, full protocol status, security details,
crate maps, and contributor commands to linked documentation unless one of
them changes the adoption decision.

Allow a longer README when its primary job is genuinely an executable
engineering notebook and the reader must compare modes, reproduce experiments,
or diagnose observable failures beside the code. Length is earned by a
progressive recurring example, not by the number of facts available.

## Align with the reader

Before a substantial creation or rewrite, determine what the skill user expects
the reader to **be**, **know**, and **want**. If those expectations are not
already explicit, ask one compact batch using the `align-me` shape:

1. State each reader belief as a numbered decision.
2. Give two to four mutually exclusive lettered choices with concrete effects.
3. Recommend one choice for each decision.
4. End with `Reply approve all to accept 1A, 2B, 3A, or give changes such as
   2C.` Then wait.

Tailor the choices to the repository. A useful default is:

1. **Who is the primary reader?**
   - A. New evaluator or adopter — optimize for understanding and first success.
   - B. Operator or integrator — optimize for setup, behavior, and failure recovery.
   - C. Contributor or researcher — optimize for internals and extension.
2. **What may they already know?**
   - A. General software concepts only — define the domain and every project noun.
   - B. The domain, but not this project — explain the project's distinctive model.
   - C. This ecosystem — move faster, but still define repository-specific terms.
3. **What should they accomplish?**
   - A. Decide whether the project fits and obtain one visible result.
   - B. Reproduce or integrate a real workflow.
   - C. Understand, debug, benchmark, or extend the implementation.

Recommend the new evaluator, domain-but-not-project, and first-visible-result
path unless the repository clearly serves specialists. Do not ask questions the
user has already answered. For a small correction, state the inferred reader
briefly and proceed.

## Establish the truth

Inspect before writing:

1. Read the current README and linked documentation without assuming either is
   current.
2. Inspect build and dependency manifests, public interfaces, CLI help, examples, tests,
   configuration, release metadata, and recent relevant history.
3. Identify the project's real status: proposal, prototype, experimental,
   supported, production-used, deprecated, or unknown.
4. Find the shortest safe first-success path. Run it when reasonably cheap.
5. Capture the actual prerequisite, command, output, duration, environment, and
   cleanup needed to reproduce it.
6. Identify the reference or oracle path when faster, approximate, cached, or
   aggressive modes can change correctness, quality, or behavior.

Do not invent commands, output, support promises, performance, compatibility,
or project intent. Mark a path as unverified when it cannot be run. Preserve
useful failed attempts and reversals when they prevent readers from repeating a
mistake.

## Address the elephant in the first screen

The opening viewport must answer, in ordinary language:

1. What is this project?
2. Who is it for, and what can they do with it?
3. What is its current status or most important limitation?
4. What is the shortest path to seeing it work?

Name the central thing directly. If the repository is a Program Database, say
`Program Database`; do not hide it behind a slogan such as `Record every
thread`. A memorable line may sharpen the explanation, but it cannot replace
the subject, status, or reader promise.

Do not put badge walls, architecture inventories, project history, generated
hero art, or a table of contents ahead of the definition and first useful path.

## Build an executable progression

Prefer this sequence, adapting it to the reader's job:

1. **Inspect or install.** State prerequisites and provide the smallest safe
   setup.
2. **Produce one visible result.** Use one canonical fixture, request, file,
   prompt, or input that can recur through the README.
3. **Interpret it.** Tell the reader what happened and what to notice.
4. **Explain the minimum model.** Reduce the mechanism to the fewest concrete
   parts that predict the observed behavior.
5. **Change one control at a time.** Add realistic recipes or variants and state
   their consequence.
6. **Show the boundary.** Describe limitations and failures through observable
   symptoms rather than `quality regressed` or `may not work`.
7. **Go deeper only on demand.** Move into architecture, API details,
   performance, diagnostics, and contribution after successful use is clear.

Stop when the primary reader can make the next decision. Link the secondary
path instead of completing it inline.

Before every command or code excerpt, state the question it answers. After it,
show or summarize the expected result and explain why it matters. Do not make a
reader reverse-engineer a tutorial from a command inventory.

When tradeoffs matter, use consistent language such as **reference**,
**validated default**, and **aggressive/experimental**. State what may change,
the measured benefit, the test boundary, and how to restore the reference path.
Introduce a second fixture only to test whether the lesson generalizes.

## Explain without sounding generated

Default to a smart adjacent engineer. Give plain behavior before a formal name
or abbreviation. Define every project-specific noun on first use, break dense
noun stacks, and avoid introducing several unfamiliar concepts in one sentence.
A hyperlink can support an explanation; it cannot substitute for one.

Use direct, natural technical language with varied rhythm. Analogy, contrast,
humor, and first-person reaction are welcome when they arise from authentic
notes, experiments, or project history and make the mechanism easier to retain.
Do not invent a human opinion or experience for the repository.

Tone down common AI habits:

- repeated `not X, but Y` or `X is not Y` constructions;
- a title, deck, and every heading competing to be an aphorism;
- uniform three-item lists, symmetrical sections, and compulsory recaps;
- audit vocabulary such as `evidence`, `receipt`, `boundary`, `contract`,
  `durable`, and `exact` when ordinary words would be clearer;
- exhaustive caveats in the main path, artificial drama, or fake certainty;
- treating every available metric, feature, or implementation fact as part of
  the reader's story.

Prefer one real reason the project exists, one stable example, one surprising
observation, and one honest limitation over ornamental polish.

## Use visuals only when they teach

Use an authentic screenshot, compact diagram, measured comparison, or short
annotated output when it lets the reader understand or verify something faster.
Keep the first success available as text and commands. Never use generated
pixels as evidence or let a decorative image displace the definition and
quickstart.

## Review in three passes

1. **Developmental:** confirm one primary reader path, an explicit project
   definition, progressive order, and a clear cut line between README material
   and linked detail. Cut sections written mainly for a secondary reader and
   justify any front-door README that grows beyond roughly 1,500 words.
2. **Explanatory:** audit assumptions, jargon, missing expected results, causal
   jumps, unexplained commands, and whether one example carries the mechanism.
3. **Line:** improve concrete verbs, sentence rhythm, ambiguous references,
   repeated conclusions, AI-favored antithesis, and noun stacks. As a final
   step, sharpen the definition, mechanism, and limitation sentences when they
   can become more memorable without becoming less exact.

Then run a context-isolated cold-reader review for every substantial README.
Give a fresh subagent only the approved reader beliefs and the rendered or
source README—not the repository, task thread, intended answers, suspected
problems, or this diagnosis. Ask it to:

- identify the project, intended reader, status, and first useful outcome;
- predict what the first command will do;
- explain the central mechanism in plain language;
- list undefined terms, missing prerequisites, causal gaps, and promises it
  could not verify;
- name the point where it would stop reading or become lost.

Revise until the cold reader's account matches the intended reader contract.
Do not coach the reviewer toward the desired answer.

## Verify the repository handoff

- Run the documented first-success path and representative tests when safe and
  reasonably cheap.
- Check commands, expected output, links, anchors, code wrapping, narrow-screen
  rendering, and copied snippets.
- Keep installation, usage, reference behavior, and contribution commands
  consistent with the code at the inspected revision.
- Report which paths were executed, which were read from existing evidence,
  and which remain unverified.
- Edit only repository documentation and supporting assets unless the user also
  asked to change product behavior.
