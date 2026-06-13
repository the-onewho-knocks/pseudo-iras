import os
from dotenv import load_dotenv

load_dotenv(override=True)

groq_key = os.getenv("GROQ_API_KEY", "")
gemini_key = os.getenv("GEMINI_API_KEY", "")

print("Groq Key begins with:", groq_key[:4] if groq_key else "EMPTY")
print("Gemini Key begins with:", gemini_key[:4] if gemini_key else "EMPTY")

print("\n--- Testing Groq ---")
try:
    from groq import Groq
    client = Groq(api_key=groq_key)
    # Just try to list models to test auth
    client.models.list()
    print("✅ Groq API Key is VALID!")
except Exception as e:
    print("❌ Groq API Key INVALID:", type(e).__name__, str(e))

print("\n--- Testing Gemini ---")
try:
    import google.generativeai as genai
    genai.configure(api_key=gemini_key)
    # Try to list models
    list(genai.list_models())
    print("✅ Gemini API Key is VALID!")
except Exception as e:
    print("❌ Gemini API Key INVALID:", type(e).__name__, str(e))
