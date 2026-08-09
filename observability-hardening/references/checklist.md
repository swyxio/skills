# Observability Hardening Checklist

Use only signals needed to answer named operational questions. `Not
applicable` is valid. Prefer provider-native or existing signals and delete
noise before adding a telemetry type, pipeline, dashboard, or alert.

## Counterweight

- Every signal has a named consumer, question, and decision.
- The cheapest sufficient signal is used; logs, metrics, traces, and analytics are not a required bundle.
- Cardinality, volume, retention, privacy, latency, and on-call cost are bounded.
- Alerts have an owner and concrete response.
- External services, retention changes, dashboards, and deployment require explicit authorization.

## Signals

- Structured logs with event name, route/action, status, duration, request/operation id.
- Error classes and safe user/developer messages.
- Metrics selected for named reliability or cost questions.
- Traces or spans only where multi-step ownership cannot be reconstructed more cheaply.
- Product analytics only when product behavior, rather than engineering diagnosis, is in scope.

## Redaction

- No secrets, tokens, cookies, auth headers.
- No raw private content by default.
- Prompt/LLM payloads local-only or explicitly gated.
- Bounded payload sizes and safe serialization.

## Debuggability

- Request id visible in logs and optionally user support surfaces.
- Provider/model/region/version labels.
- Stage history for long-running operations.
- Dashboards or saved queries for top incidents.
- Runbook links for common alerts.

## Validation

- Success path emits expected telemetry.
- Failure path emits sanitized diagnostics.
- Cancel/timeout/retry paths are distinguishable.
- Duplicate events are avoided.
- Production smoke verifies telemetry path when practical.
