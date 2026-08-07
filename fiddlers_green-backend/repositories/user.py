"""
Data access layer for User model.
"""
import uuid
import logging
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from db_models.user import User
from services.auth_service import hash_password

logger = logging.getLogger(__name__)


async def get_user_by_email(session: AsyncSession, email: str) -> Optional[User]:
    result = await session.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()


async def get_user_by_id(session: AsyncSession, user_id: uuid.UUID) -> Optional[User]:
    result = await session.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()


async def create_user(
    session: AsyncSession,
    email: str,
    plain_password: str,
    role: str = "customer",
) -> User:
    """
    Creates a new user. Raises ValueError if email already exists.
    Password is hashed before storage — plain_password is never persisted.
    """
    existing = await get_user_by_email(session, email)
    if existing:
        raise ValueError(f"A user with email {email!r} already exists.")

    user = User(
        email=email,
        password_hash=await hash_password(plain_password),
        role=role,
    )
    session.add(user)
    await session.commit()
    # Phase 17 perf: no refresh() — same reasoning as repositories/product.py
    # and repositories/cart.py (expire_on_commit=False + Python-side
    # defaults only; every User column here is either client-supplied or
    # one of those defaults, confirmed by the same testing approach).
    logger.info("User created: id=%s email=%s role=%s", user.id, email, role)
    return user
