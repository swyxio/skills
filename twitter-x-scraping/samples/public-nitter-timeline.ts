/**
 * Bounded public Nitter-style profile/list extraction.
 *
 * Configure an explicitly permitted instance and target path, then adapt the
 * selectors against a current saved fixture before production use. This sample
 * uses ordinary HTTP only and stops on challenge/access pages.
 *
 * Example environment:
 *   NITTER_INSTANCE=https://approved.example
 *   NITTER_TARGET_PATH=/some_public_handle
 *   START_DATE=2026-04-01T00:00:00Z
 *   END_DATE=2026-05-01T00:00:00Z
 *   MAX_PAGES=5
 *   MAX_ITEMS=500
 *   PAGE_DELAY_MS=1000
 *   INCLUDE_MEDIA_METADATA=0
 */

import axios, { type AxiosResponse } from 'axios';
import * as cheerio from 'cheerio';

type Config = {
  instance: URL;
  targetPath: string;
  startDate: Date;
  endDate: Date;
  maxPages: number;
  maxItems: number;
  maxRetries: number;
  pageDelayMs: number;
  includeMediaMetadata: boolean;
};

type PublicPost = {
  id: string;
  canonicalUrl: string;
  authorHandle?: string;
  displayName?: string;
  text: string;
  timestamp: string;
  pinned: boolean;
  repostedBy?: string;
  images?: string[];
  avatarUrl?: string;
};

type PageResult = {
  posts: PublicPost[];
  nextHref?: string;
  blocked: boolean;
};

type StopReason =
  | 'item_limit'
  | 'page_limit'
  | 'date_cutoff'
  | 'missing_cursor'
  | 'repeated_cursor'
  | 'no_new_items'
  | 'blocked'
  | 'source_error';

type RunResult = {
  records: PublicPost[];
  provenance: {
    instance: string;
    targetUrl: string;
    retrievedAt: string;
    startDate: string;
    endDate: string;
    maxPages: number;
    maxItems: number;
    pagesFetched: number;
    pageUrls: string[];
    stopReason: StopReason;
    partial: boolean;
    warnings: string[];
  };
};

const TRANSIENT = new Set([429, 502, 503]);
const REQUEST_TIMEOUT_MS = 30_000;
const BASE_DELAY_MS = 2_000;
const MAX_DELAY_MS = 60_000;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function positiveInt(value: string | undefined, fallback: number, maximum: number): number {
  const parsed = Number(value ?? fallback);
  if (!Number.isInteger(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, maximum);
}

function nonNegativeInt(value: string | undefined, fallback: number, maximum: number): number {
  const parsed = Number(value ?? fallback);
  if (!Number.isInteger(parsed) || parsed < 0) return fallback;
  return Math.min(parsed, maximum);
}

function loadConfig(): Config {
  const instance = new URL(required('NITTER_INSTANCE'));
  if (instance.protocol !== 'https:' && instance.hostname !== 'localhost') {
    throw new Error('NITTER_INSTANCE must use HTTPS except for localhost development');
  }

  const target = new URL(required('NITTER_TARGET_PATH'), instance);
  if (target.origin !== instance.origin) throw new Error('target must stay on the approved instance');
  if (!/^\/(?:i\/lists\/\d+|[A-Za-z0-9_]{1,30})$/.test(target.pathname)) {
    throw new Error('target must be one public profile path or /i/lists/<numeric-id>');
  }

  const startDate = new Date(required('START_DATE'));
  const endDate = new Date(required('END_DATE'));
  if (!Number.isFinite(startDate.getTime()) || !Number.isFinite(endDate.getTime())) {
    throw new Error('START_DATE and END_DATE must be absolute timestamps');
  }
  if (startDate >= endDate) throw new Error('START_DATE must precede END_DATE');

  return {
    instance,
    targetPath: target.pathname,
    startDate,
    endDate,
    maxPages: positiveInt(process.env.MAX_PAGES, 5, 50),
    maxItems: positiveInt(process.env.MAX_ITEMS, 500, 5_000),
    // Historical adapter default was 10; make it explicit and lower it when a
    // source policy or smaller task calls for less persistence.
    maxRetries: nonNegativeInt(process.env.MAX_RETRIES, 10, 10),
    pageDelayMs: positiveInt(process.env.PAGE_DELAY_MS, 1_000, 60_000),
    includeMediaMetadata: process.env.INCLUDE_MEDIA_METADATA === '1'
  };
}

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`missing ${name}`);
  return value;
}

function retryDelayMs(response: AxiosResponse, attempt: number): number {
  const retryAfter = response.headers['retry-after'];
  if (typeof retryAfter === 'string' && /^\d+$/.test(retryAfter)) {
    return Math.min((Number(retryAfter) + 2) * 1_000, 5 * 60_000);
  }
  const reset = response.headers['x-rate-limit-reset'];
  if (typeof reset === 'string' && /^\d+$/.test(reset)) {
    return Math.min(Math.max(0, Number(reset) * 1_000 - Date.now()), 5 * 60_000);
  }
  return Math.min(BASE_DELAY_MS * 2 ** attempt + Math.floor(Math.random() * 250), MAX_DELAY_MS);
}

async function fetchPage(url: string, maxRetries: number): Promise<string> {
  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    const response = await axios.get<string>(url, {
      timeout: REQUEST_TIMEOUT_MS,
      responseType: 'text',
      // Do not follow an instance-controlled redirect to an unapproved origin.
      maxRedirects: 0,
      headers: {
        'User-Agent': 'PublicTimelineResearchBot/1.0 (+operator contact URL)',
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9'
      },
      validateStatus: (status) => (status >= 200 && status < 400) || TRANSIENT.has(status)
    });
    if (!TRANSIENT.has(response.status)) return response.data;
    if (attempt === maxRetries) throw new Error(`transient status ${response.status}; retries exhausted`);
    await sleep(retryDelayMs(response, attempt));
  }
  throw new Error('retry loop exhausted');
}

function absoluteTimestamp(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const normalized = value.replace(/\s*[·•]\s*/g, ' ').replace(/\s+/g, ' ').trim();
  const milliseconds = Date.parse(normalized);
  return Number.isFinite(milliseconds) ? new Date(milliseconds).toISOString() : undefined;
}

function canonicalStatusUrl(href: string | undefined): { id: string; url: string; author: string } | undefined {
  const match = href?.match(/^\/([^/]+)\/status\/(\d+)/);
  if (!match) return undefined;
  return { id: match[2], author: match[1], url: `https://x.com/${match[1]}/status/${match[2]}` };
}

function parsePage(html: string, instance: URL, includeMediaMetadata: boolean): PageResult {
  const lower = html.toLowerCase();
  const blocked = ['verifying your request', 'captcha', 'access denied']
    .some((marker) => lower.includes(marker));
  if (blocked) return { posts: [], blocked: true };

  const $ = cheerio.load(html);
  const posts: PublicPost[] = [];
  $('.timeline .timeline-item')
    .filter((_, element) => $(element).find('.tweet-body').length > 0)
    .each((_, element) => {
      const item = $(element);
      const status = canonicalStatusUrl(item.find('a.tweet-link[href]').first().attr('href'));
      const timestamp = absoluteTimestamp(item.find('.tweet-date a[title]').attr('title'));
      if (!status || !timestamp) return;

      const avatarSrc = item.find('.tweet-header a.tweet-avatar img.avatar[src]').attr('src');
      posts.push({
        id: status.id,
        canonicalUrl: status.url,
        authorHandle: status.author,
        displayName: item.find('.tweet-header a.fullname').attr('title'),
        text: item.find('.tweet-content.media-body').text().trim(),
        timestamp,
        pinned: item.hasClass('pinned') || item.find('.pinned-icon, .icon-pin').length > 0,
        repostedBy: item.find('.retweet-header').text().trim() || undefined,
        images: includeMediaMetadata
          ? item.find('.attachments .attachment.image img[src]').map((__, image) => {
              const src = $(image).attr('src');
              return src ? new URL(src, instance).href : undefined;
            }).get().filter((url): url is string => Boolean(url))
          : undefined,
        avatarUrl: includeMediaMetadata && avatarSrc ? new URL(avatarSrc, instance).href : undefined
      });
    });

  return {
    posts,
    nextHref: $('div.show-more a[href]').last().attr('href'),
    blocked: false
  };
}

export async function scrapePublicTimeline(config: Config): Promise<RunResult> {
  const target = new URL(config.targetPath, config.instance);
  let currentUrl = target.href;
  let pagesFetched = 0;
  let stopReason: StopReason = 'page_limit';
  let partial = false;
  const warnings: string[] = [];
  const seenIds = new Set<string>();
  const seenCursors = new Set<string>();
  const pageUrls: string[] = [];
  const records: PublicPost[] = [];

  for (let page = 0; page < config.maxPages; page += 1) {
    let parsed: PageResult;
    try {
      pageUrls.push(currentUrl);
      const html = await fetchPage(currentUrl, config.maxRetries);
      parsed = parsePage(html, config.instance, config.includeMediaMetadata);
    } catch (error) {
      warnings.push(error instanceof Error ? error.message : String(error));
      stopReason = 'source_error';
      partial = true;
      break;
    }

    pagesFetched += 1;
    if (parsed.blocked) {
      warnings.push('source returned a challenge/access page; stopped without bypass');
      stopReason = 'blocked';
      partial = true;
      break;
    }

    let newStableIds = 0;
    for (const post of parsed.posts) {
      if (seenIds.has(post.id)) continue;
      seenIds.add(post.id);
      newStableIds += 1;

      const timestamp = Date.parse(post.timestamp);
      if (timestamp < config.startDate.getTime() || timestamp >= config.endDate.getTime()) continue;
      records.push(post);
      if (records.length >= config.maxItems) break;
    }

    if (records.length >= config.maxItems) {
      stopReason = 'item_limit';
      break;
    }
    if (newStableIds === 0 && page > 0) {
      stopReason = 'no_new_items';
      break;
    }

    const cutoffTimes = parsed.posts
      .filter((post) => !post.pinned)
      .map((post) => Date.parse(post.timestamp))
      .filter(Number.isFinite);
    if (cutoffTimes.length && Math.min(...cutoffTimes) < config.startDate.getTime()) {
      stopReason = 'date_cutoff';
      break;
    }

    if (!parsed.nextHref) {
      stopReason = 'missing_cursor';
      break;
    }
    const next = new URL(parsed.nextHref, currentUrl);
    const cursor = next.searchParams.get('cursor');
    if (next.origin !== config.instance.origin || next.pathname !== config.targetPath) {
      warnings.push('next-page link left the approved target');
      stopReason = 'missing_cursor';
      partial = records.length > 0;
      break;
    }
    if (!cursor) {
      stopReason = 'missing_cursor';
      break;
    }
    if (seenCursors.has(cursor)) {
      stopReason = 'repeated_cursor';
      break;
    }
    seenCursors.add(cursor);
    currentUrl = next.href;
    if (page === config.maxPages - 1) {
      stopReason = 'page_limit';
      partial = true;
      break;
    }
    await sleep(config.pageDelayMs);
  }

  return {
    records,
    provenance: {
      instance: config.instance.origin,
      targetUrl: target.href,
      retrievedAt: new Date().toISOString(),
      startDate: config.startDate.toISOString(),
      endDate: config.endDate.toISOString(),
      maxPages: config.maxPages,
      maxItems: config.maxItems,
      pagesFetched,
      pageUrls,
      stopReason,
      partial,
      warnings
    }
  };
}

if (import.meta.main) {
  scrapePublicTimeline(loadConfig())
    .then((result) => console.log(JSON.stringify(result, null, 2)))
    .catch((error) => {
      console.error(error instanceof Error ? error.message : String(error));
      process.exitCode = 1;
    });
}
