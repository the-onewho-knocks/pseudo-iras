from dotenv import load_dotenv

load_dotenv(override=True)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from routes import upload, analyze, dashboard, email, resume

app = FastAPI(
    title="Interview Intelligence API",
    description="AI-powered interview analysis platform",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload.router,    prefix="/api/upload",    tags=["Upload"])
app.include_router(analyze.router,   prefix="/api/analyze",   tags=["Analyze"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["Dashboard"])
app.include_router(email.router,     prefix="/api/email",     tags=["Email"])
app.include_router(resume.router,    prefix="/api/resume",    tags=["Resume"])

@app.get("/")
def root():
    return {"message": "Interview Intelligence API is running 🚀"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)