import os
import json
import asyncio
import google.generativeai as genai

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-1.5-pro")

SCORING_DIMENSIONS = [
    "communication_clarity", "technical_knowledge", "problem_solving",
    "confidence", "cultural_fit", "leadership_potential",
    "conciseness", "relevance_of_answers"
]

SYSTEM_PROMPT = """
You are an expert interview coach and talent evaluator.
Analyze the provided interview transcript and return a structured JSON evaluation.

Return ONLY valid JSON with no markdown fences, in this exact format:
{
  "scores": {
    "communication_clarity": <1-10>,
    "technical_knowledge": <1-10>,
    "problem_solving": <1-10>,
    "confidence": <1-10>,
    "cultural_fit": <1-10>,
    "leadership_potential": <1-10>,
    "conciseness": <1-10>,
    "relevance_of_answers": <1-10>
  },
  "overall_score": <1-100>,
  "strengths": ["..."],
  "weaknesses": ["..."],
  "improvement_tips": ["..."],
  "summary": "<2-3 sentence overall assessment>",
  "recommended_for_role": <true|false>
}
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
    return await asyncio.to_thread(_call_gemini, SYSTEM_PROMPT + "\n\n" + user_prompt, 0.3, 1500)


async def generate_follow_up_questions(transcript: str, job_role: str) -> list[str]:
    """Generate targeted follow-up questions based on weak areas."""
    prompt = f"""
Based on this interview transcript for the role of {job_role},
generate 5 targeted follow-up questions that probe areas where the candidate was weak or vague.
Return ONLY a JSON array of question strings, no markdown fences.

Transcript:
\"\"\"{transcript}\"\"\"
"""
    raw = await asyncio.to_thread(_call_gemini_raw, prompt, 0.5, 600)
    try:
        return json.loads(raw)
    except Exception:
        return [raw]


def _call_gemini(full_prompt: str, temperature: float = 0.3, max_tokens: int = 1500) -> dict:
    model = genai.GenerativeModel(
        model_name=GEMINI_MODEL,
        generation_config=genai.GenerationConfig(
            temperature=temperature,
            max_output_tokens=max_tokens,
        )
    )
    response = model.generate_content(full_prompt)
    raw = response.text.strip().replace("```json", "").replace("```", "").strip()
    return json.loads(raw)


def _call_gemini_raw(prompt: str, temperature: float = 0.5, max_tokens: int = 600) -> str:
    model = genai.GenerativeModel(
        model_name=GEMINI_MODEL,
        generation_config=genai.GenerationConfig(
            temperature=temperature,
            max_output_tokens=max_tokens,
        )
    )
    return model.generate_content(prompt).text.strip()