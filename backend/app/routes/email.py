from fastapi import APIRouter, HTTPException, Depends
from ..services.email_service import EmailService
from ..schemas.email import EmailSchema
from typing import Dict, Any

router = APIRouter(prefix="/api/email", tags=["Email"])

@router.post("/send", response_model=Dict[str, Any])
async def send_email(email_data: EmailSchema):
    """
    Endpoint to send an email
    """
    try:
        result = await EmailService.send_email(
            to=email_data.to,
            subject=email_data.subject,
            html_content=email_data.html_content,
            from_email=email_data.from_email if email_data.from_email else "noreply@formflow.com"
        )
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send email: {str(e)}") 