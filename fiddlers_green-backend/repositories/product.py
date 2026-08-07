"""
Data access layer for Product.
All product DB operations go through this module — no raw SQL in routes.
Used by both the admin router (full CRUD, sees inactive products too) and
the public products router (read-only, active products only).
"""
import uuid
import logging
from typing import List, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from db_models.product import Product

logger = logging.getLogger(__name__)


async def list_products(
    session: AsyncSession,
    *,
    category: Optional[str] = None,
    search: Optional[str] = None,
    is_active: Optional[bool] = None,
) -> List[Product]:
    """
    Returns products ordered by name.
    is_active=None (the admin default) returns both active and inactive rows —
    soft-deleted products remain visible to admins. Callers that must never
    expose inactive products (the public /products route) pass is_active=True
    explicitly; it is not something a caller of this function can leave to a
    client-supplied value without deciding to.
    """
    query = select(Product)
    if is_active is not None:
        query = query.where(Product.is_active == is_active)
    if category:
        query = query.where(Product.category == category)
    if search:
        query = query.where(Product.name.ilike(f"%{search}%"))
    result = await session.execute(query.order_by(Product.name))
    return list(result.scalars().all())


async def get_product_by_id(session: AsyncSession, product_id: uuid.UUID) -> Optional[Product]:
    return await session.get(Product, product_id)


async def _check_gummy_variant_conflict(
    session: AsyncSession,
    *,
    variant_option: Optional[str],
    dosage: Optional[str],
    exclude_id: Optional[uuid.UUID] = None,
) -> None:
    """
    Phase 16.2: a gummy configuration (variant_option + dosage) must
    resolve to exactly one Product. This mirrors the partial unique index
    on the same two columns (see the Phase 16.2 migration) so a conflict
    is caught here, before the DB constraint would raise a raw
    IntegrityError, giving the admin a clear 409 instead. Only runs when
    both fields are actually set — every non-gummy-configuration product
    (Flowers, Hash, named Gummies) leaves both NULL and is never checked.
    """
    if not variant_option or not dosage:
        return
    query = select(Product).where(
        Product.variant_option == variant_option,
        Product.dosage == dosage,
        Product.is_active.is_(True),
    )
    if exclude_id is not None:
        query = query.where(Product.id != exclude_id)
    existing = (await session.execute(query)).scalars().first()
    if existing is not None:
        raise ValueError(
            f"A gummy product with variant_option={variant_option!r} and "
            f"dosage={dosage!r} already exists (id={existing.id})."
        )


async def create_product(session: AsyncSession, **fields) -> Product:
    await _check_gummy_variant_conflict(
        session,
        variant_option=fields.get("variant_option"),
        dosage=fields.get("dosage"),
    )
    product = Product(**fields)
    session.add(product)
    await session.commit()
    await session.refresh(product)
    logger.info("Product created: id=%s name=%s", product.id, product.name)
    return product


async def update_product(session: AsyncSession, product: Product, **fields) -> Product:
    await _check_gummy_variant_conflict(
        session,
        variant_option=fields.get("variant_option", product.variant_option),
        dosage=fields.get("dosage", product.dosage),
        exclude_id=product.id,
    )
    for field, value in fields.items():
        setattr(product, field, value)
    await session.commit()
    await session.refresh(product)
    # Phase 17: this repository previously had no log line at all for
    # updates (create/soft-delete did). Logs field *names* only, never
    # values — some fields (description) can be long, and this is enough
    # to answer "what changed" without duplicating the DB row in logs.
    logger.info("Product updated: id=%s fields=%s", product.id, list(fields.keys()))
    return product


async def soft_delete_product(session: AsyncSession, product: Product) -> None:
    """Sets is_active=False. Record is never hard-deleted."""
    product.is_active = False
    await session.commit()
    logger.info("Product soft-deleted: id=%s name=%s", product.id, product.name)
