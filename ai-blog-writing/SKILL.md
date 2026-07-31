---
name: ai-blog-writing
description: Write, revise, or publish public AI/game-research blog posts. Use for research updates, AI release notes, strategy explainers, autoresearch retrospectives, or any request to turn experimental work into a readable MDX-first article with honest evidence and a working preview or deployed URL.
---

# AI Blog Writing

Create posts that let a technically curious reader understand what changed,
why it matters, and what is still unknown. The post is an editorial artifact,
not a source-code handoff.

## Authoring contract

- Put every post body in one human-editable MDX file per slug, normally
  `content/blog/<slug>.mdx`. Keep front matter with title, description, date,
  and eyebrow in that file.
- Use route files only for metadata and shared layout. Do not store prose as
  TypeScript arrays, JSX data structures, or hard-coded page components.
- Compile MDX at build time. On a Worker/Vite stack, prefer the native
  Rollup/Vite MDX integration and compiled front matter; do not parse files at
  request time.
- Reuse one restrained article shell. Add small feature-owned React visual
  components only where the data needs a diagram or chart.

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

## Visual standard

Lead with one straightforward visual that gives the reader confidence:

- funnel for opportunity → gate → activation → conversion;
- before/after bar chart with real counts and an evidence boundary;
- compact board reconstruction for a tactical choice;
- two-lane or timeline diagram when a process is the claim.

Use captions that name the sample, unit, and limitation. Use the game’s real
tile, height, and piece visual language; never substitute generic dots or
unrelated icons. Keep secondary charts below the main story or in an
expandable section. A chart should explain a relationship, not decorate.

## Workflow

1. Inspect the actual result artifacts, source fingerprint, and prior context.
   Do not write a research conclusion from memory alone.
2. Choose a specific audience and one job for the post. For game AI, usually:
   “help players recognize the mechanism” or “explain why the research changed
   direction.”
3. Draft the MDX body and front matter first. Add a short prior-context section
   before describing the latest patch.
4. Build only the visuals required to make the measured evidence legible.
   Keep them accessible: semantic figures, captions, and text equivalents.
5. Build and visually inspect desktop and mobile or a narrow viewport.
6. End every handoff with either:
   - a verified production URL after deployment, or
   - a running local preview URL.

Never make source-file links the primary handoff. State clearly whether the
post is local-only, committed/pushed, or deployed.

## Release checklist

- MDX body is in the content directory and metadata comes from front matter.
- Claims match the actual experiment scope and uncertainty.
- Main chart reports its sample and limitation.
- Links, build, and readable preview pass.
- The user receives a browser URL they can read immediately.
