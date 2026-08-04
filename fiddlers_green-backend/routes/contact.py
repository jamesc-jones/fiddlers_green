from fastapi import APIRouter, HTTPException

import logging
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_db
from repositories.contact import save_contact_submission

from models.contact import ContactRequest, ContactResponse
from services.email_service import send_contact_email

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/contact", response_model=ContactResponse)
async def contact(request: ContactRequest, db: AsyncSession = Depends(get_db)) -> ContactResponse:
    sent = await send_contact_email(request)
    if not sent:
        raise HTTPException(
            status_code=502,
            detail="Failed to send message. Please try again later.",
        )

    # Persist to database — failure is logged, not surfaced to frontend
    try:
        await save_contact_submission(
            session=db,
            name=request.name,
            email=request.email,
            message=request.message,
            inquiry_type=request.inquiry_type or "general",
        )
    except Exception as db_err:
        logger.error("Failed to persist contact submission to DB: %s", db_err)

    return ContactResponse(ok=True, detail="Message received. We'll be in touch soon.")
