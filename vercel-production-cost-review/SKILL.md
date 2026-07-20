---
name: vercel-production-cost-review
description: Audit and reduce Vercel production spend across projects and monorepo zones. Use for periodic weekly or monthly cost reviews, unexpected bill spikes, Fast Data Transfer or bandwidth investigations, cache analysis, oversized route or asset diagnosis, abusive traffic, and post-remediation verification.
---

# Vercel Production Cost Review

Use this skill to turn Vercel usage into an evidence-backed remediation plan. Diagnose before changing code or firewall rules.

## Workflow

1. **Establish scope and baseline**
   - Confirm team, projects, production domains, monorepo zones, and review window.
   - Capture current total spend/usage and the previous comparable period.
   - Inventory Vercel project links and Root Directory settings before using project-scoped CLI commands.

2. **Rank cost drivers**
   - Query usage by project, route/path, method, status, cache result, region, and bot dimensions when available.
   - Start with Fast Data Transfer incoming, outgoing, and total bytes plus request count.
   - Separate shared-domain paths from their owning Vercel projects/zones.
   - If detailed metrics require Observability Plus, use the dashboard export, runtime-log grouping, response probes, and project/deployment APIs as fallback evidence.

3. **Diagnose before fixing**
   - Consider at least: abusive polling/scraping, oversized responses, oversized public assets, missing browser caching, missing CDN caching, dynamic/POST responses, duplicate middleware/function work, Next data payloads, and stale project configuration.
   - Distill to the 1–2 most likely causes.
   - Add temporary privacy-safe request logs when method, tool/action, response bytes, user agent, or client distribution is unknown.
   - Measure representative response headers and compressed/uncompressed sizes.

4. **Choose the right remediation**
   - **Abuse:** Vercel Firewall deny/challenge/rate-limit at the edge; preserve legitimate protocol methods.
   - **Payload size:** paginate, omit heavy fields by default, compact JSON, compress, and offer explicit opt-ins for detail.
   - **Assets:** resize/re-encode large images and fonts; preserve stable URLs where compatibility matters.
   - **Browser transfer:** set a safe `max-age`; use content hashes plus `immutable` for versioned assets.
   - **Origin work:** use `s-maxage`, `stale-while-revalidate`, ISR, or Vercel CDN cache controls.
   - **Architecture:** avoid shipping large page props or `/_next/data` payloads when details can load on demand.

5. **Apply safely**
   - Treat WAF publication, production config changes, and deploys as external mutations requiring authorization.
   - Stage and inspect firewall rules before publishing.
   - Preserve unrelated working-tree changes.
   - Test route patterns with a production build before deploying.
   - Deploy the owning project and every zone that consumes shared cache/config helpers.

6. **Verify impact**
   - Smoke critical routes, metadata, API/MCP protocol calls, redirects, and zone ownership.
   - Verify expected status, `Cache-Control`, `x-vercel-cache`, content encoding, and response size.
   - Re-query traffic after enough time for a useful sample; compare request rate and bytes/request with baseline.
   - Record incomplete evidence, plan limits, and any frozen zone that could not redeploy.

## Critical distinctions

- A CDN `HIT` reduces origin compute and latency, but Fast Data Transfer still counts bytes sent from Vercel to the client.
- Browser caching, smaller payloads, and blocking unwanted traffic reduce outgoing transfer; CDN caching alone may not.
- Vercel may consume or strip `s-maxage` from the client-visible `Cache-Control` header. Use `x-vercel-cache` and targeted CDN headers to verify edge behavior.
- Static Next.js chunks are usually immutable already. A hot chunk can still be expensive if it is very large or repeatedly fetched by new clients.
- POST responses are normally not safely CDN-cacheable because the request body affects the result.
- Runtime logs can contain both middleware and function entries for one request. Do not treat raw log rows as unique requests without checking source.

## Cadence

**Weekly spike review**
- Compare seven-day totals and top paths with the prior week.
- Investigate new routes, sudden request-rate changes, and bytes/request regressions.
- Confirm active firewall mitigations and recent deploy impact.

**Monthly full review**
- Review every production project/zone, not only the primary domain.
- Audit large public assets, Next data/page payloads, API defaults, cache headers, project roots, and archived-site TTLs.
- Update the baseline and prioritized savings backlog.

## Output

Report:

1. Period, team, projects, and evidence limitations.
2. Top drivers with requests, incoming bytes, outgoing bytes, total bytes, and bytes/request.
3. Likely cause for each material driver.
4. Actions taken versus recommended, with risk and expected savings.
5. Verification results and follow-up measurement time.

For the repeatable audit checklist and command patterns, read [checklist.md](references/checklist.md).
