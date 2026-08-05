"""
Pydantic schemas for cart endpoints.
API contract — do not rename fields without a versioning plan.
"""
import uuid
from datetime import datetime

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


class CartItemResponse(BaseModel):
    id: uuid.UUID
    product_id: uuid.UUID
    quantity: int
    added_at: datetime

    model_config = {"from_attributes": True}


class CartResponse(BaseModel):
    items: list[CartItemResponse]
    total_items: int  # sum of all quantities across all line items

    @classmethod
    def from_items(cls, items: list) -> "CartResponse":
        return cls(
            items=[CartItemResponse.model_validate(i) for i in items],
            total_items=sum(i.quantity for i in items),
        )
