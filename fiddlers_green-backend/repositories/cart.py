"""
Data access layer for CartItem.
All cart DB operations go through this module — no raw SQL in routes.

Rules enforced here:
  - quantity must be >= 1 (validated before write)
  - adding an item already in the cart increments its quantity
  - removing an item not in the cart is a silent no-op (idempotent)
"""
import uuid
import logging
from typing import List, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from db_models.cart import CartItem
from db_models.product import Product

logger = logging.getLogger(__name__)


async def get_cart(session: AsyncSession, user_id: uuid.UUID) -> List[CartItem]:
    """
    Returns all active cart items for a user, ordered by time added.
    Eager-loads the related Product (selectinload) so callers building a
    response with product name/category/price don't trigger an N+1 —
    one query for cart_items, one batched query for all related products.
    """
    result = await session.execute(
        select(CartItem)
        .options(selectinload(CartItem.product))
        .where(CartItem.user_id == user_id)
        .order_by(CartItem.added_at)
    )
    return list(result.scalars().all())


async def add_to_cart(
    session: AsyncSession,
    user_id: uuid.UUID,
    product_id: uuid.UUID,
    quantity: int = 1,
) -> CartItem:
    """
    Adds a product to the cart. If the product is already present,
    increments quantity rather than inserting a duplicate row.
    Raises ValueError if the product does not exist, is inactive, or quantity < 1.
    """
    if quantity < 1:
        raise ValueError("Quantity must be at least 1.")

    # Verify the product exists and is active
    product = await session.get(Product, product_id)
    if product is None or not product.is_active:
        raise ValueError(f"Product {product_id} not found or is unavailable.")

    # Check for an existing row for this user + product pair
    result = await session.execute(
        select(CartItem).where(
            CartItem.user_id == user_id,
            CartItem.product_id == product_id,
        )
    )
    existing = result.scalar_one_or_none()

    if existing:
        existing.quantity += quantity
        await session.commit()
        # Phase 17 perf: no refresh() — the session factory is configured
        # with expire_on_commit=False (database.py), and every column here
        # is either already in memory (quantity, set above) or a
        # Python-side default populated at flush time (id, added_at) —
        # confirmed by direct testing. The caller (routes/cart.py) also
        # never uses this return value; it re-fetches the whole cart
        # separately regardless, so refresh() was a pure wasted round
        # trip on every single cart mutation.
        logger.info(
            "Cart item quantity updated: user=%s product=%s new_qty=%s",
            user_id, product_id, existing.quantity,
        )
        return existing

    item = CartItem(user_id=user_id, product_id=product_id, quantity=quantity)
    session.add(item)
    await session.commit()
    logger.info("Cart item added: user=%s product=%s qty=%s", user_id, product_id, quantity)
    return item


async def set_cart_item_quantity(
    session: AsyncSession,
    user_id: uuid.UUID,
    product_id: uuid.UUID,
    quantity: int,
) -> Optional[CartItem]:
    """
    Sets a cart item's quantity to an absolute value.

    Caller (the route, via CartUpdateRequest's Pydantic validator)
    guarantees quantity >= 0 before this is ever invoked — this function
    does not re-validate that, unlike add_to_cart's defense-in-depth
    check. The only failure this function can raise is "item not in
    cart," so the route's ValueError -> 404 mapping is unambiguous.

    quantity == 0 removes the item entirely — never writes a 0 row, so
    the DB's quantity >= 1 CHECK constraint is never at risk.
    """
    result = await session.execute(
        select(CartItem).where(
            CartItem.user_id == user_id,
            CartItem.product_id == product_id,
        )
    )
    item = result.scalar_one_or_none()
    if item is None:
        raise ValueError(f"Product {product_id} is not in the cart.")

    if quantity == 0:
        await session.delete(item)
        await session.commit()
        logger.info("Cart item removed via set_cart_item_quantity: user=%s product=%s", user_id, product_id)
        return None

    item.quantity = quantity
    await session.commit()
    # See the matching comment in add_to_cart above — refresh() here was
    # equally unnecessary and equally unused by the caller.
    logger.info("Cart item quantity set: user=%s product=%s qty=%s", user_id, product_id, quantity)
    return item


async def remove_from_cart(
    session: AsyncSession,
    user_id: uuid.UUID,
    product_id: uuid.UUID,
) -> bool:
    """
    Removes a product from the cart entirely (regardless of quantity).
    Returns True if a row was deleted, False if it was not present.
    """
    result = await session.execute(
        select(CartItem).where(
            CartItem.user_id == user_id,
            CartItem.product_id == product_id,
        )
    )
    item = result.scalar_one_or_none()
    if item is None:
        return False
    await session.delete(item)
    await session.commit()
    logger.info("Cart item removed: user=%s product=%s", user_id, product_id)
    return True
