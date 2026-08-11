# Nitter-style mirror inventory — historical April 2026 snapshot

Read this reference when selecting or diagnosing a public Nitter-style mirror.
It restores research captured on April 15, 2026; it is not a live ranking and
must not be treated as evidence that an instance is currently available,
authorized for automation, or structurally compatible.

## Historical snapshot

| Instance | Observation recorded April 15, 2026 |
|---|---|
| `nitter.tiekoetter.com` | Successfully returned expected timeline markup during the recorded run |
| `nitter.privacyredirect.com` | TLS timeout during the recorded run |
| `nitter.catsarch.com` | Listed as up by the observed status source; not independently guaranteed |
| `xcancel.com` | Listed as up by the observed status source; not independently guaranteed |
| `nitter.net` | Reachable in some modes but returned blocking/error pages in others |

The historical status source was [status.d420.de](https://status.d420.de/).
Status aggregators are discovery aids, not permission or compatibility checks.

## Verify before selecting

For every candidate instance:

1. Check its current terms, robots/access policy, and any operator guidance.
2. Make one ordinary, low-rate request to the exact public profile/list path.
3. Reject login pages, CAPTCHA/challenge pages, generic error documents, and
   status-200 pages without the expected public timeline structure.
4. Confirm that a real `.timeline-item` contains a `.tweet-body`, canonical
   status link, and absolute timestamp attribute before accepting the adapter.
5. Record the instance, retrieval time, HTTP status, final URL, and validation
   result in the run metadata.
6. Do not automatically rotate through a large mirror list. Use a short,
   user-approved list and stop when access is denied or policy is unclear.

An instance being reachable does not make it the preferred source. Prefer the
source the user supplied or explicitly authorized. If no source is supplied,
report the available choices and their verification state rather than silently
selecting a third-party operator.

## Typed probe result

Keep availability, access, and parse compatibility distinct:

```ts
type MirrorProbe = {
  instance: string;
  checkedAt: string;
  finalUrl?: string;
  httpStatus?: number;
  outcome: 'compatible' | 'empty' | 'blocked' | 'policy_unknown' | 'network_error' | 'markup_drift';
  detail?: string;
};
```

Do not publish the historical table as a current uptime ranking. If a task asks
for current availability, probe at action time and timestamp the result.
