# ElevenLabs

Checked 2026-09-22; verify current fields and plan access when executing:

- [Key types, restrictions and rotation](https://elevenlabs.io/docs/overview/administration/workspaces/api-keys)
- [Create service-account key](https://elevenlabs.io/docs/api-reference/service-accounts/api-keys/create)
- [List keys and quota readback](https://elevenlabs.io/docs/api-reference/service-accounts/api-keys/list)

Use provider ID `elevenlabs`, names such as `notes-dev-elevenlabs` and server secret `ELEVENLABS_API_KEY`; requests authenticate with `xi-api-key`. Prefer a dedicated service account for backend automation when the approved multi-seat workspace supports it. Otherwise use a named personal key from the dashboard; do not upgrade the plan or buy seats automatically. Service-account keys do not expire; personal keys can expire. Record actual workspace/resource access rather than claiming a dedicated app name isolates workspace data.

The service-account key API supports `POST /v1/service-accounts/{service_account_user_id}/api-keys` with `name`, feature-specific `permissions` and optional `character_limit`. Use an approved provisioning credential; capture returned `xi-api-key` privately and retain `key_id`. Read back permissions and quota through the list resource. Match the app's actual features, e.g. TTS plus voice lookup only if needed, rather than `all`. IP allowlisting is optional and fits only known stable outbound addresses.

The UI offers credit quotas; the API documents `character_limit` as a monthly character allowance that rejects charge-incurring requests after exhaustion. These are not USD amounts. Derive a conservative quota from the current account plan, enabled products/models and credit multipliers; record units, conversion basis and billing/reset window. Do not assume one credit equals one character or use the subscription's price as a per-key cap. Where conversion or endpoint coverage is uncertain, label the native quota honestly and use the approved USD warning fallback before adding a runtime gate. Include any authorized overage in accounting without changing shared workspace billing settings.

Rotate for the same service account and preserve permissions plus current-period remaining quota; creating a new key must not grant fresh spend. Install/test the replacement, then delete the exact old key. Shared workspace credit balance is not app attribution.
