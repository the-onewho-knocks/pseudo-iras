import os
import json
import asyncio
from google import genai
from google.genai import types

API_KEY = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=API_KEY) if API_KEY and API_KEY != "dummy" else None
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-1.5-pro")

SCORING_DIMENSIONS = [
    "communication_clarity", "technical_knowledge", "problem_solving",
    "confidence", "cultural_fit", "leadership_potential",
    "conciseness", "relevance_of_answers"
]

SYSTEM_PROMPT = """
You are an expert interview coach and talent evaluator.
Analyze the provided interview transcript and critically evaluate the candidate's performance across communication, technical knowledge, problem solving, confidence, cultural fit, leadership potential, conciseness, and relevance of answers.
Provide constructive strengths, weaknesses, and improvement tips. Finally, give an overall score (1-100) and indicate if they are recommended for the role.

CRITICAL: 
1. Keep all text fields (strengths, weaknesses, improvement_tips, summary) VERY CONCISE (1-2 short sentences max each).
2. You MUST return ONLY a raw JSON object string. Do not use markdown code blocks like ```json.
3. Completely ESCAPE any double-quotes inside your text fields using a backslash (\"), or simply use single quotes for inner quotes. Never leave unescaped double quotes inside JSON values.
"""


async def analyze_transcript(
    transcript: str,
    job_role: str = "Software Engineer",
    experience_level: str = "mid"
) -> dict:
    """Send the transcript to Gemini for structured scoring."""
    user_prompt = f"""
Job Role: {job_role}
Experience Level: {experience_level}

Interview Transcript:
\"\"\"
{transcript}
\"\"\"

Evaluate this candidate thoroughly based on the transcript above.
"""
    return await asyncio.to_thread(_call_gemini, SYSTEM_PROMPT + "\n\n" + user_prompt, 0.3, 2000)


async def generate_follow_up_questions(transcript: str, job_role: str) -> list[str]:
    """Generate targeted follow-up questions based on weak areas."""
    prompt = f"""
Based on this interview transcript for the role of {job_role},
generate 5 targeted follow-up questions that probe areas where the candidate was weak or vague.
Keep the questions extremely concise and short.
Return ONLY a raw JSON array of 5 question strings, no markdown fences.

Transcript:
\"\"\"{transcript}\"\"\"
"""
    raw = await asyncio.to_thread(_call_gemini_raw, prompt, 0.5, 600)
    raw = raw.replace("```json", "").replace("```", "").strip()
    
    try:
        if "[" in raw and "]" in raw:
            raw = raw[raw.find("["):raw.rfind("]")+1]
        return json.loads(raw)
    except Exception:
        import ast
        import re
        try:
            cleaned = re.sub(r'\btrue\b', 'True', raw)
            cleaned = re.sub(r'\bfalse\b', 'False', cleaned)
            cleaned = re.sub(r'\bnull\b', 'None', cleaned)
            return ast.literal_eval(cleaned)
        except Exception:
            return [raw]


from pydantic import BaseModel

class Scores(BaseModel):
    communication_clarity: int
    technical_knowledge: int
    problem_solving: int
    confidence: int
    cultural_fit: int
    leadership_potential: int
    conciseness: int
    relevance_of_answers: int

class InterviewEvaluation(BaseModel):
    scores: Scores
    overall_score: int
    strengths: list[str]
    weaknesses: list[str]
    improvement_tips: list[str]
    summary: str
    recommended_for_role: bool

def _call_gemini(full_prompt: str, temperature: float = 0.3, max_tokens: int = 2000) -> dict:
    if not client:
        raise RuntimeError("GEMINI_API_KEY is missing or invalid.")
    
    response = client.models.generate_content(
        model=GEMINI_MODEL,
        contents=full_prompt,
        config=types.GenerateContentConfig(
            temperature=temperature,
            max_output_tokens=max_tokens,
            response_mime_type="application/json",
            response_schema=InterviewEvaluation,
        )
    )
    if hasattr(response, "parsed") and response.parsed is not None:
        return response.parsed.model_dump() if hasattr(response.parsed, "model_dump") else dict(response.parsed)

    raw = response.text.strip().replace("```json", "").replace("```", "").strip()
    
    try:
        if "{" in raw and "}" in raw:
            raw = raw[raw.find("{"):raw.rfind("}")+1]
        return json.loads(raw)
    except json.JSONDecodeError as e:
        print(f"JSON Parse Error: {e}. Raw response: {raw}")
        # Extreme fallback if Gemini still decides to hallucinate syntax
        import ast
        import re
        try:
            cleaned = re.sub(r'\btrue\b', 'True', raw)
            cleaned = re.sub(r'\bfalse\b', 'False', cleaned)
            cleaned = re.sub(r'\bnull\b', 'None', cleaned)
            return ast.literal_eval(cleaned)
        except Exception:
            raise ValueError(f"Gemini returned completely invalid JSON: {e}")


def _call_gemini_raw(prompt: str, temperature: float = 0.5, max_tokens: int = 600) -> str:
    if not client:
        raise RuntimeError("GEMINI_API_KEY is missing or invalid.")
        
    response = client.models.generate_content(
        model=GEMINI_MODEL,
        contents=prompt,
        config=types.GenerateContentConfig(
            temperature=temperature,
            max_output_tokens=max_tokens,
        )
    )
    return response.text.strip()