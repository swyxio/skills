#!/usr/bin/env python3
"""Score presentation frames and optionally reject near-duplicate visuals."""

import argparse
import json
import sys

try:
    import cv2
except ImportError:
    print("OpenCV is required: install opencv-python in the active environment.", file=sys.stderr)
    raise SystemExit(2)


def difference_hash(gray):
    reduced = cv2.resize(gray, (9, 8), interpolation=cv2.INTER_AREA)
    value = 0
    for bit in (reduced[:, 1:] > reduced[:, :-1]).flatten():
        value = (value << 1) | int(bit)
    return f"{value:016x}"


def hamming_distance(left, right):
    return (int(left, 16) ^ int(right, 16)).bit_count()


def score_frame(path, detector):
    frame = cv2.imread(path)
    if frame is None:
        return {"path": path, "accepted": False, "reason": "unreadable-image"}

    normalized = cv2.resize(frame, (640, 360), interpolation=cv2.INTER_AREA)
    gray = cv2.cvtColor(normalized, cv2.COLOR_BGR2GRAY)
    faces = detector.detectMultiScale(gray, 1.1, 5, minSize=(28, 28))
    face_area_ratio = sum(width * height for _, _, width, height in faces) / float(gray.size)
    edges = cv2.Canny(gray, 80, 180)
    edge_density = float((edges > 0).sum() / edges.size)
    brightness = float(gray.mean())
    contrast = float(gray.std())
    blur_variance = float(cv2.Laplacian(gray, cv2.CV_64F).var())

    reasons = []
    if not 28 <= brightness <= 232:
        reasons.append("underexposed-or-overexposed")
    if contrast < 25:
        reasons.append("low-contrast")
    if blur_variance < 35:
        reasons.append("blurry")
    if edge_density < 0.045:
        reasons.append("low-detail")
    if face_area_ratio > 0.10 and edge_density < 0.055:
        reasons.append("speaker-only")
    if len(faces) >= 4:
        reasons.append("audience-heavy")

    score = (
        edge_density * 150
        + min(contrast / 20, 4)
        + min(blur_variance / 300, 4)
        - face_area_ratio * 35
        - len(faces) * 0.35
    )
    return {
        "path": path,
        "accepted": not reasons,
        "reasons": reasons,
        "score": round(float(score), 5),
        "faceCount": int(len(faces)),
        "faceAreaRatio": round(float(face_area_ratio), 5),
        "edgeDensity": round(edge_density, 5),
        "brightness": round(brightness, 3),
        "contrast": round(contrast, 3),
        "blurVariance": round(blur_variance, 3),
        "differenceHash": difference_hash(gray),
        "width": int(frame.shape[1]),
        "height": int(frame.shape[0]),
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("frames", nargs="+", help="Source video frames to evaluate")
    parser.add_argument("--distinct", action="store_true", help="Reject near-duplicate accepted frames")
    parser.add_argument("--min-hamming-distance", type=int, default=10)
    arguments = parser.parse_args()
    if not 0 <= arguments.min_hamming_distance <= 64:
        parser.error("--min-hamming-distance must be between 0 and 64")

    detector = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
    results = [score_frame(path, detector) for path in arguments.frames]

    if arguments.distinct:
        accepted_hashes = []
        for result in sorted(results, key=lambda item: item.get("score", float("-inf")), reverse=True):
            if not result["accepted"]:
                continue
            distance = min(
                (hamming_distance(result["differenceHash"], previous) for previous in accepted_hashes),
                default=64,
            )
            result["nearestAcceptedDistance"] = distance
            if distance < arguments.min_hamming_distance:
                result["accepted"] = False
                result["reasons"].append("near-duplicate")
            else:
                accepted_hashes.append(result["differenceHash"])

    print(json.dumps(results, separators=(",", ":")))


if __name__ == "__main__":
    main()
