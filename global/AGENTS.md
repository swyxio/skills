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

- For large runs, check free space, reuse existing inputs, and clear disposable outputs after verification.
- When freeing space, rank worktrees, build caches, and simulators within scope. Remove confirmed disposable items, report free space before and after, and identify recurring sources of growth. On this Mac, `~/.local/bin/worktree-space --all <repo>` ranks a repo's checkouts.
- Before removing a checkout, check active chats and dependent jobs, confirm its changes are merged or saved, and verify an independent copy of unique files, including original media and ignored research. On this Mac, use `~/.local/bin/worktree-run retire-check`.
