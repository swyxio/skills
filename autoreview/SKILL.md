---
name: autoreview
description: Perform a structured final code review of a local diff, commit, branch, or pull request. Use only when the user explicitly asks for autoreview, a second review, or a final review before commit, merge, or release, or when repository instructions require one. Do not trigger automatically for ordinary non-trivial edits.
---

# Auto Review

Review the completed change as a closeout check. Use the review capability available in the current environment; do not make completion depend on a particular helper, model, service, or installation.

## Select the real change

- For dirty work, review the staged, unstaged, and relevant untracked diff.
- For a commit, review that commit and its immediate context.
- For branch or pull-request work, compare against the actual base branch.
- Do not push, rewrite history, or manufacture a diff merely to make review possible.

## Review priorities

Inspect the changed code and adjacent ownership boundaries for:

1. correctness and violated invariants;
2. security, privacy, authorization, and unsafe data handling;
3. error handling, retries, concurrency, cleanup, and partial failure;
4. compatibility with persisted state and public contracts;
5. missing or misleading tests;
6. unnecessary complexity introduced by the change.

Prefer concrete defects with a reproducible path. Reject speculative edge cases, style-only churn, unrelated rewrites, and fixes that cost more complexity than the risk warrants.

## Verify findings

- Treat every finding as advisory until confirmed against the real code path.
- Read adjacent code, types, tests, and authoritative dependency documentation when needed.
- Fix accepted findings at the narrowest correct ownership boundary.
- Rerun affected tests after review-driven edits.
- Re-review only the changed result when a fix could have introduced another defect.

Stop when no confirmed actionable findings remain. Do not seek extra reviewers or repeat a clean review solely for more reassuring wording.

## Report

Include:

- the target reviewed;
- findings accepted and rejected, with brief reasons;
- fixes made and tests run;
- remaining risks or verification gaps.
