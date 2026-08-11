---
name: web-perf
description: Audit or debug a reachable web page's loading and runtime performance with the available Chrome DevTools tooling, using measured traces, network evidence, relevant Core Web Vitals, and codebase inspection when source access exists. Load for performance, profiling, Lighthouse, Core Web Vitals, or site-speed work; not for generic frontend review.
---

# Web Performance Audit

Use the current Chrome DevTools and web-platform documentation for metric
definitions, tool names, and rating thresholds. Do not treat a copied command
catalog or fixed number as a durable API contract.

## Preconditions and evidence

- Confirm the target URL, environment, device/network assumptions, authenticated
  state, and whether codebase access is available. Do not mutate the user's MCP
  configuration from this skill; if required tooling is unavailable, report the
  missing capability and offer a non-invasive fallback.
- Measure before recommending. Record the trace/run conditions, observed values,
  and whether a finding came from a trace, network response, DOM/accessibility
  tree, source code, or inference.
- Separate field/user data from lab measurements and separate first-party code
  from third-party resources. Avoid claiming causality from a single metric.
- Prefer a small, repeatable run set and compare like with like. Redact tokens,
  private URLs, and user data from captured artifacts.

## Workflow

1. Load the target and verify that the expected page actually rendered.
2. Capture an appropriate performance trace, normally including a reload. Use
   current tooling to inspect available insights rather than assuming insight
   names or parameters.
3. Report relevant Core Web Vitals and supporting measurements such as server
   response, paint, long-task, transfer, and layout-shift evidence. Include the
   current rating definition when a rating is important.
4. Inspect network requests and dependency chains for render-blocking work,
   late critical resources, cache/compression behavior, oversized payloads, and
   third-party cost. Verify that a proposed removal is actually unused.
5. Take an accessibility snapshot when it is relevant to the question. Treat
   accessibility findings as a parallel quality concern, not automatically a
   performance cause.
6. If source access exists, map findings to the framework/build/config and
   identify the smallest actionable change. Skip source conclusions for a
   third-party page.
7. Re-run the focused measurement after an authorized change and report the
   before/after evidence. If no change was made, label recommendations as
   unverified.

## Output

Provide:

1. Run conditions and a concise metric summary with values and current ratings.
2. A prioritized list of evidence-backed issues, with affected URL/resource or
   code location and measured or clearly qualified impact.
3. Specific next actions, ordered by expected user impact and implementation
   cost. Do not invent savings or prioritize a nominal issue with no measured
   effect.
4. Codebase findings only when source access was available, plus limitations,
   third-party caveats, and any failed or incomplete run.

Tool names and exact thresholds should come from the current primary docs or
the current tool response. Keep the skill's durable contract here and put
version-specific command examples in a selective reference if they are needed.
