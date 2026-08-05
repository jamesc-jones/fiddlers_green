# Phase 15 Execution Progress

Tracks actual execution of `PHASES_14_15_16_ROADMAP_AND_TUTORIALS.md`'s Tutorial B
(Authentication, Role-Based Access Control, and Shopping Cart) against this repo.
Step titles below are copied verbatim from that document's `### STEP B-N` headings.

## Completed

- [x] B-1 — Add Auth Dependencies
  Commit: `4b8639b`
  Validation: python-jose installed; passlib[bcrypt] installed; bcrypt pinned at 3.2.2;
  bcrypt hash()/verify() round-trip succeeded; pydantic[email] preserved with no downgrade.

- [x] B-2 — Add JWT Environment Variables
  Commit: `a2cca20`
  Validation: `JWT_SECRET`, `JWT_ALGORITHM`, `JWT_ACCESS_TOKEN_EXPIRE_MINUTES` added to
  `.env` and `.env.example`; `docker compose config` resolves all three with real
  values and no blank-secret warning.
  Deviation note: the tutorial's literal instruction to also add
  `JWT_SECRET: ${JWT_SECRET}` etc. to `docker-compose.yml`'s backend `environment:`
  block was **not applied**. That block's `${VAR}` syntax resolves from a root-level
  `.env`/shell environment, which doesn't exist here, so it evaluated to an empty
  string — and since `environment:` overrides `env_file:` in Compose, it would have
  silently blanked out the correct value already supplied via
  `env_file: ./fiddlers_green-backend/.env` (the same mechanism `ANTHROPIC_API_KEY`
  and `SMTP_*` already rely on with no override). `docker-compose.yml` is therefore
  unchanged from its Phase 14 state.

## Completed (continued)

- [x] B-3 — Create the Auth Service
  Commit: `7898bdd`
  Validation: `python -c "from services.auth_service import hash_password, verify_password; ..."`
  printed `auth_service OK` — bcrypt hash/verify round-trip succeeded via the backend's
  `.venv` interpreter.
  Risk flagged (not fixed in this step): `main.py` imports `routes.chat`/`routes.contact`
  *before* calling `load_dotenv()`. `auth_service.py` reads `JWT_SECRET` at import time
  with no `load_dotenv()` of its own — identical in shape to the Phase 10 bug that
  required adding `load_dotenv()` to `ai_service.py`. Not an issue yet (nothing imports
  `auth_service` yet), but will need the same fix once a future step (B-6/B-7) wires an
  auth router into `main.py`'s import chain. Watch for this at that step's validation.

- [x] B-4 — Create the User Repository
  Commit: `a7df210`
  Validation: `python -c "from repositories.user import get_user_by_email; print('user repo OK')"`
  printed `user repo OK` via the backend's `.venv` interpreter. `DATABASE_URL is not set`
  and `JWT_SECRET is not set` warnings are expected (no `load_dotenv()` in this
  standalone invocation) and match established Phase 14 warn-not-crash behavior — not
  a regression.
  Verified before writing: `db_models/user.py`'s `User` model already has `id`, `email`,
  `password_hash`, `role` fields matching this repository's usage exactly (scaffolded
  in Phase 14, unmodified here).

- [x] B-5 — Create Auth Pydantic Schemas
  Commit: `bd1e239`
  Validation: `python -c "from models.auth import RegisterRequest, LoginRequest, TokenResponse; print('auth models OK')"`
  printed `auth models OK` via the backend's `.venv` interpreter, no warnings (module
  has no `.env`-dependent state, unlike auth_service/user repository).
  Verified before writing: `EmailStr` support confirmed present (`email_validator`
  importable), Pydantic 2.13.4 in use; `models/contact.py` and `models/chat.py`
  unchanged.

- [x] B-6 — Create FastAPI Auth Dependencies
  Commit: `9a70c98`
  Validation: `python -c "from dependencies.auth import get_current_user, require_admin; print('auth deps OK')"`
  printed `auth deps OK` via the backend's `.venv` interpreter. `DATABASE_URL is not set`
  and `JWT_SECRET is not set` warnings are the same expected/benign ones seen in B-4 —
  standalone invocation, no `load_dotenv()` — and are not the previously-flagged
  `main.py` import-order risk manifesting, since `main.py` is untouched by this step.
  `dependencies/auth.py` is not imported anywhere yet (no route wiring until B-7/B-8).

- [x] B-7 — Create the Auth Router
  Commit: `389f6e0`
  Validation: `python -c "from routes.auth import router; print('auth router OK')"`
  printed `auth router OK` via the backend's `.venv` interpreter. Same expected/benign
  `DATABASE_URL`/`JWT_SECRET` warnings as B-4/B-6 (standalone invocation, no
  `load_dotenv()`). `main.py` still untouched — the previously-flagged import-order
  risk does not manifest yet.
  Correction to the B-3 note: `main.py` isn't wired to the auth router until **B-8**
  specifically (not "B-6/B-7" as originally guessed before the full tutorial was read)
  — B-7 only creates `routes/auth.py`, it does not register it.

- [x] B-8 — Register the Auth Router in main.py
  Commit: `7fd87d2`
  Validation: full `docker compose up --build -d` against real Postgres. `GET /health`
  → `{"status":"ok"}` (unaffected). `POST /auth/register` → created user with correct
  `UserResponse` shape. `POST /auth/login` → valid JWT with `token_type: "bearer"`.
  `GET /auth/me` with that token → correct profile. All four confirmed against the
  live container, not just import-level checks.
  Risk resolution (previously flagged in B-3/B-6/B-7): confirmed via
  `docker exec fiddlers-backend printenv JWT_SECRET` and
  `docker exec fiddlers-backend python -c "import services.auth_service as a; print(repr(a.JWT_SECRET))"`
  that the real secret is present in both the container's OS environment and the
  imported module — **the risk does not manifest in the Docker deployment.** Root
  cause: `docker-compose.yml`'s `env_file: ./fiddlers_green-backend/.env` on the
  `backend` service injects `JWT_SECRET` into the container's OS-level environment
  before the Python process starts at all, so `os.getenv("JWT_SECRET")` at import time
  sees the real value regardless of import order relative to `main.py`'s
  `load_dotenv()` call. `load_dotenv()` is redundant for the Docker path specifically —
  it would only be load-bearing for a bare `uvicorn main:app` run directly on the host
  with no other env-var source. Not fixed because there was nothing to fix; recorded so
  this isn't misremembered as a resolved bug rather than a non-issue.

- [x] B-9 — Create the Admin Product Router
  Commit: `83c4eda`
  Validation: `python -c "from routes.admin import router; print('admin router OK')"`
  printed `admin router OK` via the backend's `.venv` interpreter. Same expected/benign
  `DATABASE_URL`/`JWT_SECRET` warnings as prior standalone-import validations.
  Verified before writing: `db_models/product.py`'s `Product` model already has `id`,
  `name`, `category`, `description`, `dosage`, `pricing`, `is_active` matching this
  router's usage exactly (scaffolded in Phase 14, unmodified here). Not registered in
  `main.py` yet — that's B-11. `data/products.ts`-driven frontend catalog is untouched.

- [x] B-10 — Create the Customer Router
  Commit: `4bd8603`
  Validation: `python -c "from routes.customer import router; print('customer router OK')"`
  printed `customer router OK` via the backend's `.venv` interpreter. Same
  expected/benign `DATABASE_URL`/`JWT_SECRET` warnings as prior standalone-import
  validations. Not registered in `main.py` yet — that's B-11, alongside admin.py.

## Pending

- [ ] B-11 — Register Admin & Customer Routers in main.py
- [ ] B-12 — Create the CartItem DB Model
- [ ] B-13 — Generate and Apply the CartItem Migration
- [ ] B-14 — Create the Cart Repository
- [ ] B-15 — Create Cart Pydantic Schemas
- [ ] B-16 — Create the Cart Router
- [ ] B-17 — Register the Cart Router in main.py
- [ ] B-18 — Final Phase 15 Validation
