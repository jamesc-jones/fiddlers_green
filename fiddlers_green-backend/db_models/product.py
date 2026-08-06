"""
Product catalog — scaffolded for Phase 15 admin CRUD.
Not yet read by the frontend (which uses data/products.ts).
"""
import uuid
from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import Boolean, DateTime, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


class Product(Base):
    __tablename__ = "products"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    category: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    dosage: Mapped[str | None] = mapped_column(String(100), nullable=True)
    pricing: Mapped[str | None] = mapped_column(String(100), nullable=True)
    # Added in Phase 16 — numeric price for arithmetic (cart subtotals/totals).
    # `pricing` (above) is untouched: existing display-string data is preserved,
    # and this column is nullable so it's a purely additive migration.
    price: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
    cart_items = relationship("CartItem", back_populates="product", cascade="all, delete-orphan")
