"""
Authentication utilities: password hashing and JWT management.
This module has no FastAPI dependencies — it is a pure service layer.
"""
import os
import logging
from datetime import datetime, timedelta, timezone
from typing import Optional

from jose import JWTError, jwt
from passlib.context import CryptContext

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Configuration — read from environment
# ---------------------------------------------------------------------------
JWT_SECRET: str = os.getenv("JWT_SECRET", "")
JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = int(
    os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", "60")
)

if not JWT_SECRET:
    logger.warning(
        "JWT_SECRET is not set. Authentication will not work. "
        "Set JWT_SECRET in your .env file."
    )

# ---------------------------------------------------------------------------
# Password hashing
# ---------------------------------------------------------------------------
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Phase 17 security review: a static, valid bcrypt hash with no real
# corresponding password. routes/auth.py's login() verifies against this
# when the email doesn't match any user, so that a nonexistent-email
# request costs the same bcrypt-verify time as a wrong-password request —
# confirmed via live timing measurement that without this, the two cases
# were trivially distinguishable (~0.01s vs ~0.35s), letting an attacker
# enumerate registered emails through /auth/login alone.
DUMMY_PASSWORD_HASH = "$2b$12$GteYqS03rECwrp4VuXwzbewByUZE4flo3Khh5cvcj2GkOmWs/9R7a"


def hash_password(plain_password: str) -> str:
    return pwd_context.hash(plain_password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


# ---------------------------------------------------------------------------
# JWT
# ---------------------------------------------------------------------------
def create_access_token(
    subject: str,
    role: str,
    expires_delta: Optional[timedelta] = None,
) -> str:
    """
    Creates a signed JWT.
    subject: typically the user's email or UUID string.
    role: 'admin' or 'customer'.
    """
    if not JWT_SECRET:
        raise RuntimeError("JWT_SECRET is not configured.")
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    payload = {
        "sub": subject,
        "role": role,
        "exp": expire,
        "iss": "fiddlers-green",
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_access_token(token: str) -> dict:
    """
    Decodes and validates a JWT.
    Raises JWTError on invalid or expired tokens — caller handles this.
    """
    if not JWT_SECRET:
        raise RuntimeError("JWT_SECRET is not configured.")
    return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
