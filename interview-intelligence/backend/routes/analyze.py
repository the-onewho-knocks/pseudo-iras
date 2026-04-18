from fastapi import APIRouter, HTTPException
from models.schemas import AnalyzeRequest, AnalyzeResponse
from services.transcription import transcribe_audio
from services.analyzer import analyze_transcript
from services.audio_metrics import extract_audio_metrics
from services.emotion_detector import detect_emotions
from services.report import build_report
from utils.file_handler import get_upload_path, save_report
import os

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

    # Step 1 — Transcription
    transcript = await transcribe_audio(file_path)
    if not transcript:
        raise HTTPException(status_code=500, detail="Transcription failed.")

    # Step 2 — Audio Metrics (filler words, pace, pauses)
    audio_metrics = await extract_audio_metrics(file_path, transcript)

    # Step 3 — Emotion Detection
    emotions = await detect_emotions(file_path)

    # Step 4 — AI Scoring via Gemini
    ai_scores = await analyze_transcript(
        transcript=transcript,
        job_role=payload.job_role,
        experience_level=payload.experience_level
    )

    # Step 5 — Build unified report
    report = build_report(
        session_id=payload.session_id,
        transcript=transcript,
        audio_metrics=audio_metrics,
        emotions=emotions,
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