---
name: observability-hardening
description: Audit or improve observability for named production questions, incidents, or opaque operations using privacy-safe telemetry. Use only when the user explicitly asks for an observability or instrumentation pass, telemetry design, dashboards or alerts, or when inability to explain production behavior is the primary problem. Do not trigger for ordinary debugging, adding one log line, generic production readiness, product analytics alone, or implementation work that merely benefits from diagnostics.
---

# Observability Hardening

Use this skill when the product works but failures are opaque. The output should make production behavior explainable without leaking private data.

## Counterweight: questions before telemetry

- Start with the operator or user question that cannot currently be answered. Add no signal without a named consumer and decision.
- Inspect provider-native logs, metrics, traces, request IDs, and dashboards before building parallel telemetry.
- Choose the cheapest sufficient signal. Do not add logs, metrics, traces, dashboards, alerts, analytics, and user-visible state as a bundle.
- Instrument ownership boundaries and material state transitions, not every function or phase.
- Prefer a saved query or clearer existing event over a new pipeline, schema, SDK, collector, or dashboard.
- Budget cardinality, volume, retention, latency, privacy, and on-call noise. More telemetry can make diagnosis worse.
- Add an alert only when someone owns a concrete response. Add user-visible progress only when users must wait or act.
- Do not turn a local debugging gap into a repository-wide observability program or product analytics redesign.
- A scoped audit may conclude existing signals are sufficient or recommend deletion of noisy telemetry.
- Do not configure external services, create dashboards, change retention, or deploy instrumentation unless the active request explicitly authorizes it.

## Workflow

1. **Map what must be understood**
   - Trace only the user, route, job, provider, or cost boundaries relevant to the named question.
   - Inspect current provider and application signals that may already answer it.

2. **Define telemetry contracts**
   - Choose only the event, label, correlation, and redaction fields required by the question.
   - Separate product analytics from engineering diagnostics.
   - Keep user/prompt/content-heavy payloads local or redacted unless explicitly allowed.

3. **Instrument high-value paths**
   - Add request or correlation IDs only where a multi-boundary question requires them.
   - Add structured transition logs or safe error classification only when needed.
   - Add only metrics required by named operational questions.
   - Add user-visible operation state only when users must wait, retry, or act.

4. **Make it usable**
   - Prefer the smallest saved query, dashboard, or developer/admin view that answers a real question.
   - Define alert thresholds only for actionable failures.
   - Document the resulting query or diagnostic path when it will be reused.

5. **Validate**
   - Run focused local or production-shaped checks proportional to the changed telemetry path.
   - Verify logs/events are emitted, correlated, redacted, and not duplicated.
   - Test representative failure paths.

## Quality Bar

- Reviewed critical failures can be traced across the boundaries relevant to them.
- New signals are structured and low-cardinality where needed.
- Sensitive content is redacted by default.
- Alerts map to actions, not noise.
- Reviewed long-running operations expose only the state users or operators need.

For the audit checklist, read [checklist.md](references/checklist.md).
