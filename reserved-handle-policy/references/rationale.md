# Reserved handle rationale

## Why two tiers

A route such as `admin`, `api`, or `security` should never become a personal identity. A scarce handle such as `ai`, a common name such as `olivia`, or a well-known identity such as `karpathy` has a different risk: it may have a legitimate claimant, but open signup should not decide ownership. Collapsing both cases into a permanent denylist makes future assignment opaque and encourages unsafe administrator bypasses.

The registry therefore uses:

- `hard_reserved` for platform, authority, route, security, and service terms;
- `manual_claim_required` for short names, common words, common names, coding/AI terms, and selected public identities.

Every alphanumeric skeleton of three characters or fewer requires review even when the exact spelling is absent from the file. If separators are accepted, `a_i`, `a-i`, and `ai` share the same skeleton and inherit the stricter tier.

## Registry format

`reserved-handles.toml` is canonical. Its top-level tables preserve policy rules, capture metadata, cohort counts, source URLs, and ordered cohort entries. Each entry is one compact inline TOML table, retaining optional source rank, karma, source spelling, or sex-specific name ranks without expanding a single handle across several lines. Python 3.11+ can parse it with the standard-library `tomllib` module. `reserved-handles.csv` remains a flattened exact-handle export for spreadsheets and simple imports.

## Included cohorts

The 2026-07-13 snapshot contains 3,181 unique exact handles before algorithmic separator variants:

| Cohort | Stored rows | Rationale |
| --- | ---: | --- |
| Hard platform terms | 88 | Routes, authority identities, security names, services |
| Common English words | 380 | First 500 ranked Google English words that fit the product syntax and are longer than three characters |
| Common given names | 480 | Top 250 US 2024 boys' and girls' names, deduplicated within each source list |
| Common surnames | 245 | Top 250 US Census 2010 surnames that fit the syntax and exceed three characters |
| Coding and AI terms | 79 | Curated developer, infrastructure, language, and AI vocabulary |
| Digg X AI ranking | 983 | Syntactically eligible handles among ranks 1–1000 |
| Hacker News karma | 996 | Syntactically eligible handles among the top 1000 by latest karma; cutoff 14,640 |
| Curated Reddit | 12 | Platform/security identities and a small high-signal cohort |

Rows overlap across cohorts, so cohort counts do not sum to the unique total.

## Sources

- Common words: [Google 10,000 English](https://github.com/first20hours/google-10000-english), first 500 ranked entries.
- Given names: [2024 popular baby names mirror](https://github.com/aruljohn/popular-baby-names), top 250 by sex, mirroring US Social Security rankings.
- Surnames: [US Census 2010 surnames](https://www.census.gov/topics/population/genealogy/data/2010_surnames.html), top 250.
- X identities: [Digg AI rankings](https://di.gg/rankings), ranks 1–1000.
- Hacker News identities: [ClickHouse public playground](https://play.clickhouse.com/) over the public HN profile-change dataset, top 1000 by latest karma.
- Reddit: curated rather than imported from a third-party karma leaderboard. Reddit provides no official global user ranking.

## Limits and maintenance

- Rankings and popularity lists drift. The snapshot is useful launch protection, not a claim about current prominence.
- Common-word and common-name protection creates false positives by design; the manual tier preserves a legitimate claim path.
- External handles do not prove cross-platform identity. An administrator should require evidence and adjudicate conflicts when multiple people use the same name.
- A live product must check the new list against current and historical handles before adopting an update. Existing identities should not be confiscated.
- Store the policy version used for every decision so later audits can reconstruct why a claim was blocked or approved.
