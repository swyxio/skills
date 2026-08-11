# Provider operation notes

Use these as adapter-level rules, not as a substitute for provider-neutral request profiles, validation, cache lineage, or run lifecycle. Recheck current documentation before changing API calls or relying on a capability.

## OpenAI

- Record `x-request-id` and send a unique, sanitized `X-Client-Request-Id` when the transport permits it; use either identifier to correlate ambiguous timeouts with support or internal telemetry.
- Feed the admission controller from `x-ratelimit-*` request/token headers and, when present, project-token headers. Do not assume a single global token pool.
- Treat requested output capacity as a reservation input to rate planning where the endpoint documents that behavior. Calibrate against actual headers and usage instead of converting a workers value directly into throughput.
- Keep the requested model version, actual model, endpoint/API surface, schema hash, and finish reason in the attempt record. Pin versions and evaluate before interpreting a model upgrade as behavior-preserving.

Official references: [API overview and headers](https://developers.openai.com/api/reference/overview#debugging-requests), [rate limits](https://developers.openai.com/api/docs/guides/rate-limits), [Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs).

## Anthropic

- Pace against separate RPM, input-token, and output-token constraints; do not model the service as one combined TPM bucket.
- Honor `retry-after`. Ramp traffic smoothly because short-window and acceleration limits can reject a burst that looks safe at a one-minute average.
- Capture `anthropic-ratelimit-*` headers. Keep cache-read, cache-creation, and uncached-input usage distinct: caching changes both economics and effective input-rate headroom for most models.
- In streaming Messages responses, finalize the attempt only after the terminal `message_delta` carries `stop_reason`. Handle `max_tokens`, `tool_use`, `pause_turn`, and refusal as distinct outcomes; a continuation is a new effective request with explicit coverage semantics.

Official references: [rate limits and headers](https://platform.claude.com/docs/en/api/rate-limits), [stop reasons](https://platform.claude.com/docs/en/api/handling-stop-reasons).

## OpenRouter

- Treat the route as variable unless it is constrained. Record requested model(s), provider preferences, actual provider/model, generation ID, router attempts, region/privacy restrictions, and routing metadata when available.
- For schema-critical work, require structured-output parameters during provider routing and verify support per endpoint, not merely per model. `strict` improves enforcement but does not make validation optional.
- Opt in to `X-OpenRouter-Metadata: enabled` for diagnostic runs. Decode metadata permissively; its fields are additive. Recover a post-mortem generation record from `X-Generation-Id` when appropriate.
- Make router fallbacks explicit in the effective request identity. An implicit provider or model fallback is not identical to the originally requested transport contract.

Official references: [provider routing](https://openrouter.ai/docs/guides/routing/provider-selection), [structured outputs](https://openrouter.ai/docs/guides/features/structured-outputs), [router metadata](https://openrouter.ai/docs/guides/features/router-metadata).
