from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from services.resume_matcher import match_resume_to_role
from utils.file_handler import save_resume, load_report
from models.schemas import ResumeMatchResponse
import uuid
import os

router = APIRouter()

@router.post("/upload-and-match", response_model=ResumeMatchResponse)
async def upload_and_match_resume(
    file: UploadFile = File(...),
    job_role: str = Form(...),
    job_description: str = Form(default="")
):
    """Upload a resume (PDF/DOCX) and match it against a target job role."""
    allowed_types = {".pdf", ".docx", ".doc", ".txt"}
    ext = os.path.splitext(file.filename)[-1].lower()
    if ext not in allowed_types:
        raise HTTPException(status_code=400, detail=f"Unsupported resume format: {ext}")

    resume_id = str(uuid.uuid4())
    resume_path = await save_resume(file, resume_id)

    result = await match_resume_to_role(
        resume_path=resume_path,
        job_role=job_role,
        job_description=job_description
    )

    return ResumeMatchResponse(
        resume_id=resume_id,
        job_role=job_role,
        match_score=result["match_score"],
        matched_skills=result["matched_skills"],
        missing_skills=result["missing_skills"],
        recommendations=result["recommendations"]
    )


from typing import Optional
from utils.file_handler import save_resume, load_report, get_resume_path

@router.post("/match-with-session")
async def match_resume_with_interview(
    session_id: str = Form(...),
    job_role: str = Form(...),
    resume_file: Optional[UploadFile] = File(None),
    resume_id: Optional[str] = Form(None)
):
    """Match a resume against both the job role and the interview transcript."""
    report = load_report(session_id)
    if not report:
        raise HTTPException(status_code=404, detail="Interview report not found for this session.")

    if resume_file:
        new_resume_id = str(uuid.uuid4())
        resume_path = await save_resume(resume_file, new_resume_id)
        active_resume_id = new_resume_id
    elif resume_id:
        resume_path = get_resume_path(resume_id)
        if not resume_path:
            raise HTTPException(status_code=404, detail="Resume not found.")
        active_resume_id = resume_id
    else:
        raise HTTPException(status_code=400, detail="Must provide either resume_file or resume_id.")

    transcript = report.get("transcript", "")
    result = await match_resume_to_role(
        resume_path=resume_path,
        job_role=job_role,
        transcript=transcript
    )

    return {
        "session_id": session_id,
        "resume_id": active_resume_id,
        "job_role": job_role,
        "resume_interview_alignment": result
    }