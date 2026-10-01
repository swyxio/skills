# swyxio Skills

Reusable skills for Claude Code, Codex, Cursor, and similar agent environments.

Each skill folder contains a `SKILL.md`: a trigger description followed by the
workflow an agent reads when the skill applies. Scripts, references, and assets
support individual workflows. This is a personal working collection; some
skills assume swyx's projects, preferences, credentials, or installed tools.
Read a skill's prerequisites before running its commands.

## Install And Try One Skill

Clone the collection with Git, then link a selected skill into your agent's
personal skills directory. You need Git and a compatible agent installed. This
Codex example uses macOS/Linux and HTTPS, so cloning does not require a GitHub
SSH key:

```bash
git clone https://github.com/swyxio/skills.git ~/Work/skills
mkdir -p ~/.agents/skills
test ! -e ~/.agents/skills/review-thread && test ! -L ~/.agents/skills/review-thread && \
  ln -s ~/Work/skills/review-thread ~/.agents/skills/review-thread
test -r ~/.agents/skills/review-thread/SKILL.md && echo "review-thread linked"
```

The last command prints `review-thread linked` when the installed instructions
are readable. The checks before `ln -s` prevent replacing an existing entry:
inspect that entry before deliberately replacing it. Readability alone does not
prove that an existing entry points to this checkout.

Choose the destination for your agent:

| Agent | Personal skills directory | Use |
| --- | --- | --- |
| [Codex](https://developers.openai.com/codex/skills) | `~/.agents/skills/` | Select the skill or mention `$review-thread` in a prompt. |
| [Claude Code](https://code.claude.com/docs/en/skills) | `~/.claude/skills/` | Link there instead, then invoke `/review-thread`. |
| [Cursor](https://cursor.com/docs/skills) | `~/.cursor/skills/` or `~/.agents/skills/` | Link there, then select the skill in Agent chat. |

For a first use, open a task that already contains your goal and work so far
(or provide that context), then ask: "Use review-thread to
assess progress toward my goal, what remains, and the likely agent execution
time." Expect an assessment grounded in that task's context; it does not start
new tasks merely by suggesting them. A useful assessment distinguishes what
works from what is merely implemented or tested, and names the remaining
completion endpoint. Refresh or restart the agent if the skill is missing from
its selector. The author also maintains a legacy `~/.codex/skills/` installation;
the table follows current documented directories for new installs.

Repeat the link command for the skills you need. Keep a single checkout as the
source and link whole skill folders so references and scripts stay together.
Updates to that checkout appear through its links; use `git status` before
`git pull --ff-only`, and resolve local edits rather than overwriting them.
Link newly added skills separately. Installation supplies instructions; it does
not install workflow dependencies or grant API, browser, or publishing access.

## Quick Routing

Use the most specific skill that matches the job. When a workflow spans multiple stages, start with the orchestrator skill, which coordinates the stages, then hand off to the atomic
skill that handles one stage.

| User intent | Start with | Hand off to |
| --- | --- | --- |
| Download, transform, transcribe, thumbnail, or publish media end-to-end | [media-transform](./media-transform) | `download-*`, `transcribe-anything`, `thumbnail-extraction`, `youtube-*` |
| Download a video from a page, X/Twitter, or Zoom | [download-video](./download-video), [download-x-video](./download-x-video), or [zoom-download](./zoom-download) | [media-transform](./media-transform) if more stages follow |
| Upload many submitted talks from Airtable/local files to YouTube Studio | [youtube-studio-batch-upload](./youtube-studio-batch-upload) | [youtube-studio-computer-use](./youtube-studio-computer-use) for post-upload Studio cleanup |
| Edit existing YouTube Studio videos, thumbnails, playlists, visibility, or schedules through Chrome | [youtube-studio-computer-use](./youtube-studio-computer-use) | [youtube-api](./youtube-api) if API credentials exist and the task is API-friendly |
| Use the YouTube Data API for metadata, thumbnails, uploads, or channel listing | [youtube-api](./youtube-api) | [youtube-studio-computer-use](./youtube-studio-computer-use) for Studio-only states |
| Build a full YouTube operations bot with raw API access, Slack approvals, playlists, comments, live operations, and change-impact analytics | [youtube-channel-operator](./youtube-channel-operator) | [slackbot-builder](./slackbot-builder), [data-chatbots](./data-chatbots), then [youtube-api](./youtube-api) or [youtube-studio-computer-use](./youtube-studio-computer-use) |
| Redesign an app or explore product behavior through generated visual directions and matched implementation screenshots | [design-apps-with-imagegen](./design-apps-with-imagegen) | [visual-playtest](./visual-playtest) after the selected direction is implemented |
| Visually inspect a local or deployed site/app and find concrete layout or responsive defects | [visual-playtest](./visual-playtest) | Load its app/media references only when those workflows are in scope; use [design-apps-with-imagegen](./design-apps-with-imagegen) for broader redesign |
| Create or align a durable project CEO, product steward, or autonomous owner | [ceo-creator](./ceo-creator) | Project-specific execution skills selected by the approved CEO charter |
| Create a durable independent dissent agent with its own evidence model, ledger, interruption threshold, and cadence | [cassandra-creator](./cassandra-creator) | The created Cassandra thread's bounded tests or decisions |
| Critically audit or trim an overgrown skill or over-broad trigger | [skill-cutter](./skill-cutter) | Apply local cuts only when explicitly requested |
| Build conference schedule, speaker, or developer data surfaces | [schedule-design](./schedule-design), [conference-developer-endpoints](./conference-developer-endpoints), or [europe-developer-api](./europe-developer-api) | `accelevents-*` or [sync-accelevents](./sync-accelevents) when syncing source systems |
| Harden a software repo | [antislop-codebase](./antislop-codebase) for deliberate structural cleanup | `productionize-*`, `security-*`, `observability-*`, `release-*`, `test-*` |
| Design, debug, migrate, cache, or deploy a production system on Cloudflare | [cloudflare-production-builder](./cloudflare-production-builder) | Product-specific skills after the Cloudflare durability, storage, security, and release boundaries are settled |
| Host repositories or deploy exact-SHA releases through SmolForge | [forge](./forge) | [cloudflare-production-builder](./cloudflare-production-builder) when the underlying Cloudflare runtime or bindings also need design work |
| Build a structured-data chatbot or Slack bot | [data-chatbots](./data-chatbots) or [slackbot-builder](./slackbot-builder) | [app-ux-paradigms](./app-ux-paradigms) for interaction details |
| Protect usernames and public handles from route collisions, squatting, or impersonation | [reserved-handle-policy](./reserved-handle-policy) | [security-hardening](./security-hardening) when broader auth or permission review is needed |
| Create or substantially revise a repository README around a verified first result | [ai-readme](./ai-readme) | [ai-devblog](./ai-devblog) for a dated engineering story |
| Write, revise, verify, or publish an individual technical devblog | [ai-devblog](./ai-devblog) | [blog-system-design](./blog-system-design) only when shared presentation infrastructure must change |
| Create or redesign a technical blog index, post shell, navigation, search, typography, or reusable components | [blog-system-design](./blog-system-design) | [ai-devblog](./ai-devblog) for individual article content |

### Routing Notes

- Prefer API skills for stable, supported bulk operations; prefer Computer Use skills for authenticated browser states, Studio-only controls, file pickers, disabled buttons, and save verification.
- Keep source acquisition, metadata staging, and upload ledgers in batch/upload skills. Keep existing-video cleanup, thumbnails, scheduling, playlist fixes, and save recovery in `youtube-studio-computer-use`.
- Treat status, reviewer, and operations fields as private by default. Public descriptions should use submitted abstracts, bios, company/project links, and social links entered for publication.
- Do not physically reorganize skill folders into categories unless every target agent loader supports nested skill discovery. The top-level `folder/SKILL.md` layout is intentional.

## Skill Index

### Coding, Agents, And Workstations

#### Kakuna Codebase Hardening Suite

Use these opt-in skills only when the named hardening problem is the primary
task. They are diagnostic tools, not a maturity ladder: select the smallest
relevant skill, reuse existing controls, prefer deletion, and stop when the
explicit problem is resolved. Ordinary implementation work should not trigger
the suite merely because it will ship or could be made more robust.

<table>
  <tr>
    <td width="280" align="center" valign="middle">
      <img src="./assets/kakuna-codebase-hardening.png" alt="Kakuna Codebase Hardening Suite logo: a cute armored cocoon mascot inside a code shield" width="240">
    </td>
    <td valign="middle">
      <p><strong>Foundation</strong></p>
      <ul>
        <li><a href="./antislop-codebase">antislop-codebase</a> — <strong>Structural cleanup/migration.</strong> Reduces demonstrated repository maintenance cost without imposing folder, file-size, compatibility, testing, or audit-artifact targets.</li>
      </ul>
      <p><strong>Productization</strong></p>
      <ul>
        <li><a href="./productionize-app-with-services">productionize-app-with-services</a> — <strong>Bounded productization.</strong> Adds only explicitly needed product services for named users and operators; it does not install a default SaaS maturity stack.</li>
      </ul>
      <p><strong>Safety</strong></p>
      <ul>
        <li><a href="./security-hardening">security-hardening</a> — <strong>Threat-scoped appsec.</strong> Fixes concrete reachable risks in an explicitly reviewed threat surface and reuses existing framework/provider defenses.</li>
      </ul>
      <p><strong>Operability</strong></p>
      <ul>
        <li><a href="./observability-hardening">observability-hardening</a> — <strong>Question-driven visibility.</strong> Uses the cheapest existing or new privacy-safe signal to answer named production questions without requiring every telemetry type.</li>
        <li><a href="./release-readiness-hardening">release-readiness-hardening</a> — <strong>Minimal ship proof.</strong> Audits the smallest sufficient release controls, prefers authoritative provider facts, and removes redundant ceremony.</li>
        <li><a href="./vercel-production-cost-review">vercel-production-cost-review</a> — <strong>Material cost diagnosis.</strong> Answers a defined Vercel billing question by investigating the few dominant drivers before authorizing any remediation.</li>
      </ul>
      <p><strong>Quality</strong></p>
      <ul>
        <li><a href="./test-strategy-hardening">test-strategy-hardening</a> — <strong>Confidence-per-minute.</strong> Solves explicit test-system problems through faithful boundaries, deterministic fixes, and deletion or consolidation—not test-layer growth.</li>
      </ul>
    </td>
  </tr>
</table>

#### Other coding/workstation skills

- [review-thread](./review-thread) — reviews task progress and goal alignment, estimates agent execution time, and suggests worthwhile parallel work.
- [align-me](./align-me) — pauses before a long autonomous run to surface material ambiguities as numbered, lettered choices with concrete tradeoffs, recommendations, and an `approve all` path.
- [new-mac-setup](./new-mac-setup) — opinionated Apple Silicon Mac bootstrap for fullstack and AI work. Installs Homebrew, shell tooling, editors, AI tools, terminal setup, and macOS defaults in a repeatable run order.
- [cloudflare](./cloudflare) — routes ambiguous or cross-product Cloudflare work to the relevant product skill.
- [cloudflare-production-builder](./cloudflare-production-builder) — chooses among Workers, Pages, Workflows, Queues, Durable Objects, D1, R2, KV, Cache API, alarms, and Cron; then applies durable handoffs, safe caching, migration discipline, multi-tenant boundaries, observability, and live production verification.
- [forge](./forge) — operates SmolForge as a Git repository and collaboration host or as an exact-SHA Deploy/Sites release control plane, while preserving explicit authentication, provider, preview, and production boundaries.
- [claude-session-introspect](./claude-session-introspect) — inspects Claude Code session JSONL files at `~/.claude/projects/` for token totals, prompt counts, assistant turns, tool calls, compaction boundaries, and compaction summaries.
- [deep-trajectory-analysis](./deep-trajectory-analysis) — reconstructs paired agent, game, or policy trajectories from exact shared pre-states, connects aggregate effects to first-divergence evidence, and validates machine-readable causal reports before promotion decisions.
- [design-apps-with-imagegen](./design-apps-with-imagegen) — audits an existing interface, researches free Mobbin references, generates four distinct visual and behavioral directions including a wildcard, honors a selected or delegated choice, and implements and compares matched screenshots at relevant sizes.
- [visual-playtest](./visual-playtest) — runs a proportional browser review of representative visual states; app-interaction and media-workflow checklists are selectively loaded only when relevant.
- [ceo-creator](./ceo-creator) — creates a durable project CEO with an evidence model, authority boundaries, operating cadence, initiative and delegation rules, privacy protections, and a decision-oriented reporting contract.
- [cassandra-creator](./cassandra-creator) — creates a durable independent dissent agent with separate evidence access, a dated assumptions and predictions ledger, symmetric skepticism, a high interruption threshold, explicit self-correction, read-only authority, and an optional approved recurring cadence.
- [skill-cutter](./skill-cutter) — critically classifies and trims overgrown skills to their behavioral core, narrows over-broad trigger metadata, and separates provider constraints from optional or project-specific policy.
- [smart-entity-resolution](./smart-entity-resolution) — resolves named people or organizations in messy databases with aliases, duplicates, sparse records, common names, LLM retrieval repair, reranking, and visible runner-up candidates.
- [autoreview](./autoreview) — performs an explicitly requested final review using whatever review capability is available, without depending on a particular helper, model, or service.
- [public-qa-chatbot](./public-qa-chatbot) — builds unauthenticated public Q&A chatbot widgets with rate limits, origin/input hardening, semantic caching, observability, streaming UX, and robust chat scroll behavior.
- [slackbot-builder](./slackbot-builder) — builds production Slack bots with signed Events API handlers, causal shared-thread sessions, per-thread serialization, stateful routing and owned-resource resolution, state-aware Block Kit approvals, durable execution for slow agent work, guaranteed result-or-error delivery, and structured observability.
- [sync-url-navigation](./sync-url-navigation) — syncs URL query params with app navigation, tabs, and filter state so views are bookmarkable and shareable (`view`, `table`, `q`, deep links, `popstate`).
- [app-ux-paradigms](./app-ux-paradigms) — standard web UX defaults: Esc/backdrop/× for modals, ⌘/Ctrl shortcuts, form save states, tables, menus, and help text for discoverable interactions.
- [data-chatbots](./data-chatbots) — copilots over structured data that **propose** mutations (draft → Apply), not direct writes: prompting, validator allowlists, session memory with DRAFT/APPLIED/IGNORED, version-stale UX, and test matrices.
- [reserved-handle-policy](./reserved-handle-policy) — designs and implements two-tier public username protection with hard platform reservations, administrator-reviewed claims, separator-confusable matching, a source-attributed registry of common names and notable identities, and signup/rename/admin test guidance.

### Cloudflare Product Work

- [workers-best-practices](./workers-best-practices) — reviews Workers runtime, bindings, streaming, concurrency, and static asset routing.
- [wrangler](./wrangler) — resolves exact CLI commands and configuration changes for the selected environment.
- [durable-objects](./durable-objects) — designs per-key coordination, object-owned state, alarms, and WebSockets.
- [agents-sdk](./agents-sdk) — builds stateful apps with Cloudflare's `agents` package.
- [sandbox-sdk](./sandbox-sdk) — uses `@cloudflare/sandbox` for isolated commands, files, processes, and previews.
- [cloudflare-do-turn-based-multiplayer](./cloudflare-do-turn-based-multiplayer) — handles room identity, reconnects, and concurrent turns in Durable Object games.
- [cloudflare-email-service](./cloudflare-email-service) — handles Cloudflare sending, Email Routing, inbound handlers, and deliverability.
- [cloudflare-one](./cloudflare-one) — guides Zero Trust and SASE configuration using current provider documentation.
- [cloudflare-one-migrations](./cloudflare-one-migrations) — plans migration from VPN, SWG, and other SASE deployments.
- [turnstile-spin](./turnstile-spin) — adds or repairs a widget and mandatory server-side verification on a scoped form.
- [diy-netlify](./diy-netlify) — builds isolated pull-request previews with the existing hosting provider.

### App Design And Interaction

- [design-preferences](./design-preferences) — applies swyx's shared-shell, density, typography, and color preferences.
- [mobile-native](./mobile-native) — covers iPhone/iPad UX, notifications, signing, delivery, and device verification.
- [mobile-webapp-ux](./mobile-webapp-ux) — improves phone layouts and touch flows while preserving desktop usability.
- [website-searchbar](./website-searchbar) — implements universal search, catalog coverage, fuzzy typeahead, and responsiveness.
- [location-input](./location-input) — builds accessible city/country autocomplete.
- [long-running-operation-ux](./long-running-operation-ux) — designs visible progress, cancellation, recovery, and result handoff for slow actions.
- [media-heavy-workflows](./media-heavy-workflows) — designs reference attachment, generation history, and draft-to-publish media workspaces.
- [data-visualization-quality](./data-visualization-quality) — selects analytically faithful charts and tables.
- [web-perf](./web-perf) — investigates a named web performance problem with current browser measurements.
- [cli-ux](./cli-ux) — reviews CLI interaction, output, credentials, and mutation behavior.

### Agent Execution And Workflow Reuse

- [programmatic-agents](./programmatic-agents) — runs supported coding-agent CLIs with usage, latency, cost, and trace logging; [programmatic-codex](./programmatic-codex) is a compatibility pointer.
- [ai-engineering](./ai-engineering) — repairs unreliable structured outputs, retries, fan-out, caching, and telemetry.
- [live-ai-pipelines](./live-ai-pipelines) — adds partial results, resume, and atomic publication to long AI workflows.
- [babysit-runs](./babysit-runs) — keeps an authorized unattended job progressing through completion.
- [resilient-computer-use](./resilient-computer-use) — observes, acts, and verifies UI state, with isolated tab-bound Chrome control and recovery.
- [coordinate](./coordinate) — coordinates bounded helpers and advisers when delegation is useful.
- [next-steps](./next-steps) — turns open directions into actionable choices.
- [keep-it-simple](./keep-it-simple) — identifies unnecessary complexity and proposes concrete simplifications.
- [future-only](./future-only) — applies explicitly authorized breaking changes without preserving obsolete interfaces.
- [generalize](./generalize) — extracts transferable lessons and broader fixes when requested.
- [provision-model-keys](./provision-model-keys) — provisions or rotates app-specific provider credentials under saved authorization.

### AI DevRel

AI DevRel is the end-to-end publication bundle: capture technical work, acquire
and transform source media, extract the useful story, publish dense written and
video explanations, operate distribution channels, and measure what changed.
Start with the orchestrator for a multi-stage job, then route each stage to the
narrowest atomic skill.

#### Technical blogging

- [ai-readme](./ai-readme) — turns a repository into a progressive, executable explanation for an explicitly chosen reader, with a verified first result, one stable example, honest tradeoffs, and a context-isolated cold read.
- [ai-devblog](./ai-devblog) — routes technical material into the right story mode and weight, aligns on the reader and belief change, preserves primary evidence, and edits the result for clarity and human interest before verified publication.
- [blog-system-design](./blog-system-design) — designs dense technical blog systems: index and section pages, compact typography, full-text `/` search, resizable article index rails, responsive floating TOCs, reusable explanatory components, and information-dense media policy.

#### Writing And Corpus Publishing

- [swyx-writing](./swyx-writing) — applies the shared nonfiction voice and three editing passes.
- [research-grounded-writing](./research-grounded-writing) — produces finished nonfiction backed by primary sources.
- [person-profile-writing](./person-profile-writing) — resolves identity and writes source-grounded biographies.
- [video-talk-to-essay](./video-talk-to-essay) — turns a recording and transcript into an illustrated technical article.
- [media-to-wiki-pipeline](./media-to-wiki-pipeline) — ingests source corpora into readers, profiles, and topic pages with resumable subset refreshes.
- [pulp-fiction-writing](./pulp-fiction-writing) — writes and revises serialized genre fiction.
- [latent-space-thumbnail-director](./latent-space-thumbnail-director) — directs Latent Space and FDE thumbnails using saved brand resources.
- [face-matching](./face-matching) — verifies identities and face references across media collections.

#### Media acquisition and transformation

- [media-transform](./media-transform) — orchestrates video pipelines across download, upload, transcription, chapters, thumbnails, and title testing by routing to the right atomic skill for each stage.
- [download-video](./download-video) — downloads embedded videos from web pages by resolving the real player URL and calling `yt-dlp` with the right referer/origin headers.
- [download-x-video](./download-x-video) — downloads X/Twitter post videos with `yt-dlp`, including HLS streams and reliable final-path detection.
- [zoom-download](./zoom-download) — downloads Zoom cloud recordings, verifies filenames/file types, and supports ffmpeg-based content analysis.

#### Transcription, extraction, and repurposing

- [transcribe-anything](./transcribe-anything) — transcribes audio and video files using pluggable ASR backends including local Whisper, whisperX, faster-whisper, OpenAI, Groq, Deepgram, AssemblyAI, Gemini, and Hugging Face models.
- [conference-transcribe](./conference-transcribe) — splits long conference livestreams or YouTube videos into per-talk transcripts using chapter timestamps, segment transcription, and LLM cleanup.
- [multimodal-extraction](./multimodal-extraction) — turns local videos or video URLs into Markdown timelines with slide screenshots, key frames, and transcript spans aligned by timestamp.
- [summarize-anything](./summarize-anything) — recursively summarizes long text with pluggable LLM backends and can emit executive summaries, YouTube descriptions, chapters, posts, titles, thumbnail prompts, blog outlines, and pull quotes.
- [podcast-publishing-assistant](./podcast-publishing-assistant) — turns podcasts, interviews, panels, and long-form audio/video into transcripts, summaries, chapter markers, show notes, titles, descriptions, and promo copy.

#### YouTube operations

- [youtube-channel-operator](./youtube-channel-operator) — designs full-power multi-channel YouTube operators with typed Data/Analytics/Reporting/Live API access, transcript-derived viewer packages, paid-versus-organic analysis, guided Slack approvals, exact-channel OAuth isolation, immutable external-action audit, Studio-only handoffs, and post-change measurement.
- [youtube-api](./youtube-api) — manages YouTube videos programmatically through the YouTube Data API v3, including uploads, thumbnails, metadata updates, and channel video listing.
- [youtube-publish](./youtube-publish) — publishes videos on YouTube, edits titles/descriptions/timestamps, assigns playlists, and manages YouTube Studio metadata workflows.
- [youtube-studio-batch-upload](./youtube-studio-batch-upload) — batches YouTube Studio uploads from Airtable or local video submissions, with source download recovery, metadata staging, unlisted visibility, playlist tagging, save verification, and blocked-row reporting.
- [youtube-studio-computer-use](./youtube-studio-computer-use) — automates live YouTube Studio cleanup through Chrome/Computer Use: thumbnails, schedules, playlist fixes, visibility, save-state recovery, and DOM-assisted edit pages.
- [youtube-thumbnails](./youtube-thumbnails) — creates AI-generated YouTube thumbnails with prompt engineering, image generation, compression, and upload guidance.
- [thumbnail-extraction](./thumbnail-extraction) — extracts interesting video frames, face crops, presentation slides, and transparent cutouts for thumbnail compositing.

### Web And Social Scraping

- [twitter-x-scraping](./twitter-x-scraping) — scrapes public Twitter/X profile and list timelines through Nitter-compatible mirror HTML, with cursor pagination, raw JSON persistence, and anti-bot fallback guidance. Does not treat public mirrors as a reliable source for a user's following graph.

### Workspace And Organizer Administration

- [gsuite-setup](./gsuite-setup) — configures Google Workspace sharing, Groups, delegation, and collaboration settings.
- [sessionize-automation](./sessionize-automation) — inspects and verifies authenticated Sessionize organizer changes.

### Conference And Event Operations

- [accelevents-api](./accelevents-api) — reads and updates AI Engineer Europe speaker records through the Accelevents REST API while preserving full speaker payloads.
- [accelevents-speaker-sync](./accelevents-speaker-sync) — syncs website speaker, session, schedule, room, track, and headshot changes back to Accelevents for AI Engineer Europe.
- [conference-developer-endpoints](./conference-developer-endpoints) — adds and reviews developer-facing conference endpoints such as `llms.txt`, `sessions.json`, `speakers.json`, and MCP routes.
- [europe-developer-api](./europe-developer-api) — works with AI Engineer Europe developer endpoints, public schedule JSON, speakers JSON, MCP access, and the local `aieng` CLI.
- [schedule-design](./schedule-design) — builds polished conference schedule views with React grids, filters, modals, favorites, sticky layouts, and normalized data.
- [sync-accelevents](./sync-accelevents) — pulls Accelevents speaker headshots, social data, bios, and schedule metadata into local conference source data.
- [testing-schedule-preview](./testing-schedule-preview) — tests the AI Engineer Europe internal Bun schedule preview and public schedule page workflows.
- [web-animation-perf](./web-animation-perf) — debugs jank, layout thrash, and drift in JS-driven CSS animation across AI Engineer conference sites.

## Repo Shape

- One canonical skill per top-level folder; `programmatic-codex` is a compatibility directory.
- Every canonical skill includes `SKILL.md` with YAML `name` and `description` metadata.
- Optional `references/`, `scripts/`, `assets/`, and `agents/openai.yaml` carry detailed guidance, executables, resources, or agent UI metadata.
- Add scripts only when they make the workflow more reliable or repeatable.
- Keep auxiliary docs minimal; the skill body should carry the agent-facing workflow.

Click into each folder for the detailed workflow, prerequisites, and command examples.
The index above covers the tracked canonical skills. HyperFrames and its
companion media workflows have been removed from this collection; the remaining
skills are stored in this repository.

## Recent Workflow Changes

Recent commits added [review-thread](./review-thread) progress assessments and
[mobile-native](./mobile-native) preferences and device guidance. Design
exploration now uses distinct Mobbin-informed briefs and honors delegated
choices without repeated approval. Chrome workflows favor isolated tab-bound
control. Shared execution guidance is more agent-neutral, while writing and
wiki workflows preserve source evidence and support incremental corpus updates.
See `git log --oneline -8` for the current commit history.

## Skill acceptance model

A skill is an advisory lens, not an implicit acceptance gate. Author and review
skills with this model:

```text
User outcome
  + higher-level invariants
  + risks created by this action
  = blocking acceptance criteria

Everything else is advice or follow-up.
```

Classify meaningful instructions by their actual force:

| Class | Meaning |
| --- | --- |
| **Invariant** | Must never be violated, such as authorization, privacy, secret handling, destructive-target clarity, or user-data integrity. |
| **Action-required** | Intrinsic to the named task type; without it the requested result is not correct or usable. |
| **Risk-triggered gate** | Blocking only when the skill names a concrete risk introduced by the proposed action. |
| **Recommendation** | A useful default that may be skipped without blocking completion. |
| **Opportunity** | An adjacent improvement or follow-up outside the current critical path. |

Write the class directly when prose could otherwise make a recommendation sound
mandatory. A comprehensive checklist is not a demand to satisfy every item:
tell agents to select only relevant items and state the concrete risk before
promoting one to a gate.

For bounded tasks, a skill should normally add no more than one or two blocking
criteria. Exceed that budget only for a direct correctness, privacy, security,
data-integrity, or irreversible-action risk. Match evidence to impact: a local
documentation edit may need formatting and link checks; a CLI contract fix
needs focused process or contract tests; one Worker repair needs component
checks, health, one bounded reproduction, and rollback evidence; a schema or
data mutation warrants stronger integrity and repair proof; a destructive or
externally consequential action requires exact targets and explicit authority.

Do not silently expand scope. Adjacent improvements, checklist findings, and
residual issues are observations or follow-ups unless necessary to make the
requested result correct, safe, or usable. Define a stop condition for workflows
that can otherwise accumulate proof or retries, and allow completion when that
condition is met.

Do not make a broken control plane approve or execute its own repair when a
documented lower-level operator path exists. Preserve that path's authorization,
target-resolution, rollback, and evidence requirements. Coordinate only for
concrete overlap: the same files with likely merge conflicts, production
resource, migration sequence, or externally mutable object. Read-only work and
unrelated components do not need a global mutex or continual peer updates.

Users may simplify recommendations and authorize documented break-glass paths.
They cannot waive higher-level constraints around secrets, destructive
ambiguity, unauthorized external action, privacy, or irreversible user-data
loss.

## Validating Skills

The repository pins PyYAML in `pyproject.toml` and `uv.lock`. With
[uv](https://docs.astral.sh/uv/) installed, prepare those dependencies from the
repository root:

```bash
uv sync --locked
```

This prepares `.venv` without changing the lockfile. Validate a changed skill
with the repository's shared [Agent Skills](https://agentskills.io/specification)
metadata validator:

```bash
uv run --locked python scripts/validate_skill.py review-thread
```

A successful run prints `review-thread: Skill is valid!`. The validator checks
standard metadata, including `compatibility`, and requires custom fields such as
`version` inside `metadata`. Keep shared frontmatter portable; loader-specific
invocation hints can be documented in the skill body. Older environment-supplied
validators may reject valid standard fields.

Validation checks metadata and structure, not workflow correctness. For changed
skills, also check relative links, read referenced files, and run the focused
script tests named in that skill when applicable.

Before contributing, read [AGENTS.md](./AGENTS.md), preserve unrelated edits,
and use `git diff --check` for whitespace errors. Keep top-level discovery,
working reference paths, focused trigger descriptions, and the acceptance model
above intact. Review substantial behavior concerns explicitly rather than
silently expanding a documentation change into implementation.
