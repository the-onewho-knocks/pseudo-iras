import os
import json
import aiofiles
import datetime
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

    meta_path = os.path.join(UPLOAD_DIR, f"{session_id}_meta.json")
    meta_data = {
        "session_id": session_id,
        "filename": file.filename,
        "created_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "status": "pending"
    }
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(meta_data, f, ensure_ascii=False)

    return file_path


async def save_resume(file: UploadFile, resume_id: str) -> str:
    ext = os.path.splitext(file.filename)[-1].lower()
    file_path = os.path.join(RESUME_DIR, f"{resume_id}{ext}")
    async with aiofiles.open(file_path, "wb") as out:
        await out.write(await file.read())
    return file_path


def get_resume_path(resume_id: str) -> str | None:
    for fname in os.listdir(RESUME_DIR):
        if fname.startswith(resume_id):
            return os.path.join(RESUME_DIR, fname)
    return None

def get_upload_path(session_id: str) -> str | None:
    if session_id in _session_index:
        return _session_index[session_id]
    for fname in os.listdir(UPLOAD_DIR):
        if fname.startswith(session_id) and not fname.endswith("_meta.json"):
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
    """List all sessions by looking at metadata and reports."""
    sessions = {}
    
    for fname in os.listdir(UPLOAD_DIR):
        path = os.path.join(UPLOAD_DIR, fname)
        if fname.endswith("_meta.json"):
            session_id = fname.replace("_meta.json", "")
            try:
                with open(path, "r", encoding="utf-8") as f:
                    sessions[session_id] = json.load(f)
            except Exception:
                sessions[session_id] = {"session_id": session_id, "status": "pending"}
        elif not os.path.isdir(path) and not fname.endswith("_universal.mp3"):
            session_id = os.path.splitext(fname)[0]
            if session_id not in sessions:
                sessions[session_id] = {
                    "session_id": session_id,
                    "filename": fname,
                    "status": "pending",
                    "created_at": datetime.datetime.fromtimestamp(os.path.getmtime(path), datetime.timezone.utc).isoformat()
                }

    for fname in os.listdir(OUTPUT_DIR):
        if not fname.endswith(".json"):
            continue
        session_id = fname[:-5]
        path = os.path.join(OUTPUT_DIR, fname)
        if session_id not in sessions:
            sessions[session_id] = {"session_id": session_id, "status": "completed"}
        try:
            with open(path, "r", encoding="utf-8") as f:
                data = json.load(f)
            
            # Format duration nicely if possible
            duration_sec = data.get("audio_metrics", {}).get("duration_seconds")
            duration_str = None
            if duration_sec:
                mins = int(duration_sec // 60)
                secs = int(duration_sec % 60)
                duration_str = f"{mins:02d}:{secs:02d}"

            sessions[session_id].update({
                "status": "completed",
                "generated_at": data.get("generated_at"),
                "job_role": data.get("job_role"),
                "overall_score": data.get("overall_score"),
                "duration": duration_str or "—"
            })
        except Exception:
            sessions[session_id]["status"] = "failed"
            
    session_list = list(sessions.values())
    session_list.sort(key=lambda x: x.get("created_at") or x.get("generated_at") or "", reverse=True)
    return session_list


def delete_session_files(session_id: str) -> bool:
    deleted = False
    upload_path = get_upload_path(session_id)
    if upload_path and os.path.exists(upload_path):
        os.remove(upload_path)
        deleted = True
    meta_path = os.path.join(UPLOAD_DIR, f"{session_id}_meta.json")
    if os.path.exists(meta_path):
        os.remove(meta_path)
    report_path = os.path.join(OUTPUT_DIR, f"{session_id}.json")
    if os.path.exists(report_path):
        os.remove(report_path)
        deleted = True
    _session_index.pop(session_id, None)
    return deleted