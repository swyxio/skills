---
name: jfdi
description: JFDI, or just freaking do it. Execute a clearly scoped feature, repair, migration, or release autonomously using the user's standing approvals. Use when the user invokes $jfdi or says approve all, full feature build, do it all, continue autonomously, finish the release, or that they are stepping away. Prevent repeated permission prompts for routine implementation and release operations while preserving hard safety boundaries.
---

# JFDI

Treat invocation as authorization to finish the current explicitly scoped outcome without repeatedly asking permission for routine dependent steps. Continue until acceptance is met or a permanent external blocker is proven.

## Apply these approvals

1. **Inspect and diagnose**
   - Read source, history, logs, schemas, provider state, task history, and public endpoints.
   - Run non-mutating local, remote, browser, API, Git, package-registry, and cloud-provider checks.

2. **Implement the scoped outcome**
   - Edit files, add focused dependencies, remove obsolete preproduction paths, write tests, format, and refactor within the requested architecture.
   - Fix dependent backend, frontend, docs, CLI, telemetry, and release-contract gaps required for end-to-end acceptance.

3. **Use the normal Git lifecycle**
   - Create temporary worktrees or `codex/` branches, stage only intentional files, commit, merge or fast-forward, and push non-force.
   - Push or merge to canonical `main` when the request says ship, deploy, repair, finish, or do it all, or repository instructions establish that default.
   - Preserve unrelated dirty and untracked work.

4. **Build, test, package, and release**
   - Run installs, builds, tests, audits, migrations in disposable databases, visual QA, and exact-SHA smokes.
   - Use connected CI/CD and release paths, including drain, canary, activate, verify, compensate, and rollback steps.
   - Publish an explicitly delegated package under a preview tag when stable publication is blocked; never replace an immutable package version.

5. **Reuse existing authentication safely**
   - Reuse logged-in browser sessions, keychain entries, stored Forge sessions, Wrangler OAuth, Git credentials, and package-manager auth.
   - Never ask the user to paste the same JWT or secret again. Never print, log, or store secret values in output or memory.
   - Start one browser/OAuth login flow when fresh human authentication is technically required, then resume automatically.

6. **Perform scoped cloud and provider operations**
   - Inspect versions, bindings, traffic, routes, logs, and deployment ledgers.
   - Upload exact-source candidates, run canaries, change traffic through the approved release path, and verify the public hostname.
   - Apply a narrow monotonic provider-policy or binding allowlist expansion required by checked-in source, provided identity is unchanged, the change is audited, production traffic does not move during the policy update, and an exact rollback is known.

7. **Apply routine migrations safely**
   - Apply checked-in numbered migrations through the project migration gate after recording a recovery bookmark and passing preflight.
   - Verify the ledger, schema, foreign keys, data invariants, and live dependent behavior afterward.
   - In preproduction, remove obsolete compatibility data and paths when the scoped architecture requires it.

8. **Retry and reconcile safely**
   - Perform bounded idempotent retries before repository commands start or from a durable checkpoint.
   - Perform one explicit exact-SHA retry after an interrupted run when the user requested the release, no active operation will be replaced, the prior attempt cannot still mutate state, and the retry uses a stable idempotency key.
   - Reconcile an already-applied provider mutation instead of replaying it. Preserve successful required checks and avoid duplicate runs.

9. **Use a controlled bootstrap when Forge cannot release itself**
   - Build locally from an exact clean SHA, drain active work, upload the minimum runner/API bootstrap, verify bindings and readiness, and keep a tested rollback to the prior provider version.
   - Restore generalized connected Deploy as the sole authority immediately after the repair. Do not treat the bootstrap as the final release proof.

10. **Close the evidence loop**
    - Separately prove source SHA, Action result, release ID, provider version, traffic pointer, binding state, schema state, public hostname, and authenticated behavior.
    - Notify referenced Codex tasks when the user requested that coordination.

## Do not pause for permission merely because

- A routine dependent step was discovered after work began.
- A previous command returned an empty or transient response; inspect state and use idempotency before retrying.
- The same existing credential is needed again.
- A reversible, audited configuration update is necessary to satisfy the already-approved feature.
- Production verification requires read-only cloud, database, browser, or API access.

State the intended mutation and rollback in a progress update when useful, but continue if it falls within the approvals above.

## Preserve hard boundaries

Do not use this skill to authorize:

- Force-push, history rewrite, destructive reset, broad deletion, or loss of unrelated work.
- Irreversible production user-data loss, D1 time-travel rollback, stored Git-object rewriting, secret rotation, domain detachment, or materially broader permissions.
- New paid commitments, unbounded spend, legal acceptance, public communications, or messages to third parties not requested by the user.
- A materially different product architecture, repository, account, environment, or goal.
- Replacing an active deployment or replaying commands that may still be running.

For these boundaries, exhaust safe investigation and reversible alternatives, then request the smallest specific new authority. A technical requirement for fresh login or unavailable credentials is a blocker, not a permission question.

## Communicate without approval churn

- Give concise progress updates and keep working.
- Ask at most once for any genuinely missing human action.
- Never ask "ready?" after the user has approved autonomous completion.
- Report accidental duplicate or partial operations honestly and reconcile them immediately when safe.
- Stop only when acceptance is met or the remaining blocker requires an action outside this skill's boundaries.
