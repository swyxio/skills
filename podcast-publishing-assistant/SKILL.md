---
name: podcast-publishing-assistant
description: Transcribe long-form audio, YouTube videos, podcasts, interviews, or panels; summarize them; extract chapter markers; and draft publishing assets like titles, YouTube descriptions, show notes, and tweet/X copy. Use when a user shares a YouTube link or audio/video file and asks for transcription, diarization, summaries with timestamps, chapter markers, show notes, titles, descriptions, promo copy, or social posts. Especially use for Whisper-based workflows, source-audio-first podcast processing, and any request to turn a recorded conversation into publishable assets.
---

# Podcast Publishing Assistant

Use this skill for podcast or interview publishing workflows.

## Core rules

- Prefer source audio over platform captions.
- Do not rely on YouTube captions unless the user explicitly asks for the fastest possible rough pass.
- For Whisper or API transcripts, be honest about uncertainty. Do not claim true diarization unless the tool actually produced it.
- If the user has a formatting preference, preserve it exactly on later turns.
- Default chapter output for swyx: YouTube timestamp format only, start times only, followed by a 2 to 10 word headline.

## Workflow

1. Fetch source audio first.
   - For YouTube URLs, use `yt-dlp` to extract audio.
   - Prefer MP3 output for compatibility.

2. Transcribe with a fallback ladder.
   - First try the OpenAI Whisper API when `OPENAI_API_KEY` is available.
   - The OpenAI audio transcription upload cap is about 25 MB. Expect long episodes to exceed it.
   - If the file is too large, compress before retrying, for example mono 16 kHz MP3 around 32 kbps.
   - If API transcription still fails, fall back to local Whisper.
   - If a script exists but is not executable, invoke it with `bash` rather than failing on permissions.

3. Keep the user updated during long jobs.
   - Brief progress notes are enough: downloading, compressing, transcribing, packaging.
   - If a fallback happens, say what failed in one line and continue.

4. Produce the publishing pack.
   - Summary tuned for someone deciding whether to watch or listen.
   - Key takeaways or key arguments.
   - 5 title ideas when asked.
   - 5 description ideas when asked.
   - Chapter timestamps.
   - Optional: tweet thread, show notes, key quotes, newsletter blurb.

5. Package timestamps correctly.
   - Prefer real timestamps if the transcription source provides segments.
   - If the transcript is a single plain-text blob, estimate coarse chapter times conservatively and label them as approximate if needed.
   - For swyx, default to this exact style:
     - `0:00` Intro and origin story
     - `3:30` How the brand grew

## Transcript quality notes

- OpenAI Whisper API often returns plain text unless a segment-rich response format is requested elsewhere.
- Plain text transcripts are good for summaries and rough chapters, but weak for precise diarization.
- When speaker labels are needed without true diarization, reconstruct heuristically from turn-taking and identify this clearly as approximate.

## Launch template

When a user wants publishing help, default to a reusable launch pack.

### Standard launch pack

1. YouTube titles
   - Provide 3 to 4 options.
   - Prefer thesis first, guest second.
   - Keep them specific, not generic.

2. YouTube descriptions
   - Provide 3 to 4 options.
   - Each should include:
     - one short framing paragraph
     - 3 to 6 concrete bullets on what the audience will learn
     - chapter markers in YouTube timestamp format when available

3. X main post
   - Provide 3 to 4 options.
   - Structure:
     - hook or thesis
     - guest credibility line
     - 3 to 6 concrete bullets
     - link placeholder or actual link

4. X follow-up reply
   - Provide 1 concise timestamps-only reply unless the user asks for more.
   - Use YouTube timestamp format only, start times only, 2 to 10 word headlines.

5. Native clip ideas
   - Provide 3 to 4 options.
   - For each clip idea, include:
     - clip theme
     - why it works as promo
     - rough timestamp window if known

6. Quote card ideas
   - Provide 3 to 4 options.
   - Prefer clean, arguable lines with strong standalone meaning.

### Packaging guidance

- Distinguish between:
  - what the episode is about
  - why it matters now
- Prefer concrete bullets over abstract topic labels.
- For X, optimize for curiosity plus utility, not just announcement tone.
- For YouTube, optimize for searchable thesis plus guest credibility.
- If the audience is technical, specificity beats hype.

## Output format

Default output order:
1. Short summary
2. Key takeaways
3. Chapter timestamps
4. 3 to 4 title options
5. 3 to 4 description options
6. 3 to 4 X post options
7. 3 to 4 clip ideas
8. 3 to 4 quote card ideas

## Scripts

- `scripts/transcribe_youtube.sh`: download audio from YouTube, shrink oversized audio for Whisper API, and fall back cleanly.

## Notes

- Prefer speed first, but do not fake certainty.
- If a transcript path is broken, say what failed and continue with the next fallback.
- For long episodes, give the user a progress update before the final packaging pass.
- If the user says a format like “always give me YouTube timestamp format”, treat that as a sticky preference for the rest of the task.
