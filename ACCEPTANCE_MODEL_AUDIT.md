# Skill Acceptance-Model Audit

## Result

Skills in this repository are advisory lenses. They may identify risks, useful
checks, and follow-up opportunities, but they do not create acceptance gates by
themselves.

```text
User outcome
  + higher-level invariants
  + risks created by this action
  = blocking acceptance criteria

Everything else is advice or follow-up.
```

The tracked authoring guidance in `README.md` defines five instruction classes:
invariant, action-required, risk-triggered gate, recommendation, and
opportunity. It also sets a normal expansion budget of one or two skill-added
blocking criteria for bounded work, with exceptions only for direct
correctness, privacy, security, data-integrity, or irreversible-action risks.

## Audit method and inventory

The repository-wide screen covered all 84 present `SKILL.md` entrypoints: 78
tracked skills and 6 Git-ignored managed system skills. It checked routing
descriptions and mandatory/checklist language for silent scope expansion,
exhaustive verification, circular release dependencies, global coordination,
missing stop conditions, and adjacent improvements promoted to gates. The broad
skills named in the task and every screen hit received a closer behavioral read.

| Skill or guidance | Disposition |
| --- | --- |
| `README.md` authoring guidance | Changed: added the shared acceptance model, evidence scale, expansion budget, coordination boundary, break-glass rule, and user-override boundary. |
| `.system/skill-creator` | Inspected and used. It already preserves scope and matches specificity to risk, but is intentionally Git-ignored and managed outside this repository, so it was not force-added. The tracked authoring rule now lives in `README.md`. |
| `skill-cutter` | Changed: added acceptance-force classification and explicit cuts for accidental gates, global coordination, circular repair, and post-completion proof. |
| `forge` | Changed in the immediately preceding Forge-specific commit: preserved the customer exact-SHA lane while documenting the lower-level Wrangler repair path, bounded evidence, proportional coordination, and stop condition for Forge infrastructure. |
| `cli-ux` | Changed: narrowed routing; made broad design sections selective; limited preflight, dry runs, adversarial cases, and tests to risks created by the changed command. |
| `release-readiness-hardening` | Retained: already says “smallest sufficient proof,” rejects unrelated global gates, handles self-hosting circularity, and requires production authority. |
| `security-hardening` | Retained: threat-first, explicit-only routing and scoped residual-risk reporting already prevent checklist application while preserving security invariants. |
| `observability-hardening` | Retained: question-first telemetry, named consumers, explicit-only routing, and scoped validation are already proportional. |
| `test-strategy-hardening` | Retained: explicitly rejects completeness ladders and global suites, and defines a risk-scaled stop condition. |
| `cloudflare-production-builder` | Retained: already separates diagnose/recover/change modes, forbids mutation during diagnosis, and limits checks to affected rollout axes. |
| `workers-best-practices` | Retained: Workers-specific routing, selective references, evidence-backed findings, and explicit refusal to become a production-readiness program. |
| `live-ai-pipelines` | Retained: complex machinery is risk-triggered; optional enrichment is non-blocking; resume and publication scale with workflow duration. |
| `app-ux-paradigms` | Changed: replaced universal “must-have” and new-UI checklist semantics with touched-interaction defaults; removed project-specific examples from the generic skill. |
| `mobile-webapp-ux` | Changed: limited completion to the named mobile loop and agreed viewport; made 390 × 844 a practical reference, not a new support contract. |
| `visual-playtest` | Retained: already limits states and controls, separates review from mutation, and stops at the named issue plus closest responsive variants. |
| `web-perf` | Rewritten: removed mandatory five-phase audit, accessibility detour, mandatory MCP installation, and generic bundler inventory; now selects evidence by the named metric and stops when it is explained or comparably verified. |
| `next-steps` | Retained: read-only bounded discovery, optional/monitor choices, and “recommendations are not authorization” already keep follow-ups out of the current gate. |
| `conference-developer-endpoints` | Changed after corpus screen: one endpoint no longer implies the full endpoint/MCP/CLI/docs/skill suite; public-data privacy remains invariant. |
| `data-chatbots` | Changed after corpus screen: incidents and platform layers are selected by touched data risk; draft/apply integrity and explicit destructive approval remain invariants. |
| `public-qa-chatbot` | Changed after corpus screen: caching, retrieval, tracing, virtualization, voice, and service choices are a catalog rather than a mandatory stack; public abuse, cost, privacy, and secret boundaries remain protected. |
| Other 60 tracked skills and 5 managed system skills | Screened. Mandatory language was either absent, narrow to the named workflow, or tied to a concrete domain invariant. No boilerplate was added. |

## Problematic wording and correction

| Before | Why it could become a gate | After |
| --- | --- | --- |
| `cli-ux`: “For every CLI change… At minimum, check” twelve adjacent concerns. | A help-text fix could inherit auth, pagination, portability, destructive-action, and accessibility work. | The scan applies to broad designs/reviews; focused mismatches skip it and surface unrelated findings as follow-ups. |
| `cli-ux`: “Provide --dry-run for mutations.” | Every harmless network update could be blocked on a new dry-run architecture. | Dry run is risk-triggered when target/effect preview materially reduces mutation risk. |
| `app-ux-paradigms`: “Must-have behaviors” plus “Checklist for new UI.” | Any interaction review could become a product-wide keyboard/modal/form certification. | Common expectations and a selective lens apply only to touched interactions. |
| `mobile-webapp-ux`: test 390 × 844 “before considering the work complete.” | A generic reference viewport silently became a product support promise and gate. | Use the product's agreed viewport; 390 × 844 is a practical fallback reference. |
| `web-perf`: mandatory MCP preflight and five-phase checklist including accessibility and codebase analysis. | A named LCP regression inherited tool installation, network, accessibility, and bundler audits. | Use any available measurement path and only evidence that can answer the named performance question. |
| `conference-developer-endpoints`: “What To Build For Each Conference” listed seven surfaces. | Adding `sessions.json` implied MCP, CLI, developer page, agent skill, and all other endpoints. | The list is a full-suite catalog; one endpoint changes only that endpoint and shared public-data boundary. |

## Before and after acceptance examples

### Docs-only edit

- **Before:** Load every relevant checklist, run product/release preflight, and
  keep validating adjacent repository concerns.
- **After:** Acceptance is the requested text change plus formatting and link
  validity. An unrelated stale example is a follow-up unless it makes the edit
  false or unusable.

### Bounded CLI fix

- **Before:** Fixing one `--help` mismatch triggers typed-registry redesign,
  authentication-state review, dry-run support, hostile-input tests, and the
  full process matrix.
- **After:** Correct the authoritative help/parser contract and run the focused
  help or process test. Auth changes only if the mismatched command actually
  changes credential behavior.

### Worker production repair

- **Before:** A stuck Forge Worker must traverse the broken canonical release
  system, prove unrelated Sites/preview state, and continually coordinate with
  unrelated work.
- **After:** An authorized Forge operator may use the documented Wrangler
  break-glass path after resolving the exact component/version and rollback.
  Acceptance is component health, one bounded reproduction, and rollback
  availability; exact-SHA and production-pointer safety remain intact for
  customer deployments.

### Migration

- **Before:** Either a generic focused test is accepted as enough or every
  release checklist item becomes blocking.
- **After:** The migration's own data-integrity risk adds stronger gates:
  authoritative target and sequence, compatibility/integrity checks, and a
  rollback or forward-repair path. Unrelated monitoring or UI cleanup remains
  follow-up work.

### Destructive data operation

- **Before:** Generic speed-oriented proportionality could be misread as
  permission to skip ceremony, or generic checklists could add unrelated gates.
- **After:** “Delete these users” remains blocked until identities and scope are
  exact, authorization is explicit, recoverability or irreversibility is clear,
  and the result can be reconciled. Unrelated account-quality improvements do
  not join the deletion gate.

## Representative prompt validation

| Prompt | Expected behavior under the revised model |
| --- | --- |
| “Fix one CLI help mismatch.” | Change the authoritative help/contract source and run a focused process or contract test. Do not redesign authentication. |
| “Repair a stuck worker using Wrangler.” | If authorized to mutate production, use the lower-level operator path when the canonical lane is broken; resolve exact component/version, preserve rollback, check health, and reproduce once. |
| “Diagnose a production issue.” | Remain read-only. `cloudflare-production-builder` explicitly separates diagnosis from recovery and mutation. |
| “Deploy this app through Forge.” | Use Forge's exact pushed SHA and authoritative production pointer; a direct provider deploy is not a customer-app promotion shortcut. |
| “Delete these users.” | Require exact targets, explicit authorization, recoverability/irreversibility clarity, and post-action reconciliation. |
| “Review UX.” | Inspect and report relevant interaction behavior; do not mutate unrelated product surfaces. |
| “I noticed another useful improvement.” | Record it as a follow-up unless it is necessary for the requested result's correctness, safety, or usability. |

## Stop condition

This audit is complete when the shared tracked authoring rule is present, each
credible accidental gate found by the corpus screen is removed or reclassified,
real invariants remain explicit, every changed skill validates, and the seven
representative prompts map to bounded acceptance behavior. Additional style or
maintainability improvements are outside this audit.
