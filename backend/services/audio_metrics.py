import re
import os
import asyncio
from collections import Counter

# Common filler words to detect
FILLER_WORDS = [
    "um", "uh", "like", "you know", "basically", "literally",
    "actually", "sort of", "kind of", "i mean", "right", "okay so",
    "so yeah", "you see", "well", "hmm", "er", "ah"
]

async def extract_audio_metrics(file_path: str, transcript: str) -> dict:
    """
    Extract linguistic and audio metrics from the transcript.
    Optionally uses audio duration for pace calculation.
    """
    duration_seconds = await asyncio.to_thread(_get_audio_duration, file_path)

    metrics = {}
    metrics["filler_word_analysis"]  = _analyze_filler_words(transcript)
    metrics["word_count"]            = _count_words(transcript)
    metrics["sentence_count"]        = _count_sentences(transcript)
    metrics["avg_sentence_length"]   = _avg_sentence_length(transcript)
    metrics["speech_pace_wpm"]       = _calculate_pace(metrics["word_count"], duration_seconds)
    metrics["pause_analysis"]        = _estimate_pauses(transcript)
    metrics["vocabulary_diversity"]  = _vocabulary_diversity(transcript)
    metrics["duration_seconds"]      = duration_seconds

    return metrics


def _get_audio_duration(file_path: str) -> float:
    """Use mutagen or pydub to get audio duration in seconds."""
    try:
        from pydub import AudioSegment
        ext = os.path.splitext(file_path)[-1].lower().strip(".")
        fmt = "mp4" if ext in ("mp4", "m4a") else ext
        audio = AudioSegment.from_file(file_path, format=fmt)
        return len(audio) / 1000.0
    except Exception:
        return 0.0


def _analyze_filler_words(transcript: str) -> dict:
    text = transcript.lower()
    found = {}
    total = 0
    for filler in FILLER_WORDS:
        pattern = r'\b' + re.escape(filler) + r'\b'
        count = len(re.findall(pattern, text))
        if count:
            found[filler] = count
            total += count

    return {
        "total_filler_words": total,
        "breakdown": dict(sorted(found.items(), key=lambda x: x[1], reverse=True)),
        "filler_rate": round(total / max(_count_words(transcript), 1) * 100, 2)
    }


def _count_words(transcript: str) -> int:
    return len(transcript.split())


def _count_sentences(transcript: str) -> int:
    sentences = re.split(r'[.!?]+', transcript)
    return len([s for s in sentences if s.strip()])


def _avg_sentence_length(transcript: str) -> float:
    words = _count_words(transcript)
    sentences = _count_sentences(transcript)
    return round(words / max(sentences, 1), 2)


def _calculate_pace(word_count: int, duration_seconds: float) -> float:
    """Words per minute. Normal pace: 120-160 WPM."""
    if duration_seconds <= 0:
        return 0.0
    return round((word_count / duration_seconds) * 60, 2)


def _estimate_pauses(transcript: str) -> dict:
    """
    Estimate pauses by counting ellipsis patterns or long silence markers.
    For proper pause detection, integrate with Whisper verbose timestamps.
    """
    ellipsis_count = transcript.count("...")
    dash_pause = len(re.findall(r'\s-{2,}\s', transcript))
    return {
        "estimated_long_pauses": ellipsis_count + dash_pause,
        "note": "For precise pause detection, use Whisper verbose timestamps."
    }


def _vocabulary_diversity(transcript: str) -> dict:
    """Type-Token Ratio (TTR) — higher = more diverse vocabulary."""
    words = re.findall(r'\b\w+\b', transcript.lower())
    unique = set(words)
    ttr = round(len(unique) / max(len(words), 1), 4)
    top_words = Counter(words).most_common(10)
    return {
        "total_words": len(words),
        "unique_words": len(unique),
        "type_token_ratio": ttr,
        "top_10_words": dict(top_words)
    }