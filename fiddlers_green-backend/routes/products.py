"""
Public product catalog endpoint.
No authentication required — matches /health, /contact, /chat's existing
no-auth convention. Always restricted to is_active=True at the call site:
soft-deleted products are never exposed here, regardless of query params —
that restriction is enforced server-side, not left to the client.
"""
import logging
from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models.product import PublicProductResponse
from repositories.product import list_products

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/products", tags=["products"])


@router.get("", response_model=List[PublicProductResponse])
async def get_products(
    category: Optional[str] = Query(default=None),
    search: Optional[str] = Query(default=None),
    db: AsyncSession = Depends(get_db),
) -> list:
    """Returns active products, optionally filtered by category and/or name search."""
    return await list_products(db, category=category, search=search, is_active=True)
