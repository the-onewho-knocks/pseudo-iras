import os
import json
import aiofiles
from fastapi import UploadFile

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "uploads")
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "outputs")
RESUME_DIR = os.path.join(UPLOAD_DIR, "resumes")

for _dir in (UPLOAD_DIR, OUTPUT_DIR, RESUME_DIR):
    os.makedirs(_dir, exist_ok=True)

_session_index: dict[str, str] = {}


async def save_upload(file: UploadFile, session_id: str) -> str:
    ext = os.path.splitext(file.filename)[-1].lower()
    file_path = os.path.join(UPLOAD_DIR, f"{session_id}{ext}")
    async with aiofiles.open(file_path, "wb") as out:
        await out.write(await file.read())
    _session_index[session_id] = file_path
    return file_path


async def save_resume(file: UploadFile, resume_id: str) -> str:
    ext = os.path.splitext(file.filename)[-1].lower()
    file_path = os.path.join(RESUME_DIR, f"{resume_id}{ext}")
    async with aiofiles.open(file_path, "wb") as out:
        await out.write(await file.read())
    return file_path


def get_upload_path(session_id: str) -> str | None:
    if session_id in _session_index:
        return _session_index[session_id]
    for fname in os.listdir(UPLOAD_DIR):
        if fname.startswith(session_id):
            full_path = os.path.join(UPLOAD_DIR, fname)
            _session_index[session_id] = full_path
            return full_path
    return None


def save_report(session_id: str, report: dict) -> str:
    path = os.path.join(OUTPUT_DIR, f"{session_id}.json")
    with open(path, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2, ensure_ascii=False)
    return path


def load_report(session_id: str) -> dict | None:
    path = os.path.join(OUTPUT_DIR, f"{session_id}.json")
    if not os.path.exists(path):
        return None
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def list_sessions() -> list[dict]:
    """List all sessions that have saved reports."""
    sessions = []
    for fname in os.listdir(OUTPUT_DIR):
        if not fname.endswith(".json"):
            continue
        session_id = fname[:-5]
        path = os.path.join(OUTPUT_DIR, fname)
        try:
            with open(path, "r", encoding="utf-8") as f:
                data = json.load(f)
            sessions.append({
                "session_id":    session_id,
                "generated_at":  data.get("generated_at"),
                "job_role":      data.get("job_role"),
                "overall_score": data.get("overall_score"),
            })
        except Exception:
            sessions.append({"session_id": session_id})
    return sessions


def delete_session_files(session_id: str) -> bool:
    deleted = False
    upload_path = get_upload_path(session_id)
    if upload_path and os.path.exists(upload_path):
        os.remove(upload_path)
        deleted = True
    report_path = os.path.join(OUTPUT_DIR, f"{session_id}.json")
    if os.path.exists(report_path):
        os.remove(report_path)
        deleted = True
    _session_index.pop(session_id, None)
    return deleted