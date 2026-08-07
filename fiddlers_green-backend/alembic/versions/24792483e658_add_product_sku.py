"""add_product_sku

Revision ID: 24792483e658
Revises: 12f3c8355604
Create Date: 2026-08-07 08:15:53.998385

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '24792483e658'
down_revision: Union[str, None] = '12f3c8355604'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('products', sa.Column('sku', sa.String(length=64), nullable=True))


def downgrade() -> None:
    op.drop_column('products', 'sku')
