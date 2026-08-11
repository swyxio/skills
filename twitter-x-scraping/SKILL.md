---
name: twitter-x-scraping
description: Scrape public Twitter/X timelines or lists through an explicitly permitted mirror or public page, with bounded pagination, date cutoffs, provenance, and artifact verification. Load for public timeline/list extraction; not for private data, authentication, posting, or bypassing access controls.
metadata:
  skill-cutter: ignore
  skill-cutter-reason: "Deliberately retains operational mirror research, selectors, adapters, and samples; preserve unless the user explicitly overrides this exemption."
---

# Public Twitter/X extraction

Use this skill only for public, authorized collection from a supplied source.
Mirror HTML is an implementation detail, not a stable provider contract: first
inspect the chosen instance and current markup, then keep selectors and output
adapters local to that source.

## Non-negotiable boundaries

- Respect the source's terms, robots/access policy, rate limits, and the user's
  authorization. Do not scrape private or login-gated content.
- Do not defeat CAPTCHAs, anti-bot challenges, authentication, paywalls, or
  access blocks. If a source challenges, blocks, or asks for login, stop and
  report the condition; do not use headed-browser tricks, webdriver spoofing,
  stealth flags, proxy rotation, or fingerprint changes.
- Use the smallest request rate and page bound that answers the question. Honor
  `Retry-After`; cap retries and backoff. Never use an unbounded cursor loop.
- Preserve source URLs, instance, retrieval time, query/list/profile identity,
  and any partial/failure state in the output when provenance matters. Avoid
  collecting unrelated personal data or third-party media by default.

## Retrieval workflow

1. Confirm the public source, target profile/list, time window, fields, output,
   and maximum pages/items. Check the instance before the first request.
2. Fetch with a normal HTTP client where permitted. If the public page requires
   a supported browser for ordinary rendering, use a standard browser session
   without bypass flags; stop on a challenge or access denial.
3. Parse the current page structure defensively. Record stable post/status IDs,
   author, canonical URL, text, timestamp, and requested media/engagement fields
   only when present. Treat relative display dates as unreliable; use an
   absolute timestamp attribute or source metadata when available.
4. Follow the source's next-page cursor only after validating that it changes.
   Stop on a missing/repeated cursor, the configured page/item limit, the date
   cutoff, or a source error. Exclude pinned or otherwise out-of-window records
   according to the current page metadata rather than guessing.
5. Deduplicate by stable post ID or canonical URL, preserve partial results, and
   verify that the output is parseable and corresponds to the requested source.

An adapter may use Axios, Cheerio, Playwright, or another existing dependency,
but this skill does not mandate a package, a mirror domain, or a CSS selector.
If a selector contract is needed, document it next to the adapter and test it
against a saved public fixture.

## Result and failure shape

Return the requested records plus source/provenance metadata, counts, cutoff,
and warnings. Distinguish an empty result from an incomplete or blocked run.
Surface rate limiting, markup drift, parse failures, and cursor termination;
never present partial data as complete. Do not infer deleted/private content or
claim that engagement fields are current unless the source supplied them.

## Selective supporting files

Load only the detail needed for the requested adapter or failure:

- [references/mirror-inventory-apr-2026.md](references/mirror-inventory-apr-2026.md)
  for the dated April 2026 instance snapshot and a current-verification method;
- [references/fetch-and-retry.md](references/fetch-and-retry.md) for Axios and
  ordinary Playwright adapters, configurable retry/backoff defaults, challenge
  detection, and the historical dependency baseline;
- [references/nitter-html-contract.md](references/nitter-html-contract.md) when
  implementing or repairing Cheerio selectors and field extraction;
- [references/pagination-media-and-edge-cases.md](references/pagination-media-and-edge-cases.md)
  for cursor construction, stopping rules, pinned posts, retweet attribution,
  images, and avatar fallbacks; and
- [samples/public-nitter-timeline.ts](samples/public-nitter-timeline.ts) for a
  bounded, provenance-bearing end-to-end adapter.

Do not load every reference for a routine extraction. The mirror snapshot,
package versions, markup, and provider behavior are historical or volatile;
verify them before use. No supporting file overrides the access boundaries in
this main skill.
