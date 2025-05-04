import os
from dotenv import load_dotenv
from resend import Resend

# Load environment variables
load_dotenv()

# Initialize Resend with API key from .env
resend_api_key = os.getenv("RESEND_API_KEY")
resend = Resend(api_key=resend_api_key)

class EmailService:
    @staticmethod
    async def send_email(to: str, subject: str, html_content: str, from_email: str = "noreply@formflow.com"):
        """
        Send an email using Resend API
        
        Args:
            to (str): Recipient email address
            subject (str): Email subject
            html_content (str): HTML content of the email
            from_email (str, optional): Sender email. Defaults to "noreply@formflow.com".
            
        Returns:
            dict: Response from Resend API
        """
        try:
            params = {
                "from": from_email,
                "to": to,
                "subject": subject,
                "html": html_content,
            }
            
            response = resend.emails.send(params)
            return response
        except Exception as e:
            # Log the error and return it
            print(f"Error sending email: {str(e)}")
            return {"error": str(e)} 