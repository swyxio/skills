# Registry refresh notes

Refresh into a new policy version. Do not silently replace a live snapshot, and do not confiscate a handle that was valid under an earlier version.

## Common English words

Source: <https://github.com/first20hours/google-10000-english>

Take the first 500 ranked lines, normalize to lowercase, apply the target product's handle syntax, and omit entries covered by the three-character rule from the stored cohort. Record the original line number as `rank`.

## US given names

Source mirror: <https://github.com/aruljohn/popular-baby-names>

Take the top 250 boys' and top 250 girls' names for the chosen year. Combine identical names into one entry while retaining both source-list ranks. Note that the repository mirrors Social Security rankings; verify the year and upstream provenance before presenting it as current SSA data.

## US surnames

Source: <https://www.census.gov/topics/population/genealogy/data/2010_surnames.html>

Take the first 250 ranked surnames and retain the Census rank and count. Record the dataset year explicitly because the Census surname release is not annual.

## Digg X identities

Source: <https://di.gg/rankings>

Capture ranks 1–1000 from the rendered ranking page. Preserve the original handle and rank, normalize a separate policy handle, and report entries excluded by target syntax instead of renumbering the survivors.

## Hacker News identities

Use the ClickHouse public playground at <https://play.clickhouse.com/> with the `explorer` public account and this query:

```sql
SELECT
  id,
  argMax(karma, update_time) AS current_karma
FROM hackernews_changes_profiles
GROUP BY id
ORDER BY current_karma DESC
LIMIT 1000
FORMAT JSONEachRow
```

Retain original rank, latest karma, and original capitalization. Hacker News' official API exposes individual users but does not provide a global leaderboard, so describe this as a ranking derived from the public profile-change dataset.

## Reddit identities

Do not bulk-import a third-party karma leaderboard. Reddit does not publish an official global top-user list, while scraped lists tend to mix bots, deleted or suspended users, repost accounts, explicit accounts, and historical anomalies.

Maintain a small reviewed cohort with a one-line reason for each addition. Broaden it only when a defensible source and identity-review use case justify doing so.

## Pre-release checks

1. Validate every stored handle against the target syntax.
2. Deduplicate within each cohort while preserving cross-cohort membership.
3. Generate exact-name and separator-skeleton collision reports against current and historical product handles.
4. Confirm cohort counts, excluded-row counts, and the unique union.
5. Run `scripts/validate.mjs` and representative classifier checks.
6. Update the capture date, policy version, rationale counts, and release notes together.
