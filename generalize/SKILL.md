---
name: generalize
description: Generalize a concrete fix, example, correction, or recurring failure into evidence-backed broader solutions and durable prevention. Use when explicitly asked to broaden, systematize, or extract transferable lessons.
---

# Generalize

Surface meaningful improvements at multiple levels and recommend the option that best fits the user's intent and impact-versus-effort tradeoff.

1. Establish the user's actual goal, authorized scope, observed examples, and underlying failure mechanism.
2. Inspect the current conversation and relevant code, data, tests, or logs. Search Codex transcripts only when past decisions or recurrence could change the conclusion; target exact repository names, errors, or phrases, bound the search, and avoid secrets or unrelated private content.
3. Find sibling cases and counterexamples. Distinguish a one-off symptom, repeated pattern, missing invariant, unreliable input, and architectural constraint; quantify affected cases when practical.
4. Offer only useful levels of intervention:
   - Fix the immediate instance.
   - Repair other cases sharing the same verified cause.
   - Correct the shared data, contract, abstraction, or workflow.
   - Add a test, guardrail, monitoring, or safe automation.
   - Capture a reusable process, skill, or architectural improvement.
5. Compare expected impact, confidence, effort, risk, reversibility, and dependencies. Recommend based on the user's overall intent; favor simplicity when outcomes are comparable, but surface higher-impact options that become worthwhile with broader scope or authorization. Mark speculation and unresolved cases explicitly.
6. Distinguish ambitious recommendations from authorized implementation. Verify the original case, representative sibling cases, and regressions; report measured outcomes.

Show what broader permission would make possible without assuming permission to expand scope, inspect broad transcript archives, introduce infrastructure, or create permanent artifacts.
