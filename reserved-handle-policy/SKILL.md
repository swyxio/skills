---
name: reserved-handle-policy
description: Design, implement, audit, or refresh protected username and handle namespaces for public products. Use whenever a product has open signup, mutable handles, profile URLs, impersonation or squatting risk, reserved route names, short usernames, common-word or common-name claims, developer/AI terminology, notable social identities, or administrator-approved handle assignment—even if the user only asks for a username denylist.
---

# Reserved Handle Policy

Use this skill to protect a public handle namespace without turning a broad list into an unexplained permanent ban.

## Start with the policy model

Separate two kinds of restriction:

1. `hard_reserved`: platform routes, authority terms, security identities, and service names that users must never claim.
2. `manual_claim_required`: scarce or impersonation-prone names that an administrator may assign after identity review.

Do not report both as merely `taken`. A caller needs to distinguish an existing account, a permanent platform reservation, and a claim that can be reviewed.

Read [rationale.md](references/rationale.md) before changing the tiers or source cohorts. Load [reserved-handles.json](references/reserved-handles.json) only when implementing, auditing, or inspecting the concrete list; it is intentionally kept out of the default context because it contains thousands of names.

## Implementation workflow

1. Locate the canonical handle validator, signup command, rename command, availability endpoint, database uniqueness constraints, and administrator mutation boundary.
2. Preserve the product's existing normalization rules. Compare a normalized lowercase handle and a separator-stripped skeleton where separators are allowed.
3. Apply the stricter result in this order:
   - hard-reserved exact or confusable match;
   - an already-issued current or historical handle;
   - three-or-fewer-character skeleton;
   - manual-claim exact or confusable match;
   - otherwise available.
4. Reject protected names in open signup and self-service rename. Do not add a role-based bypass to those public commands.
5. If manual assignment is in scope, create a distinct administrator command with claimant evidence, reason, actor, timestamp, and audit record. A bootstrap-admin claim may be a narrowly documented exception.
6. Keep historical handles permanently unavailable if old profile or content URLs redirect through handle history.
7. Return an explicit machine-readable reason such as `manual_claim_required` and give the user honest UI copy.
8. Add focused tests for hard reservations, short handles, separators, one example from every cohort, existing/historical handles, bootstrap behavior, and audited assignment.

## Using the bundled registry

Run the classifier against one or more candidates:

```bash
node reserved-handle-policy/scripts/check-handle.mjs admin swyx a_i available-name
```

Validate the registry after editing it:

```bash
node reserved-handle-policy/scripts/validate.mjs
```

The JSON resource is the source of truth. The CSV is a flattened convenience export containing one row per exact handle and all matching cohorts.

## Refreshing cohorts

Read [refresh.md](references/refresh.md) for the source-specific retrieval notes and the exact Hacker News query.

- Treat rankings as dated evidence, not timeless identity truth.
- Preserve source order and rank metadata when available.
- Filter candidates through the product's syntactic handle rules, but record how many source rows were excluded.
- Do not import a raw Reddit karma leaderboard as authoritative. There is no official global ranking, and third-party lists are noisy with bots, repost accounts, deleted users, and unsafe identities. Keep Reddit curated unless a better defensible dataset appears.
- Adding a newly protected name cannot reclaim a handle already issued. Produce a collision report before changing a live policy.
- Keep source URLs, capture date, cohort rationale, and policy version beside the data.

## Handoff

Report:

- counts by tier and cohort;
- normalization and confusable rules;
- collisions with existing or historical accounts;
- which user-facing and administrator flows changed;
- tests run;
- source capture dates and any cohorts deliberately excluded.
