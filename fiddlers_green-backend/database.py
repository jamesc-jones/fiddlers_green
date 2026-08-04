"""
Async SQLAlchemy engine and session factory.
Import Base into model files; import get_db into route files.
"""
import os
import logging
from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

logger = logging.getLogger(__name__)

DATABASE_URL = os.getenv("DATABASE_URL", "")

if not DATABASE_URL:
    logger.warning(
        "DATABASE_URL is not set. Database features will be unavailable. "
        "Set DATABASE_URL in your .env file to enable them."
    )

engine = create_async_engine(
    DATABASE_URL,
    echo=False,          # Set to True temporarily if you need to debug SQL
    pool_pre_ping=True,  # Detect stale connections before use
    pool_size=5,
    max_overflow=10,
) if DATABASE_URL else None

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
    autocommit=False,
) if engine else None


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    FastAPI dependency: yields an AsyncSession and closes it when the request ends.
    If the database is not configured, raises a 503.
    """
    if AsyncSessionLocal is None:
        from fastapi import HTTPException
        raise HTTPException(status_code=503, detail="Database not configured.")
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
