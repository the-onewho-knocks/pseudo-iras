from fastapi import APIRouter, HTTPException
from models.schemas import ReportResponse
from utils.file_handler import load_report, list_sessions, delete_session_files
from services.report import format_report_for_display

router = APIRouter()


@router.get("/", )
async def list_all_sessions():
    """List all available sessions with basic metadata."""
    sessions = list_sessions()
    return {"sessions": sessions, "count": len(sessions)}


@router.get("/{session_id}", response_model=ReportResponse)
async def get_report(session_id: str):
    """Fetch the full analysis report for a given session."""
    report = load_report(session_id)
    if not report:
        raise HTTPException(
            status_code=404,
            detail="Report not found. Please run /api/analyze first."
        )
    return ReportResponse(
        session_id=session_id,
        report=format_report_for_display(report)
    )


@router.delete("/{session_id}")
async def delete_session(session_id: str):
    """Delete a session's uploaded file and report from disk."""
    deleted = delete_session_files(session_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Session not found.")
    return {"message": f"Session {session_id} deleted successfully."}