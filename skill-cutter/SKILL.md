---
name: skill-cutter
description: Critically audit or explicitly trim an existing agent skill to its behavioral core, including narrowing over-broad trigger metadata. Use when the user asks to cut, simplify, shorten, de-slop, or reduce the context cost or trigger aggressiveness of a SKILL.md or skill folder. Do not trigger merely because a skill is long or is being edited for another purpose.
---

# Skill Cutter

Reduce context cost and accidental activation without weakening the behavior the
skill exists to provide. Treat line count as evidence, not the objective.

## Choose the mode

- **Audit:** When asked to review, critique, or identify cuts, inspect and report
  without editing.
- **Cut:** An explicit request to cut, trim, shorten, simplify, or de-slop the
  skill authorizes local edits within that skill. It does not authorize commit,
  push, publication, or changes to consumers outside the requested scope.

## Find the behavioral core

Read the complete `SKILL.md`, its UI metadata, and only the directly relevant
resources. Identify the concrete tasks that should trigger it and the decisions
an otherwise capable agent would get wrong without it.

Classify material before cutting:

| Class | Default treatment |
| --- | --- |
| Non-obvious domain constraint or fragile required sequence | Keep |
| Useful optional expert recommendation | Condense and label as optional |
| Generic knowledge or ordinary engineering advice | Delete |
| Policy already enforced by system or repository instructions | Delete |
| Duplicate instruction or example | Keep the clearest instance |
| Project- or incident-specific policy in a generic skill | Move or delete |
| Stale, unverifiable, or overclaimed fact | Verify, qualify, or delete |
| Detail needed only for one variant | Move to a selectively loaded reference |

Report which class justified every material keep, move, or deletion. Do not hide
subjective policy behind claims that a provider or tool requires it.

## Cut trigger aggression

The frontmatter description is always-loaded routing context. Make it narrow and
concrete:

- name positive user intents and artifacts that should activate the skill;
- remove phrases such as “any task,” “all requests,” and broad product-name-only
  triggers unless universal activation is truly intended;
- add concise exclusions for nearby tasks that should not activate it;
- move no trigger rules into the body, which is read only after activation; and
- keep `agents/openai.yaml` display text and default prompt aligned with the
  narrowed contract.

Do not make the description so timid that explicit requests stop matching.

## Apply the cut

Prefer deletion over compression. Preserve:

- task-specific decision rules and failure modes;
- domain-specific safety or authorization boundaries;
- exact tool or file contracts that are easy to misuse; and
- routing to resources that are genuinely needed conditionally.

Remove:

- explanations written for a novice human when the agent already knows them;
- exhaustive product catalogs, copied manuals, and speculative edge cases;
- mandatory-sounding ceremony that applies only to one project or incident;
- repeated summaries, principles, checklists, and completion language; and
- historical justification that does not change future execution.

Do not preserve text merely because it is correct. Do not replace readable
instructions with dense slogans, and do not move bulk into references simply to
make `SKILL.md` look shorter. Do not delete scripts, assets, or operational
references based only on apparent non-use; inspect their callers and purpose.

For unstable provider claims, check current primary documentation. Separate
provider constraints from optional recommendations and local policy.

## Validate and report

Preserve unrelated work. After editing, update broken links and UI metadata, run
the repository's skill validator, and inspect the final diff.

Report:

- before/after lines, words, and files;
- the retained behavioral contract;
- a compact keep/condense/move/delete classification with reasons;
- trigger changes and exclusions;
- validation performed; and
- uncertain material deliberately left untouched.

A successful cut is smaller and less eager to trigger while still changing the
agent's behavior in every case the skill was created to handle.
