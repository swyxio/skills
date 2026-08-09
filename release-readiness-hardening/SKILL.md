---
name: release-readiness-hardening
description: Audit or harden an existing application's release readiness, including deploy prerequisites, minimal release gates, rollback, production-shaped smoke checks, and post-deploy verification. Use only when the user explicitly asks for a release-readiness review, deploy or release gates, rollback rehearsal, production verification, or hardening of a deployment path. Do not trigger merely because work will eventually be merged, shipped, deployed, or touches CI/CD.
---

# Release Readiness Hardening

Use this skill to answer: can this ship safely, and what is the smallest sufficient proof? Treat every gate, identity, queue, receipt, and manual step as operational cost.

## Counterweight: simplify before adding

- Start from current callers, stored data, provider facts, and failure history. Do not preserve machinery merely because it exists.
- Inventory existing controls before proposing new ones. Delete, combine, or narrow controls that duplicate the same authority or fact.
- Add a gate only for a concrete material failure mode not already covered. Record why a cheaper existing signal is insufficient.
- When one trusted system builds, deploys, and observes production end to end, do not invent signatures, admission ceremonies, or proof handoffs between its internal stages.
- Prefer authoritative external facts—exact source, immutable provider version, traffic, health, and rollback target—over duplicated internal evidence.
- Do not create bookkeeping PRs, proof PRs, smoke commits, or known-impossible release attempts solely to exercise release machinery.
- For self-hosting CI/CD changes, validate with the currently trusted base configuration, then reload the merged configuration after merge. Do not require a new workflow to authorize the change that introduces it.
- A typed pre-mutation failure is a valid safe outcome. Stop, preserve the failure and unchanged production state, and identify the smallest real fix; do not manufacture source changes to obtain different evidence.
- Skip preview, staging, feature flags, smoke data, or extra monitoring when they do not reduce a concrete risk. Mark them not applicable instead of adding ceremony.
- User architecture and scope decisions override this generic checklist. Do not broaden an audit request into implementation or a local implementation request into production mutation.

## Workflow

1. **Inventory release surfaces and cost**
   - Inspect only release surfaces relevant to the requested review: build, runtime config, migrations, storage, queues, providers, health, monitoring, or rollback.
   - Trace the current CI/CD and production path far enough to answer the release question.
   - For each gate, identity, queue, and receipt, name its caller, durable reader, failure mode, and deletion consequence.
   - Produce a concise keep/delete/consolidate map when the release system is already complex.

2. **Choose the minimum sufficient gates**
   - Select focused local checks in proportion to the touched risk; do not default to every global gate.
   - Select integration, migration, smoke, and post-deploy checks only when relevant.
   - Reuse exact provider, source, traffic, and health facts instead of generating parallel evidence.

3. **Close demonstrated gaps**
   - Prefer deleting redundant states and handoffs before adding validation.
   - Add startup or environment validation, health checks, smoke scripts, feature flags, or kill switches only for demonstrated gaps.
   - Keep rollback instructions concrete for code, config, and data changes.

4. **Run an authorized release rehearsal when needed**
   - Execute local gates and record results.
   - Deploy to preview or staging only when it exists and materially reduces risk.
   - Mutate production only when the active user request explicitly authorizes it.
   - Verify only affected routes, state, dependencies, traffic, logs, or metrics.
   - If smoke data was needed, clean it up and confirm no residue.
   - Stop at the first bounded terminal failure; do not patch inline or create synthetic source changes to force another attempt.

5. **Ship report**
   - State shipped version/commit/deployment URL.
   - List gates passed, skipped, or blocked.
   - List known risks, rollback steps, and what to monitor next.

## Quality Bar

- Reviewed required environment fails early with a clear message when relevant.
- Deploy verification uses production-shaped facts when deployment is in scope.
- Rollback is concrete when mutation risk requires it.
- Any smoke test leaves no permanent test data.
- The control set is no larger than the concrete risks justify.
- Safe pre-mutation failure is reported as evidence, not treated as pressure to bypass the design.
- The final answer distinguishes green gates from accepted risk.

For the audit checklist, read [checklist.md](references/checklist.md).
