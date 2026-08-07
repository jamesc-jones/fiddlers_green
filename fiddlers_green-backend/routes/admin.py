"""
Admin-only product management endpoints.
All routes require a valid admin JWT (enforced via Depends(require_admin)).
As of Phase 16.3, the frontend's /catalog page reads live from GET /products
(the public route backed by this same Product table) instead of a static
file, so changes made through these endpoints are now directly reflected
in the storefront.
"""
import uuid
import logging
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from db_models.user import User
from dependencies.auth import require_admin
from models.product import (
    ProductCreateRequest,
    ProductResponse,
    ProductUpdateRequest,
    WeightVariantCreateRequest,
)
from repositories.product import (
    create_product,
    create_weight_variant_products,
    get_product_by_id,
    list_products,
    soft_delete_product,
    update_product,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/admin", tags=["admin"])


@router.post("/products", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
async def create_product_route(
    request: ProductCreateRequest,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    try:
        product = await create_product(db, **request.model_dump())
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))
    # Coverage gap (Phase 17 Step 4): repositories/product.py already logs
    # that a product was created, but not who created it — admin identity
    # is only available here at the route layer, not in the repository.
    logger.info("Admin action: admin=%s action=create_product product_id=%s", admin.email, product.id)
    return product


@router.get("/products", response_model=List[ProductResponse])
async def list_products_route(
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    return await list_products(db)


@router.put("/products/{product_id}", response_model=ProductResponse)
async def update_product_route(
    product_id: uuid.UUID,
    request: ProductUpdateRequest,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    product = await get_product_by_id(db, product_id)
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found.")
    try:
        updated = await update_product(db, product, **request.model_dump(exclude_unset=True))
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))
    logger.info("Admin action: admin=%s action=update_product product_id=%s", admin.email, product_id)
    return updated


@router.post(
    "/products/weight-variants",
    response_model=List[ProductResponse],
    status_code=status.HTTP_201_CREATED,
)
async def create_weight_variants_route(
    request: WeightVariantCreateRequest,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """
    Phase 16.3.1. Creates 5 Product rows (1g/3.5g/7g/14g/28g) for a single
    Flower/Hash base product, priced from request.price_per_gram. See
    repositories/product.py's create_weight_variant_products() and the
    WEIGHT_VARIANTS constant for the derivation and column-role convention.
    """
    try:
        products = await create_weight_variant_products(db, **request.model_dump())
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))
    logger.info(
        "Admin action: admin=%s action=create_weight_variants base_name=%s category=%s count=%d",
        admin.email, request.name, request.category, len(products),
    )
    return products


@router.delete("/products/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product_route(
    product_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
) -> None:
    product = await get_product_by_id(db, product_id)
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found.")
    await soft_delete_product(db, product)
    logger.info("Admin action: admin=%s action=deactivate_product product_id=%s", admin.email, product_id)
