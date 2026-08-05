"""
FastAPI dependency functions for authentication and authorization.
Stack these on protected routes — never on existing public routes.

Usage:
  @router.get("/admin/foo")
  async def foo(user: User = Depends(require_admin), db: AsyncSession = Depends(get_db)):
      ...
"""
import logging
from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from db_models.user import User
from repositories.user import get_user_by_email
from services.auth_service import decode_access_token

logger = logging.getLogger(__name__)

bearer_scheme = HTTPBearer(auto_error=True)


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(bearer_scheme)],
    db: AsyncSession = Depends(get_db),
) -> User:
    """
    Validates the Bearer token and returns the authenticated User.
    Raises HTTP 401 on any token error.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired token.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = decode_access_token(credentials.credentials)
        email: str = payload.get("sub", "")
        if not email:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = await get_user_by_email(db, email)
    if user is None or not user.is_active:
        raise credentials_exception
    return user


async def require_admin(user: User = Depends(get_current_user)) -> User:
    """Raises HTTP 403 if the authenticated user is not an admin."""
    if user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required.",
        )
    return user


async def require_customer(user: User = Depends(get_current_user)) -> User:
    """Raises HTTP 403 if the authenticated user is not a customer or admin."""
    if user.role not in ("customer", "admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Customer access required.",
        )
    return user
