# Fiddler's Green — Phases 17–18: Production Readiness & Deployment Roadmap

> **Status of existing phases:** Phases 1–17 complete and validated (see `PHASES_14_15_16_ROADMAP_AND_TUTORIALS.md` for Phases 14–16; Phase 17 completion record is in this document below). Phase 17.5 (Final Production Readiness Audit) is the next gate before Phase 18 deployment begins.
> This document covers the production-focused phases — final QA/hardening, the deployment readiness gate, and the actual VPS deployment — split out from `PHASES_14_15_16_ROADMAP_AND_TUTORIALS.md` to keep that document focused on application development phases.

---

## TABLE OF CONTENTS

1. [Phase 17 — Final Production Polish + QA + Deploy Ready](#phase-17--final-production-polish--qa--deploy-ready) ✅ COMPLETE
2. [Phase 17.5 — Final Production Readiness Audit](#phase-175--final-production-readiness-audit)
3. [Phase 18 — VPS Deployment / DigitalOcean Production](#phase-18--vps-deployment--digitalocean-production)

---

---

# PART 1 — PRODUCTION-FOCUSED PROJECT PHASES

---

## Phase 17 — Final Production Polish + QA + Deploy Ready

**Status: COMPLETE**
**Git tag:** Phase 17 completion tag created locally; latest Phase 17 commit pushed.
**Prerequisite:** Phase 16 complete and validated.
**Goal:** End-to-end validation that every system — frontend, backend, database, auth, AI assistant, Docker — is production-ready and mutually consistent.

### 1. Frontend–Backend Contract Validation

- Automated contract test: for each frontend `fetch`/`postJson` call, assert the backend response shape matches exactly (field names, types, optional vs. required)
- `/contact` request body shape verified against `ContactRequest` Pydantic model
- `/chat` request/response verified against `ChatRequest`/`ChatResponse`
- `/health` response verified (must include `"status": "ok"` at minimum)

### 2. End-to-End Testing

| Flow | Tool | Pass Criteria |
|---|---|---|
| Contact form submission | Playwright | 200 response, row in DB, email sent (mocked) |
| AI chat | Playwright | Reply returned, no 5xx |
| Product catalog display (static `/catalog` page) | Playwright | All categories render from `data/products.ts`, no console errors — confirms the pre-existing static catalog is unaffected by Phase 16, by design |
| Product listing from `GET /products` | Playwright | `/cart`'s product listing renders real backend products (name, category, price), no console errors |
| Add-to-cart without a Product ID | Playwright | Clicking "Add to Cart" adds the item; no manual ID/UUID input exists anywhere in the flow |
| Cart enrichment | Playwright | Cart items display product name, category, and a correct line total (`quantity × price`) |
| Cart total correctness | Playwright | `total_price` equals the sum of line totals when every item has a price, and is `null` (shown as "Total unavailable") if any item lacks one |
| Category/search filtering | API (curl or equivalent) | `GET /products?category=X` and `?search=Y` return only matching, active products — validated at the API level only, since no frontend filter UI exists yet |
| Admin login + product update | Playwright | JWT returned, PUT 200, DB reflects change |
| Customer registration + login | Playwright | Tokens returned, `/customer/me` 200 |
| Public routes require no auth | Playwright | All return 200 without Authorization header |

### 3. Error Handling Validation

- Simulate DB offline: frontend contact form must show error UI, not crash
- Simulate Anthropic API unavailable: chat must show graceful error, not white screen
- Invalid JWT: 401 returned, frontend handles without crash (where applicable)
- Expired JWT: 401 returned, frontend prompts re-login (where applicable)

### 4. Performance Checks

- Backend API p99 response time < 300ms for `/health`, `/contact` (without email send), `/auth/login`
- DB query for contact submission INSERT < 20ms
- Frontend Lighthouse score: no numeric Phase 13 baseline was ever recorded (confirmed absent from all Phase 13 documentation), so the earlier "no regression" framing isn't executable as written. Replaced with an explicit target instead of a historical comparison: Performance ≥ 90 (mobile), Accessibility ≥ 95, Best Practices ≥ 95, SEO ≥ 95, run against the production build.

### 5. Security Validation

- JWT secret is not the default/example value in any environment
- `/admin/*` returns 403 for a valid customer token
- `/admin/*` returns 401 for no token
- Password is never returned in any API response (assert via test)
- `DISABLE_DOCS=true` confirmed set in production Docker Compose

### 6. Author `docker-compose.prod.yml`

This is the one **build** task inside an otherwise validation-only phase — called out explicitly so it isn't skipped or assumed to already exist (it does not exist in the repo as of this writing).

Create `docker-compose.prod.yml` at the repo root, based on the existing `docker-compose.yml`, with:
- `restart: unless-stopped` on all services
- No `ports` exposed for `db` (internal network only — already the case in the dev compose file; carry forward)
- `DISABLE_DOCS=true` for the backend
- `JWT_SECRET` sourced from environment (not hardcoded)

### 7. Deployment Readiness Validation

- DB migration runs as a one-shot init container (or via `entrypoint.sh`, as it already does in dev) before the backend starts serving
- All health checks passing before traffic is accepted
- `NEXT_PUBLIC_SITE_URL` set to the real production domain (Phase 18 prerequisite)

### 8. Rollback Verification

- Confirm the previous image tag (or previous git commit's built image) can be redeployed via `docker-compose.prod.yml` and restores service without data loss
- Confirm a failed/bad migration can be reverted with `alembic downgrade -1` without breaking the running application — matches the existing rollback pattern already used for every migration in this project (e.g. Phase 15's B-13, Phase 16's `add_product_price`)

---

### Phase 17 Completion Record

**Completed areas:**

- ✅ **Error Handling** — graceful degradation on DB offline, Anthropic API unavailable; structured error responses throughout; no unhandled exceptions reaching the client
- ✅ **Input Validation Hardening** — Pydantic models tightened; edge cases for malformed UUIDs, empty payloads, and out-of-range quantities confirmed handled at the API layer
- ✅ **Security Review** — JWT secret non-default in all environments; `/admin/*` returns 403/401 correctly; passwords never returned in any response; `DISABLE_DOCS` pattern confirmed
- ✅ **Observability & Logging** — structured logging in place for cart, auth, product, and contact paths; request-scoped errors surfaced correctly; fire-and-forget failures logged without crashing the request
- ✅ **Performance & Efficiency** — response time targets met for `/health`, `/auth/login`, and cart operations; no N+1 query regressions introduced
- ✅ **UX Polish** — loading, error, and empty states consistent across auth, cart, and catalog flows; no flash-of-protected-content; redirect timing correct on auth guard
- ✅ **QA Validation** — all flows below validated end-to-end

**Validated flows:**

| Flow | Result |
|---|---|
| Authentication (register → login → token → `/auth/me`) | ✅ Pass |
| RBAC enforcement (customer token blocked on `/admin/*`) | ✅ Pass |
| Admin CRUD (`POST/GET/PUT/DELETE /admin/products`) | ✅ Pass |
| Cart operations (add, increment, remove, view) | ✅ Pass |
| Cart isolation (user A cannot access user B's cart) | ✅ Pass |
| Gummy variant → cart flow (entry option + strength → UUID → cart) | ✅ Pass |
| Logout + re-login persistence (localStorage cleared on logout) | ✅ Pass |
| Public route validation (no auth required on `/`, `/catalog`, `/heritage`, `/contact`, `/chat`) | ✅ Pass |
| Frontend lint + build (`npm run lint`, `npx tsc --noEmit`, `npm run build`) | ✅ Pass |

**No unfinished implementation work introduced.** Phase 17 was a hardening and validation pass only — no new routes, models, or frontend components were added. All existing API contracts are unchanged.

---

## Phase 17.5 — Final Production Readiness Audit

**Status: NOT STARTED**
**Prerequisite:** Phase 17 complete and validated (it is).
**Purpose:** A final deployment-readiness validation gate. This is not a feature phase. No new features, no architectural refactoring, no infrastructure provisioning. The sole output is a readiness decision: *"Ready to proceed to Phase 18 deployment."*

### Scope

#### 1. Infrastructure Readiness

- `docker-compose.prod.yml` exists and is correct — verify `restart: unless-stopped` on all services, no `ports` exposed for `db`, `DISABLE_DOCS=true`, `JWT_SECRET` sourced from environment
- All required environment variables documented and present for a production deployment (no runtime surprises)
- Secrets handling confirmed — no secrets in committed files, `.env` excluded by `.gitignore`, all secret values sourced from environment injection only
- Health checks configured and passing for all services before traffic is accepted
- Container restart behavior verified — services recover after a crash without manual intervention
- Volume persistence confirmed — `postgres_data` volume survives container restarts and `docker compose down` (without `-v`)
- Database migration behavior confirmed — `entrypoint.sh` runs `alembic upgrade head` before uvicorn starts; graceful degradation if DB is temporarily unavailable at startup

#### 2. Deployment Readiness

- Production build verified — `npm run build` against the production environment config produces a clean, deployable artifact
- Production startup verified — `docker compose -f docker-compose.prod.yml up --build` starts all services healthy with no errors in logs
- Missing environment variable behavior confirmed — backend logs a clear warning and refuses to issue tokens if `JWT_SECRET` is absent; frontend falls back to same-host port 8000 if `NEXT_PUBLIC_BACKEND_URL` is unset
- Rollback procedure documented and confirmed executable — previous image tag or git commit can be redeployed via `docker-compose.prod.yml` without data loss; `alembic downgrade -1` verified operable
- Backup strategy confirmed or explicitly accepted as out-of-scope for Phase 18 initial deployment

#### 3. Security Final Review

- Confirm no secrets committed — `git log --all -- '*.env'` and `git log --all -- '.env'` return no matches with real values
- `.env` exclusion confirmed in `.gitignore` for both frontend and backend
- Production CORS reviewed — `FRONTEND_URL` env var set to the real production domain; `localhost:3000` not present in production allowed origins
- Authentication configuration reviewed — `JWT_SECRET` is a strong random value (not the default empty string or a simple test value); `JWT_ACCESS_TOKEN_EXPIRE_MINUTES` is appropriate for production
- JWT issuer claim (`fiddlers-green`) confirmed present and validated on decode
- Admin controls reviewed — no admin account with a weak password exists in the production DB before go-live

#### 4. Operational Readiness

- Logs are readable — structured log output is confirmed parseable for the failure scenarios most likely in production (DB unavailable, expired JWT, invalid product UUID on cart add)
- Monitoring expectations documented — even if no external monitoring tool is connected at Phase 18 launch, the team understands what to watch (container health, `/health` endpoint, DB connectivity)
- Failure scenarios understood — the following failure modes have known, documented behaviors:
  - DB offline at startup → backend starts, returns 503 on DB-dependent routes, recovers when DB returns
  - Anthropic API unavailable → `/chat` returns a graceful 502 error message, no crash
  - Expired JWT → 401 returned, frontend `AuthContext` clears token and redirects to `/login`
  - Cart add with invalid product UUID → 404 returned, frontend shows error state

### Readiness Decision

Phase 17.5 concludes with one of:

- **READY** — all checklist items above confirmed; proceed to Phase 18.
- **NOT READY** — specific blocking items listed; resolve and re-audit before Phase 18 begins.

Phase 17.5 must not introduce new features, refactor architecture, add infrastructure prematurely, or optimize code unrelated to the items above. Any issue discovered that requires a code change is a regression fix (handled before Phase 17.5 closes) or a deferred item (explicitly accepted and documented as out-of-scope for the initial Phase 18 deployment).

---

## Phase 18 — VPS Deployment / DigitalOcean Production

**Status: NOT STARTED**
**Prerequisite:** Phase 17 complete and validated.

### Deployment Target — Resolved

**DigitalOcean VPS**, not Vercel. This document's own title and every prior
placeholder note already assumed DigitalOcean-specific infrastructure (VPS
provisioning, Nginx reverse proxy, SSL certificates) — none of which apply
to Vercel's fully-managed model. The only place still naming Vercel is
`CLAUDE.md`'s separate, older "Phase 17 — VPS Deployment with NGINX + Domain
+ SSL" stub, which predates this document's DigitalOcean framing and has
not been reconciled — that file is not modified as part of this update;
flagging it as a required follow-up.

### 1. Provisioning

- DigitalOcean Droplet: Ubuntu LTS, minimum 2 vCPU / 4GB RAM (running Postgres + FastAPI + Next.js in Docker concurrently)
- SSH key authentication only — disable password auth
- UFW firewall: allow only 22 (SSH), 80 (HTTP), 443 (HTTPS)
- Install Docker Engine + Docker Compose plugin (DigitalOcean's official Docker install script, or the upstream Docker apt repository)

### 2. Docker Setup

- Use the `docker-compose.prod.yml` authored in Phase 17, with one addition: an `nginx` service (see Nginx Config below)
- Build images directly on the droplet from the deployed repo checkout — simplest path, no container registry required at this scale; a registry/CI pipeline can be added later without changing this phase's scope
- No ports published for `db` — internal Docker network only, matching the existing dev `docker-compose.yml` pattern

### 3. Database Setup

- Default: PostgreSQL continues running as a Docker service (`postgres:15-alpine`, matching the current dev setup) with a named volume for persistence — lowest new complexity, consistent with the existing architecture
- Alternative to consider, not required for this phase: DigitalOcean Managed Postgres, which removes self-managed backup/failover responsibility at additional monthly cost — flagged as a future upgrade path, not a Phase 18 requirement
- Migrations: `alembic upgrade head` runs the same way it already does via `entrypoint.sh` — no change to the existing migration strategy

### 4. Nginx Config

Per `docker-compose.yml`'s own existing comment (written in Phase 11): *"once a domain is available, an Nginx service will front both of these on 80/443 and route by path — e.g. `domain.com` → frontend, `domain.com/api` → backend."* This phase implements exactly that:
- `domain.com/*` → proxied to the `frontend` container (port 3000)
- `domain.com/api/*` → proxied to the `backend` container (port 8000), with the `/api` prefix stripped before forwarding
- **Required frontend build-arg change:** `NEXT_PUBLIC_BACKEND_URL` must be explicitly set to `https://domain.com/api` at build time — `lib/api.ts`'s existing fallback (same-hostname, port 8000) only works when frontend and backend are reached directly by port, which stops being true once Nginx fronts both on 80/443

### 5. SSL Setup

- **Method: Certbot with the Let's Encrypt Nginx plugin** (`certbot --nginx`) — free, automated, requires no manual certificate purchase or renewal
- Auto-renewal via Certbot's default systemd timer (installed automatically with the package) — no custom cron job needed
- Validate auto-renewal with `certbot renew --dry-run` before considering this step complete

### 6. Environment Variables

- Production `fiddlers_green-backend/.env` and `fiddlers_green-frontend/.env.local` populated with real values, copied onto the server out-of-band (scp/manual — never via git, matching the existing `.gitignore` pattern for these files)
- `JWT_SECRET`: freshly generated for production (`python -c "import secrets; print(secrets.token_hex(32))"`, per the existing convention from Phase 15's B-2) — never reused from any dev/test value
- `DATABASE_URL`: points at the production `db` service
- `ANTHROPIC_API_KEY`, SMTP credentials: real production values
- `NEXT_PUBLIC_SITE_URL` and `NEXT_PUBLIC_BACKEND_URL`: set to the real domain (see Nginx Config above)
- `DISABLE_DOCS=true` (carried forward from Phase 17's `docker-compose.prod.yml`)

### 7. Deployment Steps

1. Clone (or pull the latest) repository onto the droplet
2. Copy production `.env`/`.env.local` files onto the server (never committed)
3. `docker compose -f docker-compose.prod.yml up --build -d`
4. Confirm all containers report healthy (`docker compose ps`)
5. Point the domain's DNS A record at the droplet's IP address
6. Run Certbot to issue the SSL certificate (see SSL Setup above)
7. Reload Nginx to pick up the new certificate

### 8. Smoke Tests

Run the same categories already exercised in Phase 17's e2e suite, once, directly against the live production URL (not `localhost`):
- `/health` returns 200
- Register, login, JWT issuance
- `GET /products` returns real data
- Full cart flow (add, view, remove) against production data
- Admin login and product creation
- Contact form — with **real** SMTP credentials this time (unlike local dev, where blank SMTP config causes an expected 502, documented since Phase 14)
- AI chat returns a real reply

**Not detailed in this pass** (named in earlier drafts of this phase, intentionally out of scope for this update): backups, monitoring. Carried forward as topics still needing their own plan before Phase 18 is fully specified end-to-end.

---

---

*Document version: Phase 17–18 plan complete (this revision) — Phase 18 expanded from a placeholder into a full DigitalOcean VPS deployment plan; Phase 17's e2e suite updated for Phase 16 coverage. Update this document again after Phase 17 and Phase 18 are actually executed, to capture real production environment specifics and any deviations found during execution.*
