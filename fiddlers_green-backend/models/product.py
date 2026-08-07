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
product, so this is invisible to every other category). As of Phase
16.3 it also includes `image_url` and `product_type`, since the
frontend catalog now renders directly from this response instead of a
static file.
"""
import uuid
from decimal import Decimal
from typing import Literal, Optional

from pydantic import BaseModel, Field, field_validator

# Phase 16.3 — "backend-owned categories": previously `category` was any
# free-text string, with the frontend's static data file as the only
# real source of truth for what categories existed. Now that the
# frontend reads categories from this API, an unvalidated free-text
# value could silently create a product no page ever queries for (or
# worse, a case-variant of an existing one — exactly what happened with
# two pre-existing rows using "Flower" instead of "flower", found during
# the Phase 16.3 audit and fixed via a data migration).
KNOWN_CATEGORIES = {"flower", "hash", "gummies"}


def _validate_optional_text(v: Optional[str], label: str, max_length: int) -> Optional[str]:
    # Shared shape for every optional staff-facing text field (sku,
    # image_url, product_type): optional, but if provided must be a real
    # value (not blank/whitespace) within the column's actual width.
    if v is None:
        return v
    if not v.strip():
        raise ValueError(f"{label} cannot be blank.")
    if len(v) > max_length:
        raise ValueError(f"{label} must be {max_length} characters or fewer.")
    return v


def _validate_sku(v: Optional[str]) -> Optional[str]:
    return _validate_optional_text(v, "SKU", 64)


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


def _validate_category(v: str) -> str:
    v = _validate_non_blank(v, "Category")
    normalized = v.strip().lower()
    if normalized not in KNOWN_CATEGORIES:
        raise ValueError(
            f"Category must be one of {sorted(KNOWN_CATEGORIES)}; got {v!r}."
        )
    return normalized


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
    # Added in Phase 16.3. image_url is optional at the API layer — if
    # omitted, repositories/product.py fills a category-based placeholder
    # so a product is never created with no image at all.
    image_url: Optional[str] = Field(default=None, max_length=500)
    product_type: Optional[str] = Field(default=None, max_length=100)

    @field_validator("name")
    @classmethod
    def name_not_blank(cls, v: str) -> str:
        return _validate_non_blank(v, "Name")

    @field_validator("category")
    @classmethod
    def category_known(cls, v: str) -> str:
        return _validate_category(v)

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

    @field_validator("image_url")
    @classmethod
    def image_url_valid_if_provided(cls, v: Optional[str]) -> Optional[str]:
        return _validate_optional_text(v, "Image URL", 500)

    @field_validator("product_type")
    @classmethod
    def product_type_valid_if_provided(cls, v: Optional[str]) -> Optional[str]:
        return _validate_optional_text(v, "Product type", 100)


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
    image_url: Optional[str] = Field(default=None, max_length=500)
    product_type: Optional[str] = Field(default=None, max_length=100)

    @field_validator("name")
    @classmethod
    def name_not_blank_if_provided(cls, v: Optional[str]) -> Optional[str]:
        # Only runs when "name" is actually present in the request body
        # (same omitted-vs-provided distinction used for price/sku below) —
        # an update that doesn't touch name is unaffected.
        return _validate_non_blank(v, "Name") if v is not None else v

    @field_validator("category")
    @classmethod
    def category_known_if_provided(cls, v: Optional[str]) -> Optional[str]:
        return _validate_category(v) if v is not None else v

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

    @field_validator("image_url")
    @classmethod
    def image_url_valid_if_provided(cls, v: Optional[str]) -> Optional[str]:
        return _validate_optional_text(v, "Image URL", 500)

    @field_validator("product_type")
    @classmethod
    def product_type_valid_if_provided(cls, v: Optional[str]) -> Optional[str]:
        return _validate_optional_text(v, "Product type", 100)


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
    image_url: Optional[str] = None
    product_type: Optional[str] = None

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
    image_url: Optional[str] = None
    product_type: Optional[str] = None

    model_config = {"from_attributes": True}


class WeightVariantCreateRequest(BaseModel):
    """
    Phase 16.3.1 — creates 5 Product rows (one per weight in
    repositories.product.WEIGHT_VARIANTS) for a single Flower/Hash base
    product, with prices derived deterministically from price_per_gram.
    No manual per-variant price entry — see repositories/product.py's
    create_weight_variant_products() for the derivation.
    """
    name: str = Field(max_length=255)
    category: Literal["flower", "hash"]
    description: Optional[str] = None
    price_per_gram: Decimal

    @field_validator("name")
    @classmethod
    def name_not_blank(cls, v: str) -> str:
        return _validate_non_blank(v, "Name")

    @field_validator("price_per_gram")
    @classmethod
    def price_per_gram_must_be_positive(cls, v: Decimal) -> Decimal:
        if v <= 0:
            raise ValueError("Price per gram must be greater than zero.")
        return v
