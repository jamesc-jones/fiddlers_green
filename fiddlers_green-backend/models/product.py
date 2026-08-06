"""
Pydantic schemas for product endpoints.

Admin-facing schemas (ProductCreateRequest, ProductUpdateRequest, ProductResponse)
were moved here from routes/admin.py for consistency with every other route's
schema location (models/auth.py, models/cart.py, models/chat.py, models/contact.py) —
field names and behavior are unchanged, this is a structural move only.

PublicProductResponse is new in Phase 16 — the customer-facing shape returned
by GET /products. It intentionally omits the legacy `pricing` display
string, but as of Phase 16.2 it includes `dosage` and `variant_option`:
the gummy configurator resolves a (entry, strength) selection to a
Product by matching these two fields client-side, so the public endpoint
must expose them (they're just NULL for every non-gummy-configuration
product, so this is invisible to every other category).
"""
import uuid
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel


class ProductCreateRequest(BaseModel):
    name: str
    category: str
    description: Optional[str] = None
    dosage: Optional[str] = None
    pricing: Optional[str] = None
    price: Optional[Decimal] = None
    variant_option: Optional[str] = None


class ProductUpdateRequest(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    dosage: Optional[str] = None
    pricing: Optional[str] = None
    price: Optional[Decimal] = None
    is_active: Optional[bool] = None
    variant_option: Optional[str] = None


class ProductResponse(BaseModel):
    id: uuid.UUID
    name: str
    category: str
    description: Optional[str]
    dosage: Optional[str]
    pricing: Optional[str]
    price: Optional[Decimal]
    is_active: bool
    variant_option: Optional[str] = None

    model_config = {"from_attributes": True}


class PublicProductResponse(BaseModel):
    id: uuid.UUID
    name: str
    category: str
    description: Optional[str] = None
    price: Optional[Decimal] = None
    is_active: bool
    dosage: Optional[str] = None
    variant_option: Optional[str] = None

    model_config = {"from_attributes": True}
