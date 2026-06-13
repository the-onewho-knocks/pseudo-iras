from fastapi import APIRouter, HTTPException
from models.schemas import AnalyzeRequest, AnalyzeResponse
from services.transcription import transcribe_audio
from services.analyzer import analyze_transcript
from services.audio_metrics import extract_audio_metrics
from services.report import build_report
from utils.file_handler import get_upload_path, save_report
import os
import asyncio

router = APIRouter()

@router.post("/", response_model=AnalyzeResponse)
async def analyze_interview(payload: AnalyzeRequest):
    """
    Run full analysis pipeline on an uploaded interview file.
    Steps: Transcription → Audio Metrics → Emotion Detection → AI Scoring → Report
    """
    file_path = get_upload_path(payload.session_id)
    if not file_path or not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Session file not found. Please upload first.")

    try:
        # Step 1 — Transcription
        transcript = await transcribe_audio(file_path)
        if not transcript:
            raise HTTPException(status_code=500, detail="Transcription failed.")

        # Step 2 & 3 — Audio Metrics and AI Scoring run concurrently
        audio_metrics, ai_scores = await asyncio.gather(
            extract_audio_metrics(file_path, transcript),
            analyze_transcript(
                transcript=transcript,
                job_role=payload.job_role,
                experience_level=payload.experience_level
            )
        )

        # Step 4 — Build unified report
        report = build_report(
            session_id=payload.session_id,
            transcript=transcript,
            audio_metrics=audio_metrics,
            ai_scores=ai_scores,
            job_role=payload.job_role
        )

        save_report(payload.session_id, report)

        return AnalyzeResponse(
            session_id=payload.session_id,
            status="completed",
            summary=report.get("summary", {}),
            message="Analysis complete. Fetch full report from /api/dashboard/{session_id}"
        )

    except FileNotFoundError as e:
        if "ffmpeg" in str(e).lower() or "[winerror 2]" in str(e).lower():
            raise HTTPException(status_code=500, detail="FFmpeg is not installed or not in PATH. Required for processing video files.")
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        error_msg = str(e).lower()
        if "authentication" in error_msg or "api key" in error_msg or "401" in error_msg:
            raise HTTPException(status_code=401, detail="Invalid API Key. Please update your .env file with a valid GROQ_API_KEY.")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")