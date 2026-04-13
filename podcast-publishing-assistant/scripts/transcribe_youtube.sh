#!/usr/bin/env bash
set -euo pipefail

if [ $# -lt 2 ]; then
  echo "Usage: $0 <youtube-url> <output-prefix>" >&2
  exit 1
fi

URL="$1"
OUT_PREFIX="$2"
OUT_DIR="$(dirname "$OUT_PREFIX")"
BASE_NAME="$(basename "$OUT_PREFIX")"
mkdir -p "$OUT_DIR"

yt-dlp -x --audio-format mp3 --audio-quality 0 -o "${OUT_PREFIX}.%(ext)s" "$URL"

AUDIO_FILE="${OUT_PREFIX}.mp3"
if [ ! -f "$AUDIO_FILE" ]; then
  echo "Audio file not found: $AUDIO_FILE" >&2
  exit 1
fi

TRANSCRIBE_SCRIPT="$HOME/.local/share/fnm/node-versions/v22.22.2/installation/lib/node_modules/openclaw/skills/openai-whisper-api/scripts/transcribe.sh"
API_OUT="${OUT_PREFIX}.txt"
SMALL_AUDIO_FILE="${OUT_PREFIX}.small.mp3"

if [ -n "${OPENAI_API_KEY:-}" ] && [ -f "$TRANSCRIBE_SCRIPT" ]; then
  if bash "$TRANSCRIBE_SCRIPT" "$AUDIO_FILE" --out "$API_OUT"; then
    echo "$API_OUT"
    exit 0
  fi

  if command -v ffmpeg >/dev/null 2>&1; then
    ffmpeg -y -i "$AUDIO_FILE" -ar 16000 -ac 1 -b:a 32k "$SMALL_AUDIO_FILE" >/dev/null 2>&1
    if [ -f "$SMALL_AUDIO_FILE" ] && bash "$TRANSCRIBE_SCRIPT" "$SMALL_AUDIO_FILE" --out "$API_OUT"; then
      echo "$API_OUT"
      exit 0
    fi
  fi
fi

whisper "$AUDIO_FILE" --model turbo --output_format txt --output_dir "$OUT_DIR"
TXT_OUT="$OUT_DIR/${BASE_NAME}.txt"
if [ ! -f "$TXT_OUT" ]; then
  TXT_OUT="$OUT_DIR/$(basename "$AUDIO_FILE" .mp3).txt"
fi

echo "$TXT_OUT"
