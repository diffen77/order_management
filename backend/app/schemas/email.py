from pydantic import BaseModel, Field

class EmailSchema(BaseModel):
    """
    Schema for sending emails
    """
    to: str = Field(..., description="Recipient email address")
    subject: str = Field(..., description="Email subject")
    html_content: str = Field(..., description="HTML content of the email")
    from_email: str = None 