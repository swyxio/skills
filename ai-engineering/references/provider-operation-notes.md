# Provider operation notes

Use these conditional adapter notes when they apply; they are not a universal telemetry or lifecycle requirement. Recheck current documentation before changing API calls or relying on a capability.

## OpenAI

- For schema-critical artifacts, use OpenAI's documented Structured Outputs interface rather than prompt-only JSON. Keep local validation and source/domain checks after the provider returns a complete object.
- Capture `x-request-id` and rate-limit headers when debugging, scaling, or correlating failures; a unique `X-Client-Request-Id` can help trace ambiguous timeouts.
- Use observed headers and usage to pace a busy client; do not assume a single token pool or infer throughput directly from worker count.
- Record the requested/actual model, endpoint, and finish reason when behavior comparisons matter. Pin versions and evaluate before treating a model upgrade as behavior-preserving.

Official references: [API overview and headers](https://developers.openai.com/api/reference/overview#debugging-requests), [rate limits](https://developers.openai.com/api/docs/guides/rate-limits), [Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs).

## Anthropic

- When scaling, pace separately for requests, input tokens, and output tokens, and honor `retry-after`; short bursts can still be rejected.
- Cache-read, cache-creation, and uncached-input usage can change rate headroom, so retain that breakdown when optimizing throughput.
- In streaming Messages, inspect the terminal `message_delta` stop reason. Treat `max_tokens`, tool work, pauses, and refusal as different outcomes; a continuation is a new request when it changes coverage.

Official references: [rate limits and headers](https://platform.claude.com/docs/en/api/rate-limits), [stop reasons](https://platform.claude.com/docs/en/api/handling-stop-reasons).

## OpenRouter

- A route may vary unless constrained. For comparisons, debugging, privacy controls, or schema-critical work, record requested provider policy and actual provider/model/generation.
- Prefer the official provider API for schema-critical structured artifacts. If OpenRouter is intentionally used, pin and verify its exact provider endpoint supports native structured outputs; `strict` helps but does not replace application validation, and prompt-only JSON is not an acceptable substitute.
- Diagnostic runs may opt into `X-OpenRouter-Metadata: enabled`; decode its additive fields permissively. Record a router fallback separately when it changes the result contract.

Official references: [provider routing](https://openrouter.ai/docs/guides/routing/provider-selection), [structured outputs](https://openrouter.ai/docs/guides/features/structured-outputs), [router metadata](https://openrouter.ai/docs/guides/features/router-metadata).
