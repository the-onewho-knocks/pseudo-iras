import os
import json
import asyncio
from groq import Groq
import time

API_KEY = os.getenv("GROQ_API_KEY")
client = Groq(api_key=API_KEY) if API_KEY else None
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

SCORING_DIMENSIONS = [
    "communication_clarity", "technical_knowledge", "problem_solving",
    "confidence", "cultural_fit", "leadership_potential",
    "conciseness", "relevance_of_answers"
]

SYSTEM_PROMPT = """
You are an expert interview coach and talent evaluator.
Analyze the provided interview transcript and critically evaluate the candidate's performance across communication, technical knowledge, problem solving, confidence, cultural fit, leadership potential, conciseness, and relevance of answers.
Provide constructive strengths, weaknesses, and improvement tips. Finally, give an overall score (1-100) and indicate if they are recommended for the role.

CRITICAL JSON CONTRACT:
1. Keep all text fields (strengths, weaknesses, improvement_tips, summary) VERY CONCISE (1 short phrase or sentence max).
2. You MUST return ONLY a valid JSON object matching this exact structure:
{
  "scores": {
    "communication_clarity": int,
    "technical_knowledge": int,
    "problem_solving": int,
    "confidence": int,
    "cultural_fit": int,
    "leadership_potential": int,
    "conciseness": int,
    "relevance_of_answers": int
  },
  "overall_score": int,
  "strengths": ["string"],
  "weaknesses": ["string"],
  "improvement_tips": ["string"],
  "summary": "string",
  "recommended_for_role": boolean
}
3. Do NOT use markdown code blocks or extra conversational text.
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
    msg = [{"role": "system", "content": SYSTEM_PROMPT}, {"role": "user", "content": user_prompt}]
    return await asyncio.to_thread(_call_groq, msg, 0.3, 2000)


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
    msg = [{"role": "system", "content": prompt}]
    raw = await asyncio.to_thread(_call_groq_raw, msg, 0.5, 600)
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

def _call_groq(messages: list[dict], temperature: float = 0.3, max_tokens: int = 2000) -> dict:
    if not client:
        raise RuntimeError("GROQ_API_KEY is missing or invalid.")
    
    last_err = None
    for attempt in range(3):
        try:
            response = client.chat.completions.create(
                model=GROQ_MODEL,
                messages=messages,
                temperature=temperature + (attempt * 0.1),
                max_tokens=max_tokens,
                response_format={"type": "json_object"}
            )
            raw = response.choices[0].message.content.strip()
            return json.loads(raw)
            
        except Exception as e:
            last_err = e
            raw_preview = response.choices[0].message.content[:200] if 'response' in locals() and hasattr(response, "choices") else ""
            print(f"JSON Parse Error on attempt {attempt+1}: {e}. Raw response preview: {raw_preview}")
            if "429" in str(e):
                raise RuntimeError(f"Groq API Rate Limit Exceeded: {e}")
            time.sleep(1) # Backoff before retry
            continue
            
    raise ValueError(f"Groq returned completely invalid JSON after attempts: {last_err}")


def _call_groq_raw(messages: list[dict], temperature: float = 0.5, max_tokens: int = 600) -> str:
    if not client:
        raise RuntimeError("GROQ_API_KEY is missing or invalid.")
        
    response = client.chat.completions.create(
        model=GROQ_MODEL,
        messages=messages,
        temperature=temperature,
        max_tokens=max_tokens,
    )
    return response.choices[0].message.content.strip()