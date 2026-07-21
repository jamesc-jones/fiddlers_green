from fastapi import APIRouter, HTTPException

from models.contact import ContactRequest, ContactResponse
from services.email_service import send_contact_email

router = APIRouter()


@router.post("/contact", response_model=ContactResponse)
async def contact(request: ContactRequest) -> ContactResponse:
    sent = await send_contact_email(request)
    if not sent:
        raise HTTPException(
            status_code=502,
            detail="Failed to send message. Please try again later.",
        )
    return ContactResponse(ok=True, detail="Message received. We'll be in touch soon.")
