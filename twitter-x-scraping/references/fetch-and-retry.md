# Fetch adapters, retries, and dependency baseline

Read this reference when implementing transport, retrying transient failures,
or adding an ordinary browser-rendering fallback. The exact numbers and package
versions below are restored as an April 2026 tested baseline, not universal
requirements.

## Axios adapter

Use a transparent user agent that identifies the client. Do not impersonate a
specific person's browser or hide automation identity.

```ts
import axios, { type AxiosResponse } from 'axios';

const FETCH_HEADERS = {
  'User-Agent': 'PublicTimelineResearchBot/1.0 (+operator contact URL)',
  Accept: 'text/html,application/xhtml+xml',
  'Accept-Language': 'en-US,en;q=0.9'
};

const TRANSIENT = new Set([429, 502, 503]);

type RetryPolicy = {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  maxServerDelayMs: number;
  requestTimeoutMs: number;
};

// Historical April 2026 defaults. Reduce these for small jobs or stricter
// source policies; never convert them into an unbounded retry loop.
const HISTORICAL_POLICY: RetryPolicy = {
  maxRetries: 10,
  baseDelayMs: 2_000,
  maxDelayMs: 60_000,
  maxServerDelayMs: 5 * 60_000,
  requestTimeoutMs: 30_000
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function serverDelayMs(response: AxiosResponse, nowMs = Date.now()): number | undefined {
  const retryAfter = response.headers['retry-after'];
  if (typeof retryAfter === 'string') {
    if (/^\d+$/.test(retryAfter)) return Number(retryAfter) * 1_000;
    const dateMs = Date.parse(retryAfter);
    if (Number.isFinite(dateMs)) return Math.max(0, dateMs - nowMs);
  }

  const reset = response.headers['x-rate-limit-reset'];
  if (typeof reset === 'string' && /^\d+$/.test(reset)) {
    return Math.max(0, Number(reset) * 1_000 - nowMs);
  }
  return undefined;
}

export async function fetchPublicHtml(
  url: string,
  policy: RetryPolicy = HISTORICAL_POLICY
): Promise<{ html: string; finalUrl: string; status: number }> {
  for (let attempt = 0; attempt <= policy.maxRetries; attempt += 1) {
    const response = await axios.get<string>(url, {
      headers: FETCH_HEADERS,
      timeout: policy.requestTimeoutMs,
      responseType: 'text',
      maxRedirects: 3,
      validateStatus: (status) => (status >= 200 && status < 400) || TRANSIENT.has(status)
    });

    if (!TRANSIENT.has(response.status)) {
      return {
        html: response.data,
        finalUrl: response.request?.res?.responseUrl ?? url,
        status: response.status
      };
    }

    if (attempt === policy.maxRetries) {
      throw new Error(`transient status ${response.status} after ${attempt + 1} requests`);
    }

    const instructed = serverDelayMs(response);
    const exponential = Math.min(
      policy.maxDelayMs,
      policy.baseDelayMs * 2 ** attempt + Math.floor(Math.random() * 250)
    );
    const waitMs = instructed == null
      ? exponential
      : Math.min(policy.maxServerDelayMs, Math.max(exponential, instructed));
    await sleep(waitMs);
  }
  throw new Error('retry loop exhausted');
}
```

Ten retries is intentionally preserved from the historical implementation, but
it is aggressive for many sources. Select a lower bound when the task is small,
the source policy is stricter, or the user does not need exhaustive recovery.
Always honor a longer policy-required delay even if that means stopping and
reporting that the requested run cannot finish now.

## Challenge and error-page detection

Do not trust HTTP 200 or the document title alone. Nitter-style deployments have
returned challenge and branded error pages with successful status codes.

```ts
import * as cheerio from 'cheerio';

const BLOCK_MARKERS = [
  'Verifying your request',
  'captcha',
  'access denied',
  'rate limit'
];

export function classifyHtml(html: string): 'timeline' | 'empty' | 'blocked' | 'unexpected' {
  const lower = html.toLowerCase();
  if (BLOCK_MARKERS.some((marker) => lower.includes(marker.toLowerCase()))) return 'blocked';
  const $ = cheerio.load(html);
  if ($('.timeline .timeline-item .tweet-body').length > 0) return 'timeline';
  if ($('.timeline').length > 0) return 'empty';
  return 'unexpected';
}
```

On `blocked`, stop and report the condition. Do not suppress `navigator.webdriver`,
disable automation-detection features, rotate fingerprints/proxies, or switch
to headed mode for the purpose of defeating the block.

## Ordinary Playwright rendering

Use Playwright only when the permitted public page requires JavaScript for
ordinary rendering or when the user specifically requests browser capture. It
is not a challenge solver.

```ts
import { chromium, type Browser } from 'playwright';

let browser: Browser | undefined;

export async function fetchRenderedPublicHtml(url: string): Promise<string> {
  browser ??= await chromium.launch({ headless: true });
  const context = await browser.newContext({
    locale: 'en-US',
    userAgent: 'PublicTimelineResearchBot/1.0 (+operator contact URL)'
  });
  try {
    const page = await context.newPage();
    const response = await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: 30_000
    });
    if (!response) throw new Error('navigation produced no response');
    const html = await page.content();
    const kind = classifyHtml(html);
    if (kind === 'blocked') throw new Error('source returned an access challenge; stopping');
    if (kind === 'unexpected') throw new Error('public timeline markup not found');
    return html;
  } finally {
    await context.close();
  }
}
```

Reuse one browser process for a bounded run, but isolate contexts when cookies
or page state should not carry across targets. Close the browser in the caller's
`finally` block.

## Historical dependency baseline

The original adapter recorded this package set in April 2026:

```json
{
  "axios": "^1.7.2",
  "cheerio": "^1.0.0",
  "playwright": "^1.58.2"
}
```

Prefer the repository's existing compatible versions. Before adding or
upgrading, inspect current release/security guidance and the lockfile. Do not
install Playwright or browser binaries unless the requested implementation
actually needs browser rendering and the user has authorized installation.

The historical installation command was:

```bash
npx playwright install chrome
```

Treat it as reference only; use the project's package manager and approved
browser target.

## Prohibited historical workaround

The earlier skill recommended headed Chrome, automation-signal suppression,
`--disable-blink-features=AutomationControlled`, and overriding
`navigator.webdriver` after a challenge. Those details are intentionally not
restored as executable guidance: they are access-control circumvention. Their
retained lesson is diagnostic—some instances discriminate between clients. If
ordinary HTTP or an ordinary browser receives a block, record it and stop.
