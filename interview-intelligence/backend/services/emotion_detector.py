import os
import asyncio
import json
import base64
import google.generativeai as genai
from utils.video_utils import extract_frames_from_video

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-1.5-pro")

VIDEO_EXTENSIONS = {".mp4", ".webm", ".mov", ".avi"}


async def detect_emotions(file_path: str) -> dict:
    """
    Detect emotional cues from the interview.
    - Video: visual frame analysis via Gemini Vision
    - Audio: prosody stub (pluggable with Hume AI / SpeechBrain)
    """
    ext = os.path.splitext(file_path)[-1].lower()
    results: dict = {"source": [], "emotion_profile": {}, "timeline": []}

    if ext in VIDEO_EXTENSIONS:
        visual = await _analyze_video_frames(file_path)
        results["source"].append("visual")
        results["visual_emotions"] = visual

    audio_emotions = await _analyze_audio_prosody(file_path)
    results["source"].append("audio")
    results["audio_emotions"] = audio_emotions

    results["emotion_profile"] = _merge_emotion_profiles(
        results.get("visual_emotions"), audio_emotions
    )
    return results


async def _analyze_video_frames(file_path: str) -> dict:
    frames = await asyncio.to_thread(extract_frames_from_video, file_path, 30)
    if not frames:
        return {"error": "No frames extracted from video."}

    results = []
    for frame_path in frames[:5]:
        emotion = await asyncio.to_thread(_gemini_vision_emotion, frame_path)
        results.append({"frame": os.path.basename(frame_path), "emotion": emotion})
    return {"frame_emotions": results}


def _gemini_vision_emotion(frame_path: str) -> dict:
    with open(frame_path, "rb") as f:
        image_data = base64.b64encode(f.read()).decode("utf-8")

    model = genai.GenerativeModel(GEMINI_MODEL)
    response = model.generate_content([
        {"mime_type": "image/jpeg", "data": image_data},
        (
            "Look at this interview frame. Identify the person's emotional state. "
            "Return ONLY a JSON object with no markdown fences: "
            "{\"emotion\": \"<label>\", \"confidence\": <0.0-1.0>, \"notes\": \"<brief>\"}"
        )
    ])

    raw = response.text.strip().replace("```json", "").replace("```", "").strip()
    try:
        return json.loads(raw)
    except Exception:
        return {"emotion": raw, "confidence": 0.5, "notes": "parse error"}


async def _analyze_audio_prosody(file_path: str) -> dict:
    """Stub — replace with Hume AI or SpeechBrain for real prosody analysis."""
    return {
        "dominant_emotion": "neutral",
        "energy_level": "medium",
        "pitch_variability": "moderate",
        "note": "Integrate Hume AI or SpeechBrain for real prosody analysis."
    }


def _merge_emotion_profiles(visual: dict | None, audio: dict) -> dict:
    if not visual:
        return {
            "primary_emotion": audio.get("dominant_emotion", "neutral"),
            "energy_level": audio.get("energy_level", "unknown"),
            "overall_confidence_signal": "medium"
        }

    from collections import Counter
    frame_emotions = visual.get("frame_emotions", [])
    labels = [f.get("emotion", {}).get("emotion", "neutral") for f in frame_emotions]
    most_common = Counter(labels).most_common(1)
    dominant = most_common[0][0] if most_common else "neutral"

    return {
        "primary_emotion": dominant,
        "visual_dominant": dominant,
        "audio_dominant": audio.get("dominant_emotion", "neutral"),
        "energy_level": audio.get("energy_level", "medium"),
        "overall_confidence_signal": _infer_confidence(dominant)
    }


def _infer_confidence(visual_emotion: str) -> str:
    if visual_emotion in {"confident", "enthusiastic", "calm"}:
        return "high"
    if visual_emotion in {"nervous", "hesitant", "stressed"}:
        return "low"
    return "medium"