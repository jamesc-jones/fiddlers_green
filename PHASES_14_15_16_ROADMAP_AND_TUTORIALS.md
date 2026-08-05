# Fiddler's Green — Phases 14–16: Roadmap & Claude CLI Implementation Tutorials

> **Status of existing phases:** Phases 1–13 complete and validated. Phase 16 (Product Catalog Integration) is not started.
> This document covers the application-development phases — Database Integration, Authentication & RBAC, and Product Catalog Integration — and provides step-by-step Claude CLI tutorials for Phases 14 and 15. The production-focused phases that follow (Final Production Polish + QA, and VPS Deployment) have moved to [`PHASES_17_18_ROADMAP_AND_TUTORIALS.md`](./PHASES_17_18_ROADMAP_AND_TUTORIALS.md).
> Phase 15.1 (Frontend Authentication UI Integration) is documented separately in `PHASE_15_1_AUTH_UI_INTEGRATION.md`, not in this file.

---

## ⚠️ GLOBAL NON-NEGOTIABLE CONSTRAINT

> **NOTHING in the existing frontend or current functionality may break at any point.**
> Every step in every tutorial is:
> - **Backward compatible** — existing API contracts are preserved exactly
> - **Incremental** — each step can be committed, deployed, and rolled back independently
> - **Fully testable** — a validation checklist follows every step

---

## TABLE OF CONTENTS

1. [Phase 14 — Database Integration](#phase-14--database-integration)
2. [Phase 15 — Authentication & RBAC](#phase-15--authentication--role-based-access-control-rbac)
3. [Phase 16 — Product Catalog Integration](#phase-16--product-catalog-integration)
4. [Tutorial A — Database Integration (Phase 14)](#tutorial-a--database-integration-phase-14)
5. [Tutorial B — Authentication & RBAC (Phase 15)](#tutorial-b--authentication--rbac-phase-15)
6. [Final Safety Guarantee Checklist](#final-safety-guarantee-checklist)

> Phase 15.1 is documented in `PHASE_15_1_AUTH_UI_INTEGRATION.md`. Phases 17–18 are documented in [`PHASES_17_18_ROADMAP_AND_TUTORIALS.md`](./PHASES_17_18_ROADMAP_AND_TUTORIALS.md).

---

---

# PART 1 — UPDATED PROJECT PHASES

---

## Phase 14 — Database Integration

**Status: NOT STARTED**
**Prerequisite:** Phases 1–13 complete and validated.
**Goal:** Introduce a database layer into the existing application in a safe, non-breaking way. The frontend must work identically after every step. The `/contact` and `/chat` endpoints must continue returning the same response shapes throughout.

### 1. Database Selection & Justification

- **Database:** PostgreSQL 15
- **Justification:**
  - Production-grade ACID compliance with JSONB support for flexible schema evolution
  - Native Docker image (`postgres:15-alpine`) — minimal surface area, small footprint
  - Best-in-class support within SQLAlchemy's async dialect (`asyncpg`)
  - Alembic migrations are first-class for FastAPI + SQLAlchemy stacks
  - Compatible with Vercel Postgres, Supabase, Neon, and self-hosted VPS — all viable Phase 18 targets
- **Driver:** `asyncpg` (async) with SQLAlchemy's `AsyncEngine`

### 2. Data Modeling (Initial Scope)

| Model | Phase 14 Status | Notes |
|---|---|---|
| `ContactSubmission` | **IMPLEMENT** | Persists `/contact` POST bodies with timestamp and status |
| `Product` | **SCAFFOLD** (table created, no routes) | Mirrors current `data/products.ts` shape; will power admin CRUD in Phase 15 |
| `User` | **SCAFFOLD** (table created, no routes) | id, email, password_hash, role, created_at; auth logic deferred to Phase 15 |

Auth-related columns (`password_hash`, `role`) are created in migrations but no registration, login, or session logic is introduced in Phase 14.

### 3. ORM / Data Access Layer

- **ORM:** SQLAlchemy 2.x with async session (`AsyncSession`)
- **Pattern:** Repository pattern — a `repositories/` directory exposes typed async functions; routes call repositories, never raw SQL
- **Session management:** FastAPI dependency injection via `AsyncSession` factory — one session per request, closed on response

### 4. API Layer Updates

- `POST /contact` — saves submission to `contact_submissions` table **after** sending the email (email failure still returns HTTP 502; DB write failure is logged but returns HTTP 200 so the user experience is unchanged)
- `POST /chat` — **unchanged**; no DB write (chat is stateless by design until Phase 15+)
- `GET /health` — **unchanged**; optionally adds a `"db": "ok"` field without removing `"status": "ok"`

**Critical constraint:** Request and response JSON shapes for all three endpoints are byte-for-byte identical to Phase 13. No new required fields. No renamed fields.

### 5. Migrations

- **Tool:** Alembic with async support
- **Strategy:** Migration files are committed alongside code; applied on container startup via an entrypoint script (not during the FastAPI application startup path, to avoid startup-time failures from DB not being ready)
- **Initial migration:** Creates `contact_submissions`, `products`, and `users` tables

### 6. Local + Docker Setup

```yaml
# Addition to docker-compose.yml
services:
  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: fiddlers_green
      POSTGRES_USER: fg_user
      POSTGRES_PASSWORD: fg_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U fg_user -d fiddlers_green"]
      interval: 5s
      timeout: 5s
      retries: 5
```

Environment variables added to `fiddlers_green-backend/.env`:
```
DATABASE_URL=postgresql+asyncpg://fg_user:fg_password@db:5432/fiddlers_green
```

### 7. Logging & Error Handling

- All DB errors are caught at the repository layer and re-raised as `HTTPException` (for request-scoped errors) or swallowed with a structured log entry (for fire-and-forget writes like the contact submission)
- DB connection failure at startup logs a structured error but does **not** crash the application — all non-DB endpoints remain available
- Python `logging` module (no new dependency) with structured dict output for machine readability

---

## Phase 15 — Authentication & Role-Based Access Control (RBAC)

**Status: NOT STARTED**
**Prerequisite:** Phase 14 complete and validated.
**Goal:** Introduce a secure, additive authentication and authorization system. Every existing public route (`/`, `/catalog`, `/heritage`, `/contact`, `/chat`) remains fully accessible without authentication. Login is additive — nothing is gated until Phase 16 explicitly gates it.

### 1. User System Design

```
users table (from Phase 14 scaffold):
  id            UUID, primary key, default gen_random_uuid()
  email         TEXT, unique, not null
  password_hash TEXT, not null
  role          TEXT, not null, default 'customer'  -- 'admin' | 'customer'
  is_active     BOOLEAN, not null, default true
  created_at    TIMESTAMPTZ, not null, default now()
  updated_at    TIMESTAMPTZ, not null, default now()
```

**Roles:**
- `admin` — Fiddler's Green staff; can create/edit/delete products
- `customer` — registered buyer; can view account info and order history scaffold
- `public` — unauthenticated; all current routes remain exactly as-is

### 2. Authentication Mechanism

- **Strategy:** JSON Web Tokens (JWT) via `python-jose` + `passlib[bcrypt]`
- **Token type:** Bearer token in `Authorization` header
- **Access token TTL:** 60 minutes
- **Refresh token:** Not implemented in Phase 15 (YAGNI); scaffold noted
- **Password hashing:** bcrypt via `passlib` (work factor 12)
- **No session storage** — purely stateless JWT; database is not queried per request except for the optional `is_active` check

### 3. Registration & Login Endpoints

All new — no existing endpoints are modified:

```
POST /auth/register   — customer self-registration
POST /auth/login      — returns access_token (admin and customer)
GET  /auth/me         — returns current user info (requires valid token)
```

### 4. Role-Based Authorization

FastAPI dependency injection pattern:
```python
# Dependencies stacked, not inline conditionals
get_current_user(token) → User | 401
require_admin(user)     → User | 403
require_customer(user)  → User | 403
```

- Public routes: no dependency applied — **unchanged**
- Admin routes: `Depends(require_admin)` applied only to new admin endpoints
- Customer routes: `Depends(require_customer)` applied only to new customer endpoints

### 5. Admin Product Management (CRUD)

New endpoints only — existing frontend product display reads from `data/products.ts` (static) and is unaffected:

```
POST   /admin/products          — create product
GET    /admin/products          — list all products (admin view, includes draft status)
PUT    /admin/products/{id}     — update product (name, dosage, description, pricing)
DELETE /admin/products/{id}     — soft delete (sets is_active=false, never hard deletes)
```

**Frontend safety guarantee:** The frontend's `/catalog` page reads from `data/products.ts` (a static TypeScript file), not from any API endpoint. Admin product updates do NOT affect the frontend display until a Phase 16+ migration wires the catalog to the DB. This is intentional — it gives Phase 16 a clean cutover point with full rollback capability.

### 6. Customer Features

```
GET /customer/me              — account info (email, role, created_at)
GET /customer/orders          — scaffold: returns empty array []
```

Order history is scaffolded as an empty array so the frontend client can be wired up safely in a future phase without API shape changes.

### 7. API Design Constraints

- All existing endpoints (`/health`, `/contact`, `/chat`) are **read-only** in this phase — no changes
- All new endpoints use `/auth/`, `/admin/`, or `/customer/` prefixes — no namespace collision
- OpenAPI schema remains browsable at `/docs` (development only, controlled by `DISABLE_DOCS` env var from Phase 13)

### 8. Security Basics

- `email` validated with `pydantic.EmailStr`
- Passwords validated: minimum 8 characters, enforced at the Pydantic model layer
- JWT secret (`JWT_SECRET`) is a required environment variable — server refuses to start if absent
- Tokens validated on every protected request (signature, expiry, issuer claim)
- SQL injection: prevented by SQLAlchemy parameterization (no raw SQL strings)
- No rate limiting in Phase 15 (deferred to Phase 17 / infrastructure layer)

### 9. Incremental Rollout Strategy

Auth is introduced in this strict order:
1. User model migration (already scaffolded in Phase 14 — just a schema change)
2. Auth endpoints live but nothing requires a token
3. Admin product CRUD endpoints go live (token required, but frontend doesn't call them)
4. Customer endpoints go live
5. At no point does any existing frontend user flow require a token

The frontend continues to work exactly as it does after Phase 13 throughout all of Phase 15.

---

## Phase 16 — Product Catalog Integration

**Status: NOT STARTED**
**Prerequisite:** Phase 15 complete and validated.

### Objective

Replace the temporary frontend product model with a fully integrated backend-driven product catalog.

Phase 15 intentionally delivered authentication, RBAC, and cart functionality without expanding into product management. Phase 16 connects products, carts, and the frontend experience into one complete shopping workflow.

### Backend Work

**Product API** — create public product endpoints:

- `GET /products`
  - Retrieve active products
  - Support pagination if required
  - Return complete product information
- Product filtering/search:
  - Category filtering
  - Name search
  - Availability filtering

**Product schema expansion** — extend product responses to support:

- Product name
- Description
- Category
- Price
- Image URL
- Inventory/status information

**Product images** — add support for:

- Product image URLs
- Default product images
- Future CDN/storage integration compatibility

### Frontend Work

**Replace static product data** — remove dependency on `data/products.ts`; replace static product information with API-driven data.

**Live product fetching** — implement:

- Product listing page
- Product detail views
- Category filtering
- Search functionality

**Cart integration upgrade** — update cart display to use backend product relationships. Cart items should display:

- Product name
- Product image
- Product price
- Quantity
- Subtotal

Correctly map:

```
Product UUID
      |
      v
Backend Product
      |
      v
Frontend Product Display
```

### Validation

Confirm:

- Products load from backend
- Search/filtering works
- Product UUID mapping is correct
- Cart displays complete product information
- Customer isolation remains intact
- Admin product creation remains functional

### Outcome

Phase 16 completes the transition from a backend-enabled shopping cart into a complete product-driven ecommerce workflow.

---

> **Phase 17 — Final Production Polish + QA + Deploy Ready** and **Phase 18 —
> VPS Deployment / DigitalOcean Production** are documented in
> [`PHASES_17_18_ROADMAP_AND_TUTORIALS.md`](./PHASES_17_18_ROADMAP_AND_TUTORIALS.md),
> split out to keep this document focused on application-development phases.

---

---

# PART 2 — CLAUDE CLI IMPLEMENTATION TUTORIALS

> These tutorials are written for **Claude CLI** (`claude` command). Each prompt is a discrete, safe, testable instruction. Run them in order. Do not skip validation steps.

---

## Tutorial A — Database Integration (Phase 14)

### Overview

We are adding PostgreSQL + SQLAlchemy (async) + Alembic to an existing FastAPI backend that is already serving `/health`, `/contact`, and `/chat`. The frontend must work identically after every single step.

**Backend directory:** `fiddlers_green-backend/`
**Frontend directory:** `fiddlers_green-frontend/`

---

### STEP A-1 — Add Dependencies

**What this step does:** Adds the Python packages needed for async PostgreSQL and migrations. Nothing is wired up yet — this is a pure dependency declaration.

**Files to modify:** `fiddlers_green-backend/requirements.txt`

**Claude CLI prompt:**
```
Open fiddlers_green-backend/requirements.txt and append the following lines exactly, preserving all existing lines:

sqlalchemy[asyncio]==2.0.36
asyncpg==0.30.0
alembic==1.14.0
greenlet==3.1.1

Do not remove or modify any existing line.
```

**Validation:**
```bash
cd fiddlers_green-backend
pip install -r requirements.txt --break-system-packages
# Or inside Docker:
docker compose build backend
```

**Success criteria:**
- `pip install` (or `docker compose build`) completes with no errors
- `python -c "import sqlalchemy, asyncpg, alembic"` exits 0
- Frontend still loads at `http://localhost:3000` — no change

**Rollback:** Remove the four appended lines from `requirements.txt` and rebuild.

---

### STEP A-2 — Add Database Environment Variables

**What this step does:** Adds `DATABASE_URL` to the backend's environment configuration. The application does not read this variable yet — this step only makes it available.

**Files to modify:**
- `fiddlers_green-backend/.env` (local secrets, git-ignored)
- `fiddlers_green-backend/.env.example` (committed template)
- `fiddlers_green-backend/.env.local.example` (Docker-facing template)

**Claude CLI prompt:**
```
In fiddlers_green-backend/.env, add this line at the end (create the file if it does not exist — but check first and preserve any existing content):

DATABASE_URL=postgresql+asyncpg://fg_user:fg_password@localhost:5432/fiddlers_green

In fiddlers_green-backend/.env.example, add this line at the end, preserving all existing lines:

# PostgreSQL connection string (asyncpg driver)
# Format: postgresql+asyncpg://USER:PASSWORD@HOST:PORT/DATABASE
DATABASE_URL=postgresql+asyncpg://fg_user:fg_password@localhost:5432/fiddlers_green

In fiddlers_green-backend/.env.local.example, add this line at the end, preserving all existing lines:

DATABASE_URL=postgresql+asyncpg://fg_user:fg_password@db:5432/fiddlers_green
```

**Note:** The `@localhost` variant is for running the backend directly on your host machine during development. The `@db` variant (matching the Docker service name) is used inside Docker Compose. Use the appropriate one for your context.

**Validation:**
- `cat fiddlers_green-backend/.env` shows `DATABASE_URL` present
- No existing variables were removed
- `git status` shows `.env` is not staged (it's git-ignored)

**Rollback:** Remove the `DATABASE_URL` line from `.env`. No other changes were made.

---

### STEP A-3 — Add PostgreSQL to Docker Compose

**What this step does:** Adds a `db` service and `postgres_data` volume to `docker-compose.yml`. The backend service is updated with a `depends_on` for the DB's health check and the `DATABASE_URL` environment variable. The existing `frontend` and `backend` service definitions are not changed except for the dependency and env var additions.

**Files to modify:** `docker-compose.yml` (root of the repo)

**Claude CLI prompt:**
```
Read docker-compose.yml in the project root. Make exactly these changes and no others:

1. Add a new top-level service called "db" with this exact configuration:

  db:
    image: postgres:15-alpine
    restart: unless-stopped
    environment:
      POSTGRES_DB: fiddlers_green
      POSTGRES_USER: fg_user
      POSTGRES_PASSWORD: fg_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U fg_user -d fiddlers_green"]
      interval: 5s
      timeout: 5s
      retries: 10

2. In the "backend" service, add or update the "depends_on" block to include:

    depends_on:
      db:
        condition: service_healthy

3. In the "backend" service's "environment" block (or create one if absent), add:

      DATABASE_URL: postgresql+asyncpg://fg_user:fg_password@db:5432/fiddlers_green

4. At the bottom of the file, in the top-level "volumes" block (create it if absent), add:

  postgres_data:

Do not modify any other part of the file.
```

**Validation:**
```bash
docker compose up --build -d
docker compose ps
# All three services (frontend, backend, db) should show "Up (healthy)" or "Up"
docker compose exec db pg_isready -U fg_user -d fiddlers_green
# Should print: /var/run/postgresql:5432 - accepting connections
curl http://localhost:8000/health
# Should return: {"status":"ok"}
curl http://localhost:3000
# Frontend must load normally
```

**Success criteria:**
- All three containers running
- `/health` returns `{"status":"ok"}` — unchanged
- Frontend loads — unchanged
- DB accepts connections

**Rollback:**
```bash
docker compose down -v   # stops containers and removes postgres_data volume
```
Then revert `docker-compose.yml` to the previous version (remove `db` service, `postgres_data` volume, and `depends_on` / `DATABASE_URL` from backend).

---

### STEP A-4 — Create the Database Module

**What this step does:** Creates `fiddlers_green-backend/database.py` — the async SQLAlchemy engine, session factory, and `Base` declarative class. Nothing imports this yet; it is safe to add in isolation.

**Files to create:** `fiddlers_green-backend/database.py`

**Claude CLI prompt:**
```
Create fiddlers_green-backend/database.py with exactly this content:

"""
Async SQLAlchemy engine and session factory.
Import Base into model files; import get_db into route files.
"""
import os
import logging
from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

logger = logging.getLogger(__name__)

DATABASE_URL = os.getenv("DATABASE_URL", "")

if not DATABASE_URL:
    logger.warning(
        "DATABASE_URL is not set. Database features will be unavailable. "
        "Set DATABASE_URL in your .env file to enable them."
    )

engine = create_async_engine(
    DATABASE_URL,
    echo=False,          # Set to True temporarily if you need to debug SQL
    pool_pre_ping=True,  # Detect stale connections before use
    pool_size=5,
    max_overflow=10,
) if DATABASE_URL else None

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
    autocommit=False,
) if engine else None


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    FastAPI dependency: yields an AsyncSession and closes it when the request ends.
    If the database is not configured, raises a 503.
    """
    if AsyncSessionLocal is None:
        from fastapi import HTTPException
        raise HTTPException(status_code=503, detail="Database not configured.")
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
```

**Validation:**
```bash
cd fiddlers_green-backend
python -c "from database import Base, get_db, engine; print('database module OK')"
```

**Success criteria:** Prints `database module OK` with no errors.

**Rollback:** Delete `fiddlers_green-backend/database.py`.

---

### STEP A-5 — Create the Data Models

**What this step does:** Creates three SQLAlchemy model files under a new `models/` directory. These define the DB tables but do not create them yet (migrations handle that). The existing `models/contact.py` (Pydantic) and `models/chat.py` (Pydantic) are **not changed** — the new files go in a new `db_models/` directory to avoid any naming conflict.

**Files to create:**
- `fiddlers_green-backend/db_models/__init__.py`
- `fiddlers_green-backend/db_models/contact.py`
- `fiddlers_green-backend/db_models/product.py`
- `fiddlers_green-backend/db_models/user.py`

**Claude CLI prompt:**
```
Create the following four files exactly as specified. Do not modify any existing file.

--- FILE 1: fiddlers_green-backend/db_models/__init__.py ---
# DB model registry — import all models here so Alembic can discover them
from .contact import ContactSubmission   # noqa: F401
from .product import Product             # noqa: F401
from .user import User                   # noqa: F401


--- FILE 2: fiddlers_green-backend/db_models/contact.py ---
"""
Persists contact form submissions from POST /contact.
"""
import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from database import Base


class ContactSubmission(Base):
    __tablename__ = "contact_submissions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    inquiry_type: Mapped[str] = mapped_column(String(50), nullable=False, default="general")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc)
    )


--- FILE 3: fiddlers_green-backend/db_models/product.py ---
"""
Product catalog — scaffolded for Phase 15 admin CRUD.
Not yet read by the frontend (which uses data/products.ts).
"""
import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

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
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )


--- FILE 4: fiddlers_green-backend/db_models/user.py ---
"""
User accounts — scaffolded for Phase 15 auth.
Password hashing and auth logic are NOT implemented in this file.
"""
import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(50), nullable=False, default="customer")
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
```

**Validation:**
```bash
cd fiddlers_green-backend
python -c "import db_models; print('db_models import OK')"
```

**Success criteria:** Prints `db_models import OK` with no errors.

**Rollback:** Delete the `fiddlers_green-backend/db_models/` directory.

---

### STEP A-6 — Initialize Alembic

**What this step does:** Initializes Alembic in the backend directory with async support. This creates `alembic.ini` and the `alembic/` directory. The existing application code is not changed.

**Files created by Alembic:** `alembic.ini`, `alembic/env.py`, `alembic/versions/` (empty), `alembic/script.py.mako`

**Claude CLI prompt:**
```
Run this command from inside fiddlers_green-backend/:
  alembic init -t async alembic

Then open fiddlers_green-backend/alembic/env.py and make exactly these two changes:

CHANGE 1 — Replace the line that reads:
  target_metadata = None
With:
  import sys, os
  sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
  from database import Base
  import db_models  # noqa: F401 — registers all models with Base
  target_metadata = Base.metadata

CHANGE 2 — In the run_migrations_online() function, find the line that calls
create_engine or similar and ensure the DATABASE_URL is read from the environment.
Alembic's async template already does this via config.get_main_option("sqlalchemy.url").
Update alembic.ini so the sqlalchemy.url line reads:

  sqlalchemy.url = %(DATABASE_URL)s

This tells Alembic to read DATABASE_URL from the environment instead of hardcoding it.

Do not modify any other part of alembic/env.py or alembic.ini.
```

**Validation:**
```bash
cd fiddlers_green-backend
DATABASE_URL=postgresql+asyncpg://fg_user:fg_password@localhost:5432/fiddlers_green \
  alembic current
# Should print: (no output or "INFO  [alembic.runtime.migration] Context impl PostgreSQLImpl")
# "current" with no revision yet is correct — it means Alembic connected successfully
```

**Success criteria:** Alembic connects to Postgres without error. No existing application code is changed.

**Rollback:** Delete `alembic.ini` and the `alembic/` directory.

---

### STEP A-7 — Generate the Initial Migration

**What this step does:** Generates an Alembic migration file that creates the three tables (`contact_submissions`, `products`, `users`). The migration is reviewed before being applied.

**Claude CLI prompt:**
```
From inside fiddlers_green-backend/, run:
  alembic revision --autogenerate -m "initial_schema"

Then open the generated file in alembic/versions/ and verify it contains:
- create_table("contact_submissions", ...) with columns: id, name, email, message, inquiry_type, created_at
- create_table("products", ...) with columns: id, name, category, description, dosage, pricing, is_active, created_at, updated_at
- create_table("users", ...) with columns: id, email, password_hash, role, is_active, created_at, updated_at

If any table or column is missing, do not proceed — check that db_models/__init__.py imports all three models.

Do NOT run "alembic upgrade head" yet.
```

**Validation:**
- Open `alembic/versions/<hash>_initial_schema.py`
- Confirm all three `op.create_table(...)` calls are present
- Confirm `op.drop_table(...)` calls are in the `downgrade()` function

**Rollback:** Delete the generated file in `alembic/versions/`. No DB changes have been made.

---

### STEP A-8 — Apply the Migration

**What this step does:** Runs `alembic upgrade head` to create the three tables in the live database. This is the first step that modifies the database.

**Claude CLI prompt:**
```
Ensure the Docker db container is running (docker compose up -d db).

From inside fiddlers_green-backend/, run:
  alembic upgrade head

If running locally (not in Docker), ensure DATABASE_URL points to localhost:5432.
If running inside Docker, exec into the backend container:
  docker compose exec backend alembic upgrade head
```

**Validation:**
```bash
docker compose exec db psql -U fg_user -d fiddlers_green -c "\dt"
# Should list: contact_submissions, products, users, alembic_version
curl http://localhost:8000/health
# Must still return {"status":"ok"} — unchanged
curl http://localhost:3000
# Frontend must still load normally
```

**Success criteria:**
- Three tables + `alembic_version` exist in the database
- All existing endpoints return identical responses

**Rollback:**
```bash
alembic downgrade -1
# Or inside Docker:
docker compose exec backend alembic downgrade -1
```
This drops all three tables and removes the alembic_version row.

---

### STEP A-9 — Create the Contact Repository

**What this step does:** Creates a repository module that encapsulates all DB operations for contact submissions. No routes are modified yet.

**Files to create:** `fiddlers_green-backend/repositories/__init__.py`, `fiddlers_green-backend/repositories/contact.py`

**Claude CLI prompt:**
```
Create fiddlers_green-backend/repositories/__init__.py as an empty file.

Create fiddlers_green-backend/repositories/contact.py with exactly this content:

"""
Data access layer for ContactSubmission.
All DB interaction for the /contact route goes through this module.
"""
import logging
from sqlalchemy.ext.asyncio import AsyncSession

from db_models.contact import ContactSubmission

logger = logging.getLogger(__name__)


async def save_contact_submission(
    session: AsyncSession,
    name: str,
    email: str,
    message: str,
    inquiry_type: str,
) -> ContactSubmission:
    """
    Persists a contact form submission.
    Raises on DB error — caller is responsible for handling.
    """
    submission = ContactSubmission(
        name=name,
        email=email,
        message=message,
        inquiry_type=inquiry_type,
    )
    session.add(submission)
    await session.commit()
    await session.refresh(submission)
    logger.info("ContactSubmission saved: id=%s email=%s", submission.id, email)
    return submission
```

**Validation:**
```bash
cd fiddlers_green-backend
python -c "from repositories.contact import save_contact_submission; print('repository OK')"
```

**Success criteria:** Prints `repository OK` — no import errors.

**Rollback:** Delete `fiddlers_green-backend/repositories/` directory.

---

### STEP A-10 — Wire the Contact Route to the Repository

**What this step does:** Updates `routes/contact.py` to save the submission to the database **after** sending the email. The email logic is unchanged. The route's request/response contract is unchanged. If the DB write fails, it logs the error and still returns `{"ok": true}` to the frontend — the user's email was sent successfully and the failure is an internal concern.

**Files to modify:** `fiddlers_green-backend/routes/contact.py`

**Read the file first to understand the current structure, then apply this change:**

**Claude CLI prompt:**
```
Read fiddlers_green-backend/routes/contact.py carefully. 

Make exactly these changes and no others:

1. Add these imports at the top of the file, after existing imports:

import logging
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_db
from repositories.contact import save_contact_submission

logger = logging.getLogger(__name__)

2. In the contact route handler function, after the email send succeeds (after the line
   that returns the success response or sets ok=True), add a DB write wrapped in a
   try/except so that DB failures never surface to the user:

   # Persist to database — failure is logged, not surfaced to frontend
   try:
       await save_contact_submission(
           session=db,
           name=request.name,
           email=request.email,
           message=request.message,
           inquiry_type=request.inquiry_type or "general",
       )
   except Exception as db_err:
       logger.error("Failed to persist contact submission to DB: %s", db_err)

3. Add "db: AsyncSession = Depends(get_db)" as a parameter to the route handler function.
   Do not change any other parameters.

4. Do not change the route path, HTTP method, request model, response model, status codes,
   or any other part of the function.
```

**Validation:**
```bash
# Restart the backend
docker compose restart backend

# Submit the contact form via curl
curl -s -X POST http://localhost:8000/contact \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","message":"Hello","inquiry_type":"general"}' | python3 -m json.tool

# Should return exactly: {"ok": true, "detail": "..."}  (same as before)

# Check the DB row was created
docker compose exec db psql -U fg_user -d fiddlers_green \
  -c "SELECT id, name, email, inquiry_type, created_at FROM contact_submissions ORDER BY created_at DESC LIMIT 1;"
```

**Success criteria:**
- `/contact` response is byte-for-byte identical to Phase 13
- Row appears in `contact_submissions` table
- Frontend contact form works normally

**Rollback:** Revert `routes/contact.py` to its previous version (remove the three changes above).

---

### STEP A-11 — Update Backend Entrypoint for Migration Safety

**What this step does:** Adds an entrypoint script that runs `alembic upgrade head` before starting uvicorn. This ensures migrations are always applied before the app accepts traffic. The Docker Compose `command` for the backend service is updated.

**Files to create:** `fiddlers_green-backend/entrypoint.sh`
**Files to modify:** `fiddlers_green-backend/Dockerfile`, `docker-compose.yml`

**Claude CLI prompt:**
```
Create fiddlers_green-backend/entrypoint.sh with exactly this content:

#!/bin/sh
set -e
echo "Running database migrations..."
alembic upgrade head
echo "Migrations complete. Starting server..."
exec uvicorn main:app --host 0.0.0.0 --port 8000

Make the file executable:
  chmod +x fiddlers_green-backend/entrypoint.sh

In fiddlers_green-backend/Dockerfile, find the CMD or ENTRYPOINT line that starts uvicorn.
Replace it with:
  COPY entrypoint.sh /entrypoint.sh
  RUN chmod +x /entrypoint.sh
  ENTRYPOINT ["/entrypoint.sh"]

In docker-compose.yml, if the backend service has a "command:" key that runs uvicorn directly,
remove it (the Dockerfile ENTRYPOINT now handles startup).
Do not change any other part of either file.
```

**Validation:**
```bash
docker compose up --build -d
docker compose logs backend | head -20
# Should show "Running database migrations..." then "Migrations complete. Starting server..."
curl http://localhost:8000/health
# Must return {"status":"ok"}
```

**Success criteria:**
- Migrations log line appears before the uvicorn startup line
- All existing endpoints respond correctly

**Rollback:** Revert `Dockerfile` CMD/ENTRYPOINT to the original uvicorn command. Delete `entrypoint.sh`.

---

### STEP A-12 — Final Phase 14 Validation

**What this step does:** Full end-to-end smoke test of Phase 14 in a clean Docker environment.

**Claude CLI prompt:**
```
Run each of the following validation commands in order. Report the output of each.
Stop and flag any failure — do not proceed past a failure.

1. docker compose down -v && docker compose up --build -d
   Wait 15 seconds for all services to start.

2. docker compose ps
   Expected: 3 services, all healthy/running.

3. curl -s http://localhost:8000/health
   Expected: {"status":"ok"}

4. curl -s -X POST http://localhost:8000/contact \
     -H "Content-Type: application/json" \
     -d '{"name":"Phase14 Test","email":"phase14@example.com","message":"DB integration test","inquiry_type":"general"}'
   Expected: {"ok": true, ...}

5. docker compose exec db psql -U fg_user -d fiddlers_green \
     -c "SELECT name, email, inquiry_type FROM contact_submissions ORDER BY created_at DESC LIMIT 1;"
   Expected: "Phase14 Test" | "phase14@example.com" | "general"

6. curl -s -X POST http://localhost:8000/chat \
     -H "Content-Type: application/json" \
     -d '{"message":"What products do you carry?"}'
   Expected: {"reply": "..."} (non-empty string — AI reply)

7. curl -s http://localhost:3000
   Expected: HTTP 200, page HTML returned.

8. docker compose exec db psql -U fg_user -d fiddlers_green -c "\dt"
   Expected: contact_submissions, products, users, alembic_version all present.
```

**Success criteria:** All 8 checks pass. Phase 14 is complete.

---

### Deferred Features (Planned for Phase 15)

Shopping cart functionality is intentionally excluded from Phase 14. This is a deliberate architectural decision: a cart requires an authenticated user context to associate items with a session or account, and session handling is not available until Phase 15 introduces JWT-based auth and RBAC. Implementing cart persistence before authentication would produce a throwaway data layer that would need to be replaced in its entirety one phase later. Cart endpoints, models, and frontend integration belong in Phase 15, after `User` authentication is in place.

---

---

## Tutorial B — Authentication & RBAC (Phase 15)

### Overview

Phase 15 adds JWT-based authentication and role-based access control to the existing FastAPI backend. Phase 14 (database + models) must be complete before starting this tutorial.

**Architecture principle:** Every new endpoint is additive. No existing endpoint (`/health`, `/contact`, `/chat`) is modified. The frontend works without a token throughout all of Phase 15.

---

### STEP B-1 — Add Auth Dependencies

**What this step does:** Adds `python-jose[cryptography]` and `passlib[bcrypt]` to the backend, plus a compatibility pin for `bcrypt` itself (see below). No application code changes yet.

**`pydantic[email]` is deliberately NOT re-added here:** it is already an unpinned requirement from Phase 10 (`requirements.txt` line 3), and `EmailStr` is already available and in use (`models/contact.py`, and Phase 14's `pip install` resolved it to `pydantic-2.13.4`). Re-adding it pinned to `==2.10.3` would silently *downgrade* an already-satisfied, newer dependency shared by every existing Pydantic model in the app — a real risk under this document's own "ZERO BREAKING CHANGES" constraint, for no benefit.

**`bcrypt` is pinned explicitly below `passlib[bcrypt]`:** `passlib==1.7.4` (the latest release, effectively unmaintained since 2020) detects the installed `bcrypt` version via `bcrypt.__about__.__version__`. `bcrypt>=4.0` (a Rust-backed rewrite) removed that attribute entirely, so an unpinned install raises `AttributeError: module 'bcrypt' has no attribute '__about__'` at hashing time — breaking registration and login outright. Pinning `bcrypt==3.2.2` (last of the compatible 3.x line) avoids this.

**Files to modify:** `fiddlers_green-backend/requirements.txt`

**Claude CLI prompt:**
```
Open fiddlers_green-backend/requirements.txt and append the following lines exactly,
preserving all existing lines:

python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
bcrypt==3.2.2

Do not remove or modify any existing line. Do not add a pydantic[email] line —
it is already present, unpinned, from Phase 10.
```

**Validation:**
```bash
pip install -r fiddlers_green-backend/requirements.txt --break-system-packages
python -c "from jose import jwt; from passlib.context import CryptContext; \
  ctx = CryptContext(schemes=['bcrypt']); h = ctx.hash('testpass'); \
  assert ctx.verify('testpass', h); print('auth deps OK')"
# The hash()/verify() round-trip catches the passlib/bcrypt incompatibility;
# a bare import check does not, since the AttributeError only surfaces on first use.
# Or rebuild Docker:
docker compose build backend
```

**Success criteria:** Imports succeed. All existing endpoints unchanged.

**Rollback:** Remove the three appended lines and rebuild.

---

### STEP B-2 — Add JWT Environment Variables

**What this step does:** Adds `JWT_SECRET` and `JWT_ALGORITHM` to environment configuration. The application does not use these yet.

**Files to modify:** `fiddlers_green-backend/.env`, `fiddlers_green-backend/.env.example`

**Claude CLI prompt:**
```
In fiddlers_green-backend/.env, add these lines at the end, preserving all existing content:

# JWT Authentication — generate a strong secret: python -c "import secrets; print(secrets.token_hex(32))"
JWT_SECRET=change-this-to-a-strong-random-secret-before-production
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=60

In fiddlers_green-backend/.env.example, add these lines at the end:

# JWT Authentication
# Generate a strong secret: python -c "import secrets; print(secrets.token_hex(32))"
JWT_SECRET=your-strong-secret-here
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=60

In docker-compose.yml, in the backend service's environment block, add:
  JWT_SECRET: ${JWT_SECRET}
  JWT_ALGORITHM: ${JWT_ALGORITHM:-HS256}
  JWT_ACCESS_TOKEN_EXPIRE_MINUTES: ${JWT_ACCESS_TOKEN_EXPIRE_MINUTES:-60}
```

**Validation:**
- `cat fiddlers_green-backend/.env` shows all three JWT variables
- `docker compose config` shows them in the backend environment section

**Rollback:** Remove the three `JWT_*` lines from `.env` and `docker-compose.yml`.

---

### STEP B-3 — Create the Auth Service

**What this step does:** Creates `fiddlers_green-backend/services/auth_service.py` — handles password hashing and JWT creation/verification. This is a pure library module; it has no side effects on import and does not modify any existing file.

**Files to create:** `fiddlers_green-backend/services/auth_service.py`

**Claude CLI prompt:**
```
Create fiddlers_green-backend/services/auth_service.py with exactly this content:

"""
Authentication utilities: password hashing and JWT management.
This module has no FastAPI dependencies — it is a pure service layer.
"""
import os
import logging
from datetime import datetime, timedelta, timezone
from typing import Optional

from jose import JWTError, jwt
from passlib.context import CryptContext

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Configuration — read from environment
# ---------------------------------------------------------------------------
JWT_SECRET: str = os.getenv("JWT_SECRET", "")
JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = int(
    os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", "60")
)

if not JWT_SECRET:
    logger.warning(
        "JWT_SECRET is not set. Authentication will not work. "
        "Set JWT_SECRET in your .env file."
    )

# ---------------------------------------------------------------------------
# Password hashing
# ---------------------------------------------------------------------------
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(plain_password: str) -> str:
    return pwd_context.hash(plain_password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


# ---------------------------------------------------------------------------
# JWT
# ---------------------------------------------------------------------------
def create_access_token(
    subject: str,
    role: str,
    expires_delta: Optional[timedelta] = None,
) -> str:
    """
    Creates a signed JWT.
    subject: typically the user's email or UUID string.
    role: 'admin' or 'customer'.
    """
    if not JWT_SECRET:
        raise RuntimeError("JWT_SECRET is not configured.")
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    payload = {
        "sub": subject,
        "role": role,
        "exp": expire,
        "iss": "fiddlers-green",
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_access_token(token: str) -> dict:
    """
    Decodes and validates a JWT.
    Raises JWTError on invalid or expired tokens — caller handles this.
    """
    if not JWT_SECRET:
        raise RuntimeError("JWT_SECRET is not configured.")
    return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
```

**Validation:**
```bash
cd fiddlers_green-backend
python -c "from services.auth_service import hash_password, verify_password; \
  h = hash_password('testpass'); \
  assert verify_password('testpass', h); \
  print('auth_service OK')"
```

**Success criteria:** Prints `auth_service OK`.

**Rollback:** Delete `fiddlers_green-backend/services/auth_service.py`.

---

### STEP B-4 — Create the User Repository

**What this step does:** Creates `fiddlers_green-backend/repositories/user.py` — typed async DB operations for the User model. No routes yet.

**Files to create:** `fiddlers_green-backend/repositories/user.py`

**Claude CLI prompt:**
```
Create fiddlers_green-backend/repositories/user.py with exactly this content:

"""
Data access layer for User model.
"""
import uuid
import logging
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from db_models.user import User
from services.auth_service import hash_password

logger = logging.getLogger(__name__)


async def get_user_by_email(session: AsyncSession, email: str) -> Optional[User]:
    result = await session.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()


async def get_user_by_id(session: AsyncSession, user_id: uuid.UUID) -> Optional[User]:
    result = await session.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()


async def create_user(
    session: AsyncSession,
    email: str,
    plain_password: str,
    role: str = "customer",
) -> User:
    """
    Creates a new user. Raises ValueError if email already exists.
    Password is hashed before storage — plain_password is never persisted.
    """
    existing = await get_user_by_email(session, email)
    if existing:
        raise ValueError(f"A user with email {email!r} already exists.")

    user = User(
        email=email,
        password_hash=hash_password(plain_password),
        role=role,
    )
    session.add(user)
    await session.commit()
    await session.refresh(user)
    logger.info("User created: id=%s email=%s role=%s", user.id, email, role)
    return user
```

**Validation:**
```bash
python -c "from repositories.user import get_user_by_email; print('user repo OK')"
```

**Success criteria:** Prints `user repo OK`.

**Rollback:** Delete the file.

---

### STEP B-5 — Create Auth Pydantic Schemas

**What this step does:** Creates `fiddlers_green-backend/models/auth.py` — Pydantic request/response models for auth endpoints. Existing Pydantic models (`models/contact.py`, `models/chat.py`) are not changed.

**Files to create:** `fiddlers_green-backend/models/auth.py`

**Claude CLI prompt:**
```
Create fiddlers_green-backend/models/auth.py with exactly this content:

"""
Pydantic schemas for authentication endpoints.
These are API contracts — do not change field names without a migration plan.
"""
import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, EmailStr, field_validator


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str

    @field_validator("password")
    @classmethod
    def password_min_length(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters.")
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: Literal["bearer"] = "bearer"


class UserResponse(BaseModel):
    id: uuid.UUID
    email: str
    role: str
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}
```

**Validation:**
```bash
python -c "from models.auth import RegisterRequest, LoginRequest, TokenResponse; print('auth models OK')"
```

**Success criteria:** Prints `auth models OK`.

**Rollback:** Delete `fiddlers_green-backend/models/auth.py`.

---

### STEP B-6 — Create FastAPI Auth Dependencies

**What this step does:** Creates `fiddlers_green-backend/dependencies/auth.py` — reusable FastAPI `Depends` functions for getting the current user and enforcing roles. These are only applied to new protected routes.

**Files to create:** `fiddlers_green-backend/dependencies/__init__.py`, `fiddlers_green-backend/dependencies/auth.py`

**Claude CLI prompt:**
```
Create fiddlers_green-backend/dependencies/__init__.py as an empty file.

Create fiddlers_green-backend/dependencies/auth.py with exactly this content:

"""
FastAPI dependency functions for authentication and authorization.
Stack these on protected routes — never on existing public routes.

Usage:
  @router.get("/admin/foo")
  async def foo(user: User = Depends(require_admin), db: AsyncSession = Depends(get_db)):
      ...
"""
import logging
from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from db_models.user import User
from repositories.user import get_user_by_email
from services.auth_service import decode_access_token

logger = logging.getLogger(__name__)

bearer_scheme = HTTPBearer(auto_error=True)


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(bearer_scheme)],
    db: AsyncSession = Depends(get_db),
) -> User:
    """
    Validates the Bearer token and returns the authenticated User.
    Raises HTTP 401 on any token error.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired token.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = decode_access_token(credentials.credentials)
        email: str = payload.get("sub", "")
        if not email:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = await get_user_by_email(db, email)
    if user is None or not user.is_active:
        raise credentials_exception
    return user


async def require_admin(user: User = Depends(get_current_user)) -> User:
    """Raises HTTP 403 if the authenticated user is not an admin."""
    if user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required.",
        )
    return user


async def require_customer(user: User = Depends(get_current_user)) -> User:
    """Raises HTTP 403 if the authenticated user is not a customer or admin."""
    if user.role not in ("customer", "admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Customer access required.",
        )
    return user
```

**Validation:**
```bash
python -c "from dependencies.auth import get_current_user, require_admin; print('auth deps OK')"
```

**Success criteria:** Prints `auth deps OK`.

**Rollback:** Delete `fiddlers_green-backend/dependencies/` directory.

---

### STEP B-7 — Create the Auth Router

**What this step does:** Creates `fiddlers_green-backend/routes/auth.py` — three new endpoints (`/auth/register`, `/auth/login`, `/auth/me`). Existing routes are not modified.

**Files to create:** `fiddlers_green-backend/routes/auth.py`

**Claude CLI prompt:**
```
Create fiddlers_green-backend/routes/auth.py with exactly this content:

"""
Authentication endpoints.
All new routes — no existing endpoint is modified.
"""
import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from db_models.user import User
from dependencies.auth import get_current_user
from models.auth import LoginRequest, RegisterRequest, TokenResponse, UserResponse
from repositories.user import create_user, get_user_by_email
from services.auth_service import create_access_token, verify_password

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(request: RegisterRequest, db: AsyncSession = Depends(get_db)) -> User:
    """
    Register a new customer account.
    Returns the created user. Does NOT return a token — login separately.
    """
    try:
        user = await create_user(
            session=db,
            email=request.email,
            plain_password=request.password,
            role="customer",
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))
    return user


@router.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest, db: AsyncSession = Depends(get_db)) -> dict:
    """
    Authenticate and return a JWT access token.
    Works for both admin and customer accounts.
    """
    user = await get_user_by_email(db, request.email)
    if user is None or not verify_password(request.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated.",
        )
    token = create_access_token(subject=user.email, role=user.role)
    return {"access_token": token, "token_type": "bearer"}


@router.get("/me", response_model=UserResponse)
async def me(current_user: User = Depends(get_current_user)) -> User:
    """Returns the authenticated user's profile. Requires a valid Bearer token."""
    return current_user
```

**Validation:**
```bash
python -c "from routes.auth import router; print('auth router OK')"
```

**Success criteria:** Prints `auth router OK`.

**Rollback:** Delete `fiddlers_green-backend/routes/auth.py`.

---

### STEP B-8 — Register the Auth Router in main.py

**What this step does:** Registers the auth router with the FastAPI app. This is the first change to `main.py`. Only an `include_router` call is added — nothing else is changed.

**Files to modify:** `fiddlers_green-backend/main.py`

**Claude CLI prompt:**
```
Read fiddlers_green-backend/main.py carefully.

Make exactly these changes and no others:

1. Add this import near the top of the file, after the existing router imports:
   from routes.auth import router as auth_router

2. After the existing app.include_router() calls (for contact and chat routes),
   add this line:
   app.include_router(auth_router)

Do not modify any other line in main.py.
```

**Validation:**
```bash
docker compose up --build -d
sleep 5

# Existing endpoints still work
curl -s http://localhost:8000/health
# Expected: {"status":"ok"}

# New auth endpoints are present
curl -s http://localhost:8000/docs | grep -o '"auth"' | head -3
# Or: visit http://localhost:8000/docs and confirm /auth/* routes are listed

# Test register
curl -s -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"customer1@example.com","password":"securepass123"}' | python3 -m json.tool
# Expected: {"id":"...","email":"customer1@example.com","role":"customer","is_active":true,"created_at":"..."}

# Test login
curl -s -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"customer1@example.com","password":"securepass123"}' | python3 -m json.tool
# Expected: {"access_token":"eyJ...","token_type":"bearer"}
```

**Success criteria:**
- All existing endpoints return identical responses
- `/auth/register` creates a user and returns user data
- `/auth/login` returns a JWT token

**Rollback:** Revert the two changes to `main.py` (remove the import and `include_router` line).

---

### STEP B-9 — Create the Admin Product Router

**What this step does:** Creates `fiddlers_green-backend/routes/admin.py` — admin-only product CRUD endpoints. The frontend does not call these endpoints. Existing product display (from `data/products.ts`) is completely unaffected.

**Files to create:** `fiddlers_green-backend/routes/admin.py`

**Claude CLI prompt:**
```
Create fiddlers_green-backend/routes/admin.py with exactly this content:

"""
Admin-only product management endpoints.
All routes require a valid admin JWT (enforced via Depends(require_admin)).
The frontend's /catalog page reads from data/products.ts (static file) and is
not affected by any changes made through these endpoints.
"""
import uuid
import logging
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from db_models.product import Product
from db_models.user import User
from dependencies.auth import require_admin

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/admin", tags=["admin"])


# ---------------------------------------------------------------------------
# Pydantic schemas (admin product API contracts)
# ---------------------------------------------------------------------------
class ProductCreateRequest(BaseModel):
    name: str
    category: str
    description: Optional[str] = None
    dosage: Optional[str] = None
    pricing: Optional[str] = None


class ProductUpdateRequest(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    dosage: Optional[str] = None
    pricing: Optional[str] = None
    is_active: Optional[bool] = None


class ProductResponse(BaseModel):
    id: uuid.UUID
    name: str
    category: str
    description: Optional[str]
    dosage: Optional[str]
    pricing: Optional[str]
    is_active: bool

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
@router.post("/products", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
async def create_product(
    request: ProductCreateRequest,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
) -> Product:
    product = Product(**request.model_dump())
    db.add(product)
    await db.commit()
    await db.refresh(product)
    logger.info("Product created: id=%s name=%s", product.id, product.name)
    return product


@router.get("/products", response_model=List[ProductResponse])
async def list_products(
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
) -> list:
    result = await db.execute(select(Product).order_by(Product.name))
    return result.scalars().all()


@router.put("/products/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: uuid.UUID,
    request: ProductUpdateRequest,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
) -> Product:
    product = await db.get(Product, product_id)
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found.")
    for field, value in request.model_dump(exclude_unset=True).items():
        setattr(product, field, value)
    await db.commit()
    await db.refresh(product)
    return product


@router.delete("/products/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(
    product_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
) -> None:
    """Soft delete — sets is_active=False. Record is never hard-deleted."""
    product = await db.get(Product, product_id)
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found.")
    product.is_active = False
    await db.commit()
    logger.info("Product soft-deleted: id=%s name=%s", product_id, product.name)
```

**Validation:**
```bash
python -c "from routes.admin import router; print('admin router OK')"
```

**Success criteria:** Prints `admin router OK`.

**Rollback:** Delete `fiddlers_green-backend/routes/admin.py`.

---

### STEP B-10 — Create the Customer Router

**What this step does:** Creates `fiddlers_green-backend/routes/customer.py` — customer-only endpoints for account info and a scaffolded order history. Returns empty array for orders — safe to wire up a future frontend without shape changes.

**Files to create:** `fiddlers_green-backend/routes/customer.py`

**Claude CLI prompt:**
```
Create fiddlers_green-backend/routes/customer.py with exactly this content:

"""
Customer-facing authenticated endpoints.
All routes require a valid customer or admin JWT.
"""
import logging
from typing import List

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from db_models.user import User
from dependencies.auth import require_customer
from models.auth import UserResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/customer", tags=["customer"])


class OrderResponse(BaseModel):
    """
    Scaffold only — order history is not implemented yet.
    Returns an empty list until the orders feature is built.
    Shape is locked so the frontend can be wired safely now.
    """
    id: str
    status: str
    created_at: str


@router.get("/me", response_model=UserResponse)
async def get_my_profile(current_user: User = Depends(require_customer)) -> User:
    """Returns the authenticated customer's profile."""
    return current_user


@router.get("/orders", response_model=List[OrderResponse])
async def get_my_orders(current_user: User = Depends(require_customer)) -> list:
    """
    Returns the customer's order history.
    Currently scaffolded — always returns an empty list.
    """
    logger.debug("Order history requested for user: %s", current_user.email)
    return []
```

**Validation:**
```bash
python -c "from routes.customer import router; print('customer router OK')"
```

**Rollback:** Delete `fiddlers_green-backend/routes/customer.py`.

---

### STEP B-11 — Register Admin & Customer Routers in main.py

**What this step does:** Registers the two new routers. Same minimal change pattern as Step B-8.

**Files to modify:** `fiddlers_green-backend/main.py`

**Claude CLI prompt:**
```
Read fiddlers_green-backend/main.py.

Make exactly these changes and no others:

1. After the existing "from routes.auth import router as auth_router" line, add:
   from routes.admin import router as admin_router
   from routes.customer import router as customer_router

2. After "app.include_router(auth_router)", add:
   app.include_router(admin_router)
   app.include_router(customer_router)

Do not modify any other line.
```

**Validation:**
```bash
docker compose up --build -d
sleep 5

# All existing endpoints still work
curl -s http://localhost:8000/health
curl -s -X POST http://localhost:8000/contact \
  -H "Content-Type: application/json" \
  -d '{"name":"B11 Test","email":"b11@example.com","message":"step b11","inquiry_type":"general"}'

# Admin routes require a token — verify 401 without one
curl -s http://localhost:8000/admin/products
# Expected: HTTP 403 or 401 (not 200)

# Create an admin user directly in the DB for testing
docker compose exec db psql -U fg_user -d fiddlers_green -c \
  "UPDATE users SET role='admin' WHERE email='customer1@example.com';"

# Login to get an admin token
ADMIN_TOKEN=$(curl -s -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"customer1@example.com","password":"securepass123"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")

# Use the admin token to create a product
curl -s -X POST http://localhost:8000/admin/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"name":"Test Gummy","category":"gummies","description":"Phase 15 test","pricing":"$25"}' \
  | python3 -m json.tool
# Expected: product object with id, name, category, etc.

# Verify the frontend is completely unaffected
curl -s http://localhost:3000
# Expected: 200
```

**Success criteria:**
- All existing endpoints return identical responses
- Admin endpoints return 401/403 without a valid admin token
- Admin endpoints work correctly with an admin token
- Frontend loads normally

**Rollback:** Remove the two new imports and `include_router` calls from `main.py`. Delete `routes/admin.py` and `routes/customer.py`.

---

### STEP B-12 — Create the CartItem DB Model

**What this step does:** Adds a `CartItem` SQLAlchemy model to `db_models/`. Each row ties one product (by UUID FK) to one user (by UUID FK) with a quantity. A CHECK constraint enforces `quantity >= 1` at the database level. The model is discovered by Alembic automatically because `db_models/__init__.py` imports it. Relationships are added to `User` and `Product` so SQLAlchemy can cascade deletes correctly.

**Files to create:** `fiddlers_green-backend/db_models/cart.py`
**Files to modify:** `fiddlers_green-backend/db_models/__init__.py`, `fiddlers_green-backend/db_models/user.py`, `fiddlers_green-backend/db_models/product.py`

**Claude CLI prompt:**
```
Create fiddlers_green-backend/db_models/cart.py with exactly this content:

"""
CartItem — one row per (user, product) pair in a user's active cart.
Tied to authenticated users only: user_id is a required FK.
Quantity is always >= 1; enforced by a DB-level CHECK constraint and at
the repository layer.
"""
import uuid
from datetime import datetime, timezone

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


class CartItem(Base):
    __tablename__ = "cart_items"
    __table_args__ = (
        CheckConstraint("quantity >= 1", name="cart_items_quantity_positive"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    product_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("products.id", ondelete="CASCADE"),
        nullable=False,
    )
    quantity: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    added_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    # Relationships (lazy-loaded by default)
    user = relationship("User", back_populates="cart_items", lazy="select")
    product = relationship("Product", back_populates="cart_items", lazy="select")


Then open fiddlers_green-backend/db_models/__init__.py and add this import
at the end of the file, after the existing three imports:

from .cart import CartItem  # noqa: F401

Then open fiddlers_green-backend/db_models/user.py and add this line
inside the User class body, after the updated_at mapped_column declaration:

    cart_items = relationship("CartItem", back_populates="user", cascade="all, delete-orphan")

Then open fiddlers_green-backend/db_models/product.py and add this line
inside the Product class body, after the updated_at mapped_column declaration:

    cart_items = relationship("CartItem", back_populates="product", cascade="all, delete-orphan")

Do not modify any other part of any file.
```

**Validation:**
```bash
cd fiddlers_green-backend
python -c "from db_models.cart import CartItem; print('CartItem model OK')"
python -c "from db_models import CartItem, User, Product; print('all models OK')"
```

**Success criteria:** Both import checks print without error.

**Rollback:** Delete `db_models/cart.py`; remove the `CartItem` import from `db_models/__init__.py`; remove the `cart_items` relationship line from `db_models/user.py` and `db_models/product.py`.

---

### STEP B-13 — Generate and Apply the CartItem Migration

**What this step does:** Generates an Alembic migration file that creates the `cart_items` table with the correct FK constraints and CHECK constraint, then applies it. The existing three tables are unaffected.

**Claude CLI prompt:**
```
Ensure the Docker db container is running (docker compose up -d db).

From inside fiddlers_green-backend/ (or via docker compose exec backend), run:

  alembic revision --autogenerate -m "add_cart_items"

Open the generated file in alembic/versions/ and verify it contains:
- op.create_table("cart_items", ...) with columns: id, user_id, product_id, quantity, added_at
- ForeignKeyConstraint referencing users.id with ondelete="CASCADE"
- ForeignKeyConstraint referencing products.id with ondelete="CASCADE"
- CheckConstraint("quantity >= 1", name="cart_items_quantity_positive")
- An index on user_id
- A downgrade() function containing op.drop_table("cart_items") only —
  confirm it does NOT touch users, products, or contact_submissions

If anything is missing, do not proceed — check that db_models/__init__.py imports CartItem.

Then apply the migration:
  alembic upgrade head
  # Or inside Docker:
  docker compose exec backend alembic upgrade head
```

**Validation:**
```bash
docker compose exec db psql -U fg_user -d fiddlers_green -c "\dt"
# cart_items must appear alongside the existing tables

docker compose exec db psql -U fg_user -d fiddlers_green -c "\d cart_items"
# Verify columns, FK references, and the quantity CHECK constraint

curl -s http://localhost:8000/health
# Must still return {"status":"ok"} — unchanged
```

**Success criteria:**
- `cart_items` table exists with correct columns, FKs, and CHECK constraint
- All existing tables and endpoints are unchanged

**Rollback:**
```bash
docker compose exec backend alembic downgrade -1
# Drops cart_items table only; existing tables are unaffected
```

---

### STEP B-14 — Create the Cart Repository

**What this step does:** Creates `fiddlers_green-backend/repositories/cart.py` — all DB operations for the cart. Routes call only these typed async functions; raw SQL never appears in route handlers.

Three rules enforced here: (1) quantity must be ≥ 1, (2) adding an item that already exists increments quantity rather than creating a duplicate row, (3) removing an item not in the cart is a silent no-op (idempotent).

**Files to create:** `fiddlers_green-backend/repositories/cart.py`

**Claude CLI prompt:**
```
Create fiddlers_green-backend/repositories/cart.py with exactly this content:

"""
Data access layer for CartItem.
All cart DB operations go through this module — no raw SQL in routes.

Rules enforced here:
  - quantity must be >= 1 (validated before write)
  - adding an item already in the cart increments its quantity
  - removing an item not in the cart is a silent no-op (idempotent)
"""
import uuid
import logging
from typing import List

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from db_models.cart import CartItem
from db_models.product import Product

logger = logging.getLogger(__name__)


async def get_cart(session: AsyncSession, user_id: uuid.UUID) -> List[CartItem]:
    """Returns all active cart items for a user, ordered by time added."""
    result = await session.execute(
        select(CartItem)
        .where(CartItem.user_id == user_id)
        .order_by(CartItem.added_at)
    )
    return list(result.scalars().all())


async def add_to_cart(
    session: AsyncSession,
    user_id: uuid.UUID,
    product_id: uuid.UUID,
    quantity: int = 1,
) -> CartItem:
    """
    Adds a product to the cart. If the product is already present,
    increments quantity rather than inserting a duplicate row.
    Raises ValueError if the product does not exist, is inactive, or quantity < 1.
    """
    if quantity < 1:
        raise ValueError("Quantity must be at least 1.")

    # Verify the product exists and is active
    product = await session.get(Product, product_id)
    if product is None or not product.is_active:
        raise ValueError(f"Product {product_id} not found or is unavailable.")

    # Check for an existing row for this user + product pair
    result = await session.execute(
        select(CartItem).where(
            CartItem.user_id == user_id,
            CartItem.product_id == product_id,
        )
    )
    existing = result.scalar_one_or_none()

    if existing:
        existing.quantity += quantity
        await session.commit()
        await session.refresh(existing)
        logger.info(
            "Cart item quantity updated: user=%s product=%s new_qty=%s",
            user_id, product_id, existing.quantity,
        )
        return existing

    item = CartItem(user_id=user_id, product_id=product_id, quantity=quantity)
    session.add(item)
    await session.commit()
    await session.refresh(item)
    logger.info("Cart item added: user=%s product=%s qty=%s", user_id, product_id, quantity)
    return item


async def remove_from_cart(
    session: AsyncSession,
    user_id: uuid.UUID,
    product_id: uuid.UUID,
) -> bool:
    """
    Removes a product from the cart entirely (regardless of quantity).
    Returns True if a row was deleted, False if it was not present.
    """
    result = await session.execute(
        select(CartItem).where(
            CartItem.user_id == user_id,
            CartItem.product_id == product_id,
        )
    )
    item = result.scalar_one_or_none()
    if item is None:
        return False
    await session.delete(item)
    await session.commit()
    logger.info("Cart item removed: user=%s product=%s", user_id, product_id)
    return True
```

**Validation:**
```bash
cd fiddlers_green-backend
python -c "from repositories.cart import get_cart, add_to_cart, remove_from_cart; print('cart repo OK')"
```

**Success criteria:** Prints `cart repo OK`.

**Rollback:** Delete `fiddlers_green-backend/repositories/cart.py`.

---

### STEP B-15 — Create Cart Pydantic Schemas

**What this step does:** Creates `fiddlers_green-backend/models/cart.py` — API request and response shapes for all three cart endpoints. A `field_validator` on `CartAddRequest` mirrors the repository-level quantity check so invalid requests are rejected before touching the DB. No existing Pydantic models are changed.

**Files to create:** `fiddlers_green-backend/models/cart.py`

**Claude CLI prompt:**
```
Create fiddlers_green-backend/models/cart.py with exactly this content:

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
```

**Validation:**
```bash
python -c "from models.cart import CartAddRequest, CartResponse, CartItemResponse; print('cart models OK')"
```

**Success criteria:** Prints `cart models OK`.

**Rollback:** Delete `fiddlers_green-backend/models/cart.py`.

---

### STEP B-16 — Create the Cart Router

**What this step does:** Creates `fiddlers_green-backend/routes/cart.py` — three endpoints (`GET /cart`, `POST /cart/add`, `DELETE /cart/remove`). All three require a valid customer or admin token via `Depends(require_customer)`. No cross-user access is possible: the authenticated user's `id` is always read from the verified token, never from the request body. No existing routes are modified.

**Files to create:** `fiddlers_green-backend/routes/cart.py`

**Claude CLI prompt:**
```
Create fiddlers_green-backend/routes/cart.py with exactly this content:

"""
Shopping cart endpoints — all require authentication.
Customers and admins can both access and modify their own cart.
Cart ownership is enforced by the token: user_id comes from the verified
JWT, never from the request body, so cross-user access is impossible.
"""
import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from db_models.user import User
from dependencies.auth import require_customer
from models.cart import CartAddRequest, CartRemoveRequest, CartResponse
from repositories.cart import add_to_cart, get_cart, remove_from_cart

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/cart", tags=["cart"])


@router.get("", response_model=CartResponse)
async def view_cart(
    current_user: User = Depends(require_customer),
    db: AsyncSession = Depends(get_db),
) -> CartResponse:
    """Returns the authenticated user's current cart."""
    items = await get_cart(session=db, user_id=current_user.id)
    return CartResponse.from_items(items)


@router.post("/add", response_model=CartResponse, status_code=status.HTTP_200_OK)
async def add_item(
    request: CartAddRequest,
    current_user: User = Depends(require_customer),
    db: AsyncSession = Depends(get_db),
) -> CartResponse:
    """
    Adds a product to the cart, or increments quantity if already present.
    Returns the updated full cart.
    """
    try:
        await add_to_cart(
            session=db,
            user_id=current_user.id,
            product_id=request.product_id,
            quantity=request.quantity,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    items = await get_cart(session=db, user_id=current_user.id)
    return CartResponse.from_items(items)


@router.delete("/remove", response_model=CartResponse)
async def remove_item(
    request: CartRemoveRequest,
    current_user: User = Depends(require_customer),
    db: AsyncSession = Depends(get_db),
) -> CartResponse:
    """
    Removes a product from the cart entirely, regardless of quantity.
    Idempotent — removing an item not in the cart returns the unchanged cart.
    """
    await remove_from_cart(
        session=db,
        user_id=current_user.id,
        product_id=request.product_id,
    )
    items = await get_cart(session=db, user_id=current_user.id)
    return CartResponse.from_items(items)
```

**Validation:**
```bash
python -c "from routes.cart import router; print('cart router OK')"
```

**Success criteria:** Prints `cart router OK`.

**Rollback:** Delete `fiddlers_green-backend/routes/cart.py`.

---

### STEP B-17 — Register the Cart Router in main.py

**What this step does:** Registers the cart router with the FastAPI app. Same minimal, additive pattern as Steps B-8 and B-11 — two lines added, nothing else changed.

**Files to modify:** `fiddlers_green-backend/main.py`

**Claude CLI prompt:**
```
Read fiddlers_green-backend/main.py.

Make exactly these changes and no others:

1. After the existing "from routes.customer import router as customer_router" line, add:
   from routes.cart import router as cart_router

2. After "app.include_router(customer_router)", add:
   app.include_router(cart_router)

Do not modify any other line.
```

**Validation:**
```bash
docker compose up --build -d
sleep 5

# Existing endpoints still work
curl -s http://localhost:8000/health
# Expected: {"status":"ok"}

# Cart requires auth — unauthenticated access returns 403
curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/cart
# Expected: 403

# Register and login a test user
curl -s -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"carttest@example.com","password":"CartPass123"}'

CART_TOKEN=$(curl -s -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"carttest@example.com","password":"CartPass123"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")

# View an empty cart
curl -s http://localhost:8000/cart \
  -H "Authorization: Bearer $CART_TOKEN" | python3 -m json.tool
# Expected: {"items": [], "total_items": 0}

# Frontend unchanged
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000
# Expected: 200
```

**Success criteria:**
- All existing endpoints return identical responses
- Unauthenticated `GET /cart` returns 403
- Authenticated `GET /cart` returns `{"items": [], "total_items": 0}` for a new user
- Frontend loads normally

**Rollback:** Remove the `cart_router` import and `include_router` call from `main.py`. Delete `routes/cart.py`.

---

### STEP B-18 — Final Phase 15 Validation

**What this step does:** Full end-to-end smoke test of Phases 14 + 15 — including auth, RBAC, and shopping cart — in a clean Docker environment. Every check must pass before Phase 15 is considered complete.

**Claude CLI prompt:**
```
Run each of the following validation commands in order. Stop and flag any failure.

# 1. Clean rebuild from scratch
docker compose down -v && docker compose up --build -d
sleep 20

# 2. All three containers healthy
docker compose ps

# 3. Existing endpoints unchanged
curl -s http://localhost:8000/health
# Expected: {"status":"ok"}

curl -s -X POST http://localhost:8000/contact \
  -H "Content-Type: application/json" \
  -d '{"name":"Final Test","email":"final@test.com","message":"Phase 15 validation","inquiry_type":"general"}'
# Expected: {"ok": true, ...}

curl -s -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"What gummies do you carry?"}'
# Expected: {"reply": "..."} — non-empty AI reply

# 4. Frontend loads
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000
# Expected: 200

# 5. Register a customer account
curl -s -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"val_customer@test.com","password":"CustomerPass1"}'
# Expected: user object with role "customer"

# 6. Login and capture customer token
CUST_TOKEN=$(curl -s -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"val_customer@test.com","password":"CustomerPass1"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")
echo "Customer token acquired: ${CUST_TOKEN:0:20}..."

# 7. Customer /auth/me
curl -s http://localhost:8000/auth/me \
  -H "Authorization: Bearer $CUST_TOKEN" | python3 -m json.tool
# Expected: {"id":"...","email":"val_customer@test.com","role":"customer",...}

# 8. Customer cannot access admin routes
curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/admin/products \
  -H "Authorization: Bearer $CUST_TOKEN"
# Expected: 403

# 9. Promote to admin and re-login
docker compose exec db psql -U fg_user -d fiddlers_green -c \
  "UPDATE users SET role='admin' WHERE email='val_customer@test.com';"
ADMIN_TOKEN=$(curl -s -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"val_customer@test.com","password":"CustomerPass1"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")
echo "Admin token acquired: ${ADMIN_TOKEN:0:20}..."

# 10. Admin creates a product (required for cart test)
PRODUCT_ID=$(curl -s -X POST http://localhost:8000/admin/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"name":"Validation Gummy","category":"gummies","pricing":"$30","description":"Phase 15 test product"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")
echo "Created product ID: $PRODUCT_ID"

# 11. Confirm product appears in admin list
curl -s http://localhost:8000/admin/products \
  -H "Authorization: Bearer $ADMIN_TOKEN" | python3 -m json.tool
# Expected: array containing the product just created

# 12. Register a dedicated cart test user
curl -s -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"cart_val@test.com","password":"CartPass123"}'
CART_TOKEN=$(curl -s -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"cart_val@test.com","password":"CartPass123"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")
echo "Cart user token acquired: ${CART_TOKEN:0:20}..."

# 13. View empty cart
curl -s http://localhost:8000/cart \
  -H "Authorization: Bearer $CART_TOKEN" | python3 -m json.tool
# Expected: {"items": [], "total_items": 0}

# 14. Add product to cart (quantity: 2)
curl -s -X POST http://localhost:8000/cart/add \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $CART_TOKEN" \
  -d "{\"product_id\": \"$PRODUCT_ID\", \"quantity\": 2}" | python3 -m json.tool
# Expected: {"items": [{"id":"...","product_id":"...","quantity":2,"added_at":"..."}], "total_items": 2}

# 15. Add same product again — quantity must increment, not duplicate
curl -s -X POST http://localhost:8000/cart/add \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $CART_TOKEN" \
  -d "{\"product_id\": \"$PRODUCT_ID\", \"quantity\": 1}" | python3 -m json.tool
# Expected: total_items: 3, items still has exactly 1 row

# 16. Remove product from cart
curl -s -X DELETE http://localhost:8000/cart/remove \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $CART_TOKEN" \
  -d "{\"product_id\": \"$PRODUCT_ID\"}" | python3 -m json.tool
# Expected: {"items": [], "total_items": 0}

# 17. Unauthenticated cart access is rejected
curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/cart
# Expected: 403

# 18. DB sanity — confirm all tables and expected rows
docker compose exec db psql -U fg_user -d fiddlers_green -c "\dt"
# Expected: alembic_version, cart_items, contact_submissions, products, users

docker compose exec db psql -U fg_user -d fiddlers_green -c \
  "SELECT email, role FROM users ORDER BY created_at;"
docker compose exec db psql -U fg_user -d fiddlers_green -c \
  "SELECT name, category, is_active FROM products;"
docker compose exec db psql -U fg_user -d fiddlers_green -c \
  "SELECT COUNT(*) AS cart_rows FROM cart_items;"
# Expected: 0 (item was removed in step 16)

# 19. Public routes require no auth and are unchanged
curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/health
# Expected: 200
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000
# Expected: 200
```

**Success criteria:** All 19 steps produce expected output. Phases 14 and 15, including the shopping cart, are complete.

---

---

# PART 3 — FINAL SAFETY GUARANTEE CHECKLIST

Run this checklist against the live environment after each phase and again after Phase 17 validation.

---

## Frontend Integrity

- [ ] `http://localhost:3000` loads with HTTP 200
- [ ] No console errors in the browser DevTools console
- [ ] `/catalog` renders all product categories and cards
- [ ] `/heritage` renders all sections
- [ ] `/contact` form renders and is interactive
- [ ] `/chat` page renders the chat widget
- [ ] Floating chat FAB is visible and opens/closes correctly
- [ ] Cinematic intro sequence plays on first visit (sessionStorage cleared)
- [ ] `npm run build` completes with no errors from `fiddlers_green-frontend/`
- [ ] `npm run lint` completes with no errors
- [ ] `npx tsc --noEmit` completes with no type errors

## Existing API Responses Unchanged

- [ ] `GET /health` → `{"status":"ok"}` (no fields removed; new fields are acceptable)
- [ ] `POST /contact` with valid body → `{"ok": true, ...}` (same shape as Phase 13)
- [ ] `POST /contact` with invalid body → HTTP 422 (unchanged validation behavior)
- [ ] `POST /chat` with valid body → `{"reply": "<non-empty string>"}` (unchanged)
- [ ] `POST /chat` with empty message → HTTP 422 (unchanged validation behavior)

## Database Correctness

- [ ] `contact_submissions` table exists and contains rows after form submissions
- [ ] `products` table exists (may be empty until admin creates products)
- [ ] `users` table exists and correctly stores bcrypt-hashed passwords (never plaintext)
- [ ] `alembic_version` table reflects the current migration head
- [ ] `alembic upgrade head` can be run repeatedly with no error (idempotent)
- [ ] `alembic downgrade -1` rolls back cleanly and `alembic upgrade head` restores correctly

## Authentication & Authorization

- [ ] `POST /auth/register` creates a customer account with role `customer`
- [ ] `POST /auth/login` returns a valid JWT for both admin and customer accounts
- [ ] `GET /auth/me` returns user info with a valid token; returns 403 without one (FastAPI's `HTTPBearer(auto_error=True)` rejects a *missing* Authorization header with 403, before `get_current_user` ever runs)
- [ ] `GET /admin/products` returns 403 with no token (same `HTTPBearer` behavior as above — not 401; 401 is reserved for a present-but-invalid/expired token, raised manually inside `get_current_user`)
- [ ] `GET /admin/products` returns 403 with a customer token (correct role, wrong permission — `require_admin`'s own check)
- [ ] `GET /admin/products` returns 200 with an admin token
- [ ] `POST /admin/products` creates a product that is visible to `GET /admin/products`
- [ ] `PUT /admin/products/{id}` updates product fields correctly
- [ ] `DELETE /admin/products/{id}` sets `is_active=false` (soft delete); product still exists in DB
- [ ] `GET /customer/me` returns user profile with a valid customer token
- [ ] `GET /customer/orders` returns `[]` (empty array — scaffolded)
- [ ] All `/admin/*` and `/customer/*` routes return 401 for a syntactically valid but expired/invalid-signature/unknown-user Bearer token; 403 for a missing Authorization header or a non-Bearer scheme

## Shopping Cart

- [ ] `GET /cart` returns 403 without a token
- [ ] `GET /cart` returns `{"items": [], "total_items": 0}` for a newly registered user with no items
- [ ] `POST /cart/add` with a valid product ID adds the item and returns the updated cart
- [ ] `POST /cart/add` for the same product a second time increments the quantity (no duplicate row)
- [ ] `DELETE /cart/remove` removes the product; subsequent `GET /cart` returns empty
- [ ] `DELETE /cart/remove` for a product not in the cart returns the unchanged cart (idempotent)
- [ ] `cart_items` table exists in the database with FK constraints on `users.id` and `products.id`
- [ ] The `quantity >= 1` CHECK constraint is present on `cart_items`
- [ ] Cart items are user-scoped: a token for user A cannot read or modify user B's cart
- [ ] `alembic upgrade head` is idempotent across clean rebuilds (`docker compose down -v && up --build`)

## Public Access Unchanged

- [ ] All routes that did not require auth before Phases 14–15 still work without any Authorization header
- [ ] Contact form on the frontend submits successfully without the user being logged in
- [ ] AI chat widget works without the user being logged in
- [ ] Floating chat opens and sends messages without authentication

## Docker Environment

- [ ] `docker compose up --build -d` starts all three containers (frontend, backend, db)
- [ ] `docker compose ps` shows all containers as healthy/running
- [ ] Backend logs show "Migrations complete. Starting server..." on startup
- [ ] No `ERROR` lines in `docker compose logs backend` during normal operation
- [ ] DB container has no data loss across `docker compose restart` (volume persists)
- [ ] `docker compose down` (without `-v`) preserves the `postgres_data` volume
- [ ] `docker compose down -v` removes the volume (clean slate for testing)

## AI Assistant

- [ ] `POST /chat` returns a non-empty `reply` field when Anthropic API key is set
- [ ] `POST /chat` returns HTTP 502 with a clear error detail when the API key is missing or invalid
- [ ] Floating chat widget in the frontend receives and displays the reply correctly
- [ ] `/chat` page's dedicated chat widget also works correctly

## Security Spot-Checks

- [ ] No plaintext password appears in any API response (check `GET /auth/me`, `GET /admin/products`)
- [ ] `JWT_SECRET` is not logged in backend output
- [ ] `.env` file is not committed to git (`git status` shows it as untracked or ignored)
- [ ] `DISABLE_DOCS=true` in production environment blocks `/docs` and `/redoc`
- [ ] `POST /auth/register` with a password shorter than 8 characters → HTTP 422

---

*Document version: Phase 14–16 release (Phases 17–18 split out to `PHASES_17_18_ROADMAP_AND_TUTORIALS.md`). Update this document at the start of Phase 16 (Product Catalog Integration) implementation.*
