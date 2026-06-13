from pydantic import BaseModel, EmailStr, Field
from typing import Any, Optional


# ─── Upload ───────────────────────────────────────────────────────────────────

class UploadResponse(BaseModel):
    session_id: str
    filename:   str
    file_path:  str
    message:    str


# ─── Analyze ──────────────────────────────────────────────────────────────────

class AnalyzeRequest(BaseModel):
    session_id:       str
    job_role:         str = Field(default="Software Engineer")
    experience_level: str = Field(default="mid", description="junior | mid | senior | lead")

class AnalyzeResponse(BaseModel):
    session_id: str
    status:     str
    summary:    dict[str, Any]
    message:    str


# ─── Dashboard / Report ───────────────────────────────────────────────────────

class ReportResponse(BaseModel):
    session_id: str
    report:     dict[str, Any]


# ─── Email ────────────────────────────────────────────────────────────────────

class EmailRequest(BaseModel):
    session_id:     str
    to_email:       EmailStr
    candidate_name: Optional[str] = "Candidate"

class EmailResponse(BaseModel):
    success: bool
    message: str


# ─── Resume ───────────────────────────────────────────────────────────────────

class ResumeMatchResponse(BaseModel):
    resume_id:        str
    job_role:         str
    match_score:      float
    matched_skills:   list[str]
    missing_skills:   list[str]
    recommendations:  list[str]


# ─── Shared / Internal ────────────────────────────────────────────────────────

class AudioMetrics(BaseModel):
    word_count:           int
    sentence_count:       int
    speech_pace_wpm:      float
    duration_seconds:     float
    filler_word_analysis: dict[str, Any]
    vocabulary_diversity: dict[str, Any]
    pause_analysis:       dict[str, Any]

class AIScores(BaseModel):
    scores:               dict[str, float]
    overall_score:        int
    strengths:            list[str]
    weaknesses:           list[str]
    improvement_tips:     list[str]
    summary:              str
    recommended_for_role: bool

class EmotionProfile(BaseModel):
    primary_emotion:           str
    energy_level:              Optional[str]
    overall_confidence_signal: Optional[str]