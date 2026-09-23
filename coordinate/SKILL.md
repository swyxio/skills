---
name: coordinate
description: Coordinate focused Luna helpers for bounded work and Astra advisers for difficult design questions while doing the main work yourself.
---

# Coordinate

Do the main work yourself, using Luna for scouting or bounded tasks and Astra for advice. Keep small tasks and narrow lookups local. Delegate only when a concrete assignment saves enough time to justify coordination and you can continue useful independent work.

## Luna: `gpt-6-luna`, high

Use Luna for well-defined work or substantial investigations that require synthesizing information across sources. For scouting, give it a concrete question and sources; ask for concise findings with evidence. Use the findings directly and send gaps back to Luna instead of repeating its reads or searches. For changes, specify the owned files, expected behavior, and relevant checks; have Luna implement and verify them. Tell Luna not to spawn agents.

## Astra: `gpt-6-astra`, high

Consult Astra when the approach is unclear, repeated attempts fail, or the task needs cross-cutting design or aesthetic judgment. Share the question, relevant findings, constraints, and what you have tried. Request advice, then use its guidance to continue implementation. Tell Astra not to spawn agents.

## Coordinate

Start helpers with `collaboration.spawn_agent`, `fork_turns: "none"`, the chosen `model`, and `reasoning_effort: "high"`. Give them their assignment and the context needed to complete it, including scope and permitted side effects. Assign disjoint files when helpers make changes concurrently.

Ask helpers to report only to you, with updates that unblock work or change the plan; otherwise report on completion. Relay dependencies between helpers. Continue independent work while they run.

When blocked on helper results, use `collaboration.wait_agent` with `timeout_ms: 60000`. Answer questions or resolve blockers they raise, then resume waiting as needed. After a quiet timeout, wait again without status pings or transcript polling. Keep the user informed at the cadence required by the session. Review helpers' evidence and changes before integrating their work.

When the user adds follow-up guidance, keep a compact worklog file of the goal, current instructions, assignments, decisions, and completed work. Update entries in place; consult it after compaction or handoff.
