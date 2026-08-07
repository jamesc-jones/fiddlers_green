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

from pydantic import BaseModel, Field, field_validator


def _validate_sku(v: Optional[str]) -> Optional[str]:
    # Shared by create/update: sku is optional, but if provided it must be
    # a real value (not blank/whitespace) within a sane length — purely a
    # staff-facing label, never used for lookups, so no uniqueness check.
    if v is None:
        return v
    if not v.strip():
        raise ValueError("SKU cannot be blank.")
    if len(v) > 64:
        raise ValueError("SKU must be 64 characters or fewer.")
    return v


def _validate_non_blank(v: str, label: str) -> str:
    # Phase 17: the DB column allows any non-NULL string, including "" or
    # whitespace-only — nothing previously stopped a blank name/category
    # from being written. max_length is enforced separately via Field to
    # match the actual DB column width (name/category are VARCHAR, not
    # unbounded Text), so an overlong value fails cleanly here with a 422
    # instead of as an unhandled DB-level "value too long" error.
    if not v.strip():
        raise ValueError(f"{label} cannot be blank.")
    return v


class ProductCreateRequest(BaseModel):
    name: str = Field(max_length=255)
    category: str = Field(max_length=100)
    description: Optional[str] = None
    dosage: Optional[str] = Field(default=None, max_length=100)
    pricing: Optional[str] = Field(default=None, max_length=100)
    # Required as of Phase 17: the cart does arithmetic on this field, not
    # on `pricing` (a legacy display string). Making it optional previously
    # let products be created with a price shown to admins but never
    # actually usable by the cart — see the Phase 17 product price
    # integrity fix for the incident this caused.
    price: Decimal
    variant_option: Optional[str] = Field(default=None, max_length=50)
    # Added in Phase 17 — optional staff-facing identifier, distinct from
    # and never a substitute for product.id (the UUID cart/DB relationships
    # actually use). See _validate_sku above.
    sku: Optional[str] = None

    @field_validator("name")
    @classmethod
    def name_not_blank(cls, v: str) -> str:
        return _validate_non_blank(v, "Name")

    @field_validator("category")
    @classmethod
    def category_not_blank(cls, v: str) -> str:
        return _validate_non_blank(v, "Category")

    @field_validator("price")
    @classmethod
    def price_must_be_positive(cls, v: Decimal) -> Decimal:
        if v <= 0:
            raise ValueError("Price must be greater than zero.")
        return v

    @field_validator("sku")
    @classmethod
    def sku_valid_if_provided(cls, v: Optional[str]) -> Optional[str]:
        return _validate_sku(v)


class ProductUpdateRequest(BaseModel):
    name: Optional[str] = Field(default=None, max_length=255)
    category: Optional[str] = Field(default=None, max_length=100)
    description: Optional[str] = None
    dosage: Optional[str] = Field(default=None, max_length=100)
    pricing: Optional[str] = Field(default=None, max_length=100)
    price: Optional[Decimal] = None
    is_active: Optional[bool] = None
    variant_option: Optional[str] = Field(default=None, max_length=50)
    sku: Optional[str] = None

    @field_validator("name")
    @classmethod
    def name_not_blank_if_provided(cls, v: Optional[str]) -> Optional[str]:
        # Only runs when "name" is actually present in the request body
        # (same omitted-vs-provided distinction used for price/sku below) —
        # an update that doesn't touch name is unaffected.
        return _validate_non_blank(v, "Name") if v is not None else v

    @field_validator("category")
    @classmethod
    def category_not_blank_if_provided(cls, v: Optional[str]) -> Optional[str]:
        return _validate_non_blank(v, "Category") if v is not None else v

    @field_validator("price")
    @classmethod
    def price_must_be_positive_if_provided(cls, v: Optional[Decimal]) -> Decimal:
        # This only runs when the client includes "price" in the request
        # body at all (Pydantic skips validators for omitted fields, which
        # is what preserves "leave price unchanged" semantics on a partial
        # update). So this rejects an explicit null or non-positive price
        # without breaking the ability to update a product without
        # touching its price.
        if v is None or v <= 0:
            raise ValueError("Price must be greater than zero.")
        return v

    @field_validator("sku")
    @classmethod
    def sku_valid_if_provided(cls, v: Optional[str]) -> Optional[str]:
        # Unlike price, sku is allowed to be explicitly cleared back to
        # null (it's optional by design, not a required field like price) —
        # only a non-null value is validated for blankness/length.
        return _validate_sku(v)


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
    sku: Optional[str] = None

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
