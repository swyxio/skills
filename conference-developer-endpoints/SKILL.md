---
name: conference-developer-endpoints
description: Add or review developer- and AI-facing conference data endpoints such as llms.txt, sessions.json, speakers.json, or MCP routes for AI Engineer conference pages. Implement only the requested surface unless the user asks for the full endpoint suite; never expose private speaker, CFP, or organizer data.
---

# Conference Developer & AI Endpoints — General Pattern

This skill documents the available pattern for developer/AI-facing conference
data. Treat the sections as a surface catalog, not an all-or-nothing acceptance
checklist. For one endpoint, change and validate that endpoint plus its shared
public-data boundary; do not add MCP, CLI, documentation pages, agent skills, or
unrelated endpoints. Stripping private and internal fields is an invariant for
every public surface. Stop when the requested surface is usable and its privacy
contract is verified.

## Surface catalog for a full conference endpoint suite

For a conference at route `/{conf}`, create the following:

### 1. Public Data Utility

Create `src/data/{conf}-public-data.ts` that:
- Imports the conference's source data (typically `src/pages/{conf}/source/schedule.json` and the speaker extraction logic in `src/data/{conf}-speakers.ts`)
- Exports functions: `getPublicTalks()`, `getPublicSpeakers()`, `getScheduleByDay()`, and a `CONFERENCE_META` object
- **Strips all sensitive fields** before returning data:
  - `email` / `contact.email` — speaker email addresses
  - `notes` — internal organizer notes
  - `acceleventsSpeakerId` — internal platform IDs
  - `sessionId`, `invited` — internal session metadata
  - `cfpData` — call for papers submission details and review status
- Returns clean types (`PublicSpeaker`, `PublicTalk`) with only public-safe fields

### 2. API Routes

Create the following API routes in `src/pages/api/{conf}/`:

| File | Endpoint | Format | Description |
|---|---|---|---|
| `llms-txt.ts` | `/{conf}/llms.txt` | Plain text | Basic conference info + schedule overview. Links to other endpoints. |
| `llms-full-txt.ts` | `/{conf}/llms-full.txt` | Plain text | Full details: every talk description, speaker bio, social links. |
| `sessions.ts` | `/{conf}/sessions.json` | JSON | All sessions (talks + workshops) with metadata. CORS enabled. |
| `speakers.ts` | `/{conf}/speakers.json` | JSON | All speakers with roles, companies, socials. CORS enabled. |
| `mcp.ts` | `/{conf}/mcp` | JSON-RPC 2.0 | MCP server with tools for querying conference data. |

All endpoints should:
- Set appropriate `Cache-Control` headers (`s-maxage=3600, stale-while-revalidate=86400`)
- JSON endpoints must include CORS headers (`Access-Control-Allow-Origin: *`) and handle `OPTIONS` preflight
- Never expose sensitive/internal fields

### 3. URL Rewrites

Add rewrites in `next.config.ts` under the existing rewrites section:

```ts
// {Conf} developer/AI endpoints
{
  source: '/{conf}/llms.txt',
  destination: '/api/{conf}/llms-txt',
},
{
  source: '/{conf}/llms-full.txt',
  destination: '/api/{conf}/llms-full-txt',
},
{
  source: '/{conf}/sessions.json',
  destination: '/api/{conf}/sessions',
},
{
  source: '/{conf}/speakers.json',
  destination: '/api/{conf}/speakers',
},
{
  source: '/{conf}/mcp',
  destination: '/api/{conf}/mcp',
},
```

### 4. MCP Server Implementation

The MCP endpoint should implement JSON-RPC 2.0 with the following tools:

- `get_conference_info` — Returns conference metadata (dates, location, venue, links)
- `list_speakers` — Returns speakers with optional `search` filter
- `list_talks` — Returns talks with optional `day`, `type`, `track`, `search` filters
- `get_schedule` — Returns schedule organized by day, with optional `day` filter

The endpoint should:
- Handle both GET (returns server info) and POST (JSON-RPC requests)
- Support batch requests
- Return proper JSON-RPC 2.0 error responses
- Follow the Streamable HTTP transport spec (2025-03-26)

### 5. Developer Documentation Page

Create `src/pages/{conf}/developers.tsx` with:
- Dark terminal theme matching the conference site design
- Sections: Endpoints, Quick Start (curl/JS/Python), CLI Tool, MCP Server, Agent Skills, Data Privacy
- Interactive endpoint cards linking to each endpoint
- Code blocks with copy functionality
- MCP config snippet for Claude Desktop / Cursor / Windsurf
- Use the AIE brand gold color (#FFE9A7) for headings and accent highlights

### 6. Agent Skill

Create `.agents/skills/{conf}-developer-api/SKILL.md` with:
- Endpoint inventory with URLs and descriptions
- Quick-start curl examples
- MCP integration instructions and config
- Data model schemas (JSON structure for talks and speakers)
- List of sensitive fields that are stripped
- Key file paths in the repository

### 7. CLI Tool

The generic CLI at `cli/aie/` (published as `aieng` on npm) supports all conferences. When adding a new conference, add an entry to the `CONFERENCES` registry array in `cli/aie/cli.mjs` with:
- `slug` — Conference route slug (e.g. `europe`)
- `aliases` — Short aliases (e.g. `['eu', 'eur', 'london']`)
- `name`, `route`, `dates`, `location`, `status`
- `hasEndpoints` — Set to `true` once endpoints are live

Usage: `npx aieng {conf} [command]` (e.g. `npx aieng eu speakers`)

## Reference Implementation

The Europe conference (`/europe`) is the reference implementation. Use these files as templates:

- Data utility: `src/data/europe-public-data.ts`
- API routes: `src/pages/api/europe/` (llms-txt.ts, llms-full-txt.ts, sessions.ts, speakers.ts, mcp.ts)
- URL rewrites: `next.config.ts` (search for "Europe developer/AI endpoints")
- Inline section: `src/components/europe-2026/DeveloperEndpointsSection.jsx`
- Agent skill: `.agents/skills/europe-developer-api/SKILL.md`
- CLI tool: `cli/aie/` (generic multi-conference, published as `aieng`)

## Conference-Specific Adaptations

Each conference has its own data source format. Key differences to account for:

- **Europe**: Source data in `src/pages/europe/source/schedule.json`, speakers derived via `src/data/europe-speakers.ts`
- **World's Fair**: Historical data in `src/utils/speakers-sessions-details.json` (hundreds of speakers from 2025), new 2026 data TBD
- **Miami**: Speaker data hardcoded in `src/components/aie-miami-2026/SpeakersSection.tsx` and `speakers.js`
- **Singapore**: Data in `src/components/aie-singapore-2026/`

When adapting, always check the conference's existing data sources and extraction patterns before building the public data utility.

## Verification Checklist

After implementing endpoints for a new conference:

1. Run `SKIP_ENV_VALIDATION=1 npx tsc --noEmit` — must pass with zero errors
2. Start dev server: `SKIP_ENV_VALIDATION=1 pnpm dev`
3. Verify each endpoint returns data: `curl http://localhost:3000/{conf}/llms.txt`
4. Verify JSON endpoints don't contain emails, notes, or internal IDs
5. Test MCP endpoint with a `tools/list` JSON-RPC call
6. Test MCP endpoint with a `tools/call` JSON-RPC call (e.g. `list_speakers` with search)
7. Verify the developer page renders correctly in the browser
8. Run build: `SKIP_ENV_VALIDATION=1 pnpm build`

## Notes

- `pnpm lint` does not work on Next.js 16; use `npx tsc --noEmit` for type checking
- All endpoints use `s-maxage=3600, stale-while-revalidate=86400` caching
- The MCP implementation is hand-rolled JSON-RPC 2.0 (not using the official MCP SDK)
- The base domain for production URLs is `https://ai.engineer`
