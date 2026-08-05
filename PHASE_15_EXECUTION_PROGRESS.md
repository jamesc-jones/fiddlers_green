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

## Pending

- [ ] B-4 — Create the User Repository
- [ ] B-5 — Create Auth Pydantic Schemas
- [ ] B-6 — Create FastAPI Auth Dependencies
- [ ] B-7 — Create the Auth Router
- [ ] B-8 — Register the Auth Router in main.py
- [ ] B-9 — Create the Admin Product Router
- [ ] B-10 — Create the Customer Router
- [ ] B-11 — Register Admin & Customer Routers in main.py
- [ ] B-12 — Create the CartItem DB Model
- [ ] B-13 — Generate and Apply the CartItem Migration
- [ ] B-14 — Create the Cart Repository
- [ ] B-15 — Create Cart Pydantic Schemas
- [ ] B-16 — Create the Cart Router
- [ ] B-17 — Register the Cart Router in main.py
- [ ] B-18 — Final Phase 15 Validation
