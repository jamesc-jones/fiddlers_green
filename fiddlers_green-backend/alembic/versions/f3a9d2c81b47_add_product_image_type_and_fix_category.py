"""add_product_image_type_and_fix_category_casing

Phase 16.3 — backend-driven catalog rendering. Adds image_url and
product_type columns (mirroring dosage's nullable-String shape), backfills
them for existing rows, and fixes a pre-existing data bug found during the
Phase 16.3 audit: two rows ("Pink Kush", "White Widow") were created with
category="Flower" instead of "flower". This was harmless while category was
just a display label, but becomes a functional bug once category is a live
filter key for GET /products?category=flower and the frontend's
/catalog/flower route — those rows would silently disappear from the page.

Revision ID: f3a9d2c81b47
Revises: 24792483e658
Create Date: 2026-08-07 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f3a9d2c81b47'
down_revision: Union[str, None] = '24792483e658'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


# name -> product_type, for the 11 real catalog products that previously
# only lived in the frontend's static data/products.ts. Exact-name match
# only — admin/QA test-artifact rows created during Phase 17 testing
# (e.g. "Deactivate Test", "Playwright Test Gummy") do not match anything
# here and are correctly left with product_type=NULL.
_PRODUCT_TYPE_BACKFILL = {
    "Cedar Haze": "Sativa",
    "Turtle Island": "Hybrid",
    "Midnight Water": "Indica",
    "Longhouse Gold": "Hybrid",
    "River Stone": "Full-Melt",
    "Black Ash": "Dry-Sift",
    "Amber Line": "Bubble Hash",
    "Sweetgrass": "10mg THC",
    "Wild Berry": "10mg THC",
    "Stillwater": "5mg THC / 5mg CBD",
    "Maple Ember": "10mg THC",
}

_CATEGORY_IMAGE_BACKFILL = {
    "flower": "/images/catalog/flower.svg",
    "hash": "/images/catalog/hash.svg",
    "gummies": "/images/catalog/gummies.svg",
}


def upgrade() -> None:
    op.add_column('products', sa.Column('image_url', sa.String(length=500), nullable=True))
    op.add_column('products', sa.Column('product_type', sa.String(length=100), nullable=True))

    # Fix the "Flower" vs "flower" casing bug first, so the image backfill
    # below (keyed on the now-normalized lowercase category) reaches every
    # row in one pass.
    op.execute("UPDATE products SET category = 'flower' WHERE category = 'Flower'")

    products = sa.table(
        'products',
        sa.column('name', sa.String),
        sa.column('category', sa.String),
        sa.column('image_url', sa.String),
        sa.column('product_type', sa.String),
    )

    for category, image_url in _CATEGORY_IMAGE_BACKFILL.items():
        op.execute(
            products.update()
            .where(products.c.category == category)
            .where(products.c.image_url.is_(None))
            .values(image_url=image_url)
        )

    for name, product_type in _PRODUCT_TYPE_BACKFILL.items():
        op.execute(
            products.update()
            .where(products.c.name == name)
            .where(products.c.product_type.is_(None))
            .values(product_type=product_type)
        )


def downgrade() -> None:
    # The category-casing fix is a data correction, not reversed here —
    # consistent with this project's existing convention of not reversing
    # data-integrity fixes on downgrade (see the Phase 17 price-integrity
    # backfill for precedent).
    op.drop_column('products', 'product_type')
    op.drop_column('products', 'image_url')
