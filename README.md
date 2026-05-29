# swyxio Skills

Reusable skills for Claude Code, Codex, Cursor, and similar agent environments.

Each folder is a self-contained workflow with a `SKILL.md`, optional supporting scripts, and a focused trigger description so an agent can pick the right tool quickly.

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
      </ul>
      <p><strong>Quality</strong></p>
      <ul>
        <li><a href="./test-strategy-hardening">test-strategy-hardening</a> — <strong>Trustworthy tests.</strong> Audits whether tests carry their weight, then hardens flaky tests, contract tests, golden-path e2e, regression fixtures, runtime, dedupe, and coverage quality.</li>
      </ul>
    </td>
  </tr>
</table>

#### Other coding/workstation skills

- [new-mac-setup](./new-mac-setup) — opinionated Apple Silicon Mac bootstrap for fullstack and AI work. Installs Homebrew, shell tooling, editors, AI tools, terminal setup, and macOS defaults in a repeatable run order.
- [claude-session-introspect](./claude-session-introspect) — inspects Claude Code session JSONL files at `~/.claude/projects/` for token totals, prompt counts, assistant turns, tool calls, compaction boundaries, and compaction summaries.
- [smart-entity-resolution](./smart-entity-resolution) — resolves named people or organizations in messy databases with aliases, duplicates, sparse records, common names, LLM retrieval repair, reranking, and visible runner-up candidates.
- [autoreview](./autoreview) — runs structured closeout code review with a selected helper, verifies accepted findings, reruns focused tests, and stops only when no actionable findings remain.
- [public-qa-chatbot](./public-qa-chatbot) — builds unauthenticated public Q&A chatbot widgets with rate limits, origin/input hardening, semantic caching, observability, streaming UX, and robust chat scroll behavior.
- [slackbot-builder](./slackbot-builder) — builds production Slack bots with signed Events API handlers, fast acknowledgements, thread sessions, Block Kit interactions, App Home preferences, callbacks, and structured observability.

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

- [youtube-api](./youtube-api) — manages YouTube videos programmatically through the YouTube Data API v3, including uploads, thumbnails, metadata updates, and channel video listing.
- [youtube-publish](./youtube-publish) — publishes videos on YouTube, edits titles/descriptions/timestamps, assigns playlists, and manages YouTube Studio metadata workflows.
- [youtube-thumbnails](./youtube-thumbnails) — creates AI-generated YouTube thumbnails with prompt engineering, image generation, compression, and upload guidance.
- [thumbnail-extraction](./thumbnail-extraction) — extracts interesting video frames, face crops, presentation slides, and transparent cutouts for thumbnail compositing.

## Repo Shape

- One skill per top-level folder.
- Every skill must include `SKILL.md`.
- Add scripts only when they make the workflow more reliable or repeatable.
- Keep auxiliary docs minimal; the skill body should carry the agent-facing workflow.

Click into each folder for the detailed workflow, prerequisites, and command examples.
