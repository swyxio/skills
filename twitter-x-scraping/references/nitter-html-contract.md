# Nitter-style HTML extraction contract

Read this reference when implementing or repairing a Cheerio parser for a
specific, explicitly permitted Nitter-style source. These selectors were
observed in April 2026 and may drift. Validate them against a newly saved public
fixture from the chosen instance before relying on them.

## Selector table

| Data | Historical selector / extraction |
|---|---|
| Post container | `.timeline .timeline-item`, filtered to descendants containing `.tweet-body` |
| Post link / stable ID | `a.tweet-link[href]`; extract `/status/(\d+)` |
| Absolute timestamp | `.tweet-date a[title]` |
| Post text | `.tweet-content.media-body` |
| Author username | `.tweet-header a.username[title]` |
| Author display name | `.tweet-header a.fullname[title]` |
| Avatar | `.tweet-header a.tweet-avatar img.avatar[src]` |
| Images | `.attachments .attachment.image img[src]` |
| Video poster | `.attachments .gallery-video img[src]` |
| Link card | `.card a.card-container[href]` |
| Likes | `.tweet-stat span.icon-heart`, with count in the containing `.tweet-stat` |
| Reposts | `.tweet-stat span.icon-retweet`, with count in the containing `.tweet-stat` |
| Replies | `.tweet-stat span.icon-comment`, with count in the containing `.tweet-stat` |
| Quote count | `.tweet-stat span.icon-quote`, with count in the containing `.tweet-stat` |
| Repost banner | `.retweet-header` |
| Quoted post block | `.quote` |
| Quoted text | `.quote .quote-text` |
| Quoted author | `.quote .tweet-name-row a.username` |
| Pinned marker | container class `pinned`, `.pinned-icon`, or `.icon-pin` |
| Next cursor | `div.show-more a[href]`; extract `?cursor=` |

## Defensive record parser

```ts
import * as cheerio from 'cheerio';

type PublicPost = {
  id: string;
  canonicalUrl: string;
  authorHandle?: string;
  displayName?: string;
  text: string;
  timestamp: string;
  pinned: boolean;
  repostedBy?: string;
  images: string[];
  videoPosters: string[];
  engagement: Partial<Record<'likes' | 'reposts' | 'replies' | 'quotes', number>>;
  quote?: { author?: string; text: string };
};

function absoluteUrl(instance: string, value: string | undefined): string | undefined {
  if (!value) return undefined;
  try { return new URL(value, instance).href; } catch { return undefined; }
}

function parseAbsoluteTimestamp(title: string | undefined): string | undefined {
  if (!title) return undefined;
  const normalized = title.replace(/\s*[·•]\s*/g, ' ').replace(/\s+/g, ' ').trim();
  const milliseconds = Date.parse(normalized);
  return Number.isFinite(milliseconds) ? new Date(milliseconds).toISOString() : undefined;
}

function parseDisplayedCount(text: string): number | undefined {
  const compact = text.replace(/,/g, '').trim().match(/([\d.]+)\s*([KMB])?/i);
  if (!compact) return undefined;
  const value = Number(compact[1]);
  const multiplier = compact[2]?.toUpperCase() === 'K' ? 1_000
    : compact[2]?.toUpperCase() === 'M' ? 1_000_000
      : compact[2]?.toUpperCase() === 'B' ? 1_000_000_000
        : 1;
  return Number.isFinite(value) ? Math.round(value * multiplier) : undefined;
}

export function parseTimeline(html: string, instance: string): PublicPost[] {
  const $ = cheerio.load(html);
  const posts: PublicPost[] = [];

  $('.timeline .timeline-item')
    .filter((_, element) => $(element).find('.tweet-body').length > 0)
    .each((_, element) => {
      const item = $(element);
      const href = item.find('a.tweet-link[href]').first().attr('href');
      const id = href?.match(/\/status\/(\d+)/)?.[1];
      const canonicalUrl = absoluteUrl('https://x.com', href);
      const timestamp = parseAbsoluteTimestamp(item.find('.tweet-date a[title]').attr('title'));
      if (!id || !canonicalUrl || !timestamp) return;

      const engagement: PublicPost['engagement'] = {};
      item.find('.tweet-stats .tweet-stat').each((__, stat) => {
        const row = $(stat);
        const classes = row.find('.icon-container > span, span').first().attr('class') ?? '';
        const value = parseDisplayedCount(row.text());
        if (value == null) return;
        if (classes.includes('icon-heart')) engagement.likes = value;
        else if (classes.includes('icon-retweet')) engagement.reposts = value;
        else if (classes.includes('icon-comment')) engagement.replies = value;
        else if (classes.includes('icon-quote')) engagement.quotes = value;
      });

      const quote = item.find('.quote').first();
      posts.push({
        id,
        canonicalUrl,
        authorHandle: item.find('.tweet-header a.username').attr('title')?.replace(/^@/, ''),
        displayName: item.find('.tweet-header a.fullname').attr('title'),
        text: item.find('.tweet-content.media-body').text().trim(),
        timestamp,
        pinned: item.hasClass('pinned') || item.find('.pinned-icon, .icon-pin').length > 0,
        repostedBy: item.find('.retweet-header').text().trim() || undefined,
        images: item.find('.attachments .attachment.image img[src]').map((__, image) =>
          absoluteUrl(instance, $(image).attr('src'))
        ).get().filter((url): url is string => Boolean(url)),
        videoPosters: item.find('.attachments .gallery-video img[src]').map((__, image) =>
          absoluteUrl(instance, $(image).attr('src'))
        ).get().filter((url): url is string => Boolean(url)),
        engagement,
        quote: quote.length ? {
          author: quote.find('.tweet-name-row a.username').text().trim().replace(/^@/, '') || undefined,
          text: quote.find('.quote-text').text().trim()
        } : undefined
      });
    });

  return posts;
}
```

## Timestamp rule

Use the date link's absolute `title` attribute, such as
`Apr 14, 2026 · 5:47 PM UTC`. The visible text may be relative (`19h`) or omit
the year. Normalize the Unicode middle dot but keep both date and time. If the
absolute value is absent or unparseable, retain the record only when the task
does not require a trustworthy cutoff; otherwise report and skip it.

## Markup drift checks

Treat a fixture as invalid when:

- no post has all of ID, canonical link, and absolute timestamp;
- a selector suddenly maps every post to one shared author or timestamp;
- pagination repeats the current cursor;
- engagement parsing produces implausible values after an abbreviation change;
- the page is actually a challenge/error document; or
- expected fields disappear across the entire fixture.

Keep selectors local to the source adapter and test against saved public HTML.
Do not claim this table is a Nitter project API contract.
