---
name: design-apps-with-imagegen
description: Explore and implement app or site redesigns through free Mobbin reference research, four distinct ImageGen directions, user selection or delegated choice, and matched visual critique. Use for image-led design exploration, not routine UI fixes or implementation of an already selected design.
---

# Design Apps with ImageGen

Explore composition and interaction through images, implement the chosen direction, and compare the actual product against it.

## 1. Establish scope

Inspect the affected screens, real content, capabilities, state owners, and responsive behavior. Separate existing contracts from proposed changes. Preserve scoped functionality and data unless the user authorizes changes; generated controls and text are proposals, not product truth.

Retain applicable navigation, account controls, and workspace access through loading and recovery states. Follow [design-preferences](../design-preferences/SKILL.md); shell replacement must be in scope. Report unrelated layout gaps rather than expanding the redesign.

## 2. Research and explore

Read [imagegen-workflow](references/imagegen-workflow.md). Use Chrome computer use to search free Mobbin before ideation, then generate four distinct ImageGen directions including a purposeful wildcard. Give each its own creative brief and reference set. Differences must include composition or interaction, not just palettes and corner radii.

Use representative content and controls. For responsive products, show desktop and compact compositions; include expanded menus or settings when they determine the information architecture. Check feasibility and capability coverage before presenting directions.

## 3. Resolve the direction

Present A–D with images, a design thesis, advantage, tradeoff, and recommendation. Bundle unresolved material behavior choices into the same selection question.

Ask once when the user has not selected or delegated the choice. Honor existing authorization, “pick the defaults,” and explicitly requested combinations; restate a hybrid without asking again unless a consequential ambiguity remains. Silence is not selection.

Record the chosen direction, authorized behavior changes, and three defining traits including its signature move. These are the acceptance reference.

## 4. Implement

Use an isolated prototype for structural or behavior-heavy exploration; bounded changes can be implemented directly. Keep prototype network effects, persistence, analytics, and destructive actions isolated from live data.

Translate the design into explicit geometry: dominant region, fold, column widths, copy measures, scroll/sticky regions, and breakpoint disclosure. Use representative long text and density early; do not let wrapping or familiar stacked cards replace the chosen composition.

Generate production assets when texture, illustration, or organic detail defines the direction. Use code for dynamic text, interactive states, and simple geometry. Prove an asset-dependent treatment at its actual display size before building the full set.

Consult relevant rows of the [miss ledger](references/implementation-miss-ledger.md) when a known implementation failure applies; it is not a second checklist.

## 5. Compare, correct, and integrate

Use [visual-comparison](references/visual-comparison.md) to inspect matched reference and implementation screenshots. Verify the defining traits, hierarchy, density, typography, and responsive composition. Builds and DOM assertions cannot establish visual fidelity.

Fix material differences and recapture affected states and sizes. Do not require a correction round when the evidence already supports completion. Return to the user only if resolution needs an unapproved change to the selected direction or behavior.

Exercise the requested flow and affected capabilities after integration. Use the [edge-case matrix](references/edge-case-matrix.md) selectively for changed layout or behavior; broader redesigns warrant broader coverage. Check alternate themes when supported, reachable controls, overflow, and preservation of input, selection, focus, and scroll across layout changes. Serious failures that prevent the scoped flow are blockers.

Stop when the requested flow works, scoped contracts remain intact, and the chosen design's defining traits survive at relevant sizes. Document acceptable adaptations; do not keep gathering proof for unrelated improvements. Follow repository rules and existing user authorization for merge and deployment.

## Handoff

Retain inspected reference links, the selected mock, capture conditions, final screenshots, and any material deviations in the established design-history location. Keep unused explorations outside the repository.

Report the chosen direction, reference principles, behavior changes, visual evidence, remaining limitations, asset paths, and source-control state. Propose a generalized ledger lesson only when a useful new failure mode emerged. Running this skill does not authorize editing the skill or its ledger.
