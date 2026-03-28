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
import base64
import cv2
import numpy as np
import urllib.request
import urllib.error
from pathlib import Path

# ── Config ──────────────────────────────────────────────────────────────────
DEFAULT_OUTPUT_DIR = str(Path.home() / "Downloads" / "thumb_candidates")
SAMPLE_INTERVAL_SEC = 10  # coarser sampling = less memory
ANALYSIS_SCALE = 0.5  # downscale frames for face detection
FULL_RES_SCALE = 1.0  # keep full res for final output
SLIDE_HASH_SIZE = 9
SLIDE_HASH_DISTANCE_THRESHOLD = 10
SLIDE_GAP_SEC = SAMPLE_INTERVAL_SEC * 1.5
VLM_DEFAULT_PROVIDER = None
VLM_DEFAULT_MODEL = None
VLM_BATCH_SIZE = 8
VLM_MAX_SAMPLES = 120

face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
smile_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_smile.xml')


def parse_args(argv):
    positional = []
    extract_slides = False
    vlm_provider = VLM_DEFAULT_PROVIDER
    vlm_model = VLM_DEFAULT_MODEL
    vlm_batch_size = VLM_BATCH_SIZE
    vlm_max_samples = VLM_MAX_SAMPLES

    args = argv[1:]
    i = 0
    while i < len(args):
        arg = args[i]
        if arg == "--extract-slides":
            extract_slides = True
        elif arg == "--vlm-provider":
            i += 1
            vlm_provider = args[i]
        elif arg == "--vlm-model":
            i += 1
            vlm_model = args[i]
        elif arg == "--vlm-batch-size":
            i += 1
            vlm_batch_size = int(args[i])
        elif arg == "--vlm-max-samples":
            i += 1
            vlm_max_samples = int(args[i])
        else:
            positional.append(arg)
        i += 1

    video_path = positional[0] if len(positional) > 0 else None
    output_dir = positional[1] if len(positional) > 1 else DEFAULT_OUTPUT_DIR
    top_n = int(positional[2]) if len(positional) > 2 else 4

    return {
        "video_path": video_path,
        "output_dir": output_dir,
        "top_n": top_n,
        "extract_slides": extract_slides,
        "vlm_provider": vlm_provider,
        "vlm_model": vlm_model,
        "vlm_batch_size": vlm_batch_size,
        "vlm_max_samples": vlm_max_samples,
    }


ARGS = parse_args(sys.argv)
VIDEO_PATH = ARGS["video_path"]
OUTPUT_DIR = ARGS["output_dir"]
TOP_N = ARGS["top_n"]
EXTRACT_SLIDES = ARGS["extract_slides"]
VLM_PROVIDER = ARGS["vlm_provider"]
VLM_MODEL = ARGS["vlm_model"]
VLM_BATCH_SIZE = ARGS["vlm_batch_size"]
VLM_MAX_SAMPLES = ARGS["vlm_max_samples"]


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


def average_hash(frame, hash_size=SLIDE_HASH_SIZE):
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    resized = cv2.resize(gray, (hash_size, hash_size), interpolation=cv2.INTER_AREA)
    avg = resized.mean()
    return (resized > avg).astype(np.uint8).flatten()


def hamming_distance(hash_a, hash_b):
    return int(np.count_nonzero(hash_a != hash_b))


def chunked(items, size):
    for i in range(0, len(items), size):
        yield items[i:i + size]


def frame_to_data_url(frame):
    ok, encoded = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 82])
    if not ok:
        raise RuntimeError("Could not encode frame as JPEG")
    b64 = base64.b64encode(encoded.tobytes()).decode("ascii")
    return f"data:image/jpeg;base64,{b64}", b64


def json_http_post(url, body, headers):
    data = json.dumps(body).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers=headers, method="POST")
    with urllib.request.urlopen(req, timeout=180) as resp:
        return json.loads(resp.read().decode("utf-8"))


def extract_json_object(text):
    start = text.find("{")
    end = text.rfind("}")
    if start == -1 or end == -1 or end <= start:
        raise ValueError(f"No JSON object found in response: {text[:300]}")
    return json.loads(text[start:end + 1])


def vlm_default_model(provider):
    defaults = {
        "ollama": "gemma3",
        "gemini": "gemini-2.5-flash-lite",
        "openai": "gpt-4.1-mini",
        "anthropic": "claude-sonnet-4-6",
        "openrouter": "google/gemini-2.5-flash-lite",
    }
    return defaults.get(provider)


def offer_vlm_options():
    print("\n  No slide-like frames detected with OpenCV heuristics.")
    print("  Lowest-overhead fallback is sampled-frame VLM classification, not full native-video upload.")
    print("  To retry with a VLM fallback, rerun with one of:")
    print("    --vlm-provider ollama      # lowest infra overhead if you already run a local vision model")
    print("    --vlm-provider gemini      # best hosted default; also has separate native video support via Files API")
    print("    --vlm-provider openai      # simple hosted image-batch path via Responses API")
    print("    --vlm-provider anthropic   # strong hosted image understanding via Messages API")
    print("    --vlm-provider openrouter  # one API key for multiple providers/models")
    print("  Example:")
    print("    python3 thumbnail_extractor.py /path/to/video.mp4 ~/Downloads/thumb_candidates 4 --extract-slides --vlm-provider gemini")


def select_vlm_samples(scored_frames, max_samples):
    if not scored_frames:
        return []
    if len(scored_frames) <= max_samples:
        return list(scored_frames)

    step = max(1, int(np.ceil(len(scored_frames) / max_samples)))
    samples = scored_frames[::step]
    if samples[-1] is not scored_frames[-1]:
        samples.append(scored_frames[-1])
    return samples[:max_samples]


def build_vlm_prompt(batch):
    lines = [
        "You are classifying sampled frames from a recorded talk.",
        "For each frame, decide whether it should count as a slide frame.",
        "A frame counts as a slide if the main informational content is a presentation slide, even if a presenter webcam is also visible.",
        "Do not count talking-head-only shots, discussion tables, or audience shots as slides.",
        "Return strict JSON in this shape: {\"results\":[{\"index\":1,\"is_slide\":true,\"confidence\":0.93,\"reason\":\"short reason\"}]}",
        "Use exactly one result object per frame, in the same order as below.",
        "Frames in this batch:",
    ]
    for i, sample in enumerate(batch, 1):
        lines.append(f"- Frame {i}: timestamp {format_ts(sample['timestamp_sec'])}")
    return "\n".join(lines)


def classify_batch_with_gemini(batch, model):
    api_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        raise RuntimeError("Missing GEMINI_API_KEY or GOOGLE_API_KEY")

    parts = [{"text": build_vlm_prompt(batch)}]
    for sample in batch:
        _, b64 = frame_to_data_url(sample["frame"])
        parts.append({
            "inline_data": {
                "mime_type": "image/jpeg",
                "data": b64,
            }
        })

    body = {
        "contents": [{"parts": parts}],
        "generationConfig": {
            "responseMimeType": "application/json",
        },
    }

    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
    resp = json_http_post(url, body, {"Content-Type": "application/json"})
    text = resp["candidates"][0]["content"]["parts"][0]["text"]
    return extract_json_object(text)["results"]


def classify_batch_with_openai_compatible(batch, model, api_key, base_url, extra_headers=None):
    content = [{"type": "text", "text": build_vlm_prompt(batch)}]
    for sample in batch:
        data_url, _ = frame_to_data_url(sample["frame"])
        content.append({
            "type": "image_url",
            "image_url": {
                "url": data_url,
                "detail": "low",
            },
        })

    body = {
        "model": model,
        "messages": [
            {"role": "user", "content": content}
        ],
        "response_format": {"type": "json_object"},
    }

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}",
    }
    if extra_headers:
        headers.update(extra_headers)

    resp = json_http_post(base_url, body, headers)
    text = resp["choices"][0]["message"]["content"]
    return extract_json_object(text)["results"]


def classify_batch_with_openai(batch, model):
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("Missing OPENAI_API_KEY")
    content = [{"type": "input_text", "text": build_vlm_prompt(batch)}]
    for sample in batch:
        data_url, _ = frame_to_data_url(sample["frame"])
        content.append({
            "type": "input_image",
            "image_url": data_url,
            "detail": "low",
        })

    body = {
        "model": model,
        "input": [
            {
                "role": "user",
                "content": content,
            }
        ],
    }

    resp = json_http_post(
        "https://api.openai.com/v1/responses",
        body,
        {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}",
        },
    )
    text = resp.get("output_text")
    if not text:
        fragments = []
        for item in resp.get("output", []):
            for part in item.get("content", []):
                if part.get("type") == "output_text":
                    fragments.append(part.get("text", ""))
        text = "\n".join(fragment for fragment in fragments if fragment)
    return extract_json_object(text)["results"]


def classify_batch_with_openrouter(batch, model):
    api_key = os.environ.get("OPENROUTER_API_KEY")
    if not api_key:
        raise RuntimeError("Missing OPENROUTER_API_KEY")
    return classify_batch_with_openai_compatible(
        batch=batch,
        model=model,
        api_key=api_key,
        base_url="https://openrouter.ai/api/v1/chat/completions",
        extra_headers={
            "HTTP-Referer": "https://github.com/swyxio/skills",
            "X-Title": "thumbnail-extraction",
        },
    )


def classify_batch_with_anthropic(batch, model):
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        raise RuntimeError("Missing ANTHROPIC_API_KEY")

    content = []
    for sample in batch:
        _, b64 = frame_to_data_url(sample["frame"])
        content.append({
            "type": "image",
            "source": {
                "type": "base64",
                "media_type": "image/jpeg",
                "data": b64,
            },
        })
    content.append({"type": "text", "text": build_vlm_prompt(batch)})

    body = {
        "model": model,
        "max_tokens": 1024,
        "messages": [
            {"role": "user", "content": content}
        ],
    }

    resp = json_http_post(
        "https://api.anthropic.com/v1/messages",
        body,
        {
            "Content-Type": "application/json",
            "x-api-key": api_key,
            "anthropic-version": "2023-06-01",
        },
    )
    text_blocks = [block["text"] for block in resp.get("content", []) if block.get("type") == "text"]
    text = "\n".join(text_blocks)
    return extract_json_object(text)["results"]


def classify_batch_with_ollama(batch, model):
    body = {
        "model": model,
        "stream": False,
        "format": {
            "type": "object",
            "properties": {
                "results": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "index": {"type": "integer"},
                            "is_slide": {"type": "boolean"},
                            "confidence": {"type": "number"},
                            "reason": {"type": "string"},
                        },
                        "required": ["index", "is_slide", "confidence", "reason"],
                    },
                }
            },
            "required": ["results"],
        },
        "messages": [
            {
                "role": "user",
                "content": build_vlm_prompt(batch),
                "images": [frame_to_data_url(sample["frame"])[1] for sample in batch],
            }
        ],
    }
    resp = json_http_post(
        "http://localhost:11434/api/chat",
        body,
        {"Content-Type": "application/json"},
    )
    text = resp["message"]["content"]
    return extract_json_object(text)["results"]


def classify_slide_batches(provider, model, batches):
    provider = provider.lower()
    classifier = {
        "gemini": classify_batch_with_gemini,
        "openai": classify_batch_with_openai,
        "openrouter": classify_batch_with_openrouter,
        "anthropic": classify_batch_with_anthropic,
        "ollama": classify_batch_with_ollama,
    }.get(provider)

    if classifier is None:
        raise ValueError(f"Unsupported VLM provider: {provider}")

    results = []
    for idx, batch in enumerate(batches, 1):
        print(f"    VLM batch {idx}/{len(batches)} via {provider}:{model}...")
        batch_results = classifier(batch, model)
        for item in batch_results:
            ordinal = int(item["index"]) - 1
            if ordinal < 0 or ordinal >= len(batch):
                continue
            sample = batch[ordinal]
            results.append({
                **sample,
                "vlm_is_slide": bool(item.get("is_slide")),
                "vlm_confidence": float(item.get("confidence", 0.0)),
                "vlm_reason": str(item.get("reason", ""))[:200],
            })
    return results


def extract_slide_frames_with_vlm(video_path, scored_frames, info, output_dir, video_name,
                                  provider, model, batch_size, max_samples):
    samples = select_vlm_samples(scored_frames, max_samples=max_samples)
    if not samples:
        print("\n  No frames available for VLM fallback.")
        return []

    print(f"\n  [VLM Fallback] Sampling {len(samples)} frame(s) for {provider} classification...")
    cap = cv2.VideoCapture(video_path)
    enriched = []
    for sample in samples:
        cap.set(cv2.CAP_PROP_POS_FRAMES, sample["frame_idx"])
        ret, frame = cap.read()
        if not ret or frame is None:
            continue
        enriched.append({
            **sample,
            "frame": frame,
            "frame_hash": average_hash(frame),
        })
    cap.release()

    batches = list(chunked(enriched, batch_size))
    classified = classify_slide_batches(provider, model, batches)
    positive = [x for x in classified if x.get("vlm_is_slide")]

    if not positive:
        print("\n  VLM fallback also found no slides.")
        return []

    positive.sort(key=lambda x: x["timestamp_sec"])
    groups = []
    current_group = None
    for sample in positive:
        if current_group is None:
            current_group = [sample]
            continue
        prev = current_group[-1]
        gap = sample["timestamp_sec"] - prev["timestamp_sec"]
        hash_delta = hamming_distance(sample["frame_hash"], prev["frame_hash"])
        if gap <= SLIDE_GAP_SEC and hash_delta <= SLIDE_HASH_DISTANCE_THRESHOLD:
            current_group.append(sample)
        else:
            groups.append(current_group)
            current_group = [sample]
    if current_group:
        groups.append(current_group)

    slides_dir = os.path.join(output_dir, "slides_vlm")
    os.makedirs(slides_dir, exist_ok=True)
    manifest = {
        "video": video_name,
        "provider": provider,
        "model": model,
        "slides": [],
    }
    print(f"\n  Saving {len(groups)} VLM slide representative(s)...")
    for idx, group in enumerate(groups, 1):
        best = max(group, key=lambda x: (x["vlm_confidence"], x["slide_score"]))
        ts_label = format_ts(best["timestamp_sec"])
        base = f"{video_name}_vlm_slide_{idx}_{ts_label.replace(':', '-')}"
        out_name = f"{base}.jpg"
        out_path = os.path.join(slides_dir, out_name)
        cv2.imwrite(out_path, best["frame"], [cv2.IMWRITE_JPEG_QUALITY, 95])

        manifest["slides"].append({
            "index": idx,
            "timestamp": ts_label,
            "timestamp_sec": float(best["timestamp_sec"]),
            "confidence": round(float(best["vlm_confidence"]), 3),
            "reason": best["vlm_reason"],
            "file": out_name,
        })
        print(f"  ✓ VLM slide #{idx}: {ts_label} (confidence: {best['vlm_confidence']:.2f})")

    manifest_path = os.path.join(slides_dir, f"{video_name}_slides_vlm_manifest.json")
    with open(manifest_path, "w") as f:
        json.dump(manifest, f, indent=2)

    return manifest["slides"]


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
        slide_score = 0.0
        if is_presentation:
            slide_score += edge_density * 12.0
            slide_score += max(0.0, (55.0 - sat_std) / 25.0)
            slide_score += min(variance / 5000.0, 1.0)
            if num_faces == 0:
                slide_score += 0.75

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
            "slide_score": slide_score,
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


def extract_slide_frames(video_path, scored_frames, info, output_dir, video_name):
    """
    Extract one representative frame per detected slide segment.

    Lowest-overhead approach:
      1. Use existing cheap OpenCV presentation heuristic over the whole scan.
      2. Group consecutive slide-like samples by time proximity + perceptual hash.
      3. Save one highest-scoring representative per unique slide.

    This avoids running a VLM across the full video. If false positives become a
    problem, a future VLM pass should only classify these grouped representatives.
    """
    slide_samples = [f for f in scored_frames if f["is_presentation"]]
    if not slide_samples:
        print("\n  No slide-like frames detected.")
        if VLM_PROVIDER:
            model = VLM_MODEL or vlm_default_model(VLM_PROVIDER)
            print(f"  Trying VLM fallback with {VLM_PROVIDER}:{model}...")
            return extract_slide_frames_with_vlm(
                video_path=video_path,
                scored_frames=scored_frames,
                info=info,
                output_dir=output_dir,
                video_name=video_name,
                provider=VLM_PROVIDER,
                model=model,
                batch_size=VLM_BATCH_SIZE,
                max_samples=VLM_MAX_SAMPLES,
            )
        offer_vlm_options()
        return []

    slide_samples.sort(key=lambda x: x["timestamp_sec"])
    cap = cv2.VideoCapture(video_path)
    groups = []
    current_group = None

    for sample in slide_samples:
        cap.set(cv2.CAP_PROP_POS_FRAMES, sample["frame_idx"])
        ret, frame = cap.read()
        if not ret or frame is None:
            continue

        frame_hash = average_hash(frame)
        enriched = {
            **sample,
            "frame_hash": frame_hash,
            "frame": frame,
        }

        if current_group is None:
            current_group = [enriched]
            continue

        prev = current_group[-1]
        gap = sample["timestamp_sec"] - prev["timestamp_sec"]
        hash_delta = hamming_distance(frame_hash, prev["frame_hash"])

        if gap <= SLIDE_GAP_SEC and hash_delta <= SLIDE_HASH_DISTANCE_THRESHOLD:
            current_group.append(enriched)
        else:
            groups.append(current_group)
            current_group = [enriched]

    if current_group:
        groups.append(current_group)

    cap.release()

    slides_dir = os.path.join(output_dir, "slides")
    os.makedirs(slides_dir, exist_ok=True)
    manifest = {
        "video": video_name,
        "slides": [],
    }

    print(f"\n  Saving {len(groups)} slide representative(s)...")
    for idx, group in enumerate(groups, 1):
        best = max(group, key=lambda x: x["slide_score"])
        ts_label = format_ts(best["timestamp_sec"])
        base = f"{video_name}_slide_{idx}_{ts_label.replace(':', '-')}"
        out_name = f"{base}.jpg"
        out_path = os.path.join(slides_dir, out_name)
        cv2.imwrite(out_path, best["frame"], [cv2.IMWRITE_JPEG_QUALITY, 95])

        manifest["slides"].append({
            "index": idx,
            "timestamp": ts_label,
            "timestamp_sec": float(best["timestamp_sec"]),
            "slide_score": round(float(best["slide_score"]), 3),
            "num_faces": int(best["num_faces"]),
            "edge_density": round(float(best["edge_density"]), 4),
            "file": out_name,
        })
        print(f"  ✓ slide #{idx}: {ts_label} (score: {best['slide_score']:.2f})")

        for item in group:
            item.pop("frame", None)
            item.pop("frame_hash", None)

    manifest_path = os.path.join(slides_dir, f"{video_name}_slides_manifest.json")
    with open(manifest_path, "w") as f:
        json.dump(manifest, f, indent=2)

    return manifest["slides"]


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
        print("Usage: python thumbnail_extractor.py <video_path> [output_dir] [top_n] [--extract-slides] [--vlm-provider PROVIDER] [--vlm-model MODEL]")
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

    if EXTRACT_SLIDES:
        extract_slide_frames(VIDEO_PATH, scored, info, OUTPUT_DIR, video_name)

    print(f"\n═══ Done! ═══")
    print(f"  Output: {OUTPUT_DIR}/")
    for e in manifest["candidates"]:
        files = list(e["files"].keys())
        print(f"  #{e['index']}: {e['emotion']} @ {e['timestamp']} → {files}")


if __name__ == "__main__":
    main()
