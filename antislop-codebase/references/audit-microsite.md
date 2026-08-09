# Migration Audit Microsite

Use this optional artifact only when the user explicitly requests a migration
microsite or a major migration genuinely needs a visual review surface. A
normal refactor should end with a concise text report.

## Required Questions

- Is the repo clearer and more maintainable?
- How much LOC was added, deleted, and net changed?
- How many files were added, removed, renamed, and modified?
- Which large files collapsed, and what are the new largest files?
- How did directory structure evolve?
- How did tests, e2e, API functions, types, and runtime/deploy risk change?
- What costs and risks remain?

## Data Sources

Use git, not vibes:

- `git diff --shortstat BASE..HEAD`
- `git diff --numstat BASE..HEAD`
- `git diff --name-status BASE..HEAD`
- `git ls-tree -r --name-only BASE`
- `git ls-files`
- `git log --date=iso --pretty=... BASE..HEAD`
- per-file `wc -l` for baseline/current largest files

Use committed `HEAD:file` content for current metrics if the worktree is dirty. List dirty files separately.

## Visuals

Include:

- commit timeline by theme
- LOC/file/API/test before/after charts
- extension/language mix
- directory/module map
- largest files before/after
- maintainability scorecard
- wins, costs, risks, next recommendations

Use inline SVG or embedded CSS/JS; avoid external network assets.

## Serving Preference

Generate under a local artifact folder such as `test-results/migration-audit/`. Start a static local server for the artifact directory and return a clickable `http://127.0.0.1:<port>/` URL. Keep the server running unless the user asks to stop it.

## QA

- Verify the generator runs.
- Cross-check headline numbers with direct shell commands.
- Open the microsite in browser automation.
- Check desktop and mobile screenshots for nonblank charts, readable tables, no horizontal overflow, and acceptable visual hierarchy.
