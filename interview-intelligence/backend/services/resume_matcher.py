import os
import json
import asyncio
from google import genai
from google.genai import types
from pydantic import BaseModel

API_KEY = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=API_KEY) if API_KEY and API_KEY != "dummy" else None
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-1.5-pro")

SYSTEM_PROMPT = """
You are an expert ATS (Applicant Tracking System) and career advisor.
Analyze the candidate's resume content against the expected job role.
Determine matched skills, missing skills, experience alignment, education relevance, and provide actionable recommendations. Finally, give a match score from 0-100 and a brief summary.
"""

class ResumeMatch(BaseModel):
    match_score: int
    matched_skills: list[str]
    missing_skills: list[str]
    experience_alignment: str
    education_relevance: str
    recommendations: list[str]
    summary: str


async def match_resume_to_role(
    resume_path: str,
    job_role: str,
    job_description: str = "",
    transcript: str = ""
) -> dict:
    """Match a resume file against a job role using Gemini AI."""
    resume_text = await asyncio.to_thread(_extract_resume_text, resume_path)

    if not resume_text.strip():
        return {
            "match_score": 0,
            "matched_skills": [],
            "missing_skills": [],
            "recommendations": ["Could not extract text from resume file."],
            "summary": "Resume parsing failed."
        }

    user_prompt = f"""
Job Role: {job_role}
Job Description: {job_description or "Not provided"}

Resume Content:
\"\"\"
{resume_text[:4000]}
\"\"\"
"""
    if transcript:
        user_prompt += f"\nInterview Transcript (for holistic alignment):\n\"\"\"\n{transcript[:2000]}\n\"\"\""

    return await asyncio.to_thread(_call_gemini, SYSTEM_PROMPT + "\n\n" + user_prompt)


def _extract_resume_text(resume_path: str) -> str:
    ext = os.path.splitext(resume_path)[-1].lower()
    if ext == ".pdf":
        return _extract_pdf(resume_path)
    elif ext in (".docx", ".doc"):
        return _extract_docx(resume_path)
    elif ext == ".txt":
        with open(resume_path, "r", encoding="utf-8", errors="ignore") as f:
            return f.read()
    return ""


def _extract_pdf(path: str) -> str:
    try:
        import pdfplumber
        with pdfplumber.open(path) as pdf:
            return "\n".join(page.extract_text() or "" for page in pdf.pages)
    except Exception as e:
        return f"PDF extraction error: {e}"


def _extract_docx(path: str) -> str:
    try:
        import docx
        doc = docx.Document(path)
        return "\n".join(p.text for p in doc.paragraphs)
    except Exception as e:
        return f"DOCX extraction error: {e}"


def _call_gemini(full_prompt: str) -> dict:
    if not client:
        raise RuntimeError("GEMINI_API_KEY is missing or invalid.")
    
    response = client.models.generate_content(
        model=GEMINI_MODEL,
        contents=full_prompt,
        config=types.GenerateContentConfig(
            temperature=0.2,
            max_output_tokens=1000,
            response_mime_type="application/json",
            response_schema=ResumeMatch,
        )
    )
    raw = response.text.strip().replace("```json", "").replace("```", "").strip()
    
    try:
        return json.loads(raw)
    except json.JSONDecodeError as e:
        import ast
        try:
            return ast.literal_eval(raw)
        except:
            raise ValueError(f"Gemini schema generation failed: {e}")