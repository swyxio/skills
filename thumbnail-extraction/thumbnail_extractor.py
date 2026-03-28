#!/usr/bin/env python3
"""
Thumbnail Extractor v2 — memory-efficient version.
Finds the most interesting frames from a video for YouTube thumbnails.

Strategy: Two-pass approach
  Pass 1: Quick scan — sample every 10s, compute visual variance + detect faces (opencv only)
  Pass 2: Deep analysis — only top candidates get expression analysis + bg removal
"""

import sys
import os
import json
import cv2
import numpy as np
from pathlib import Path

# ── Config ──────────────────────────────────────────────────────────────────
VIDEO_PATH = sys.argv[1] if len(sys.argv) > 1 else None
OUTPUT_DIR = sys.argv[2] if len(sys.argv) > 2 else "/sessions/gifted-jolly-ptolemy/mnt/Downloads/thumb_candidates"
TOP_N = int(sys.argv[3]) if len(sys.argv) > 3 else 4
SAMPLE_INTERVAL_SEC = 10  # coarser sampling = less memory
ANALYSIS_SCALE = 0.5  # downscale frames for face detection
FULL_RES_SCALE = 1.0  # keep full res for final output

face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
smile_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_smile.xml')


def get_video_info(video_path):
    cap = cv2.VideoCapture(video_path)
    fps = cap.get(cv2.CAP_PROP_FPS)
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    duration_sec = total_frames / fps if fps > 0 else 0
    cap.release()
    return {"fps": fps, "total_frames": total_frames, "width": width,
            "height": height, "duration_sec": duration_sec}


def format_ts(seconds):
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    s = int(seconds % 60)
    return f"{h}:{m:02d}:{s:02d}" if h > 0 else f"{m}:{s:02d}"


def pass1_quick_scan(video_path, info):
    """
    Pass 1: Fast scan with OpenCV cascade classifiers.
    No deep learning, minimal memory. Score each sampled frame.
    """
    print("  [Pass 1] Quick scan with OpenCV cascades...")
    cap = cv2.VideoCapture(video_path)
    fps = info["fps"]
    duration = info["duration_sec"]

    start = min(60, duration * 0.05)
    end = max(duration - 60, duration * 0.95)

    scored_frames = []  # list of (timestamp, score, metadata) — NO raw frames stored
    t = start
    count = 0

    while t < end:
        frame_idx = int(t * fps)
        cap.set(cv2.CAP_PROP_POS_FRAMES, frame_idx)
        ret, frame = cap.read()
        if not ret or frame is None:
            t += SAMPLE_INTERVAL_SEC
            continue

        count += 1
        if count % 20 == 0:
            print(f"    Scanned {count} frames ({t/60:.1f} min)...")

        # Downscale for analysis
        small = cv2.resize(frame, None, fx=ANALYSIS_SCALE, fy=ANALYSIS_SCALE)
        gray = cv2.cvtColor(small, cv2.COLOR_BGR2GRAY)

        # Face detection
        faces = face_cascade.detectMultiScale(gray, 1.1, 5, minSize=(30, 30))
        num_faces = len(faces)

        # Smile detection within faces
        num_smiles = 0
        max_smile_score = 0.0
        face_regions = []

        for (fx, fy, fw, fh) in faces:
            # Scale back to original coordinates
            orig_region = {
                "x": int(fx / ANALYSIS_SCALE),
                "y": int(fy / ANALYSIS_SCALE),
                "w": int(fw / ANALYSIS_SCALE),
                "h": int(fh / ANALYSIS_SCALE)
            }
            face_regions.append(orig_region)

            # Check for smile within face ROI
            face_roi = gray[fy:fy+fh, fx:fx+fw]
            smiles = smile_cascade.detectMultiScale(face_roi, 1.8, 20, minSize=(15, 15))
            if len(smiles) > 0:
                num_smiles += 1
                # Smile confidence proxy: ratio of smile region to face region
                for (sx, sy, sw, sh) in smiles:
                    smile_ratio = (sw * sh) / (fw * fh)
                    max_smile_score = max(max_smile_score, smile_ratio)

        # Visual variance (proxy for interesting content)
        variance = float(np.var(gray))

        # Edge density (presentation detection)
        edges = cv2.Canny(gray, 100, 200)
        edge_density = np.sum(edges > 0) / edges.size

        # Color variance
        hsv = cv2.cvtColor(small, cv2.COLOR_BGR2HSV)
        sat_std = float(np.std(hsv[:, :, 1]))

        is_presentation = bool(edge_density > 0.08 and sat_std < 50)

        # Quick score
        score = 0.0
        score += min(num_faces, 3) * 2.0            # faces are good (cap at 3)
        score += num_smiles * 3.0                    # smiles are great
        score += max_smile_score * 5.0               # big smiles even better
        score += min(variance / 3000.0, 1.5)         # visual interest
        if is_presentation:
            score = max(score, 1.5)                  # presentations are useful
        if num_faces >= 2:
            score += 1.0                             # multi-person = engaging

        scored_frames.append({
            "timestamp_sec": t,
            "frame_idx": frame_idx,
            "score": score,
            "num_faces": num_faces,
            "num_smiles": num_smiles,
            "smile_score": max_smile_score,
            "variance": variance,
            "edge_density": edge_density,
            "is_presentation": is_presentation,
            "face_regions": face_regions
        })

        # Don't hold the frame in memory!
        del frame, small, gray
        t += SAMPLE_INTERVAL_SEC

    cap.release()
    print(f"    Scanned {count} total frames")
    return scored_frames


def select_diverse_top(scored_frames, top_n=TOP_N, min_gap_sec=30):
    """
    Pick top N frames ensuring temporal diversity.
    Strategy: divide the video into quadrants and pick the best from each,
    then fill remaining slots from overall top scores.
    """
    if not scored_frames:
        return []

    # Find time range
    min_t = min(f["timestamp_sec"] for f in scored_frames)
    max_t = max(f["timestamp_sec"] for f in scored_frames)
    duration = max_t - min_t

    # Divide into num_quadrants segments — pick best from each
    num_quadrants = max(top_n, 4)
    quadrant_size = duration / num_quadrants

    quadrant_picks = []
    for q in range(num_quadrants):
        q_start = min_t + q * quadrant_size
        q_end = q_start + quadrant_size
        q_frames = [f for f in scored_frames if q_start <= f["timestamp_sec"] < q_end]
        if q_frames:
            best = max(q_frames, key=lambda x: x["score"])
            quadrant_picks.append(best)

    # Sort quadrant picks by score, take top_n * 2 for pass 2
    quadrant_picks.sort(key=lambda x: x["score"], reverse=True)

    # Also get overall top scores
    ranked = sorted(scored_frames, key=lambda x: x["score"], reverse=True)

    # Merge: alternate between quadrant picks and overall top
    selected = []
    seen_times = set()

    # First pass: quadrant picks (ensures spread)
    for f in quadrant_picks:
        if len(selected) >= top_n * 3:
            break
        too_close = any(abs(f["timestamp_sec"] - s["timestamp_sec"]) < min_gap_sec for s in selected)
        if not too_close:
            selected.append(f)
            seen_times.add(f["timestamp_sec"])

    # Second pass: fill from overall ranking
    for f in ranked:
        if len(selected) >= top_n * 3:
            break
        if f["timestamp_sec"] in seen_times:
            continue
        too_close = any(abs(f["timestamp_sec"] - s["timestamp_sec"]) < min_gap_sec for s in selected)
        if not too_close:
            selected.append(f)

    return selected


def pass2_deep_analysis(video_path, candidates, info, top_n=TOP_N):
    """
    Pass 2: DeepFace expression analysis on only the top candidates.
    Re-reads specific frames from video (no bulk memory use).
    """
    print(f"\n  [Pass 2] Deep expression analysis on top {len(candidates)} candidates...")
    try:
        from deepface import DeepFace
    except Exception:
        print("    DeepFace not available, falling back to Pass 1 scores only...")
        cap = cv2.VideoCapture(video_path)
        fps = info["fps"]
        results = []
        for c in candidates:
            ts = c["timestamp_sec"]
            frame_idx = int(ts * fps)
            cap.set(cv2.CAP_PROP_POS_FRAMES, frame_idx)
            ret, frame = cap.read()
            if not ret or frame is None:
                continue
            results.append({
                **c,
                "dominant_emotion": "scene",
                "emotion_score": 0.0,
                "combined_score": c["score"],
                "frame": frame,
            })
        cap.release()
        results.sort(key=lambda x: x["combined_score"], reverse=True)
        final = results[:top_n]
        final.sort(key=lambda x: x["timestamp_sec"])
        return final

    cap = cv2.VideoCapture(video_path)
    fps = info["fps"]
    results = []

    for i, c in enumerate(candidates):
        ts = c["timestamp_sec"]
        frame_idx = int(ts * fps)
        cap.set(cv2.CAP_PROP_POS_FRAMES, frame_idx)
        ret, frame = cap.read()
        if not ret or frame is None:
            continue

        print(f"    Analyzing candidate {i+1}/{len(candidates)} at {format_ts(ts)}...")

        dominant_emotion = "neutral"
        emotion_score = 0.0

        try:
            analysis = DeepFace.analyze(
                frame, actions=['emotion'],
                enforce_detection=False,
                detector_backend='opencv',
                silent=True
            )

            WEIGHTS = {"happy": 1.0, "surprise": 0.95, "fear": 0.7,
                       "sad": 0.5, "angry": 0.6, "disgust": 0.4, "neutral": 0.1}

            if isinstance(analysis, list):
                for face in analysis:
                    emotions = face.get("emotion", {})
                    region = face.get("region", {})
                    if region.get("w", 0) < 40:
                        continue

                    for emo, weight in WEIGHTS.items():
                        s = emotions.get(emo, 0) * weight / 100.0
                        if s > emotion_score:
                            emotion_score = s
                            dominant_emotion = emo

        except Exception:
            pass

        # Updated score combining pass1 + expression data
        combined_score = c["score"] + emotion_score * 5.0
        if dominant_emotion in ("happy", "surprise"):
            combined_score += 2.0

        results.append({
            **c,
            "dominant_emotion": dominant_emotion,
            "emotion_score": emotion_score,
            "combined_score": combined_score,
            "frame": frame  # hold only current batch
        })

    cap.release()

    # Final selection: enforce temporal spread
    # Divide video into top_n segments, pick best from each segment
    if not results:
        return results

    all_times = [r["timestamp_sec"] for r in results]
    min_t = min(all_times)
    max_t = max(all_times)
    segment_size = (max_t - min_t) / max(top_n, 1)

    final = []
    # First: pick best from each time segment (guarantees spread)
    for seg in range(top_n):
        seg_start = min_t + seg * segment_size
        seg_end = seg_start + segment_size
        seg_results = [r for r in results if seg_start <= r["timestamp_sec"] < seg_end]
        if seg_results:
            best = max(seg_results, key=lambda x: x["combined_score"])
            final.append(best)

    # If segments are empty, fill from overall top
    if len(final) < top_n:
        results.sort(key=lambda x: x["combined_score"], reverse=True)
        for r in results:
            if len(final) >= top_n:
                break
            if r not in final:
                final.append(r)

    final.sort(key=lambda x: x["timestamp_sec"])
    return final


def save_outputs(selected, output_dir, video_name):
    """Save frames + face crops. BG removal done separately (needs model download)."""
    os.makedirs(output_dir, exist_ok=True)

    manifest = {"video": video_name, "candidates": []}

    for i, c in enumerate(selected):
        frame = c["frame"]
        ts_label = format_ts(c["timestamp_sec"])
        emo = c.get("dominant_emotion", "scene")
        base = f"{video_name}_{i+1}_{emo}_{ts_label.replace(':', '-')}"

        # Full frame
        full_path = os.path.join(output_dir, f"{base}_full.jpg")
        cv2.imwrite(full_path, frame, [cv2.IMWRITE_JPEG_QUALITY, 95])

        entry = {
            "index": i + 1,
            "timestamp": ts_label,
            "timestamp_sec": float(c["timestamp_sec"]),
            "emotion": emo,
            "emotion_score": round(float(c.get("emotion_score", 0)), 3),
            "combined_score": round(float(c.get("combined_score", 0)), 3),
            "num_faces": int(c["num_faces"]),
            "is_presentation": bool(c["is_presentation"]),
            "files": {"full": f"{base}_full.jpg"}
        }

        # Face crop for the largest face
        if c["face_regions"]:
            best = max(c["face_regions"], key=lambda r: r["w"] * r["h"])
            h, w = frame.shape[:2]
            pad = 0.5
            px, py = int(best["w"] * pad), int(best["h"] * pad)
            x1 = max(0, best["x"] - px)
            y1 = max(0, best["y"] - py * 2)
            x2 = min(w, best["x"] + best["w"] + px)
            y2 = min(h, best["y"] + best["h"] + py)
            crop = frame[y1:y2, x1:x2]

            if crop.size > 0:
                crop_path = os.path.join(output_dir, f"{base}_face.jpg")
                cv2.imwrite(crop_path, crop, [cv2.IMWRITE_JPEG_QUALITY, 95])
                entry["files"]["face_crop"] = f"{base}_face.jpg"

        manifest["candidates"].append(entry)
        print(f"  ✓ #{i+1}: {emo} @ {ts_label} (score: {c.get('combined_score', 0):.2f}, faces: {c['num_faces']})")

        # Free frame memory
        del c["frame"]

    manifest_path = os.path.join(output_dir, f"{video_name}_manifest.json")
    with open(manifest_path, "w") as f:
        json.dump(manifest, f, indent=2)

    return manifest


def main():
    if not VIDEO_PATH:
        print("Usage: python thumbnail_extractor.py <video_path> [output_dir] [top_n]")
        sys.exit(1)

    if not os.path.exists(VIDEO_PATH):
        print(f"Error: Video not found: {VIDEO_PATH}")
        sys.exit(1)

    video_name = Path(VIDEO_PATH).stem
    if video_name.startswith("GMT"):
        video_name = video_name.split("_")[0]

    info = get_video_info(VIDEO_PATH)
    print(f"═══ Thumbnail Extractor ═══")
    print(f"  Video: {Path(VIDEO_PATH).name}")
    print(f"  Duration: {info['duration_sec']/60:.1f} min, {info['width']}x{info['height']}")

    # Pass 1: Quick scan (no deep learning, minimal memory)
    scored = pass1_quick_scan(VIDEO_PATH, info)

    # Select top candidates for deep analysis
    top_candidates = select_diverse_top(scored, TOP_N)
    print(f"\n  Top {len(top_candidates)} candidates from Pass 1:")
    for c in sorted(top_candidates, key=lambda x: x["score"], reverse=True)[:8]:
        print(f"    {format_ts(c['timestamp_sec'])} → score={c['score']:.2f}, "
              f"faces={c['num_faces']}, smiles={c['num_smiles']}")

    # Pass 2: Deep expression analysis (only on top candidates)
    final = pass2_deep_analysis(VIDEO_PATH, top_candidates, info, TOP_N)

    # Save outputs
    print(f"\n  Saving {len(final)} final candidates...")
    manifest = save_outputs(final, OUTPUT_DIR, video_name)

    print(f"\n═══ Done! ═══")
    print(f"  Output: {OUTPUT_DIR}/")
    for e in manifest["candidates"]:
        files = list(e["files"].keys())
        print(f"  #{e['index']}: {e['emotion']} @ {e['timestamp']} → {files}")


if __name__ == "__main__":
    main()
