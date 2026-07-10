# Vercel Cost Review Checklist

## Access and scope

- [ ] Confirm `vercel whoami` and team scope.
- [ ] List production projects and domains.
- [ ] Inspect `.vercel/project.json` or `.vercel/repo.json`.
- [ ] Confirm each monorepo project's Vercel Root Directory.
- [ ] Record review period and comparison period.

## Usage evidence

Start by discovering supported metrics:

```bash
npx vercel metrics schema
npx vercel metrics schema vercel.request.fdt_out_bytes
```

Useful metrics include:

```text
vercel.request.count
vercel.request.fdt_in_bytes
vercel.request.fdt_out_bytes
vercel.request.fdt_total_bytes
vercel.function_invocation.count
vercel.function_invocation.fot_total_bytes
```

- [ ] Rank projects by total FDT.
- [ ] Rank paths/routes by outgoing FDT and request count.
- [ ] Calculate bytes/request.
- [ ] Split by request method, status, cache result, bot, and user agent where available.
- [ ] Compare with the previous equivalent period.
- [ ] Note when Observability Plus prevents a query rather than guessing.

Runtime-log fallback:

```bash
npx vercel logs --environment production --since 1h \
  --query 'requestPath:"/path"' --json --no-branch
```

Use grouped runtime logs or Vercel's runtime-log API for counts. Remember that middleware and function rows may represent the same request.

## Route and asset probes

Probe headers and compressed size:

```bash
curl -sS -D - -o /tmp/body.bin \
  -H 'Accept-Encoding: gzip' \
  'https://example.com/path'
wc -c /tmp/body.bin
```

- [ ] Record status, redirect chain, `Cache-Control`, `Age`, `ETag`, `Content-Encoding`, `Content-Length`, `x-vercel-cache`, and matched/rewritten path.
- [ ] Measure GET and representative POST/tool responses separately.
- [ ] Inspect browser-navigation `/_next/data/{buildId}/...json` payloads for Pages Router sites.
- [ ] Inventory public images/fonts larger than 500 KB.
- [ ] Inspect the largest JavaScript chunks and their cache policy.

## Diagnosis prompts

Evaluate these independently:

1. Is a crawler, poller, protocol probe, or distributed bot driving requests?
2. Is the response unnecessarily large or deeply duplicated?
3. Is a public asset poorly encoded or oversized?
4. Is browser caching absent (`max-age=0`)?
5. Is edge caching absent or ineffective?
6. Is the endpoint dynamic, POST-based, personalized, or otherwise unsafe to cache?
7. Does middleware, rewriting, or multi-zone routing duplicate work or obscure the real path?
8. Are static page props or Next data payloads shipping data that could load on demand?
9. Are archived projects still using active-event TTLs?
10. Is a Vercel project linked to the wrong Root Directory?

Add temporary logs only for evidence still missing. Prefer:

```text
route, method, action/tool, status, response_bytes,
cache_result, privacy-safe client key, user_agent_class
```

Do not log request bodies, prompts, credentials, or raw personal data.

## Remediation review

- [ ] WAF rules match only intended paths and methods.
- [ ] Rate-limit keys and windows permit legitimate clients.
- [ ] Heavy fields are opt-in and list operations are paginated.
- [ ] JSON is compact in production.
- [ ] Stable public URLs remain compatible after asset optimization.
- [ ] Hashed assets use long browser caching and `immutable`.
- [ ] Unhashed public assets have an intentional browser/CDN TTL.
- [ ] Cache headers do not leak personalized responses.
- [ ] Shared registry/config changes are deployed to every consuming zone.
- [ ] Next.js route/header patterns pass a production build.

## Verification

- [ ] Production build passes.
- [ ] Deploy reaches `READY` and the intended domain/alias.
- [ ] Critical route and metadata smoke tests pass.
- [ ] API/MCP initialization and representative calls pass.
- [ ] Firewall rejects or throttles the intended excess traffic.
- [ ] Response bytes/request decreased as expected.
- [ ] Follow-up traffic sample shows lower request rate and/or FDT.
- [ ] Final report distinguishes measured savings from estimates.
