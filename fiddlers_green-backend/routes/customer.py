"""
Customer-facing authenticated endpoints.
All routes require a valid customer or admin JWT.
"""
import logging
from typing import List

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from db_models.user import User
from dependencies.auth import require_customer
from models.auth import UserResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/customer", tags=["customer"])


class OrderResponse(BaseModel):
    """
    Scaffold only — order history is not implemented yet.
    Returns an empty list until the orders feature is built.
    Shape is locked so the frontend can be wired safely now.
    """
    id: str
    status: str
    created_at: str


@router.get("/me", response_model=UserResponse)
async def get_my_profile(current_user: User = Depends(require_customer)) -> User:
    """Returns the authenticated customer's profile."""
    return current_user


@router.get("/orders", response_model=List[OrderResponse])
async def get_my_orders(current_user: User = Depends(require_customer)) -> list:
    """
    Returns the customer's order history.
    Currently scaffolded — always returns an empty list.
    """
    logger.debug("Order history requested for user: %s", current_user.email)
    return []
