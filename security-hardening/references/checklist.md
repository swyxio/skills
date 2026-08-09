# Security Hardening Checklist

Use only sections reached by the threat model. `Not applicable` is valid. Do
not add a control merely because it appears in this checklist; first confirm a
reachable asset, trust boundary, attacker path, and missing existing defense.

## Counterweight

- Reduce exposure, privilege, or retained sensitive data before adding machinery.
- Verify framework and provider defaults before duplicating them.
- Keep one authorization source of truth.
- Avoid speculative pattern-match findings and unrelated dependency churn.
- Do not rotate credentials or mutate production without explicit authorization.

## Authentication And Authorization

- Session creation, renewal, revocation, cookie flags.
- Role checks on server-side mutations and reads.
- API key scope, storage, rotation, and revocation.
- Admin-only surfaces and hidden client-only checks.

## Input And Network Risk

- Runtime validation on API/body/query/path/provider payloads.
- SSRF: URL parsing, protocol allowlist, private IP blocking, redirects.
- File upload/download: MIME sniffing, extension checks, size limits, storage path traversal.
- CORS/CSRF policy and unsafe methods.
- Rate limits and abuse controls.

## Secrets And Logging

- `.env`, deploy env, CI secrets, provider tokens.
- Secret leakage into client bundle, logs, screenshots, fixtures, analytics.
- Error envelopes that do not expose stack traces or provider raw payloads.

## Dependencies

- Focused package manager audit when dependencies are in scope.
- Lockfile review for unexpected packages.
- Postinstall/build scripts.
- Known CVEs, stale critical deps, abandoned packages.
- Licenses when relevant.

## Output

- Severity-ranked findings.
- Fixed issues and tests.
- Deferred risks and owner/action.
