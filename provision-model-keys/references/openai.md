# OpenAI

Checked 2026-09-22; verify current fields when executing:

- [Service accounts and keys](https://developers.openai.com/api/reference/cli/resources/admin/subresources/organization/subresources/projects/subresources/service_accounts)
- [Spend limits](https://developers.openai.com/api/docs/guides/spend-limits)

Use the approved organization and dedicated app/environment project. Admin credentials provision scope; the app gets a project service-account key with the endpoints/models its features need.

`POST /v1/organization/projects/{project_id}/service_accounts` with `name` returns `api_key.value` by default. Capture privately. The service-account `/api_keys` resource supports named keys, scopes and expiry; verify current supported fields before use. Avoid minting redundant default keys.

Project Limits → Spend → Edit spend limit supports a monthly amount and **Enforce a hard limit**. Enable enforcement for the app's allocation when available and configure alerts before exhaustion. Read back the enforcement setting: an amount/alert alone is not a hard cap. Hard-limit billing errors identify project/organization spend exhaustion; enforcement can lag slightly. Prefer the project control over modifying organization limits shared by unrelated apps. If unavailable, use the approved soft-warning fallback before considering a runtime gate.
