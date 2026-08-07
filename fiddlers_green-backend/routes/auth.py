"""
Authentication endpoints.
All new routes — no existing endpoint is modified.
"""
import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from db_models.user import User
from dependencies.auth import get_current_user
from models.auth import LoginRequest, RegisterRequest, TokenResponse, UserResponse
from repositories.user import create_user, get_user_by_email
from services.auth_service import DUMMY_PASSWORD_HASH, create_access_token, verify_password

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(request: RegisterRequest, db: AsyncSession = Depends(get_db)) -> User:
    """
    Register a new customer account.
    Returns the created user. Does NOT return a token — login separately.
    """
    try:
        user = await create_user(
            session=db,
            email=request.email,
            plain_password=request.password,
            role="customer",
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))
    return user


@router.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest, db: AsyncSession = Depends(get_db)) -> dict:
    """
    Authenticate and return a JWT access token.
    Works for both admin and customer accounts.
    """
    user = await get_user_by_email(db, request.email)
    # Security review (Phase 17): verify_password always runs, even when
    # no user matches — against DUMMY_PASSWORD_HASH in that case. Without
    # this, a nonexistent email short-circuited before the (deliberately
    # slow) bcrypt check ever ran, making "wrong password" (~0.35s) and
    # "no such account" (~0.01s) trivially distinguishable by response
    # time alone — confirmed by direct measurement — which lets an
    # attacker enumerate registered emails through this endpoint.
    password_hash = user.password_hash if user else DUMMY_PASSWORD_HASH
    password_valid = verify_password(request.password, password_hash)
    if user is None or not password_valid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated.",
        )
    token = create_access_token(subject=user.email, role=user.role)
    return {"access_token": token, "token_type": "bearer"}


@router.get("/me", response_model=UserResponse)
async def me(current_user: User = Depends(get_current_user)) -> User:
    """Returns the authenticated user's profile. Requires a valid Bearer token."""
    return current_user
