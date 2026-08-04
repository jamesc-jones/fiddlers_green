"""
Data access layer for ContactSubmission.
All DB interaction for the /contact route goes through this module.
"""
import logging
from sqlalchemy.ext.asyncio import AsyncSession

from db_models.contact import ContactSubmission

logger = logging.getLogger(__name__)


async def save_contact_submission(
    session: AsyncSession,
    name: str,
    email: str,
    message: str,
    inquiry_type: str,
) -> ContactSubmission:
    """
    Persists a contact form submission.
    Raises on DB error — caller is responsible for handling.
    """
    submission = ContactSubmission(
        name=name,
        email=email,
        message=message,
        inquiry_type=inquiry_type,
    )
    session.add(submission)
    await session.commit()
    await session.refresh(submission)
    logger.info("ContactSubmission saved: id=%s email=%s", submission.id, email)
    return submission
