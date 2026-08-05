# DB model registry — import all models here so Alembic can discover them
from .contact import ContactSubmission   # noqa: F401
from .product import Product             # noqa: F401
from .user import User                   # noqa: F401
from .cart import CartItem  # noqa: F401
