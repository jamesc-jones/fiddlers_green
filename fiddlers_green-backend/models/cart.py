"""
Pydantic schemas for cart endpoints.
API contract — do not rename fields without a versioning plan.
"""
import uuid
from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, field_validator


class CartAddRequest(BaseModel):
    product_id: uuid.UUID
    quantity: int = 1

    @field_validator("quantity")
    @classmethod
    def quantity_positive(cls, v: int) -> int:
        if v < 1:
            raise ValueError("Quantity must be at least 1.")
        return v


class CartRemoveRequest(BaseModel):
    product_id: uuid.UUID


class CartUpdateRequest(BaseModel):
    product_id: uuid.UUID
    quantity: int

    @field_validator("quantity")
    @classmethod
    def quantity_non_negative(cls, v: int) -> int:
        if v < 0:
            raise ValueError("Quantity must be zero or greater.")
        return v


class CartItemResponse(BaseModel):
    id: uuid.UUID
    product_id: uuid.UUID
    product_name: str
    product_category: str
    product_price: Optional[Decimal] = None
    quantity: int
    added_at: datetime

    model_config = {"from_attributes": True}

    @classmethod
    def from_cart_item(cls, item) -> "CartItemResponse":
        """
        Built from a CartItem with its `.product` relationship eager-loaded
        (see repositories/cart.py's get_cart) — model_validate() alone can't
        flatten a nested relationship into differently-named fields, so this
        reads item.product.* explicitly instead.
        """
        return cls(
            id=item.id,
            product_id=item.product_id,
            product_name=item.product.name,
            product_category=item.product.category,
            product_price=item.product.price,
            quantity=item.quantity,
            added_at=item.added_at,
        )


class CartResponse(BaseModel):
    items: list[CartItemResponse]
    total_items: int  # sum of all quantities across all line items
    total_price: Optional[Decimal] = None  # None if any line item has no price set

    @classmethod
    def from_items(cls, items: list) -> "CartResponse":
        responses = [CartItemResponse.from_cart_item(i) for i in items]
        total_price = None
        if responses and all(r.product_price is not None for r in responses):
            total_price = sum(r.product_price * r.quantity for r in responses)
        return cls(
            items=responses,
            total_items=sum(i.quantity for i in items),
            total_price=total_price,
        )
