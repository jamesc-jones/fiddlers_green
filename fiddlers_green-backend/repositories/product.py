"""
Data access layer for Product.
All product DB operations go through this module — no raw SQL in routes.
Used by both the admin router (full CRUD, sees inactive products too) and
the public products router (read-only, active products only).
"""
import uuid
import logging
from decimal import Decimal
from typing import List, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from db_models.product import Product

logger = logging.getLogger(__name__)

# Phase 16.3 — category-based placeholder images, reusing the existing
# per-category SVGs from public/images/catalog/ (Phase 11) rather than
# introducing new assets. Used only when a product is created without an
# explicit image_url.
_CATEGORY_PLACEHOLDER_IMAGES = {
    "flower": "/images/catalog/flower.svg",
    "hash": "/images/catalog/hash.svg",
    "gummies": "/images/catalog/gummies.svg",
}


def _default_image_url(category: str) -> Optional[str]:
    return _CATEGORY_PLACEHOLDER_IMAGES.get(category)


# Phase 16.3.1 — weight-based variants for Flower/Hash. Reuses the same
# (variant_option, dosage) column pair the Phase 16.2 gummy configurator
# uses, but with the roles reversed: here `dosage` holds the base product
# name (the group key) and `variant_option` holds the weight key (varies
# within the group). Same columns, same partial unique index, no schema
# change — see _check_variant_conflict below, which now guards both uses.
# (key, display suffix, grams)
WEIGHT_VARIANTS: list[tuple[str, str, Decimal]] = [
    ("g", "1g", Decimal("1")),
    ("hq", "3.5g", Decimal("3.5")),
    ("q", "7g", Decimal("7")),
    ("half_oz", "14g", Decimal("14")),
    ("oz", "28g", Decimal("28")),
]


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


async def _check_variant_conflict(
    session: AsyncSession,
    *,
    variant_option: Optional[str],
    dosage: Optional[str],
    exclude_id: Optional[uuid.UUID] = None,
) -> None:
    """
    Phase 16.2 (gummy configurations) and Phase 16.3.1 (Flower/Hash weight
    variants) both rely on (variant_option, dosage) resolving to exactly
    one Product — see WEIGHT_VARIANTS above for the reversed column roles
    used by weight variants. This mirrors the partial unique index on the
    same two columns (see the Phase 16.2 migration) so a conflict is
    caught here, before the DB constraint would raise a raw
    IntegrityError, giving the caller a clear 409 instead. Only runs when
    both fields are actually set — every product outside these two
    variant schemes leaves both NULL and is never checked.
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
            f"A product with variant_option={variant_option!r} and "
            f"dosage={dosage!r} already exists (id={existing.id})."
        )


async def create_product(session: AsyncSession, **fields) -> Product:
    await _check_variant_conflict(
        session,
        variant_option=fields.get("variant_option"),
        dosage=fields.get("dosage"),
    )
    if not fields.get("image_url"):
        fields["image_url"] = _default_image_url(fields.get("category", ""))
    product = Product(**fields)
    session.add(product)
    await session.commit()
    # Phase 17 perf: no refresh() — database.py's session factory sets
    # expire_on_commit=False, and every Product column is either
    # client-supplied (already in memory) or a Python-side `default`
    # (id, is_active, created_at, updated_at), which SQLAlchemy populates
    # on the in-memory object at flush time regardless — confirmed by
    # direct testing. refresh() here was an extra DB round trip on every
    # admin product creation for values already correct without it.
    logger.info("Product created: id=%s name=%s", product.id, product.name)
    return product


async def update_product(session: AsyncSession, product: Product, **fields) -> Product:
    await _check_variant_conflict(
        session,
        variant_option=fields.get("variant_option", product.variant_option),
        dosage=fields.get("dosage", product.dosage),
        exclude_id=product.id,
    )
    for field, value in fields.items():
        setattr(product, field, value)
    await session.commit()
    # Phase 17 perf: no refresh() — see the matching comment in
    # create_product above. updated_at's `onupdate` callable is also
    # Python-side and populates on the in-memory object at flush time,
    # confirmed by direct testing.
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


async def create_weight_variant_products(
    session: AsyncSession,
    *,
    name: str,
    category: str,
    description: Optional[str],
    price_per_gram: Decimal,
) -> List[Product]:
    """
    Phase 16.3.1. Creates one Product row per entry in WEIGHT_VARIANTS for
    a single Flower/Hash base product. `dosage` holds the base name (the
    group key grouped on by the frontend's catalogGrouping helper);
    `variant_option` holds the weight key — the reverse of the Phase 16.2
    gummy convention, see the WEIGHT_VARIANTS comment above.

    All 5 conflict checks run before any row is created, so a conflict on
    (say) the 3rd weight leaves zero rows written — no partial variant
    sets for a base name that already partly exists.
    """
    for weight_key, _suffix, _grams in WEIGHT_VARIANTS:
        await _check_variant_conflict(
            session,
            variant_option=weight_key,
            dosage=name,
        )

    image_url = _default_image_url(category)
    products = [
        Product(
            name=f"{name} - {suffix}",
            category=category,
            description=description,
            dosage=name,
            price=(price_per_gram * grams).quantize(Decimal("0.01")),
            variant_option=weight_key,
            image_url=image_url,
        )
        for weight_key, suffix, grams in WEIGHT_VARIANTS
    ]
    session.add_all(products)
    await session.commit()
    logger.info(
        "Weight variants created: base_name=%s category=%s count=%d",
        name, category, len(products),
    )
    return products
