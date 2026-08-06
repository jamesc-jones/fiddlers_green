"""
Admin-only product management endpoints.
All routes require a valid admin JWT (enforced via Depends(require_admin)).
The frontend's /catalog page reads from data/products.ts (static file) and is
not affected by any changes made through these endpoints.
"""
import uuid
import logging
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from db_models.user import User
from dependencies.auth import require_admin
from models.product import ProductCreateRequest, ProductResponse, ProductUpdateRequest
from repositories.product import (
    create_product,
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
    _admin: User = Depends(require_admin),
):
    try:
        return await create_product(db, **request.model_dump())
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))


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
    _admin: User = Depends(require_admin),
):
    product = await get_product_by_id(db, product_id)
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found.")
    try:
        return await update_product(db, product, **request.model_dump(exclude_unset=True))
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))


@router.delete("/products/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product_route(
    product_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
) -> None:
    product = await get_product_by_id(db, product_id)
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found.")
    await soft_delete_product(db, product)
