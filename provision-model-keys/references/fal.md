# fal.ai

Checked 2026-09-22; verify current fields when executing:

- [Account identity, key scopes and FAL_KEY](https://fal.ai/docs/documentation/setting-up/authentication)
- [Programmatic key creation](https://fal.ai/docs/platform-apis/v1/keys/create) and [scope readback](https://fal.ai/docs/platform-apis/v1/keys/list)
- [CLI key lifecycle](https://fal.ai/docs/api-reference/cli/keys)
- [Model pricing and spend monitoring](https://fal.ai/docs/documentation/model-apis/pricing)
- [Account credit readback](https://fal.ai/docs/platform-apis/v1/account/billing)

Use provider ID `fal`, names such as `notes-dev-fal` and server secret `FAL_KEY`. Verify personal versus team account before creation; keys belong to that account. `API` scope supports model calls and API-scoped platform endpoints. Keep `ADMIN` scope for provisioning/deployment credentials, outside the inference app. API scope is broad within the account, not a per-model allowlist; enforce app-specific model selection in its server paths. Do not modify shared organization access policy for one app.

Prefer `POST https://api.fal.ai/v1/keys` with an approved ADMIN key, `Authorization: Key <credential>` and body `{"alias":"notes-dev-fal"}`. Read back the created key’s scope from inventory before installing it; if API scope cannot be verified, use the CLI/dashboard path that selects API explicitly. It returns one-time `key_secret` and full `key` (`key_id:key_secret`); capture the full value privately, retaining only `key_id` in the receipt. Alternatively, the authenticated CLI supports `fal keys create --scope API --desc notes-dev-fal`, list and revoke; intercept credential-bearing output privately. Never print the creation response. Reconcile uncertain creation through inventory before retrying.

The documented key-creation schema exposes an alias, not a per-key USD cap/reset field. Account credits are shared; `GET /v1/account/billing?expand=credits` requires an ADMIN credential and does not establish app spend. Check approved account controls before claiming a hard cap. Otherwise use the accepted warning/monitoring fallback, with request attribution and current endpoint prices; add a runtime gate only when needed. Estimate from actual billable units, including output count, video length/resolution or GPU time. Bound queued/concurrent jobs and retries, and reconcile request-level charges. A small media smoke test counts against the same monthly app allowance. Never auto-purchase credits or enable recharge.

Rotate by creating/installing/verifying a replacement and revoking the exact old key. Preserve usage accounting and recurring budget; do not deploy GPU workloads just to test an inference key.
