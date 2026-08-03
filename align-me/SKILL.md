---
name: align-me
description: Elicit user preferences and resolve material ambiguity before a long autonomous run. Use when the user invokes $align-me or /align-me, or asks to be interviewed, grilled, aligned, or given a batch of decisions before implementation, migration, deployment, design, or other consequential work.
---

# Align Me

Pause before the long autonomous run and surface the choices that could materially change the outcome.

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
