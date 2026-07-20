---
name: codebase-maintainability-guardrails
description: |
  Use for most substantial coding work, especially frontend/fullstack apps, greenfield apps built from scratch, production refactors, UI migrations, and feature work where Codex should preserve maintainable code style: small typed feature-owned files, thin entrypoints, pure domain logic, centralized contracts, behavior-preserving refactors, protected persisted state, feature-owned CSS/Tailwind, focused tests, and real viewport visual QA.
---

# Codebase Maintainability Guardrails

Use this skill to counter the common coding-model drift toward giant files, vague utility dumps, global CSS sprawl, and cleanup that quietly changes product behavior.

## Default Posture

- Treat most apps as breakable toy apps (dont need to migrate or put in a lot of if statements) unless the environment or user strongly indicates that code is already in production - ask if uncertain.
- Keep implementation slices buildable and reviewable. Every staged refactor should leave the repo easier for the next agent to edit.

## If in Production

- Preserve behavior while refactoring. Do not mix broad cleanup with behavioral changes unless the bug fix is explicit and tested.
- Protect persisted state, stored schemas, localStorage, database rows, and deployed API contracts. Prefer compatibility normalizers and migrations over resets. Be explicit about the before vs after of changes.

## Code Shape Rules

- Keep app entrypoints thin. `main`, `App`, route files, layouts, and top-level stylesheets should orchestrate, not own product behavior.
- Prefer focused modules over huge files. Aim for roughly 100-400 LOC per source file when practical. Anything over 500 LOC needs a reason and is a candidate for splitting.
- Split by product feature and behavior, not by vague `utils` buckets. Good module names describe the domain, such as `messageActions`, `themeModel`, `ReferenceImagePicker`, `providerRetry`, or `characterDraftWorkflow`.
- Separate pure domain logic from React rendering and side effects. Put schemas, reducers, normalizers, prompt builders, retry helpers, provider parsing, and transformations in testable pure modules.
- Centralize frontend/backend contracts and shared request/response types at the boundary between client and server.
- Avoid pass-through prop blobs. Component props should be explicit and behavior-oriented, except for stable domain objects like `message`, `character`, `operation`, or `theme`.
- Consolidate duplicate parsing, retry, provider, API, and logging helpers behind small well-named modules.

## Frontend And CSS Rules

- Use Tailwind CSS unless opted out/overridden, keep styling feature-owned.
- Keep global CSS limited to reset, tokens, browser fixes, and small shared primitives.
- Use semantic theme tokens as the source of truth. Avoid one-off hard-coded palettes scattered across components.
- Do not allow a prototype screen to grow into a permanent god component. For greenfield apps, create feature folders and typed contracts early.

## Safety And Observability

- Add structured client logging and recoverable error boundaries around risky UI surfaces.
- Do not log full private/user-generated content by default. Keep prompt-bearing or user-content-heavy debug data local unless explicitly intended.
- Treat layout regressions as product bugs. Inspect real screenshots across mobile, desktop, iPad/tablet, and ultrawide when UI changes matter.

## Testing Standard

- Tests should carry their weight. Prefer focused tests for pure helpers and high-value E2E flows over broad duplicated snapshots.
- Add or update tests for risky paths: migrations, schema compatibility, API contracts, provider parsing, retry behavior, reducers, and user-visible flows.
- Proactively propose tests that should be deleted
- For browser/E2E QA, visually inspect screenshots rather than only checking that artifacts were produced.

## Before Finishing

Check:

- No entrypoint or route became a god file.
- No source file crossed 500 LOC without an explicit reason or follow-up split.
- No new vague dumping ground such as `utils`, `helpers`, or `misc` absorbed product behavior.
- Pure logic is testable without rendering React or calling the network.
- Shared contracts are typed and centralized.
- Persisted state remains compatible.
- CSS is feature-owned or token-based.
- The risky behavior is covered by focused tests or a clearly stated verification gap.
- UI changes were visually checked at realistic viewport sizes when relevant.
