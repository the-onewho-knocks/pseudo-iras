import os
import json
import asyncio
import google.generativeai as genai

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-1.5-pro")

SYSTEM_PROMPT = """
You are an expert ATS (Applicant Tracking System) and career advisor.
Analyze the resume content against the job role and return ONLY valid JSON with no markdown fences:
{
  "match_score": <0-100>,
  "matched_skills": ["skill1", "skill2"],
  "missing_skills": ["skill3", "skill4"],
  "experience_alignment": "<strong|moderate|weak>",
  "education_relevance": "<high|medium|low>",
  "recommendations": ["Tip 1", "Tip 2", "Tip 3"],
  "summary": "<2-3 sentence assessment>"
}
"""


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
    model = genai.GenerativeModel(
        model_name=GEMINI_MODEL,
        generation_config=genai.GenerationConfig(temperature=0.2, max_output_tokens=1000)
    )
    response = model.generate_content(full_prompt)
    raw = response.text.strip().replace("```json", "").replace("```", "").strip()
    return json.loads(raw)