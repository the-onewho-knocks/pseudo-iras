import os
import subprocess
import tempfile

try:
    import imageio_ffmpeg
    FFMPEG_BINARY = imageio_ffmpeg.get_ffmpeg_exe()
except Exception:
    FFMPEG_BINARY = os.getenv("FFMPEG_PATH", "ffmpeg")


async def universal_audio_encoder(file_path: str) -> str:
    import asyncio
    return await asyncio.to_thread(_universal_audio_encoder_sync, file_path)


def _universal_audio_encoder_sync(file_path: str) -> str:
    base = os.path.splitext(file_path)[0]
    out_path = f"{base}_universal.mp3"
    
    if os.path.exists(out_path):
        return out_path

    cmd = [
        FFMPEG_BINARY, "-y",
        "-err_detect", "ignore_err",
        "-i", file_path,
        "-vn",
        "-acodec", "libmp3lame",
        "-ar", "16000",
        "-ac", "1",
        "-b:a", "32k",
        out_path
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"[UniversalEncoder Warning] {result.stderr}")
        # Return pristine path if FFmpeg catastrophically fails so analysis still attempts to run
        return file_path
    return out_path



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