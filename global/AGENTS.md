when multiple threads are running simultaneously on the same project, nominate one release coordinator and have it be responsible for merging multiple changes and batching deploys/releases. try to avoid long running branches.

for authenticated sessions/logins for external apps, use @chrome, not the built in app browser from Codex. if @chrome gets stuck, use @computer. Apply ~/.agents/skills/resilient-computer-use/SKILL.md when automation of a browser tab or macOS app window fails. For a physical iPhone or iOS simulator, use iOS tooling. If the Mac's mirroring window itself gets stuck, apply the skill to that window.

Before opening YouTube Studio, verify the active Google account and selected channel. If Studio reports a permission error, check Switch account and compare the channel with the project guide. Announce account switches and use a specific tab ID because a switch affects other tabs.


- Unless it's clear that we are in production (either from instruction or context), we are not, so don't preserve backward compatibility. Remove obsolete paths instead of adding compatibility layers, fallbacks, or migrations.
- Choose the simplest implementation that fully meets the current requirements. You can propose speculative abstractions, configuration, and other alternatives without implementing them until i say so
- Grow the system in layers. Start from the smallest version that works end to end, and add each new capability on top of a product that already works. Never trade a working product for unfinished complexity.
- Keep components modular and concerns clearly separated.
- Prefer established, well-maintained libraries when they reduce overall complexity or improve reliability. Do not reimplement common functionality without a clear reason.
- Lean on the dependencies already in the project before writing your own implementation or adding packages. Do not assume a library lacks a capability without checking its documentation and types.
- Make architectural decisions for the long term. Do not accept a stopgap that only works for now and is meant to be replaced later.
- Study how established products solve the problem before designing a solution. Adopt their proven patterns and conventions rather than inventing an approach from scratch.

my preferred stack is pnpm, typescript, tailwind, cloudflare.

## Shared app layouts

When adding or changing app screens, inherit the existing shared shell: navigation, account controls, workspace switcher where present, and responsive navigation access. Keep that context through loading, empty, error, and permission states, including before a workspace is selected. Fullscreen views require a reliable exit; public pages use consistent public chrome with Sign in / Open app as appropriate, without requiring an account or exposing private navigation. Verify route-level layout coverage within the requested scope; report unrelated gaps rather than expanding a small task into an app-wide redesign.

## Execution efficiency

Optimize for elapsed time to a verified result, not agent count, tool-call count, or apparent parallelism.

Before delegating, classify the task:

- Small: roughly 1–5 related files, one subsystem, clear requirements.
  Use one agent. Do not spawn researchers, reviewers, or coordinators.
- Medium: independent implementation and verification tracks, or two
  genuinely separate subsystems. Use at most two agents when their work
  can proceed concurrently without shared-file conflicts.
- Large: three or more independent deliverables, unfamiliar external
  systems, or substantial research. Delegate only concrete, bounded
  tasks with explicit ownership.

Spawn a subagent only when its expected time savings exceed the cost of
launching, briefing, coordinating, reviewing, and integrating its work.
Do not delegate tasks that the primary agent could finish while waiting
for the subagent to start.

For ordinary implementation work:

1. Select the final working checkout or release worktree immediately.
   Avoid implementing in one worktree and transferring patches to another.
2. Inspect affected files and repository state in one parallel batch.
3. Make one coordinated patch across the affected files.
4. Run independent focused tests and typechecks concurrently.
5. If authorized to ship, commit, push, and open the PR directly.
6. Check asynchronous operations when they are expected to complete;
   avoid repeated polling or leaving finished operations unobserved.

Prefer direct execution over planning, delegation, progress narration,
worktree switching, duplicated inspections, or intermediate status
checks when those actions do not materially reduce risk.

Escalate coordination only when the work exposes a real blocker, an
external dependency, conflicting edits, or production-sensitive risk.

## Worktree storage and cleanup

Reuse the task's checkout when feasible. Create a separate worktree for concurrent edits or a necessary clean validation. Start from tracked source and install dependencies on demand. Before a data-heavy run, check free space, estimate new bytes and set a scratch budget. If a run is growing beyond it, identify the writer and reuse or bound its output before scaling up.

Keep one verified copy of immutable inputs in the project's existing durable store. Reuse those inputs read-only by checksum. Key derived results by inputs, code/model and options, and keep each run's mutable state isolated. Use a small run manifest to record references rather than copying entire prior runs. Preserve the original identity and receipts for pending or uncertain operations.

For new local jobs with sizable output, use the project's equivalent retention convention or separate git-ignored `.artifacts/scratch/<run-id>/` (reproducible intermediates) from `.artifacts/keep/<run-id>/` (work awaiting durable storage). Record the owner, purpose, rebuild command or verified archive, and cleanup condition in the run manifest. Store sole copies of source media, approved outputs and recovery evidence durably before discarding a worktree. After verification, remove the current task's disposable scratch once readers have finished, and report the retained path and footprint.

On this Mac, use `~/.local/bin/worktree-run create <path> --repo <checkout> --branch codex/<task> --base <ref>` for manual worktree creation. This calls native Git and starts with tracked source. For a data-heavy run in either a manual or Codex-created checkout, call `~/.local/bin/worktree-run begin <checkout> --owner <chat> --purpose <task> --rebuild <command> --cleanup-when <condition> --budget-mib <amount>` and pass `--input <expected-sha256> <existing-durable-file>` for each immutable input. Use the returned paths for read-only inputs and the new run-specific scratch path for outputs. Install dependencies in the checkout on demand.

Before retiring a linked checkout, review active chats, then run `~/.local/bin/worktree-run retire-check <checkout> --chats-reviewed` from outside the candidate. Pass `--protect <path>` for current chat working directories and any additional consumers. For a squash-merged PR, pass `--merged-pr <number>`. The check verifies integration, working changes, ignored data, current-user processes and symbolic links, including intermediate directory aliases. A hold or scan error needs investigation. Archive unique local files, recheck ownership and eligibility immediately before an approved removal, and retire only the authorized target. Use Codex’s worktree archive action for an app-managed checkout and `git worktree remove` for a manual checkout. The checker only reports eligibility.

On disk pressure or cleanup requests, proactively inventory linked worktrees across both Codex and manual locations. On this Mac, `~/.local/bin/worktree-space --all <repo>` ranks large folders across the registered checkouts. Distinguish checkout bytes, dependencies, run artifacts, shared blocks and verified reclaimable bytes. Name the largest writer, why its files accumulated, what is safe to retire and how to prevent recurrence. Treat legacy mixed or ignored directories as unclassified until their contents and recovery needs have been checked.
