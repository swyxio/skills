This repo contains reusable skills for Claude Code, Codex, Cursor, and similar agent environments.

Each skill is a self-contained workflow with a `SKILL.md`, supporting scripts when needed, and a focused problem statement so an agent can pick the right tool quickly.

## Skills

- [new-mac-setup](./new-mac-setup) — opinionated Apple Silicon Mac bootstrap for fullstack and AI work. Installs Homebrew, shell tooling, editors, local AI tools, terminal setup, and macOS defaults in a repeatable run order.
- [download-video](./download-video) — downloads embedded or private video players from web pages by resolving the real player URL and calling `yt-dlp` with the right referer/origin headers.
- [youtube-api](./youtube-api) — programmatic YouTube channel management via the YouTube Data API v3. Handles OAuth setup, custom thumbnail uploads, metadata updates, and listing channel videos without relying on YouTube Studio's browser UI.
- [transcribe-anything](./transcribe-anything) — speech-to-text for audio and video files using pluggable ASR backends (whisper, whisperX, faster-whisper, OpenAI, Groq, Deepgram, AssemblyAI, Gemini). Handles 1-8+ hour files with silence skipping, optional speaker diarization, and custom vocabulary.
- [multimodal-extraction](./multimodal-extraction) — turns a local video or video URL into a Markdown timeline with slide screenshots, key frames, and transcript spans aligned by timestamp. Reuses video download, thumbnail extraction, audio preprocessing, and Whisper transcription in one speed-first workflow.
- [summarize-anything](./summarize-anything) — recursive map-reduce summarization for text of any length (1k-1M words) with pluggable LLM backends (OpenRouter, Ollama, OpenAI, Anthropic, Gemini). 17 output formats including YouTube descriptions/chapters, tweets, titles, thumbnail prompts, blog outlines, and pull quotes. Supports focus directives to steer emphasis.

Click into each folder for the detailed workflow, prerequisites, and command examples.
