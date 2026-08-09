---
name: security-hardening
description: Audit or harden a software repository against a defined application-security threat surface. Use only when the user explicitly asks for an appsec or security review, a repository-wide security hardening pass, a threat-focused auth or permission audit, or when security posture is the primary task. Do not trigger for an ordinary auth bug, adding one rate limit or validation rule, routine dependency updates, generic production readiness, or unrelated implementation work that merely has security implications.
---

# Security Hardening

Use this skill for pragmatic appsec work that produces prioritized fixes and residual-risk notes. Do not turn it into a compliance theater exercise.

## Counterweight: threat before control

- Start with assets, trust boundaries, attacker capability, exposure, and plausible abuse paths. Do not apply the checklist uniformly.
- Add or change a control only for a concrete reachable risk. Record when framework or provider defaults already cover it.
- Prefer removing exposure, privilege, data, or code over adding middleware, policy layers, scanners, and monitoring.
- Do not add rate limits, CORS/CSRF machinery, headers, runtime schemas, encryption, secret rotation, or dependency upgrades where the threat model does not require them.
- Preserve one authorization source of truth; do not duplicate permission checks across artificial layers.
- Avoid speculative findings based only on pattern matches. Confirm actual callers, deployment topology, and runtime behavior.
- Keep fixes focused. Do not turn one vulnerability into a repo-wide security program, compliance project, dependency refresh, or release ceremony.
- A scoped review may correctly conclude that no code change is needed. Report accepted and out-of-scope risk plainly.
- Do not mutate production, rotate credentials, contact users, or change provider policy unless the active request explicitly authorizes it.

## Workflow

1. **Map the attack surface**
   - Identify only the assets, entrypoints, trust boundaries, privileges, storage, and egress relevant to the defined review.
   - Trace plausible attacker paths through actual callers and deployment topology.

2. **Build a risk-ranked plan**
   - Prioritize exploitable paths over theoretical issues.
   - Separate must-fix before release, should-fix soon, and accepted/deferred risks.
   - Preserve product behavior unless the vulnerability requires a behavior change.

3. **Harden the highest-risk paths**
   - Add or tighten authorization checks at server/action boundaries.
   - Validate untrusted input at external/API/provider boundaries.
   - Protect secrets and redact sensitive logs.
   - Add rate limits, origin controls, CSRF/CORS policy, SSRF protections, upload constraints, or security headers only where the mapped threat requires them.
   - Audit dependencies and package scripts only within the reviewed attack surface.

4. **Prove the fixes**
   - Add focused tests for permission bypasses, input rejection, dangerous URL/file cases, auth/session edge cases, and safe error/log payloads.
   - Run focused dependency or security tools when their signal applies to the reviewed surface.
   - Document what could not be verified.

5. **Report residual risk**
   - List fixed issues with evidence.
   - List remaining risks with severity, exploit sketch, and recommended next action.
   - Avoid claiming the app is "secure"; state the reviewed scope.

## Quality Bar

- Every reviewed server mutation has an authorization story.
- Reviewed secrets are not exposed through reachable logs, clients, fixtures, or outputs.
- Reviewed external inputs have threat-appropriate validation before side effects.
- Reviewed dangerous network or file operations have threat-appropriate restrictions.
- Focused tests prove the highest-risk changed bypass or failure cases.

For the audit checklist, read [checklist.md](references/checklist.md).
