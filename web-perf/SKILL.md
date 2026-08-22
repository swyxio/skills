---
name: web-perf
description: Measure, diagnose, or review web page performance when page speed, Core Web Vitals, Lighthouse performance, loading behavior, or a named performance regression is the primary task. Use current browser evidence and first-party documentation. Do not turn a focused metric investigation into a full performance, accessibility, bundler, and codebase audit.
---

# Web Performance

Use current browser evidence for the page and state the user named. Metrics,
thresholds, and tooling change; retrieve current web.dev or Chrome documentation
before citing specific thresholds or API details.

## Set the acceptance scope

Choose the smallest mode that answers the request:

- **Named regression or metric:** measure that path and analyze its likely
  contributors.
- **General performance audit:** capture representative load evidence, rank the
  material issues, and stop when the highest-impact causes are explained.
- **Optimization work:** establish a comparable baseline, change only the
  authorized code, and remeasure the same page, viewport, network conditions,
  and cache state.

The user outcome and performance risk created by the proposed change define the
gates. Accessibility, generic code quality, every bundler setting, and every
available DevTools insight are separate concerns unless the request or evidence
makes one relevant. A discovered non-blocking improvement is a follow-up, not a
release prerequisite.

## Choose available evidence

Prefer a browser tool that can record a performance trace and inspect network
requests. If the preferred Chrome DevTools integration is unavailable, use
another available browser measurement path or report the limitation. Do not
make installing a particular MCP server an acceptance gate unless the user asks
for that tool specifically.

Useful evidence, selected as needed:

- a cold or warm page-load trace;
- Core Web Vitals and the element or interaction that owns the metric;
- the critical network dependency chain and response headers;
- request payload sizes and estimated savings;
- relevant DOM or source ownership for the measured culprit;
- field data when the user asks about real-user performance and it is available.

Keep lab and field evidence distinct. Record the URL, viewport, cache state,
network/CPU conditions, and run count when they materially affect comparison.

## Focused workflow

1. Reproduce the named page, route, viewport, and state.
2. Capture a trace or the narrowest available measurement. Repeat only enough
   to distinguish a stable signal from obvious noise.
3. Inspect the insight, requests, DOM, or code that can confirm the leading
   cause. Do not infer an unused or blocking resource from naming alone.
4. Rank only issues with material measured or well-supported impact. A 0 ms
   estimate or already-good metric is not an optimization task.
5. If implementation is requested, make the smallest relevant change and
   remeasure under comparable conditions.
6. Stop when the requested metric or regression is explained, or the authorized
   change is comparably verified. State uncertainty and follow-ups separately.

## Risk-triggered checks

Select these only when the evidence points to them:

- **LCP or FCP:** server latency, resource discovery, render delay, hero/font
  priority, and render-blocking resources.
- **CLS:** the actual shifting elements, missing dimensions, injected content,
  and font behavior.
- **INP or main-thread delay:** the measured interaction, long tasks, event
  handlers, hydration, and script evaluation.
- **Network weight or dependency depth:** compression, caching, payload size,
  request chains, preloads, and preconnect usage.
- **Bundle ownership:** framework and bundler configuration only far enough to
  locate the measured cost; do not run a generic tree-shaking audit by default.

Verify before recommending removal. Confirm request use, execution, or coverage
with current evidence, and avoid prescribing framework-specific configuration
from memory.

## Report

Lead with the answer to the performance question. Include:

- measured values and conditions;
- the highest-impact confirmed causes;
- specific fixes or completed changes with expected or measured impact;
- evidence unavailable or too noisy to support a claim; and
- non-blocking opportunities as follow-ups.

Use a metric table only when multiple measurements benefit from comparison. Do
not claim a full audit when only one trace, page, viewport, or lab environment
was tested.
