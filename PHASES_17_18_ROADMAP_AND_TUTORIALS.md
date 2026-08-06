# Fiddler's Green — Phases 17–18: Production Readiness & Deployment Roadmap

> **Status of existing phases:** Phases 1–16 complete and validated (see `PHASES_14_15_16_ROADMAP_AND_TUTORIALS.md`). Phase 16 (Product Catalog Integration) is complete, satisfying the prerequisite for Phase 17 below.
> This document covers the two production-focused phases — final QA/deploy-readiness and the actual VPS deployment — split out from `PHASES_14_15_16_ROADMAP_AND_TUTORIALS.md` to keep that document focused on application development phases.

---

## TABLE OF CONTENTS

1. [Phase 17 — Final Production Polish + QA + Deploy Ready](#phase-17--final-production-polish--qa--deploy-ready)
2. [Phase 18 — VPS Deployment / DigitalOcean Production](#phase-18--vps-deployment--digitalocean-production)

---

---

# PART 1 — PRODUCTION-FOCUSED PROJECT PHASES

---

## Phase 17 — Final Production Polish + QA + Deploy Ready

**Status: NOT STARTED**
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
