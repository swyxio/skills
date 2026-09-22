# OpenAI

Official references checked 2026-09-22; refresh before execution:

- [Project service accounts and keys](https://developers.openai.com/api/reference/cli/resources/admin/subresources/organization/subresources/projects/subresources/service_accounts)
- [Project settings and budgets](https://help.openai.com/en/articles/9186755-managing-projects-in-the-api-platform)

Use the approved API organization and a dedicated app/environment project. An admin credential provisions resources; runtime uses a project-bound service-account key. Never install the admin key in the app.

`POST /v1/organization/projects/{project_id}/service_accounts` with `name` returns `api_key.value` by default. Capture privately. Current docs also support `POST /v1/organization/projects/{project_id}/service_accounts/{service_account_id}/api_keys` with `name`, `scope`, and `expires_in_seconds`. Verify supported scopes before selecting them; avoid extra default keys when establishing least privilege. Independently verify project, service account, permissions and expiry.

Project monthly budgets are soft thresholds: requests continue beyond the amount. Configure alerts/model permissions as appropriate, but never label the budget a hard cap. The lifetime starter allowance requires an atomic runtime spending gate before paid traffic. Cover the app's actual enabled endpoints, tools and ancillary charges with current prices and bounded output. If coverage is incomplete, keep paid execution disabled and report that key installation alone does not fulfill capped provisioning.
