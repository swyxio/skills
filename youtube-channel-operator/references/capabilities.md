# YouTube capability reference

Use this file to decide whether an operation is supported and which surface owns
it. Recheck the linked official documentation before implementation; YouTube
changes quotas and mutable fields over time.

## Contents

- [OAuth scopes](#oauth-scopes)
- [Data API writes](#data-api-writes)
- [Live writes](#live-writes)
- [Analytics and reporting](#analytics-and-reporting)
- [Studio-only gaps](#studio-only-gaps)
- [Quota and compliance](#quota-and-compliance)

## OAuth scopes

For a full channel operator:

| Scope | Purpose |
| --- | --- |
| `youtube.force-ssl` | Broad channel management, including edits and permanent deletes; accepted by video uploads and most creator writes |
| `youtube.readonly` | Authenticated channel/resource reads; currently also required by Analytics report queries |
| `yt-analytics.readonly` | Nonmonetary Analytics and Reporting data |
| `yt-analytics-monetary.readonly` | Revenue and monetary analytics when the product promises full analytics |

Do not request `youtubepartner` unless the operator is a YouTube CMS/content
partner. Ordinary Brand Account channels use owner/manager user OAuth, not
service accounts or `onBehalfOfContentOwner`.

Use offline OAuth, securely store the refresh token, and verify the exact channel
with `channels.list(mine=true)`.

Official references:
[OAuth scopes](https://developers.google.com/identity/protocols/oauth2/scopes),
[server-side OAuth](https://developers.google.com/youtube/v3/guides/auth/server-side-web-apps).

## Data API reads and writes

`videos.list(part=snippet,id=...)` returns the complete default video
description; a `descriptionExcerpt` is an application-created truncation, not a
YouTube API limitation. Keep broad upload/search catalogs compact for entity
resolution, then batch exact owned-video IDs into a targeted metadata read
before parsing links, extracting handles, comparing descriptions, or drafting
an update. Use 50-video application pages to match YouTube's native request
limit, and continue larger sets with an explicit page or cursor. Do not add a
second row-omission or silent description-truncation layer inside a selected
page. Never treat an excerpt as authoritative content.

| Surface | Supported writes | Constraints and traps |
| --- | --- | --- |
| Videos | Upload, update, delete; title, description, tags, category, default language/localizations, recording date, privacy, scheduled publish, embedding, license, public stats, made-for-kids and synthetic-media disclosures | Update `part`s replace omitted mutable values. `snippet` updates require title and category. `publishAt` is limited to private, never-published videos. Delete is permanent. |
| Thumbnails | Set/replace a custom video thumbnail | JPEG/PNG, 2 MB, channel eligibility and rate limits. Not a Shorts thumbnail-frame control. |
| Captions | List/download, upload, replace/update, delete | Caption upload/update is quota-heavy. Auto-sync control is deprecated. |
| Playlists | Create, update, delete; title, description, privacy, podcast status, language/localizations | Special uploads playlists cannot be modified like normal playlists. Update parts have replacement semantics. |
| Playlist items | Add, remove, reorder; notes and start/end offsets | Removal uses playlist-item ID, not video ID. Reordering requires manual sort. |
| Playlist images | Insert, update, delete playlist thumbnail image | Treat the media upload as a durable asset operation. |
| Comments | Post top-level comment, reply, edit/delete own comment, publish/reject/hold, reject and ban author | No pin/unpin. Reject hides replies; rejected comments cannot be rediscovered through listing. |
| Channel | Description, keywords, country, default language, trailer, localizations, banner | No documented title, handle, or avatar change. Preserve complete mutable parts. |
| Channel sections | Create, update, reorder, delete homepage shelves | Maximum 10 shelves. |
| Watermark | Set or unset channel watermark | Channel-wide effect; unset is destructive. |
| Subscriptions/ratings | Subscribe/unsubscribe, rate/unrate, report abuse | User-account actions; normally raw-only rather than promoted channel workflows. |

Primary references:
[API reference](https://developers.google.com/youtube/v3/docs),
[videos.update](https://developers.google.com/youtube/v3/docs/videos/update),
[videos.insert](https://developers.google.com/youtube/v3/docs/videos/insert),
[thumbnails.set](https://developers.google.com/youtube/v3/docs/thumbnails/set),
[captions](https://developers.google.com/youtube/v3/docs/captions),
[playlists](https://developers.google.com/youtube/v3/guides/implementation/playlists),
[playlist images](https://developers.google.com/youtube/v3/docs/playlistImages),
[comments](https://developers.google.com/youtube/v3/guides/implementation/comments),
[channels.update](https://developers.google.com/youtube/v3/docs/channels/update),
[channel sections](https://developers.google.com/youtube/v3/docs/channelSections),
[watermarks](https://developers.google.com/youtube/v3/docs/watermarks).

Treat mutable fields that appear inconsistently across resource and update
documentation as canary-only until a live private/unlisted test verifies them.
Examples have included paid-product-placement and channel-level made-for-kids
fields.

## Live writes

The Live Streaming API supports:

- create/update/delete streams;
- create/update/delete broadcasts;
- bind/unbind a stream;
- transition broadcast status;
- configure title, description, schedule, privacy, DVR, embedding, recording,
  captions, auto-start/stop, and availability where the broadcast state permits;
- insert/delete live chat messages and polls;
- insert/delete chat bans and moderators;
- insert ad cuepoints and configure currently supported live midroll settings.

Treat live transitions, broadcast deletion, bans, and ad cuepoints as high-impact
even in trusted environments. Several fields are mutable only before going live.

Reference: [Live Streaming API](https://developers.google.com/youtube/v3/live/docs).

## Analytics and reporting

### Targeted Analytics API

Query by channel/video/playlist, day/month, geography, device, traffic source,
audience, or retention where the report supports it.

Useful metrics include:

- views and engaged views;
- estimated watch minutes;
- average view duration and percentage;
- likes, comments, shares;
- playlist adds/removes and playlist starts/views;
- subscribers gained/lost;
- retention curves;
- traffic sources, devices, geography, and demographics;
- revenue metrics when the monetary scope is granted.

References:
[channel reports](https://developers.google.com/youtube/analytics/channel_reports),
[metrics](https://developers.google.com/youtube/analytics/metrics),
[reports.query](https://developers.google.com/youtube/analytics/reference/reports/query).

### Bulk Reporting API

Create reporting jobs before relying on future daily datasets. Reach reports
provide:

- `video_thumbnail_impressions`;
- `video_thumbnail_impressions_ctr`;
- date, channel, and video dimensions.

Reports are delayed and may take roughly 48 hours to begin. The API does not
expose native A/B test arms or winners.

References:
[Reporting API](https://developers.google.com/youtube/reporting/v1/reports/),
[channel reach reports](https://developers.google.com/youtube/reporting/v1/reports/channel_reports).

## Studio-only gaps

| Operation | Supported handoff |
| --- | --- |
| Native concurrent title/thumbnail A/B test | Generate up to three candidate combinations, open exact Studio video, record a pending local marker, and verify the result in Studio |
| Pin/unpin comment | Create/update the exact channel-owned comment, then open the watch/Studio UI to pin and verify |
| Community post | Open Studio/Create and verify the published post |
| End screens/cards or Studio editor | Open the exact Studio editor |
| Shorts thumbnail frame, related-video and music controls | Use the relevant YouTube mobile/Studio surface |
| Channel handle/avatar | Use the owning account/Studio UI |
| Most ordinary VOD monetization controls | Use Studio; Content ID/partner APIs are a separate product |

Native A/B tests compare up to three title/thumbnail combinations by watch-time
share. They are unavailable for several video states, and any API title or
thumbnail change stops a running test.

References:
[A/B test titles and thumbnails](https://support.google.com/youtube/answer/16391400),
[comment methods](https://developers.google.com/youtube/v3/docs/comments),
[activities are list-only](https://developers.google.com/youtube/v3/docs/activities).

## Quota and compliance

Always check the current
[quota calculator](https://developers.google.com/youtube/v3/determine_quota_cost).

At the time this reference was authored:

- default allocation separated 100 `videos.insert` calls/day and 100
  `search.list` calls/day from 10,000 units/day for other methods;
- common mutations cost 50 units;
- captions insert/update cost substantially more;
- invalid requests still consumed quota;
- quota reset at midnight Pacific Time.

Projects created after July 2020 may have API uploads forced private until a
compliance audit. Quota extensions require a separate compliance review.

Reference:
[quota and compliance audits](https://developers.google.com/youtube/v3/guides/quota_and_compliance_audits).
