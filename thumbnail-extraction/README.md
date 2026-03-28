# thumbnail-extraction

Extracts the most interesting thumbnail candidates from a local video file.

This skill scans a recording, scores visually strong frames, and saves ready-to-use JPG outputs plus face crops when faces are detected. It is designed for long-form interviews, Zoom recordings, presentations, and talk videos where manually scrubbing for a thumbnail is slow.

## What It Produces

- Full-frame thumbnail candidates
- Face crops for the largest detected face in a candidate
- A manifest JSON with timestamps and scores

## Typical Usage

```bash
python3 thumbnail_extractor.py /path/to/video.mp4 ~/Downloads/thumb_candidates 4
```

## Notes

- Works best with OpenCV installed
- If `deepface` is available, expression scoring improves ranking
- If `deepface` is missing, the extractor still runs using OpenCV-only scoring
- Use the resulting JPG with the `youtube-api` skill's `set_thumbnail.py`
