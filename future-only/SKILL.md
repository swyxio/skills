---
name: future-only
description: Prefer the clean future product contract over legacy or backward compatibility. Use when the user invokes $future-only, says the product is preproduction or has no users, permits breaking changes, or explicitly says not to preserve legacy APIs, schemas, data, migrations, configuration, behavior, or tests.
---

# Future Only

Treat the intended future behavior as the only supported contract.

- Proactively find and remove compatibility shims, deprecated routes, fallback fields, adapters, aliases, dual-write paths, adoption logic, and tests that exist only for obsolete behavior.
- Prefer one canonical API, schema, configuration, and implementation. Update all in-repository callers together.
- Treat preproduction data as disposable. Prefer a fresh baseline, reset, or seed path over backfills, upgrade ladders, historical migration replay, or parallel schemas.
- Delete obsolete coverage only after distinguishing it from tests that still prove current authorization, correctness, security, or user-visible behavior.
- Update active documentation and tooling so they describe only the surviving contract. Historical records may remain clearly historical.
- Do not add a compatibility layer merely to reduce the diff or make old tests pass.

This skill authorizes breaking code, API, schema, configuration, fixture, and test changes within the requested scope. It does not authorize destroying confirmed production or third-party user data. If such data actually exists, stop before irreversible loss and request the smallest explicit approval; otherwise do not preserve hypothetical compatibility.
