from fastapi import APIRouter, HTTPException
from models.schemas import EmailRequest, EmailResponse
from services.email_service import send_report_email
from utils.file_handler import load_report

router = APIRouter()

@router.post("/send", response_model=EmailResponse)
async def email_report(payload: EmailRequest):
    """Send the interview analysis report to a specified email address."""
    report = load_report(payload.session_id)
    if not report:
        raise HTTPException(
            status_code=404,
            detail="Report not found. Please run analysis first."
        )

    success = await send_report_email(
        to_email=payload.to_email,
        candidate_name=payload.candidate_name,
        report=report,
        session_id=payload.session_id
    )

    if not success:
        raise HTTPException(status_code=500, detail="Failed to send email. Check SMTP config.")

    return EmailResponse(
        success=True,
        message=f"Report successfully sent to {payload.to_email}"
    )