# Fiddler's Green — Phases 17–18: Production Readiness & Deployment Roadmap

> **Status of existing phases:** Phases 1–15.1 complete and validated (see `PHASES_14_15_16_ROADMAP_AND_TUTORIALS.md`). Phase 16 (Product Catalog Integration) is documented there and not yet started; it is the prerequisite for Phase 17 below.
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
| Product catalog display | Playwright | All categories render, no console errors |
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
- Frontend Lighthouse score maintained (no regression from Phase 13 baseline)

### 5. Security Validation

- JWT secret is not the default/example value in any environment
- `/admin/*` returns 403 for a valid customer token
- `/admin/*` returns 401 for no token
- Password is never returned in any API response (assert via test)
- `DISABLE_DOCS=true` confirmed set in production Docker Compose

### 6. Deployment Readiness

- Production `docker-compose.prod.yml` with:
  - `restart: unless-stopped` on all services
  - No `ports` exposed for DB (internal network only)
  - `DISABLE_DOCS=true` for backend
  - `JWT_SECRET` sourced from environment (not hardcoded)
- DB migration run as a one-shot init container before backend starts
- All health checks passing before traffic is accepted
- `NEXT_PUBLIC_SITE_URL` set to real production domain (Phase 18 prerequisite)

---

## Phase 18 — VPS Deployment / DigitalOcean Production

**Status: NOT STARTED**
**Prerequisite:** Phase 17 complete and validated.

> **Placeholder — no detailed technical plan exists yet.** Prior to this
> reorganization, this phase was only ever referenced by name/number
> throughout `PHASES_14_15_16_ROADMAP_AND_TUTORIALS.md` (e.g. "Phase 18
> prerequisite", "Phase 18 targets") — it was never written out as a full
> section there, so there is no existing technical plan to move or preserve
> here. `CLAUDE.md` separately carries a short, currently-inconsistent stub
> under its own "Phase 17 — VPS Deployment with NGINX + Domain + SSL"
> heading (mentions Vercel, not DigitalOcean) that has not yet been
> reconciled with this numbering. A full Phase 18 plan — covering DigitalOcean
> VPS provisioning, Docker production deployment, PostgreSQL production
> database, Nginx reverse proxy, SSL certificates, environment secrets,
> backups, monitoring, and production smoke tests — still needs to be
> written before this phase can begin.

---

---

*Document version: Phase 17–18 split from `PHASES_14_15_16_ROADMAP_AND_TUTORIALS.md` (originally authored as part of that document's "Phase 14–17 initial release"). Update this document once Phase 18's technical plan is written, and again after Phase 18 itself is executed to capture production environment specifics.*
