"""add_gummy_variant_option

Revision ID: 12f3c8355604
Revises: 57161dcec088
Create Date: 2026-08-06 18:18:38.162586

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '12f3c8355604'
down_revision: Union[str, None] = '57161dcec088'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('products', sa.Column('variant_option', sa.String(length=50), nullable=True))
    # Partial index: only applies when both columns are set, so Flowers,
    # Hash, and named-Gummies rows (variant_option always NULL for them)
    # are completely unaffected. Guarantees a gummy (entry, strength)
    # selection can never resolve to more than one Product.
    op.create_index(
        'ix_products_gummy_variant_unique',
        'products',
        ['variant_option', 'dosage'],
        unique=True,
        postgresql_where=sa.text('variant_option IS NOT NULL AND dosage IS NOT NULL'),
    )


def downgrade() -> None:
    op.drop_index('ix_products_gummy_variant_unique', table_name='products')
    op.drop_column('products', 'variant_option')
