# Pagination, media, and edge cases

Read this reference when implementing bounded cursor traversal, date cutoffs,
repost attribution, or media/avatar extraction for a permitted Nitter-style
source.

## Target paths

Historically observed path shapes:

| Target | Path |
|---|---|
| Profile | `/<handle>` |
| Public list | `/i/lists/<listId>` |
| Next page | the source-provided relative `?cursor=<value>` on the same target path |

Build the next request from the current page URL and the actual link rather than
manually concatenating a base domain. Validate that the final origin remains the
approved instance and the pathname remains under the approved target.

```ts
export function nextCursorUrl(
  currentUrl: string,
  href: string | undefined,
  approvedOrigin: string,
  approvedPath: string
): { url?: string; cursor?: string } {
  if (!href) return {};
  const next = new URL(href, currentUrl);
  if (next.origin !== approvedOrigin || next.pathname !== approvedPath) return {};
  const cursor = next.searchParams.get('cursor') ?? undefined;
  return cursor ? { url: next.href, cursor } : {};
}
```

This avoids both naive `base + href` bugs and accidental traversal to an
unapproved origin.

## Bounded pagination

Track stable post IDs and seen cursors. Stop on the first applicable condition:

- configured page or item maximum;
- missing cursor;
- repeated cursor or next URL;
- source/network/parse failure;
- access challenge or denial;
- oldest trustworthy non-pinned record is earlier than the requested start;
- a page contributes no new stable IDs; or
- the source leaves the approved profile/list path.

Preserve partial records and the exact stop reason.

```ts
const seenCursors = new Set<string>();

if (!next.cursor) stop('missing_cursor');
else if (seenCursors.has(next.cursor)) stop('repeated_cursor');
else {
  seenCursors.add(next.cursor);
  currentUrl = next.url!;
}
```

## Date-bounded stopping and pinned posts

A pinned post may be much older than surrounding timeline records. It may be
included when it falls inside the requested window, but it must not trigger the
pagination cutoff.

```ts
const cutoffCandidates = pagePosts
  .filter((post) => !post.pinned)
  .map((post) => Date.parse(post.timestamp))
  .filter(Number.isFinite);

const oldest = cutoffCandidates.length ? Math.min(...cutoffCandidates) : undefined;
if (oldest != null && oldest < startDate.getTime()) stop('date_cutoff');
```

The original implementation excluded reposts from its cutoff calculation as a
local policy. Preserve that only when the requested semantics are “original
posts by this account.” For a complete displayed timeline, repost timestamps
may be relevant; define which timestamp the source exposes and document the
choice.

## Repost attribution

On observed Nitter markup, the primary `a.tweet-link` inside a repost points to
the original author's status, which is useful for canonical provenance. Extract
the original handle from that link rather than assuming the requested profile
is the author:

```ts
const match = href.match(/^\/([^/]+)\/status\/(\d+)/);
const originalAuthor = match?.[1];
const statusId = match?.[2];
const canonicalUrl = originalAuthor && statusId
  ? `https://x.com/${originalAuthor}/status/${statusId}`
  : undefined;
```

Keep `repostedBy` separately from `authorHandle`.

## Images and video posters

Resolve relative media paths against the approved instance:

```ts
const proxiedMediaUrl = src ? new URL(src, instance).href : undefined;
```

Only download media when requested. Record the original post URL and the mirror
URL from which the media was obtained. A gallery-video image is generally a
poster, not proof that the actual video was downloaded.

## Avatar options

The historical selector for an avatar was:

```ts
const avatarSrc = item.find('.tweet-header a.tweet-avatar img.avatar').attr('src');
const proxiedAvatarUrl = avatarSrc ? new URL(avatarSrc, instance).href : undefined;
```

The proxied URL is easiest but may stop working when the mirror changes. Some
instances used paths resembling `/pic/pbs.twimg.com%2F...`; if direct-media
reconstruction is required, validate the exact encoding before converting it:

```ts
export function historicalDirectAvatar(src: string | undefined): string | undefined {
  if (!src?.startsWith('/pic/')) return undefined;
  const decoded = decodeURIComponent(src.slice('/pic/'.length));
  if (!decoded.startsWith('pbs.twimg.com/')) return undefined;
  return `https://${decoded}`;
}
```

The April 2026 notes found that `unavatar.io/twitter/<handle>` redirected to an
X-specific route and had a low anonymous allowance during bulk backfills. Treat
that as historical behavior, not a current contract. If using any avatar
provider, verify its current terms, limits, and URL shape; do not silently send
a large handle list to a third party.

## Output provenance

For each run, retain:

- approved instance and target URL;
- retrieval start/end times;
- requested date window, page limit, and item limit;
- every page URL or cursor hash needed for debugging;
- IDs used for deduplication;
- blocked, drifted, or partially parsed pages;
- final stop reason; and
- whether media URLs are canonical, mirror-proxied, or reconstructed.
