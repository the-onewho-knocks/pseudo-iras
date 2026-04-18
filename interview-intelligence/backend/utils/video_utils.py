import os
import subprocess
import tempfile

FFMPEG_BINARY = os.getenv("FFMPEG_PATH", "ffmpeg")


async def extract_audio_from_video(video_path: str) -> str:
    import asyncio
    return await asyncio.to_thread(_extract_audio_sync, video_path)


def _extract_audio_sync(video_path: str) -> str:
    base = os.path.splitext(video_path)[0]
    audio_path = f"{base}_audio.wav"
    cmd = [
        FFMPEG_BINARY, "-y",
        "-i", video_path,
        "-vn",
        "-acodec", "pcm_s16le",
        "-ar", "16000",
        "-ac", "1",
        audio_path
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        raise RuntimeError(f"FFmpeg audio extraction failed:\n{result.stderr}")
    return audio_path


def extract_frames_from_video(
    video_path: str,
    sample_rate: int = 30,
    output_dir: str = None
) -> list[str]:
    if output_dir is None:
        output_dir = tempfile.mkdtemp(prefix="frames_")
    os.makedirs(output_dir, exist_ok=True)
    output_pattern = os.path.join(output_dir, "frame_%04d.jpg")
    cmd = [
        FFMPEG_BINARY, "-y",
        "-i", video_path,
        "-vf", f"fps=1/{sample_rate}",
        "-q:v", "2",
        output_pattern
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"[video_utils] Frame extraction warning: {result.stderr}")
        return []
    return sorted([
        os.path.join(output_dir, f)
        for f in os.listdir(output_dir)
        if f.endswith(".jpg")
    ])


def get_video_metadata(video_path: str) -> dict:
    import json
    cmd = ["ffprobe", "-v", "quiet", "-print_format", "json",
           "-show_streams", "-show_format", video_path]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        return {"error": result.stderr}
    return json.loads(result.stdout)


def is_video_file(file_path: str) -> bool:
    return os.path.splitext(file_path)[-1].lower() in {".mp4", ".webm", ".mov", ".avi", ".mkv", ".flv"}


def is_audio_file(file_path: str) -> bool:
    return os.path.splitext(file_path)[-1].lower() in {".mp3", ".wav", ".m4a", ".ogg", ".flac", ".aac"}