import os
import asyncio
from groq import Groq
from utils.video_utils import universal_audio_encoder

_groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))

AUDIO_EXTENSIONS = {".mp3", ".wav", ".m4a", ".ogg", ".flac"}
VIDEO_EXTENSIONS = {".mp4", ".webm", ".mov", ".avi"}
MAX_FILE_SIZE_MB  = 25


async def transcribe_audio(file_path: str) -> str:
    """
    Transcribe an audio or video file using Groq Whisper.
    For video files, audio is extracted first via FFmpeg.
    """
    # Pass literally any uploaded file through the unified FFmpeg squasher
    audio_path = await universal_audio_encoder(file_path)

    if not os.path.exists(audio_path):
        raise FileNotFoundError(f"Audio file not found at: {audio_path}")

    _check_file_size(audio_path)
    return await asyncio.to_thread(_whisper_transcribe, audio_path)


def _whisper_transcribe(audio_path: str) -> str:
    with open(audio_path, "rb") as audio_file:
        response = _groq_client.audio.transcriptions.create(
            model="whisper-large-v3",
            file=audio_file,
            response_format="text",
            language="en"
        )
    return response if isinstance(response, str) else response.text


async def transcribe_with_timestamps(file_path: str) -> dict:
    """Transcribe and return verbose JSON with segment-level timestamps."""
    audio_path = await universal_audio_encoder(file_path)

    return await asyncio.to_thread(_whisper_verbose, audio_path)


def _whisper_verbose(audio_path: str) -> dict:
    with open(audio_path, "rb") as audio_file:
        response = _groq_client.audio.transcriptions.create(
            model="whisper-large-v3",
            file=audio_file,
            response_format="verbose_json",
            timestamp_granularities=["segment"]
        )
    return response.model_dump() if hasattr(response, "model_dump") else dict(response)


def _check_file_size(path: str) -> None:
    size_mb = os.path.getsize(path) / (1024 * 1024)
    if size_mb > MAX_FILE_SIZE_MB:
        raise ValueError(
            f"Audio file is {size_mb:.1f} MB — Groq Whisper limit is {MAX_FILE_SIZE_MB} MB. "
            "Please compress or trim before uploading."
        )