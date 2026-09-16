---
name: align-me
description: Elicit user preferences and resolve material ambiguity before a long autonomous run. Use when the user invokes $align-me or /align-me, or asks to be interviewed, grilled, aligned, or given a batch of decisions before implementation, migration, deployment, design, or other consequential work.
---

# Align Me

Pause before the long autonomous run and surface the choices that could materially change the outcome.

**Output contract:** The deliverable is a self-contained questionnaire in the final answer: every numbered question, every lettered option with its consequence, and every recommendation. A tool call or a summary of decisions is not the deliverable.

## Prepare

1. Inspect available context and perform lightweight, read-only discovery first.
2. Do not ask for facts that can be discovered safely or decisions whose answer would not affect the work.
3. Identify ambiguities involving scope, product behavior, destructive changes, architecture, migration, rollout, safety, cost, or verification.

## Ask the batch

Give one batch of 2–10 numbered questions. For every question:

- State the decision plainly.
- Provide a few mutually exclusive lettered options, normally 2–4.
- Explain the concrete tradeoff or consequence of each option.
- End with a reasonable recommendation and briefly explain why.

Keep the questions compact, specific to the task, and answerable without specialist knowledge. Do not manufacture filler questions. If fewer than two material ambiguities exist, ask only the meaningful question or state the assumptions and proceed.

### Required final-answer output

Write the complete question batch directly in the final user-facing response as ordinary Markdown. Include every option, its tradeoff, and the recommendation. The user must be able to answer by reading that response alone, without expanding activity, opening a panel, inspecting tool arguments, or finding another message. Put the questionnaire before any extended explanation or implementation plan.

Default to text only for this skill. Do not call a native question tool or asynchronous picker merely because one is available. Codex may show question titles while hiding the option payload; a tool response saying `accepted: true` confirms submission, not that the user can see or answer the options.

If a picker is explicitly requested or required by higher-priority instructions, use it only as permitted. Still reproduce the complete batch in the final answer whenever text options are permitted. If higher-priority instructions prohibit text options, respect that restriction: include the full alternatives and consequences in the tool's visible question text when permitted, and explain the output limitation plainly. Never ask the user to approve codes whose definitions are missing from the visible interface.

These are incomplete outputs and must be rewritten before sending:

- “I've sent six alignment choices” followed by a summary or default codes.
- Question titles with recommendations but no alternative options.
- “See the picker / activity above” in place of the questionnaire.
- An `approve all` prompt whose referenced options appear only in tool arguments.

For example:

**1. How broad should the research be?**

- **A — Distribution first:** improve packaging and promotion; keep editorial changes as optional bets. **Recommended** for near-term action.
- **B — Challenge the format too:** include episode length, cadence and guest selection; broader conclusions, more disruption.
- **C — Promotion only:** hold editorial and packaging fixed; narrower but immediately operational.

Before sending the final answer, check the answer text itself:

- Every numbered decision includes all of its lettered options, not just the recommended one.
- Every option states a concrete consequence or tradeoff.
- Every decision ends with a recommendation and its reason.
- Every code in the aggregate default maps to an option printed in this answer.
- The answer remains usable if all commentary, tools, and pickers are hidden.

If any check fails, repair the final answer before sending. Do not shorten the answer by removing the choices; shorten background explanation instead. If text options are prohibited by higher-priority instructions, explain that limitation rather than claiming these checks passed.

Finish with an aggregate default such as:

> Reply **approve all** to accept `1A, 2C, 3B`, or give changes such as `2A, 3C`.

Then stop and wait for the user's response. Do not begin consequential or mutating work while waiting.

## Apply the answers

- Treat **approve all** as approval of every recommended option.
- Accept partial overrides, prose feedback, or follow-up questions without requiring the user to restate accepted choices.
- Restate the final choices briefly only when needed to prevent misunderstanding, then proceed.
- Ask a second batch only when the answers expose a genuinely new material ambiguity.

## Voice

Be candid and useful, not bureaucratic. Make a real recommendation instead of hiding behind neutral option lists. Clearly flag irreversible, production, privacy, security, and data-loss consequences.
