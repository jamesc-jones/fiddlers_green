"""
Shopping cart endpoints — all require authentication.
Customers and admins can both access and modify their own cart.
Cart ownership is enforced by the token: user_id comes from the verified
JWT, never from the request body, so cross-user access is impossible.
"""
import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from db_models.user import User
from dependencies.auth import require_customer
from models.cart import CartAddRequest, CartRemoveRequest, CartResponse
from repositories.cart import add_to_cart, get_cart, remove_from_cart

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/cart", tags=["cart"])


@router.get("", response_model=CartResponse)
async def view_cart(
    current_user: User = Depends(require_customer),
    db: AsyncSession = Depends(get_db),
) -> CartResponse:
    """Returns the authenticated user's current cart."""
    items = await get_cart(session=db, user_id=current_user.id)
    return CartResponse.from_items(items)


@router.post("/add", response_model=CartResponse, status_code=status.HTTP_200_OK)
async def add_item(
    request: CartAddRequest,
    current_user: User = Depends(require_customer),
    db: AsyncSession = Depends(get_db),
) -> CartResponse:
    """
    Adds a product to the cart, or increments quantity if already present.
    Returns the updated full cart.
    """
    try:
        await add_to_cart(
            session=db,
            user_id=current_user.id,
            product_id=request.product_id,
            quantity=request.quantity,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    items = await get_cart(session=db, user_id=current_user.id)
    return CartResponse.from_items(items)


@router.delete("/remove", response_model=CartResponse)
async def remove_item(
    request: CartRemoveRequest,
    current_user: User = Depends(require_customer),
    db: AsyncSession = Depends(get_db),
) -> CartResponse:
    """
    Removes a product from the cart entirely, regardless of quantity.
    Idempotent — removing an item not in the cart returns the unchanged cart.
    """
    await remove_from_cart(
        session=db,
        user_id=current_user.id,
        product_id=request.product_id,
    )
    items = await get_cart(session=db, user_id=current_user.id)
    return CartResponse.from_items(items)
