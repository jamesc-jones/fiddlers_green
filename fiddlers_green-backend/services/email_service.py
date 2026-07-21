import asyncio
import os
import smtplib
from email.message import EmailMessage

from models.contact import ContactRequest


def _send_contact_email_sync(contact: ContactRequest) -> bool:
    try:
        smtp_host = os.getenv("SMTP_HOST")
        smtp_port = int(os.getenv("SMTP_PORT") or "587")
        smtp_user = os.getenv("SMTP_USER")
        smtp_password = os.getenv("SMTP_PASSWORD")
        smtp_from = os.getenv("SMTP_FROM")
        email_to = os.getenv("EMAIL_TO")

        message = EmailMessage()
        message["Subject"] = f"New contact form message from {contact.name}"
        message["From"] = smtp_from
        message["To"] = email_to
        message["Reply-To"] = contact.email

        body_lines = [f"Name: {contact.name}", f"Email: {contact.email}"]
        if contact.inquiry_type:
            body_lines.append(f"Inquiry type: {contact.inquiry_type}")
        body_lines.append("")
        body_lines.append(contact.message)
        message.set_content("\n".join(body_lines))

        with smtplib.SMTP(smtp_host, smtp_port) as server:
            server.starttls()
            server.login(smtp_user, smtp_password)
            server.send_message(message)
        return True
    except Exception as error:
        print(f"Failed to send contact email: {error}")
        return False


async def send_contact_email(contact: ContactRequest) -> bool:
    return await asyncio.to_thread(_send_contact_email_sync, contact)
