# swyxio Skills

Reusable skills for Claude Code, Codex, Cursor, and similar agent environments.

Each folder is a self-contained workflow with a `SKILL.md`, optional supporting scripts, and a focused trigger description so an agent can pick the right tool quickly.

## Quick Routing

Use the most specific skill that matches the job. When a workflow spans multiple stages, start with the orchestrator skill, then hand off to the atomic skill for the active stage.

| User intent | Start with | Hand off to |
| --- | --- | --- |
| Download, transform, transcribe, thumbnail, or publish media end-to-end | [media-transform](./media-transform) | `download-*`, `transcribe-anything`, `thumbnail-extraction`, `youtube-*` |
| Download a video from a page, X/Twitter, or Zoom | [download-video](./download-video), [download-x-video](./download-x-video), or [zoom-download](./zoom-download) | [media-transform](./media-transform) if more stages follow |
| Upload many submitted talks from Airtable/local files to YouTube Studio | [youtube-studio-batch-upload](./youtube-studio-batch-upload) | [youtube-studio-computer-use](./youtube-studio-computer-use) for post-upload Studio cleanup |
| Edit existing YouTube Studio videos, thumbnails, playlists, visibility, or schedules through Chrome | [youtube-studio-computer-use](./youtube-studio-computer-use) | [youtube-api](./youtube-api) if API credentials exist and the task is API-friendly |
| Use the YouTube Data API for metadata, thumbnails, uploads, or channel listing | [youtube-api](./youtube-api) | [youtube-studio-computer-use](./youtube-studio-computer-use) for Studio-only states |
| Build a full YouTube operations bot with raw API access, Slack approvals, playlists, comments, live operations, and change-impact analytics | [youtube-channel-operator](./youtube-channel-operator) | [slackbot-builder](./slackbot-builder), [data-chatbots](./data-chatbots), then [youtube-api](./youtube-api) or [youtube-studio-computer-use](./youtube-studio-computer-use) |
| Redesign or reskin an app through generated visual directions and matched implementation screenshots | [design-apps-with-imagegen](./design-apps-with-imagegen) | The project-specific frontend skill after the visual direction and prototype are proven |
| Build conference schedule, speaker, or developer data surfaces | [schedule-design](./schedule-design), [conference-developer-endpoints](./conference-developer-endpoints), or [europe-developer-api](./europe-developer-api) | `accelevents-*` or [sync-accelevents](./sync-accelevents) when syncing source systems |
| Harden a software repo | [codebase-maintainability-guardrails](./codebase-maintainability-guardrails) for defaults, then [antislop-codebase](./antislop-codebase) for larger cleanup | `productionize-*`, `security-*`, `observability-*`, `release-*`, `test-*` |
| Design, debug, migrate, cache, or deploy a production system on Cloudflare | [cloudflare-production-builder](./cloudflare-production-builder) | Product-specific skills after the Cloudflare durability, storage, security, and release boundaries are settled |
| Build a structured-data chatbot or Slack bot | [data-chatbots](./data-chatbots) or [slackbot-builder](./slackbot-builder) | [app-ux-paradigms](./app-ux-paradigms) for interaction details |
| Protect usernames and public handles from route collisions, squatting, or impersonation | [reserved-handle-policy](./reserved-handle-policy) | [security-hardening](./security-hardening) when broader auth or permission review is needed |

### Routing Notes

- Prefer API skills for stable, supported bulk operations; prefer Computer Use skills for authenticated browser states, Studio-only controls, file pickers, disabled buttons, and save verification.
- Keep source acquisition, metadata staging, and upload ledgers in batch/upload skills. Keep existing-video cleanup, thumbnails, scheduling, playlist fixes, and save recovery in `youtube-studio-computer-use`.
- Treat status, reviewer, and operations fields as private by default. Public descriptions should use submitted abstracts, bios, company/project links, and social links entered for publication.
- Do not physically reorganize skill folders into categories unless every target agent loader supports nested skill discovery. The top-level `folder/SKILL.md` layout is intentional.

## Skill Index

### Coding, Agents, And Workstations

#### Kakuna Codebase Hardening Suite

Use these skills as a hardening progression: prevent new slop, harden the existing codebase as-is, add product services, then tighten safety, operability, and quality gates.

<table>
  <tr>
    <td width="280" align="center" valign="middle">
      <img src="./assets/kakuna-codebase-hardening.png" alt="Kakuna Codebase Hardening Suite logo: a cute armored cocoon mascot inside a code shield" width="240">
    </td>
    <td valign="middle">
      <p><strong>Foundation</strong></p>
      <ul>
        <li><a href="./codebase-maintainability-guardrails">codebase-maintainability-guardrails</a> — <strong>Default engineering standards.</strong> Always-on rules for small, typed, feature-owned, contract-driven, behavior-preserving, visually verified app work.</li>
        <li><a href="./antislop-codebase">antislop-codebase</a> — <strong>Structural cleanup/migration.</strong> Staged refactors for messy or prototype repos as they already are, with concurrent workers, better tests, smaller files, clearer module boundaries, and a final migration audit microsite.</li>
      </ul>
      <p><strong>Productization</strong></p>
      <ul>
        <li><a href="./productionize-app-with-services">productionize-app-with-services</a> — <strong>Operational/product hardening.</strong> Adds product services after the codebase is coherent enough to operate: audit trails, role-aware permissions, API keys, REST/OpenAPI/agent docs, PostHog instrumentation, feature flags, admin UX, deploy smokes, and a final audit microsite.</li>
      </ul>
      <p><strong>Safety</strong></p>
      <ul>
        <li><a href="./security-hardening">security-hardening</a> — <strong>Practical appsec pass.</strong> Reviews auth/session risk, secrets, dependency exposure, SSRF/uploads, CORS/CSRF, rate limits, input validation, unsafe logging, permission bypasses, and security headers.</li>
      </ul>
      <p><strong>Operability</strong></p>
      <ul>
        <li><a href="./observability-hardening">observability-hardening</a> — <strong>Production visibility.</strong> Adds privacy-safe structured logs, error classes, request IDs, traces, metrics, dashboards, alert thresholds, user-visible operation status, and debug paths.</li>
        <li><a href="./release-readiness-hardening">release-readiness-hardening</a> — <strong>Safe ship gates.</strong> Defines env validation, deploy checklist, smoke tests, rollback path, feature flags, migration checks, production verification, and post-deploy monitoring.</li>
        <li><a href="./vercel-production-cost-review">vercel-production-cost-review</a> — <strong>Recurring platform cost control.</strong> Audits Vercel spend across projects and zones, ranks Fast Data Transfer drivers, diagnoses caching, payload, asset, and abusive-traffic causes, and verifies safe remediations.</li>
      </ul>
      <p><strong>Quality</strong></p>
      <ul>
        <li><a href="./test-strategy-hardening">test-strategy-hardening</a> — <strong>Trustworthy tests.</strong> Guides everyday test writing and suite-wide audits, then hardens flaky tests, contracts, golden-path e2e, fixtures, runtime, dedupe, and coverage quality.</li>
      </ul>
    </td>
  </tr>
</table>

#### Other coding/workstation skills

- [align-me](./align-me) — pauses before a long autonomous run to surface material ambiguities as numbered, lettered choices with concrete tradeoffs, recommendations, and an `approve all` path.
- [new-mac-setup](./new-mac-setup) — opinionated Apple Silicon Mac bootstrap for fullstack and AI work. Installs Homebrew, shell tooling, editors, AI tools, terminal setup, and macOS defaults in a repeatable run order.
- [cloudflare-production-builder](./cloudflare-production-builder) — chooses among Workers, Pages, Workflows, Queues, Durable Objects, D1, R2, KV, Cache API, alarms, and Cron; then applies durable handoffs, safe caching, migration discipline, multi-tenant boundaries, observability, and live production verification.
- [claude-session-introspect](./claude-session-introspect) — inspects Claude Code session JSONL files at `~/.claude/projects/` for token totals, prompt counts, assistant turns, tool calls, compaction boundaries, and compaction summaries.
- [deep-trajectory-analysis](./deep-trajectory-analysis) — reconstructs paired agent, game, or policy trajectories from exact shared pre-states, connects aggregate effects to first-divergence evidence, and validates machine-readable causal reports before promotion decisions.
- [design-apps-with-imagegen](./design-apps-with-imagegen) — audits an existing interface, generates several visual directions, prototypes beside the live product, compares matched responsive screenshots, and integrates only after behavior and visual deltas are verified.
- [smart-entity-resolution](./smart-entity-resolution) — resolves named people or organizations in messy databases with aliases, duplicates, sparse records, common names, LLM retrieval repair, reranking, and visible runner-up candidates.
- [autoreview](./autoreview) — runs structured closeout code review with a selected helper, verifies accepted findings, reruns focused tests, and stops only when no actionable findings remain.
- [public-qa-chatbot](./public-qa-chatbot) — builds unauthenticated public Q&A chatbot widgets with rate limits, origin/input hardening, semantic caching, observability, streaming UX, and robust chat scroll behavior.
- [slackbot-builder](./slackbot-builder) — builds production Slack bots with signed Events API handlers, causal shared-thread sessions, per-thread serialization, stateful routing and owned-resource resolution, state-aware Block Kit approvals, durable execution for slow agent work, guaranteed result-or-error delivery, and structured observability.
- [sync-url-navigation](./sync-url-navigation) — syncs URL query params with app navigation, tabs, and filter state so views are bookmarkable and shareable (`view`, `table`, `q`, deep links, `popstate`).
- [app-ux-paradigms](./app-ux-paradigms) — standard web UX defaults: Esc/backdrop/× for modals, ⌘/Ctrl shortcuts, form save states, tables, menus, and help text for discoverable interactions.
- [data-chatbots](./data-chatbots) — copilots over structured data that **propose** mutations (draft → Apply), not direct writes: prompting, validator allowlists, session memory with DRAFT/APPLIED/IGNORED, version-stale UX, and test matrices.
- [reserved-handle-policy](./reserved-handle-policy) — designs and implements two-tier public username protection with hard platform reservations, administrator-reviewed claims, separator-confusable matching, a source-attributed registry of common names and notable identities, and signup/rename/admin test guidance.

### Media Download And Transformation

- [media-transform](./media-transform) — orchestrates video pipelines across download, upload, transcription, chapters, thumbnails, and title testing by routing to the right atomic skill for each stage.
- [download-video](./download-video) — downloads embedded videos from web pages by resolving the real player URL and calling `yt-dlp` with the right referer/origin headers.
- [download-x-video](./download-x-video) — downloads X/Twitter post videos with `yt-dlp`, including HLS streams and reliable final-path detection.
- [zoom-download](./zoom-download) — downloads Zoom cloud recordings, verifies filenames/file types, and supports ffmpeg-based content analysis.

### Web And Social Scraping

- [twitter-x-scraping](./twitter-x-scraping) — scrapes public Twitter/X profile and list timelines through Nitter-compatible mirror HTML, with cursor pagination, raw JSON persistence, and anti-bot fallback guidance. Does not treat public mirrors as a reliable source for a user's following graph.

### Conference And Event Operations

- [accelevents-api](./accelevents-api) — reads and updates AI Engineer Europe speaker records through the Accelevents REST API while preserving full speaker payloads.
- [accelevents-speaker-sync](./accelevents-speaker-sync) — syncs website speaker, session, schedule, room, track, and headshot changes back to Accelevents for AI Engineer Europe.
- [conference-developer-endpoints](./conference-developer-endpoints) — adds and reviews developer-facing conference endpoints such as `llms.txt`, `sessions.json`, `speakers.json`, and MCP routes.
- [europe-developer-api](./europe-developer-api) — works with AI Engineer Europe developer endpoints, public schedule JSON, speakers JSON, MCP access, and the local `aieng` CLI.
- [schedule-design](./schedule-design) — builds polished conference schedule views with React grids, filters, modals, favorites, sticky layouts, and normalized data.
- [sync-accelevents](./sync-accelevents) — pulls Accelevents speaker headshots, social data, bios, and schedule metadata into local conference source data.
- [testing-schedule-preview](./testing-schedule-preview) — tests the AI Engineer Europe internal Bun schedule preview and public schedule page workflows.
- [web-animation-perf](./web-animation-perf) — debugs jank, layout thrash, and drift in JS-driven CSS animation across AI Engineer conference sites.

### Transcription, Extraction, And Summarization

- [transcribe-anything](./transcribe-anything) — transcribes audio and video files using pluggable ASR backends including local Whisper, whisperX, faster-whisper, OpenAI, Groq, Deepgram, AssemblyAI, Gemini, and Hugging Face models.
- [conference-transcribe](./conference-transcribe) — splits long conference livestreams or YouTube videos into per-talk transcripts using chapter timestamps, segment transcription, and LLM cleanup.
- [multimodal-extraction](./multimodal-extraction) — turns local videos or video URLs into Markdown timelines with slide screenshots, key frames, and transcript spans aligned by timestamp.
- [summarize-anything](./summarize-anything) — recursively summarizes long text with pluggable LLM backends and can emit executive summaries, YouTube descriptions, chapters, posts, titles, thumbnail prompts, blog outlines, and pull quotes.
- [podcast-publishing-assistant](./podcast-publishing-assistant) — turns podcasts, interviews, panels, and long-form audio/video into transcripts, summaries, chapter markers, show notes, titles, descriptions, and promo copy.

### YouTube Publishing And Thumbnails

- [youtube-channel-operator](./youtube-channel-operator) — designs full-power multi-channel YouTube operators with typed Data/Analytics/Reporting/Live API access, transcript-derived viewer packages, paid-versus-organic analysis, guided Slack approvals, exact-channel OAuth isolation, immutable external-action audit, Studio-only handoffs, and post-change measurement.
- [youtube-api](./youtube-api) — manages YouTube videos programmatically through the YouTube Data API v3, including uploads, thumbnails, metadata updates, and channel video listing.
- [youtube-publish](./youtube-publish) — publishes videos on YouTube, edits titles/descriptions/timestamps, assigns playlists, and manages YouTube Studio metadata workflows.
- [youtube-studio-batch-upload](./youtube-studio-batch-upload) — batches YouTube Studio uploads from Airtable or local video submissions, with source download recovery, metadata staging, unlisted visibility, playlist tagging, save verification, and blocked-row reporting.
- [youtube-studio-computer-use](./youtube-studio-computer-use) — automates live YouTube Studio cleanup through Chrome/Computer Use: thumbnails, schedules, playlist fixes, visibility, save-state recovery, and DOM-assisted edit pages.
- [youtube-thumbnails](./youtube-thumbnails) — creates AI-generated YouTube thumbnails with prompt engineering, image generation, compression, and upload guidance.
- [thumbnail-extraction](./thumbnail-extraction) — extracts interesting video frames, face crops, presentation slides, and transparent cutouts for thumbnail compositing.

## Repo Shape

- One skill per top-level folder.
- Every skill must include `SKILL.md`.
- Add scripts only when they make the workflow more reliable or repeatable.
- Keep auxiliary docs minimal; the skill body should carry the agent-facing workflow.

Click into each folder for the detailed workflow, prerequisites, and command examples.

## Installing in Cursor

Clone this repo, then point Cursor at it with **one symlink for the whole directory** (recommended):

```bash
git clone git@github.com:swyxio/skills.git ~/Work/skills   # or any path you prefer
rm -rf ~/.cursor/skills   # only if replacing an old per-skill layout
ln -sf ~/Work/skills ~/.cursor/skills
```

Cursor loads each skill subfolder that contains `SKILL.md`. `git pull` in `~/Work/skills` updates every skill agents see — no per-skill symlinks to add after a new commit.

**Optional:** link only the skills you use (omit `rm` above; symlink into an existing `~/.cursor/skills/` folder):

```bash
ln -sf ~/Work/skills/data-chatbots ~/.cursor/skills/data-chatbots
```

Do **not** copy `SKILL.md` files into `~/.cursor/skills/`; always symlink to this repo.

**Note:** Cursor’s built-in skills live separately at `~/.cursor/skills-cursor/` — leave that alone.
