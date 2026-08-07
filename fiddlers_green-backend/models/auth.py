"""
Pydantic schemas for authentication endpoints.
These are API contracts — do not change field names without a migration plan.
"""
import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, EmailStr, Field, field_validator

# bcrypt (via passlib, see services/auth_service.py) only ever hashes the
# first 72 bytes of a password and silently ignores the rest — confirmed
# empirically during Phase 17 hardening: a password submitted at length 80
# was accepted at registration, then successfully authenticated using only
# its first 72 characters. Rejecting overlong passwords outright (rather
# than silently accepting a password that isn't fully honored) is the fix.
BCRYPT_MAX_PASSWORD_LENGTH = 72


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(max_length=BCRYPT_MAX_PASSWORD_LENGTH)

    @field_validator("password")
    @classmethod
    def password_min_length(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters.")
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    # No valid account can have a password longer than this post-fix, and
    # bounding it here also caps the payload size accepted on every login
    # attempt.
    password: str = Field(max_length=BCRYPT_MAX_PASSWORD_LENGTH)


class TokenResponse(BaseModel):
    access_token: str
    token_type: Literal["bearer"] = "bearer"


class UserResponse(BaseModel):
    id: uuid.UUID
    email: str
    role: str
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}
