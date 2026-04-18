import os
import asyncio
import json
import base64
from groq import Groq
from utils.video_utils import extract_frames_from_video

API_KEY = os.getenv("GROQ_API_KEY")
client = Groq(api_key=API_KEY) if API_KEY else None
GROQ_VISION_MODEL = "llama-3.2-90b-vision-preview"

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

    # Batch 3 frames into a SINGLE request to avoid 429 Rate Limit Exhaustion
    selected_frames = frames[:3]
    results = await asyncio.to_thread(_groq_vision_emotion_batch, selected_frames)
    return {"frame_emotions": results}


def _groq_vision_emotion_batch(frame_paths: list[str]) -> list[dict]:
    if not client:
        return [{"emotion": "neutral", "confidence": 0.5, "notes": "No Groq client"}] * len(frame_paths)

    content_list = []
    content_list.append({
        "type": "text", 
        "text": "Look at these sequential interview frames. Identify the person's emotional state in each. Return ONLY a valid JSON object matching exactly this format: {\"emotions\": [{\"emotion\": \"<label>\", \"confidence\": <0.0-1.0>, \"notes\": \"<brief>\"}]}"
    })

    for fp in frame_paths:
        with open(fp, "rb") as f:
            image_data = base64.b64encode(f.read()).decode("utf-8")
            content_list.append({
                "type": "image_url", 
                "image_url": {"url": f"data:image/jpeg;base64,{image_data}"}
            })

    messages = [{"role": "user", "content": content_list}]

    try:
        response = client.chat.completions.create(
            model=GROQ_VISION_MODEL,
            messages=messages,
            temperature=0.2,
            max_tokens=600,
            response_format={"type": "json_object"}
        )
        
        raw = response.choices[0].message.content.strip()
        parsed = json.loads(raw)
        parsed_emotions = parsed.get("emotions", [])
        
        if not isinstance(parsed_emotions, list):
            parsed_emotions = [parsed_emotions]
            
        while len(parsed_emotions) < len(frame_paths):
            parsed_emotions.append({"emotion": "neutral", "confidence": 0.5, "notes": "fallback padding"})
            
    except Exception as e:
        print(f"[Groq Vision Error] {e}")
        parsed_emotions = [{"emotion": "neutral", "confidence": 0.5, "notes": "parse error"}] * len(frame_paths)

    results = []
    for path, emot in zip(frame_paths, parsed_emotions):
        results.append({
            "frame": os.path.basename(path),
            "emotion": emot
        })
    return results


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