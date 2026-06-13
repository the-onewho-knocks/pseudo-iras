from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
from utils.file_handler import save_upload, get_upload_path
from models.schemas import UploadResponse
import uuid
import os

router = APIRouter()

ALLOWED_EXTENSIONS = {".mp3", ".mp4", ".wav", ".webm", ".m4a", ".ogg", ".mpeg", ".mkv", ".flv", ".mov", ".avi", ".3gp", ".aac", ".flac", ".wmv"}

@router.post("/", response_model=UploadResponse)
async def upload_interview(file: UploadFile = File(...)):
    """
    Upload an interview audio/video file.
    Returns a session_id used for subsequent analysis calls.
    """
    ext = os.path.splitext(file.filename)[-1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{ext}'. Allowed: {ALLOWED_EXTENSIONS}"
        )

    session_id = str(uuid.uuid4())
    file_path = await save_upload(file, session_id)

    return UploadResponse(
        session_id=session_id,
        filename=file.filename,
        file_path=file_path,
        message="File uploaded successfully. Use session_id to trigger analysis."
    )

@router.get("/{session_id}/media")
async def get_media(session_id: str):
    """
    Serve the uploaded media file for playback.
    """
    file_path = get_upload_path(session_id)
    if not file_path or not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Media file not found.")
    return FileResponse(file_path)