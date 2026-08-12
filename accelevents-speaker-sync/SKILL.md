---
name: accelevents-speaker-sync
description: Use when an explicit AI Engineer Europe 2026 task requires synchronizing website speaker, session, schedule, room, track, or headshot changes back to Accelevents. Do not load for ordinary website edits that are not meant to update the event platform.
---

# Accelevents Speaker & Session Sync

For this project's event-operations workflow, an approved website change that
is intended to be authoritative in Accelevents must be mirrored to the matching
platform record. Do not infer that every local draft or preview edit should be
published externally.

## When This Applies

### Speaker changes
- Adding or replacing a speaker photo
- Updating speaker name, role, company, bio, or social links
- Any change to `src/pages/europe/source/schedule.json` that affects speaker metadata

### Session/schedule changes
- Changing session start time, end time, or day
- Changing session room, track, or format
- Updating a session/talk title
- Moving a speaker to a different session slot

## Accelevents API details

- **API base**: `https://api.accelevents.com`
- **Event URL**: `ai-engineer-europe-2026`
- **Auth for READ operations**: `Authorization: Bearer $ACCELEVENTS_API_KEY`
- **Auth for WRITE operations (PUT/POST)**: `Key: $ACCELEVENTS_API_KEY` header

## Speaker Update Workflow

### 1. Find the speaker's Accelevents ID

Look up `acceleventsSpeakerId` in `src/pages/europe/source/schedule.json` for the speaker you're updating.

Or search by name:
```bash
curl -s -H "Authorization: Bearer $ACCELEVENTS_API_KEY" \
  "https://api.accelevents.com/rest/host/event/ai-engineer-europe-2026/speaker?searchString=SPEAKER_NAME&page=0&size=10&expand=TAG"
```

### 2. Upload a new photo (if photo changed)

Upload the image file (must be under 2MB):
```bash
curl -s -X POST \
  -H "Authorization: Bearer $ACCELEVENTS_API_KEY" \
  -F "file=@/path/to/photo.jpg" \
  "https://api.accelevents.com/rest/event/upload/image"
```

This returns `{"type": "Success", "message": "<image-uuid>"}`. Save the `message` value as the image UUID.

### 3. Update the speaker profile

Use the currently verified write header for the endpoint (historically `Key`,
not the read-only `Authorization: Bearer` header):
```bash
curl -s -X PUT \
  -H "Key: $ACCELEVENTS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"speakerId": SPEAKER_ID, "firstName": "First", "lastName": "Last", "email": "email@example.com", "imageUrl": "<image-uuid>"}' \
  "https://api.accelevents.com/rest/host/event/ai-engineer-europe-2026/speaker/SPEAKER_ID"
```

Important notes:
- Use the `Key` header (not `Authorization: Bearer`) for PUT/write operations
- Use flat JSON body (do NOT wrap in a `speakerDTO` object)
- Include `email` in the body — it is required
- Include `speakerId`, `firstName`, `lastName` to avoid clearing existing data

### 4. Verify the update

Fetch the speaker again to confirm the change took effect:
```bash
curl -s -H "Authorization: Bearer $ACCELEVENTS_API_KEY" \
  "https://api.accelevents.com/rest/host/event/ai-engineer-europe-2026/speaker?searchString=SPEAKER_NAME&page=0&size=10&expand=TAG"
```

## Session/Schedule Update Workflow

### 1. Find the session in Accelevents

List all sessions to find the one you need to update:
```bash
curl -s -H "Authorization: Bearer $ACCELEVENTS_API_KEY" \
  "https://api.accelevents.com/rest/events/ai-engineer-europe-2026/session?page=0&size=100&expand=SPEAKER,TRACK,TAG"
```

Match sessions by title or by the speakers assigned to them. Note the `sessionId`.

Speakers in `schedule.json` may have a `sessionId` field that maps to Accelevents session IDs — check there first.

### 2. Update the session

Use PUT with the `Key` header:
```bash
curl -s -X PUT \
  -H "Key: $ACCELEVENTS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"title": "Talk Title", "startTime": "2026/04/08 13:00", "endTime": "2026/04/08 15:00", "format": "WORKSHOP"}' \
  "https://api.accelevents.com/rest/host/event/ai-engineer-europe-2026/session/SESSION_ID"
```

Key fields:
- `title`: Session/talk title
- `startTime` / `endTime`: Format is `yyyy/MM/dd HH:mm`
- `format`: One of `MAIN_STAGE`, `BREAKOUT_SESSION`, `MEET_UP`, `WORKSHOP`, `EXPO`, `BREAK`, `OTHER`
- `locationId`: Room/location ID (get from current session data)
- `status`: `VISIBLE` or `HIDDEN`

### 3. Verify the session update

```bash
curl -s -H "Authorization: Bearer $ACCELEVENTS_API_KEY" \
  "https://api.accelevents.com/rest/events/ai-engineer-europe-2026/session?page=0&size=100&expand=SPEAKER,TRACK"
```

## Existing Sync Script

The repo has a script at `src/pages/europe/source/_scripts/sync_accelevents.py` that syncs FROM Accelevents TO the website (pulls data down). The workflows above are the reverse direction (pushing data up to Accelevents).
