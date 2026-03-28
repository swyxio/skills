# multimodal-extraction

Builds a multimodal Markdown timeline from a video.

Given a local MP4 or a video URL, this skill downloads the media if needed, extracts slide frames and key visual moments, transcribes the audio, and writes one Markdown file that interleaves screenshots with the transcript at the right timestamps.

## What It Produces

- A local video file if the input was a URL
- Thumbnail candidates and slide frames
- A Whisper transcript JSON
- A final Markdown artifact that combines visuals and transcript spans

## Default Pipeline

1. If the input is a URL, download it with `yt-dlp`
2. Run `thumbnail-extraction` with `--extract-slides`
3. Extract and normalize audio with `ffmpeg`
4. Run local `whisper` with JSON output
5. Merge slide/key-frame timestamps with transcript segments into one Markdown timeline

## Typical Usage

```bash
python3 multimodal_extract.py /path/to/video.mp4 ~/Downloads/multimodal_output

python3 multimodal_extract.py "https://www.youtube.com/watch?v=..." ~/Downloads/multimodal_output

python3 multimodal_extract.py video.mp4 ~/Downloads/multimodal_output \
  --language en \
  --whisper-model turbo \
  --top-n 6
```

## Output Layout

- `source/` — downloaded or copied source media
- `visuals/` — output from `thumbnail-extraction`
- `audio/` — preprocessed WAV for ASR
- `transcript/` — Whisper JSON
- `multimodal_timeline.md` — merged Markdown artifact

## Notes

- This skill is optimized for end-to-end speed, not the most expensive multimodal reasoning path.
- It reuses `thumbnail-extraction` for the visual timeline and `whisper` for the transcript.
- If you need better diarization or a different backend, extend the transcription step later rather than bloating the first version.
