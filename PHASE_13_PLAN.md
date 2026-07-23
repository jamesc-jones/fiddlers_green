# Phase 13 — Final Production Polish & QA (Deployment Readiness)
## Execution Plan for Claude CLI

**Status:** READY TO EXECUTE  
**Scope:** Move from "feature-complete application" to "deployment-ready production candidate"  
**Hard boundary:** Phase 13 ends when the build is clean, the app is hardened, and docs are complete.  
VPS, NGINX, SSL, and domain setup belong exclusively to Phase 14.

---

## Phase 13 Objective Summary

Phases 1–12 delivered a feature-complete, Dockerized, full-stack application. Phase 13 closes the gap between "it works" and "it is ready to ship." Specifically:

- Every page has correct, distinct metadata for SEO and social sharing
- The HTML document structure is valid (no nested `<main>` elements)
- The backend validates inputs strictly and does not expose development tooling in production
- The environment configuration is complete, documented, and safe
- The codebase passes all quality gates with zero warnings
- A final checklist confirms deployment readiness

No new features are introduced. No working code is refactored without cause. Every change is validated before the next step begins.

---

## Recommended Execution Order

Execute sections in this order. Each section is a prerequisite for the next.

```
1. Repository Health Review         (audit only — no edits)
2. Production Configuration Review  (edits to config and env files)
3. Next.js Production Optimization  (edits to app/ files)
4. Accessibility Final Audit        (edits to components/)
5. Performance Review               (edits to next.config.ts)
6. Security Review                  (edits to backend)
7. Cross-Browser / Responsive QA    (code audit — no browser required)
8. Final Production Checklist       (verification pass — no edits)
```

---

## Claude CLI Execution Strategy

**Claude CLI must not execute this plan as a single operation.**

This document is approximately 1,000 lines. Attempting to execute it end-to-end in one session risks context loss, missed validation steps, and changes that span multiple logical units without intermediate commits. The correct approach is incremental — one section per session, validated and committed before the next begins.

### How to execute

Provide Claude CLI with one section at a time using the following prompt structure:

```
You are executing Phase 13 of the Fiddler's Green project.
Read PHASE_13_PLAN.md and execute [SECTION NAME] only.
Do not proceed beyond this section.
When complete: run validation commands, confirm definition of done, then stop.
```

Replace `[SECTION NAME]` with the section heading exactly as it appears in this document.

### Incremental session breakdown

Execute in this order, one session per section:

**Session 0 — Pre-execution baseline**
Prompt: "Execute the Pre-Execution Requirement section of PHASE_13_PLAN.md. Resolve all pending git state. Do not begin Section 1."
Exit condition: `git status` is clean. All pre-phase commits landed.

**Session 1 — Repository & configuration audit**
Prompt: "Execute Section 1 (Repository Health Review) and Section 2 (Production Configuration Review) of PHASE_13_PLAN.md."
Exit condition: Both definitions of done are met. Configuration changes committed.

**Session 2 — HTML structure & SEO corrections**
Prompt: "Execute Section 3 (Next.js Production Optimization) of PHASE_13_PLAN.md."
Exit condition: No nested `<main>` elements. Metadata, sitemap, robots.txt present. Build passes. Changes committed.

**Session 3 — Backend validation hardening**
Prompt: "Execute Section 6 (Security Review) of PHASE_13_PLAN.md. Scope is limited to the backend scope constraint defined in Issue 6.2."
Exit condition: `inquiry_type` validated. Docs disabled via env var. `/contact` returns 422 on invalid type. Changes committed.

**Session 4 — Accessibility & responsive review**
Prompt: "Execute Section 4 (Accessibility Final Audit) and Section 7 (Cross-Browser / Responsive QA) of PHASE_13_PLAN.md."
Exit condition: ARIA attributes confirmed or added. Responsive audit complete. Changes committed if any.

**Session 5 — Performance review**
Prompt: "Execute Section 5 (Performance Review) of PHASE_13_PLAN.md."
Exit condition: Build output reviewed. `next.config.ts` hardened. Changes committed.

**Session 6 — Final QA checklist**
Prompt: "Execute Section 8 (Final Production Checklist) of PHASE_13_PLAN.md. Run all validation commands. Update CLAUDE.md. Confirm all 11 Phase 13 completion conditions are met."
Exit condition: All checklist items pass. CLAUDE.md updated. Final commit pushed to `main`.

### Critical guardrails for Claude CLI

- **Inspect before editing.** Read the current state of every file before making any change. Never assume a file matches what the plan describes.
- **One section at a time.** When a session's section is complete, stop. Do not automatically begin the next section.
- **Validate after every file change.** Run `npx tsc --noEmit` after each TypeScript edit. Run `npm run lint` after each session. Run `npm run build` at the end of each frontend section.
- **Do not refactor working code.** If a file works correctly and the plan does not explicitly call for a change to it, leave it alone.
- **Do not touch Phase 14 scope.** VPS, NGINX, SSL, domain, server provisioning — none of this belongs in Phase 13. If a change feels like deployment, stop and re-read the plan boundary.
- **The backend scope constraint is absolute.** For Issue 6.2, the only file that changes is `models/contact.py`. Any impulse to touch other backend files for this issue is out of scope.

---

## Pre-Execution Requirement — Baseline Cleanliness

**This step must be completed before any Phase 13 work begins. It is not optional.**

Phase 13 makes targeted, reviewable changes to specific files. If unrelated changes are mixed in — from prior exploration, testing sessions, or tooling artifacts — the final commit will be unclear, the diff will be untrustworthy, and rollback will be difficult.

**Step 0.1 — Run `git status` and read every entry**

```bash
git status
```

Do not proceed if the working tree is dirty. Read each modified or untracked file and categorize it:

- **Phase 13 work** (files this plan explicitly touches): these should not exist yet, because Phase 13 has not started.
- **Unrelated application changes** (e.g. `docker-compose.yml` edits, config tweaks made during testing): review carefully. If they are correct and complete, commit them separately with a descriptive message before Phase 13 begins. If they are uncertain or experimental, stash them.
- **Temporary tooling artifacts** (e.g. `.playwright-mcp/` directories, screenshot outputs, test result files): do not commit these. Add them to `.gitignore` or delete them.
- **This plan file** (`PHASE_13_PLAN.md`): this document is a planning artifact, not application code. It should be committed separately from any application changes made during Phase 13. Commit it now if it is uncommitted, so the application change commits remain clean.

**Step 0.2 — Handle each category**

For unrelated committed changes already in the working tree:
```bash
git add <specific-file>
git commit -m "chore: <description of what this fixes, unrelated to Phase 13>"
```

For temporary artifacts to ignore:
```bash
echo ".playwright-mcp/" >> .gitignore
git add .gitignore
git commit -m "chore: ignore playwright-mcp test artifacts"
```

For the plan file if uncommitted:
```bash
git add PHASE_13_PLAN.md
git commit -m "docs: add Phase 13 execution plan"
```

**Step 0.3 — Confirm clean baseline**

```bash
git status
```

Expected output: `nothing to commit, working tree clean`

Do not begin Section 1 until this is true.

> **Required Pre-Execution Commits — Explicit Rules**
>
> These three rules are non-negotiable. Each maps to a specific artifact that must be resolved before Phase 13 implementation begins.
>
> **Rule A — `PHASE_13_PLAN.md` is a documentation artifact.**
> It must be committed separately from any application code changes. Use the commit message `docs: add Phase 13 production polish plan`. Never bundle it with a `fix:` or `feat:` application commit.
>
> **Rule B — `docker-compose.yml` pending changes must be reviewed in isolation.**
> Any modifications to `docker-compose.yml` that exist before Phase 13 starts are unrelated to Phase 13 unless this plan explicitly calls for them. Read the diff, confirm intent, and commit separately with `chore: improve docker health checks` (or an accurate description). If the changes are uncertain, stash them and investigate before proceeding.
>
> **Rule C — `.playwright-mcp/` and similar test artifacts must not enter the repository.**
> These are temporary outputs from browser automation or testing sessions. They must be added to `.gitignore` and deleted from the working tree — not committed. Use:
> ```bash
> echo ".playwright-mcp/" >> .gitignore
> rm -rf .playwright-mcp/
> git add .gitignore
> git commit -m "chore: ignore playwright-mcp test artifacts"
> ```
> Apply the same treatment to any other tool-generated directories that appear in `git status` but are not application code.

---

## Recommended Commit Strategy

Phase 13 must produce a clean, readable git history. Each commit should represent one logical unit of work that can be reviewed, reverted, or cherry-picked independently. Do not batch unrelated changes into a single commit.

### Pre-Phase 13 commits (before implementation begins)

These commits resolve pre-existing working-tree state and must land before any Phase 13 application changes.

| Commit message | Contains | Condition |
|---|---|---|
| `docs: add Phase 13 production polish plan` | `PHASE_13_PLAN.md` only | If uncommitted |
| `chore: ignore playwright-mcp test artifacts` | `.gitignore` update only | If `.playwright-mcp/` present |
| `chore: improve docker health checks` | `docker-compose.yml` only | If unrelated docker changes pending; review diff first |

### Phase 13 implementation commits

Commit at the end of each logical section. Application changes from one section must not be bundled with another section's changes. Suggested commit messages:

| After completing | Suggested commit message |
|---|---|
| Section 1 (audit only) | No commit — audit makes no changes |
| Section 2 (config + env files) | `chore: complete environment configuration and env.example documentation` |
| Section 3 (HTML structure + SEO) | `fix: resolve nested main elements and add per-route metadata, sitemap, robots.txt` |
| Section 4 (accessibility) | `fix: add missing ARIA attributes and keyboard navigation to Navbar` |
| Section 5 (performance) | `chore: harden next.config.ts for production` |
| Section 6 (backend security) | `fix: add inquiry_type validation and disable FastAPI docs in production` |
| Section 7 (responsive audit) | No commit if audit-only; if fixes made: `fix: resolve responsive layout issues at mobile viewports` |
| Section 8 (final QA + CLAUDE.md) | `docs: mark Phase 13 complete in CLAUDE.md` |

### Rules
- Never use `git add -A` for Phase 13 commits — always `git add <specific-file>` to keep diffs precise.
- Run `git diff --staged` before every commit to confirm only the intended files are included.
- Push to `main` only after the full Phase 13 checklist passes (Section 8).

---

## Section 1 — Repository Health Review

### Objective
Confirm the repository is in a clean, fully committed state before any edits begin. Identify any documentation gaps.

### Files to inspect
- `.git/` (status only — do not edit)
- `CLAUDE.md`
- `fiddlers_green-frontend/` (directory listing)
- `fiddlers_green-backend/` (directory listing)

### Inspection steps

**Step 1.1 — Confirm clean working tree**

Run from the repo root:
```bash
git status
git log --oneline -8
```

Expected: `nothing to commit, working tree clean`. All Phase 1–12 work should appear in the log. If there are uncommitted changes, commit them with an appropriate message before proceeding. Do not proceed with a dirty working tree.

**Step 1.2 — Confirm branch state**

```bash
git branch
git remote -v
```

Expected: on `main`, with `origin` pointing to the correct remote. If on a feature branch, merge or note — do not switch branches mid-phase.

**Step 1.3 — Audit the `sections/` directory**

```bash
ls fiddlers_green-frontend/sections/
```

CLAUDE.md documents `sections/` as "still an empty placeholder directory." Confirm it is empty. If empty, it serves no purpose and should be removed to avoid confusion — `git rm -r fiddlers_green-frontend/sections/` is safe. If it has content, stop and read those files before proceeding.

**Step 1.4 — Verify CLAUDE.md current state**

Read `CLAUDE.md` lines 45–78. Confirm "Current state" section correctly lists:
- Phase 12 as the latest completed milestone
- All component directories including `components/FloatingChat/` and `components/Footer.tsx`
- `hooks/useChatMessages.ts` in the data layer section
- Phase 13 as "NOT STARTED" (will be updated at phase close)

**Step 1.5 — Check for stray files**

```bash
find . -name "*.env" -not -path "*/node_modules/*" -not -path "*/.next/*"
find . -name ".DS_Store"
```

No `.env` files (other than `.env.example` files) should appear. If any do, confirm they are gitignored and do not appear in `git status`.

### Rollback
This section is audit-only. No rollback needed.

### Definition of done
- `git status` is clean
- On `main` branch
- `sections/` is removed or documented
- CLAUDE.md current state section is accurate

---

## Section 2 — Production Configuration Review

### Objective
Ensure all environment variables are documented, the `.env.example` files are complete and correct, and no secrets appear in committed code.

### Files to inspect
- `fiddlers_green-frontend/.env.example`
- `fiddlers_green-backend/.env.example`
- `fiddlers_green-frontend/.gitignore`
- `docker-compose.yml`
- `fiddlers_green-backend/main.py`
- `fiddlers_green-frontend/lib/api.ts`

### Inspection steps

**Step 2.1 — Audit frontend `.env.example`**

Read `fiddlers_green-frontend/.env.example`. Current content:
```
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

This is the only frontend environment variable. Confirm it is complete. Add a comment line above it explaining its purpose and what value to set in production (the full backend URL, e.g. `https://api.fiddlersgreen.ca`). The comment should note that leaving it blank in the Docker build is intentional — `lib/api.ts` falls back to the same host at runtime.

**Step 2.2 — Audit backend `.env.example`**

Read `fiddlers_green-backend/.env.example`. Current content:
```
ANTHROPIC_API_KEY=
EMAIL_TO=
SMTP_FROM=
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASSWORD=
FRONTEND_URL=
```

Each variable needs a comment explaining its purpose. Specifically:
- `SMTP_PORT` should note the expected value (587 for STARTTLS, 465 for SSL)
- `FRONTEND_URL` should note it controls CORS — set to the production domain (e.g. `https://fiddlersgreen.ca`). Missing or wrong values will cause browser CORS errors in production.
- `ANTHROPIC_API_KEY` should note it is required — the `/chat` endpoint fails silently without it.

Add comments directly in the `.env.example` file. Do not add real values.

**Step 2.3 — Audit `docker-compose.yml` for `.env.local` reference**

Read `docker-compose.yml`. The frontend service currently uses:
```yaml
env_file:
  - ./fiddlers_green-frontend/.env.local
```

This file is not committed (gitignored) and has no corresponding `.env.local.example`. If `docker-compose up` is run on a fresh clone, it will fail because `.env.local` does not exist.

Two acceptable fixes — choose one:
- **Option A:** Change `env_file` to `./fiddlers_green-frontend/.env` and document in `.env.example` that Docker expects this file at that path. Also create `fiddlers_green-frontend/.env.example` with the same content.
- **Option B:** Add a note to `docker-compose.yml` (as a comment) instructing users to create `.env.local` by copying `.env.example`, and add a `fiddlers_green-frontend/.env.local.example` file documenting the expected values.

Inspect before deciding. Read how `fiddlers_green-frontend/.gitignore` handles `.env*` to choose the right approach without accidentally committing a secret file.

**Step 2.4 — Scan committed code for hardcoded secrets**

```bash
grep -r "ANTHROPIC_API_KEY" fiddlers_green-frontend/
grep -r "SMTP" fiddlers_green-frontend/
grep -rn "sk-ant" . --include="*.ts" --include="*.tsx" --include="*.py" --include="*.js"
```

None should appear in committed source files. `ai_service.py` reads the key via `os.getenv()` after `load_dotenv()` — confirm this is the only location.

**Step 2.5 — Verify `NEXT_PUBLIC_*` vars are all intentionally public**

The only `NEXT_PUBLIC_` variable is `NEXT_PUBLIC_BACKEND_URL`. It holds a URL, not a secret — correct. `NEXT_PUBLIC_SITE_URL` is used in `app/layout.tsx` via `process.env.NEXT_PUBLIC_SITE_URL` but is not in `.env.example`. Add it.

### Validation
```bash
git status  # no new .env files committed
git diff    # review all changes made in this section
```

### Rollback
All edits in this section are to `.example` and comment-only files. Revert via `git checkout -- <file>`.

### Definition of done
- Both `.env.example` files have inline comments explaining each variable
- `docker-compose.yml` references a file that exists (or has clear instructions for creating it)
- `NEXT_PUBLIC_SITE_URL` is documented in `fiddlers_green-frontend/.env.example`
- No secrets in committed code

---

## Section 3 — Next.js Production Optimization

### Objective
Add per-route metadata, add `robots.txt`, harden `next.config.ts`, and fix the nested `<main>` HTML structure bug.

### Files to inspect first, then edit
- `app/layout.tsx`
- `app/catalog/page.tsx`
- `app/heritage/page.tsx`
- `app/contact/page.tsx`
- `app/chat/page.tsx`
- `app/catalog/gummies/page.tsx`
- `next.config.ts`
- `public/` directory

### Known issues to fix

**Issue 3.1 — Nested `<main>` elements (HIGH PRIORITY)**

This is a confirmed HTML validity and accessibility violation. The root layout (`app/layout.tsx`) wraps `{children}` in a `<main>` element. Every route `page.tsx` also opens with its own `<main>`. This produces nested `<main>` elements in the final DOM, which is invalid HTML. Screen readers and assistive technologies rely on a single `<main>` landmark per page.

Inspect each file before editing:
- `app/catalog/page.tsx` — opens with `<main className="min-h-screen">`
- `app/catalog/gummies/page.tsx` — inspect for a `<main>` wrapper; fix if present
- `app/heritage/page.tsx` — opens with `<main className="min-h-screen">`
- `app/contact/page.tsx` — opens with `<main className="min-h-screen flex...">`
- `app/chat/page.tsx` — opens with `<main className="min-h-screen px-6...">`

Fix: In each route `page.tsx`, change the outer `<main>` wrapper to a `<div>`. Transfer all className values from the `<main>` to the `<div>` — the visual result is identical because `<main>` has no inherent styling. The `<main>` in `app/layout.tsx` remains as-is; it is the single correct landmark.

Do NOT touch `app/page.tsx` — it renders `<HomeClient />` which renders `<Hero />`, which does not use a `<main>` wrapper. Confirm this before assuming.

The requirement is absolute: no nested `<main>` elements anywhere in route pages. Before marking this issue done, search the entire `app/` directory:
```bash
grep -rn "<main" fiddlers_green-frontend/app/ --include="*.tsx"
```
Every match under `app/layout.tsx` is the correct single landmark. Every other match is a violation that must be fixed.

After each file edit, run `npx tsc --noEmit` from `fiddlers_green-frontend/` before proceeding to the next file.

**Issue 3.2 — Per-route metadata exports**

The root layout provides default metadata, but no route has its own `metadata` export. This means every page shares identical `<title>` and `<description>` tags, which is poor for SEO and social sharing.

Add a named `metadata` export to each public route page. The root layout's `title.template` is `"%s | Fiddler's Green"`, so each route only needs to export `title` as a string (the template handles the suffix).

Suggested values per route — read the page content to verify these fit:

`/catalog`:
```
title: "Catalog"
description: "Explore the Fiddler's Green catalog — premium flower, hash, and Haney Pot gummies from Tyendinaga."
```

`/heritage`:
```
title: "Heritage"
description: "The story of Fiddler's Green — rooted in Tyendinaga, the Two Row Wampum, and the Haudenosaunee Covenant Chain."
```

`/contact`:
```
title: "Contact"
description: "Reach out to Fiddler's Green with questions about our products, wholesale inquiries, or our Tyendinaga roots."
```

`/chat`:
```
title: "Budtender"
description: "Ask our AI Budtender anything about Fiddler's Green products, strains, and cannabis guidance."
```

Do not add metadata to stub routes (`/catalog/[category]`, `/catalog/gummies/[strength]`) — they redirect, so metadata there is unused.

The export syntax for App Router Server Components:
```typescript
import type { Metadata } from "next";
export const metadata: Metadata = { title: "...", description: "..." };
```

This is a named export, not a default export — confirm it is placed before the default function export in each file.

**Issue 3.3 — `robots.txt`**

No `robots.txt` exists in `public/`. Without it, crawlers apply their own defaults, which may or may not be correct.

For this project, all public routes should be crawlable. Stub routes that redirect are harmless to crawlers. Create `public/robots.txt`:

```
User-agent: *
Allow: /

Sitemap: https://PRODUCTION_DOMAIN/sitemap.xml
```

Replace `PRODUCTION_DOMAIN` with a placeholder comment noting it must be updated before Phase 14. Do not invent a domain.

**Issue 3.4 — Sitemap**

Next.js App Router supports `app/sitemap.ts` which generates `/sitemap.xml` at build time. This is optional for Phase 13 but recommended. Create `app/sitemap.ts` returning the known static routes with `lastModified` set to `new Date()`. The production URL comes from `NEXT_PUBLIC_SITE_URL` — fall back to `http://localhost:3000` for local builds.

Include: `/`, `/catalog`, `/catalog/gummies`, `/heritage`, `/contact`, `/chat`.
Exclude: stub routes that redirect.

**Issue 3.5 — `next.config.ts` hardening**

The current `next.config.ts` is empty. Add two production-appropriate options:

```typescript
poweredByHeader: false,   // removes the X-Powered-By: Next.js response header
```

Do NOT add `compress: true` — Next.js enables gzip/brotli compression by default; the config option only affects the standalone server, and Phase 14 will put NGINX in front anyway.

Do NOT add experimental flags or features that could destabilize the build.

After any `next.config.ts` change, run a full build to confirm no regressions:
```bash
npm run build
```

### Validation commands (run from `fiddlers_green-frontend/`)
```bash
npm run lint
npx tsc --noEmit
npm run build
```

The build output should list all generated routes. Confirm `/sitemap.xml` appears if added.

### Rollback
Each file edit is independent. Revert any single file with `git checkout -- <path>`.

### Definition of done
- No nested `<main>` elements in any route
- All 4 main routes have distinct `metadata` exports
- `public/robots.txt` exists
- `app/sitemap.ts` exists and generates correct URLs
- `next.config.ts` has `poweredByHeader: false`
- All three validation commands pass with zero errors

---

## Section 4 — Accessibility Final Audit

### Objective
Audit the full component tree for ARIA correctness, keyboard navigation, focus management, and reduced-motion coverage. Fix identified gaps.

### Files to inspect
Every component file. Read before editing.

### Known issues to fix

**Issue 4.1 — Navbar hamburger button missing `aria-label` and `aria-expanded`**

Inspect `components/Navbar/index.tsx`. Locate the hamburger `<button>`. Confirm whether it has:
- `aria-label="Open menu"` (or equivalent, updating to `"Close menu"` when open)
- `aria-expanded={isMenuOpen}`
- `aria-controls` pointing to the mobile menu `id` (optional but good practice)

If any are missing, add them. The `isMenuOpen` state is already available in scope.

**Issue 4.2 — Mobile menu overlay keyboard trap**

The mobile menu is a full-screen overlay. When open, keyboard users pressing Tab should not be able to reach content underneath the overlay. Inspect `components/Navbar/index.tsx` for any focus trap implementation. If none exists, add a basic trap: capture `keydown` events while `isMenuOpen` is true and constrain Tab/Shift+Tab to focusable elements within the menu. At minimum, the ESC key should close the menu (check if this is implemented; add if not).

**Issue 4.3 — `ContactForm` submit button: `disabled` vs `aria-disabled`**

Inspect `components/contact/ContactForm.tsx`. The submit button uses `disabled={status === "loading"}`. The HTML `disabled` attribute removes the element from the tab order and prevents screen readers from reading it. This is acceptable behavior for a loading state. No change needed — but confirm `focus-visible` styles are present for when the button is enabled.

**Issue 4.4 — `ProductCard` alt text quality**

Inspect `components/catalog/ProductCard.tsx`. Currently uses `alt={product.name}`. This is correct — the product name is descriptive for a product image. No change needed. Confirm that placeholder SVG images that look decorative do not accidentally have empty `alt=""` (which would be correct for decorative images, but wrong for product images).

**Issue 4.5 — IntroSequence skip button accessibility**

Inspect `components/IntroSequence/SkipButton.tsx`. Confirm:
- The button is auto-focused on mount (`useEffect` with `buttonRef.current?.focus()`)
- It has `aria-label` or visible text clearly indicating its action
- It has `focus-visible` styles

**Issue 4.6 — FloatingChat ESC-closes and scroll lock confirmation**

Inspect `components/FloatingChat/index.tsx`. The ESC handler uses `document.addEventListener("keydown", handleKeyDown)`. Confirm this listener is attached only while `isOpen` is true, and is cleaned up on close. Confirm the mobile scroll lock at `max-width: 767px` correctly cleans up on close.

**Issue 4.7 — `prefers-reduced-motion` coverage audit**

Read each of the following and confirm `useReducedMotion()` or an equivalent check is present or not needed:

| Component | Has motion | Has reduced-motion guard |
|---|---|---|
| `Hero.tsx` | Northern lights layer | ✓ (useReducedMotion) |
| `CategoryEffect.tsx` | Smoke + sparkles | ✓ (useReducedMotion) |
| `ChapterSection.tsx` | whileInView entrance | ✓ (useReducedMotion) |
| `HeritageTimeline.tsx` | Slide-in + dot pulse | ✓ (useReducedMotion) |
| `FloatingChat/ChatButton.tsx` | Idle pulse | ✓ (useReducedMotion) |
| `IntroSequence/` | Full cinematic sequence | ✓ (checked in HomeClient) |
| `Navbar/index.tsx` | Menu open/close | No guard — note this |
| `Hero.tsx` content entrance | fadeUp variants | No guard — documented known gap |

For `Navbar`, the menu open/close is user-initiated (not auto-playing ambient motion), so no guard is required. Document this distinction in the review.

The Hero content entrance reduced-motion gap is a pre-existing documented limitation from Phase 9. Do NOT attempt to fix it here — the fix risks re-introducing the SSR/hydration mismatch that was ruled out in Phase 11. Note it in the Phase 13 CLAUDE.md close-out as a known limitation inherited from Phase 9.

### Validation commands
```bash
npm run lint
npx tsc --noEmit
```

There is no automated accessibility test runner in this project. The audit is code-review based. If time allows, run `npm run build && npm run start` and use the browser keyboard (Tab, Shift+Tab, Enter, Space, Escape) to manually verify each interactive component.

### Rollback
Each component edit is independent. Revert any single file with `git checkout -- <path>`.

### Definition of done
- Navbar hamburger has `aria-label` and `aria-expanded`
- ESC closes the mobile menu
- Keyboard trap or ESC-close covers the mobile menu overlay
- All reduced-motion implementations confirmed present per the audit table
- No lint or TypeScript errors

---

## Section 5 — Performance Review

### Objective
Identify and fix addressable performance gaps without restructuring working code.

### Files to inspect
- `next.config.ts`
- `fiddlers_green-frontend/package.json`
- `components/catalog/CategoryEffect.tsx`
- `components/FloatingChat/ChatPanel.tsx`
- `app/layout.tsx`

### Steps

**Step 5.1 — Confirm code-splitting is working**

Run a production build and inspect the output:
```bash
cd fiddlers_green-frontend
npm run build 2>&1 | tail -40
```

The build output lists each route's JS bundle size. Review for any route that is unexpectedly large (rough guide: over 150 kB first-load JS is worth investigating; over 250 kB is a problem). The `framer-motion` shared chunk will be significant — this is expected and acceptable given it is used throughout the site.

Confirm `FloatingChat` appears as a separate dynamic chunk (because it is loaded via `next/dynamic`).

**Step 5.2 — Confirm `next/image` configuration**

Inspect `next.config.ts`. If product images are ever served from an external CDN or CMS in future phases, `images.remotePatterns` will need entries. Currently all images are local SVGs, so no external patterns are needed. Confirm `unoptimized` is NOT present in `next.config.ts` (the per-component flag was removed from `ProductCard.tsx` in Phase 11).

**Step 5.3 — Audit looping animations**

Looping animations that run unconditionally consume CPU and can affect battery life. Inspect:

- `components/catalog/CategoryEffect.tsx` — smoke drift and sparkles loop continuously on catalog cards. These are conditional on `useReducedMotion()` returning false. Confirm the loops use `repeat: Infinity` only inside `animate` props, and that the elements are not mounted on routes that don't show catalog cards.
- `components/FloatingChat/ChatButton.tsx` — the idle pulse animation loops. Confirm it stops when `isOpen` is true (the `pulse` variable should gate it).
- `components/IntroSequence/` — the northern lights gradient loops during the intro overlay, then the entire overlay unmounts. No ongoing cost after unmount.

No edits required if confirmed correct. Document findings.

**Step 5.4 — Font loading strategy**

Both fonts use `display: "swap"` in `app/layout.tsx`. This is correct — it ensures text renders with a fallback font while the web font loads, preventing invisible text. No change needed. Confirm both font variables are applied to `<html>` and not re-applied at the component level.

**Step 5.5 — Lazy loading inventory**

Components loaded via `next/dynamic` (lazy):
- `FloatingChat` — ✓ (loaded in `app/layout.tsx`)

Components that could be lazy but are not:
- `IntroSequence` — conditionally rendered via JSX (`{showIntro && <IntroSequence />}`), not `dynamic()`. This is acceptable — it is conditionally rendered, so it only loads when needed. `next/dynamic` would add no benefit here because the condition is evaluated client-side anyway.

No changes required.

### Validation commands
```bash
npm run build
```

Review the route size table in build output. Investigate any route with first-load JS > 250 kB before accepting.

### Definition of done
- Build output reviewed and no unexpected bundle sizes
- All looping animations confirmed gated correctly
- Font loading confirmed correct
- No regressions introduced

---

## Section 6 — Security Review

### Objective
Confirm the backend does not expose development tooling in production, input validation is strict, and CORS is configured correctly for production use.

### Files to inspect
- `fiddlers_green-backend/main.py`
- `fiddlers_green-backend/models/contact.py`
- `fiddlers_green-backend/models/chat.py`
- `fiddlers_green-backend/routes/contact.py`
- `fiddlers_green-backend/routes/chat.py`
- `fiddlers_green-backend/services/ai_service.py`

### Known issues to fix

**Issue 6.1 — FastAPI OpenAPI docs exposed in production**

FastAPI exposes interactive API documentation at `/docs` (Swagger UI) and `/redoc` by default. In production, these should be disabled to avoid exposing endpoint structure to the public.

Inspect `fiddlers_green-backend/main.py`. The `FastAPI(...)` constructor accepts `docs_url` and `redoc_url` parameters. Disable them conditionally based on an environment variable:

```python
docs_url = None if os.getenv("DISABLE_DOCS", "false").lower() == "true" else "/docs"
redoc_url = None if os.getenv("DISABLE_DOCS", "false").lower() == "true" else "/redoc"
app = FastAPI(title="Fiddler's Green API", docs_url=docs_url, redoc_url=redoc_url)
```

Add `DISABLE_DOCS=true` to `fiddlers_green-backend/.env.example` with a comment explaining it should be `true` in production and `false` in local development.

**Issue 6.2 — `inquiry_type` has no enum validation**

Inspect `fiddlers_green-backend/models/contact.py`. The `ContactRequest` model has:
```python
inquiry_type: Optional[str] = None
```

This accepts any string. The frontend constrains it to `"general" | "wholesale"`, but the backend should not rely on the frontend for validation. Add a `Literal` type or `Enum` to enforce valid values at the Pydantic level:

```python
from typing import Literal, Optional
inquiry_type: Optional[Literal["general", "wholesale"]] = "general"
```

If an invalid value is sent, Pydantic will return a 422 Unprocessable Entity automatically — no additional code needed.

After this change, run the backend locally or via Docker and send a test request:
```bash
curl -s -X POST http://localhost:8000/contact \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"t@t.com","message":"hello","inquiry_type":"invalid"}' | python3 -m json.tool
```

Expected: `422` response with validation detail. If it returns 422, the fix is correct.

> **⚠️ Backend Scope Constraint — Contact Validation**
>
> The `inquiry_type` improvement is strictly limited in scope.
>
> **Allowed:**
> - Updating the Pydantic model field type to `Literal["general", "wholesale"]`
> - Adding the corresponding import from `typing`
> - Preserving the existing default value and optional behavior
> - Verifying the existing frontend sends a matching value
>
> **Not allowed:**
> - Database migrations or schema changes
> - New API versions or endpoint restructuring
> - Authentication or authorization changes
> - Changes to the contact email workflow or email service
> - Any changes to AI or chat backend behavior
> - Any changes to `routes/chat.py`, `services/ai_service.py`, or `models/chat.py`
>
> **Implementation goal:** prevent invalid contact form payloads while preserving the existing API contract exactly. The only file that changes is `fiddlers_green-backend/models/contact.py`. If a proposed change touches any other backend file for reasons related to this issue, stop and reassess — it is out of scope.

**Issue 6.3 — CORS hardcoded `localhost:3000`**

Inspect `fiddlers_green-backend/main.py`. The CORS allowed origins list hardcodes `http://localhost:3000`:
```python
allowed_origins = ["http://localhost:3000"]
frontend_url = os.getenv("FRONTEND_URL")
if frontend_url:
    allowed_origins.append(frontend_url)
```

This is correct behavior: `localhost:3000` is always allowed for local development; `FRONTEND_URL` adds the production domain. In production, set `FRONTEND_URL=https://fiddlersgreen.ca` (or equivalent). This logic does not need to change — just confirm it is working and document it clearly in `.env.example`.

**Issue 6.4 — Error messages do not expose stack traces**

Inspect the exception handling in `routes/chat.py` and `routes/contact.py`. Both raise `HTTPException` with plain string `detail` messages — no stack traces. The `print(f"Failed to get AI response: {error}")` in `chat.py` logs to stdout only, which is appropriate for container logs. No change needed.

**Issue 6.5 — Frontend: no secrets in client bundle**

Run a production build and search the output for any values that should be secret:
```bash
npm run build
grep -r "ANTHROPIC" fiddlers_green-frontend/.next/static/ 2>/dev/null
grep -r "sk-ant" fiddlers_green-frontend/.next/static/ 2>/dev/null
```

Neither should appear. If they do, that is a critical bug requiring immediate investigation before any further steps.

### Validation commands
After all backend changes:
```bash
cd fiddlers_green-backend
python -m pytest  # if test runner exists; if not, skip
uvicorn main:app --reload &
curl http://localhost:8000/health
# kill uvicorn after confirming
```

After all frontend changes:
```bash
cd fiddlers_green-frontend
npm run lint
npx tsc --noEmit
npm run build
```

### Rollback
Backend changes: revert individual files with `git checkout -- <path>`.  
Frontend changes: same.  
If the inquiry_type Literal type causes unexpected issues with existing data, the fallback is `Optional[str]` with a manual validator.

### Definition of done
- FastAPI docs disabled via environment variable in production
- `DISABLE_DOCS` added to backend `.env.example`
- `inquiry_type` validated to `Literal["general", "wholesale"]`
- CORS logic confirmed correct
- No secrets in client bundle
- `/health` still returns `{"status": "ok"}`

---

## Section 7 — Cross-Browser / Responsive QA

### Objective
Audit the codebase for responsive design correctness at the four required viewports. This section uses code review, not a live browser — flag any CSS or component behavior that may fail at a given breakpoint.

### Viewports to verify
| Label | Width | Tailwind breakpoint context |
|---|---|---|
| Mobile | 390px | All `sm:` prefixes inactive |
| Tablet | 768px | `md:` prefixes active |
| Laptop | 1024px | `lg:` prefixes active |
| Desktop | 1440px | `xl:` prefixes active |

### Files to audit

Inspect each file listed below. For each, verify the classes listed are present and correct.

**Step 7.1 — Navbar (`components/Navbar/index.tsx`)**

- Desktop links: `hidden md:flex` — hidden below 768px, visible above. ✓ expected
- Hamburger: `md:hidden` — visible below 768px, hidden above. ✓ expected
- Header height: `h-16 md:h-20` — must match `<main>` padding-top in `app/layout.tsx` (`pt-16 md:pt-20`). Confirm both match.
- Mobile menu: full-screen overlay `fixed inset-0` — covers all viewports. ✓ expected
- `isScrolled` frosted background — verify it works at all viewports (it is scroll-based, not width-based).

**Step 7.2 — FloatingChat FAB (`components/FloatingChat/ChatButton.tsx`)**

- FAB: `fixed bottom-6 right-6 w-14 h-14` — at 390px this places a 56px button 24px from bottom-right. Confirm no overlap with mobile browser chrome (address bar).
- Panel: `w-[calc(100vw-3rem)] max-w-sm` — at 390px: `390 - 48 = 342px`. Max-width `sm` is 384px, so 342px applies. Sufficient.
- Panel: `h-[70vh] max-h-[520px]` — at 390px with typical mobile viewport this is approximately 590px * 0.7 = 413px. Under the max. ✓
- Body scroll lock fires at `window.innerWidth < 768` — confirm this breakpoint matches Tailwind's `md:` (768px). ✓

**Step 7.3 — Hero (`components/Hero.tsx`)**

- Headline: `text-4xl sm:text-5xl md:text-7xl` — scales across breakpoints. Confirm at 390px `text-4xl` (36px) is readable and does not overflow.
- Content `max-w-4xl mx-auto px-6` — at 390px: 390 - 48 = 342px content width. Acceptable.

**Step 7.4 — Catalog (`components/catalog/CategorySection.tsx`)**

- Product card grid: inspect the grid class. Confirm it uses responsive columns, e.g. `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4` or similar. At 390px, single-column cards should display without horizontal overflow.
- `TableOfContents.tsx`: anchor links — confirm they are readable at 390px.

**Step 7.5 — Heritage Timeline (`components/heritage/HeritageTimeline.tsx`)**

- Timeline items have `x` slide-in animations. At 390px, confirm the initial offscreen position (`x: 40` or similar) does not cause horizontal overflow that produces a scrollbar. Look for `overflow-hidden` on the timeline wrapper or use of small `x` values.

**Step 7.6 — Contact Form (`components/contact/ContactForm.tsx`)**

- `max-w-2xl mx-auto px-6` in the parent page — at 390px: 390 - 48 = 342px. Acceptable.
- Input fields: `w-full` — fills container. ✓
- Submit button: full-width or auto-width? At 390px, an auto-width button with long text may be tight. Confirm.

**Step 7.7 — IntroSequence (`components/IntroSequence/index.tsx`)**

- Overlay: `fixed inset-0 z-[100]` — covers all viewports. ✓
- Child elements (feather, chain, wampum, logo): confirm none use fixed pixel sizes that would break at 390px. All should use `%`, `vw`, `rem`, or Tailwind utility classes.

### Validation
No automated test. For each issue found, determine if it is:
- A confirmed bug requiring a fix (incorrect class, missing breakpoint modifier)
- A suspected issue requiring live browser verification (flag for manual QA)
- A non-issue (false alarm from code reading)

Document findings. Fix confirmed bugs. Flag suspected issues for manual QA post-implementation.

### Definition of done
- All 7 components audited at all 4 viewports
- Confirmed bugs fixed
- Suspected issues documented
- No lint or TypeScript regressions

---

## Section 8 — Final Production Checklist

### Objective
Perform a complete, final verification pass. No new edits — this section is audit only.

### Checklist items

Run each command and confirm the expected result before checking it off.

#### 8.1 Code Quality

```bash
cd fiddlers_green-frontend
npm run lint
```
Expected: `✓ No ESLint warnings or errors`

```bash
npx tsc --noEmit
```
Expected: silent (no output = no errors)

```bash
npm run build
```
Expected: build completes without errors; all routes listed in output.

#### 8.2 Route Generation

Confirm the following routes are present in build output:
- `/` (static or SSR)
- `/catalog` (static)
- `/heritage` (static)
- `/contact` (static)
- `/chat` (static)
- `/catalog/gummies` (static)
- `/sitemap.xml` (if `app/sitemap.ts` was added)

Stub routes that redirect (`/catalog/[category]`, `/catalog/gummies/[strength]`) should appear as dynamic routes that render a redirect — not 404s.

#### 8.3 Environment File Audit

```bash
ls fiddlers_green-frontend/.env.example
ls fiddlers_green-backend/.env.example
```
Both must exist. Read each and confirm all variables are present and commented.

```bash
git status
```
Confirm no `.env` files (with real values) are staged or committed.

#### 8.4 Docker Stack

```bash
docker compose up --build -d
docker compose ps
```
Expected: both `fiddlers-backend` and `fiddlers-frontend` show `Up (healthy)`.

```bash
curl http://localhost:8000/health
```
Expected: `{"status":"ok"}`

```bash
curl http://localhost:3000
```
Expected: 200 response (HTML of the homepage)

```bash
docker compose down
```
Clean up after verification.

#### 8.5 Security Spot Checks

```bash
curl http://localhost:8000/docs
```
Expected (in production config with `DISABLE_DOCS=true`): 404 response.  
If running without `DISABLE_DOCS=true` locally: Swagger UI returns — note this is development-only behavior.

```bash
curl -X POST http://localhost:8000/contact \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"t@t.com","message":"hello","inquiry_type":"invalid"}'
```
Expected: `422 Unprocessable Entity`

#### 8.6 Accessibility Spot Checks (manual, in browser)

Start the dev server: `npm run dev`

- `/` — Tab to the skip button (if visible); Tab through Navbar links; press Enter on "Catalog". Confirm focus moves correctly.
- `/` — With mouse disabled: open mobile menu (if on a narrow viewport), press Escape to close. Confirm focus returns to hamburger button.
- `/contact` — Tab through all form fields and submit button. Confirm all have visible focus rings.
- FloatingChat — Tab to FAB; press Enter to open; Tab to confirm focus is on input; press Escape to close; confirm focus returns to FAB.

#### 8.7 Documentation

Read `CLAUDE.md` and confirm:
- Phase 13 section currently says "Status: NOT STARTED"
- After this checklist passes, update Phase 13 to "Status: COMPLETE" with a structured completion record (see template below)

#### 8.8 Git Final State

After all edits and validations:
```bash
git status
git diff --stat
```
Review every changed file. Confirm no unintended edits. Then:
```bash
git add -A
git commit -m "Phase 13 — Final production polish and deployment readiness"
git push origin main
```

---

## Validation Checklist (Summary)

Copy this list and check each item off as it passes.

### Repository
- [ ] `git status` clean before work begins
- [ ] On `main` branch
- [ ] `sections/` directory removed (if empty)
- [ ] CLAUDE.md current state section accurate

### Configuration
- [ ] Frontend `.env.example` complete and commented
- [ ] Backend `.env.example` complete and commented
- [ ] `NEXT_PUBLIC_SITE_URL` added to frontend `.env.example`
- [ ] `DISABLE_DOCS` added to backend `.env.example`
- [ ] `docker-compose.yml` env file reference is resolvable on fresh clone
- [ ] No secrets in committed code

### Next.js
- [ ] No nested `<main>` elements in any route
- [ ] `/catalog` has `metadata` export
- [ ] `/heritage` has `metadata` export
- [ ] `/contact` has `metadata` export
- [ ] `/chat` has `metadata` export
- [ ] `public/robots.txt` exists
- [ ] `app/sitemap.ts` exists and lists all public routes
- [ ] `next.config.ts` has `poweredByHeader: false`
- [ ] `npm run lint` passes
- [ ] `npx tsc --noEmit` passes
- [ ] `npm run build` passes

### Accessibility
- [ ] Navbar hamburger has `aria-label` and `aria-expanded`
- [ ] Escape closes the mobile menu
- [ ] `prefers-reduced-motion` coverage confirmed for all animated components
- [ ] Hero content entrance reduced-motion gap documented as known limitation

### Performance
- [ ] Build output reviewed — no unexpected bundle sizes
- [ ] All looping animations confirmed gated correctly
- [ ] `FloatingChat` appears as a separate dynamic chunk

### Security
- [ ] FastAPI docs disabled via `DISABLE_DOCS` env var
- [ ] `inquiry_type` validates to `Literal["general", "wholesale"]`
- [ ] CORS logic confirmed correct
- [ ] `/contact` returns 422 on `inquiry_type: "invalid"`
- [ ] No secrets in client bundle (`.next/static/` scan clean)

### Responsive QA
- [ ] Navbar renders correctly at all 4 viewports
- [ ] FloatingChat panel renders correctly at 390px
- [ ] Hero headline does not overflow at 390px
- [ ] Catalog grid renders correctly at all 4 viewports
- [ ] Heritage timeline does not cause horizontal overflow

### Docker
- [ ] `docker compose up --build` succeeds
- [ ] Both containers show `Up (healthy)`
- [ ] `/health` returns `{"status":"ok"}`
- [ ] `/` returns 200
- [ ] `docker compose down` clean

### Final
- [ ] CLAUDE.md Phase 13 section updated to COMPLETE
- [ ] All changes committed with clean `git status`
- [ ] `git push origin main` successful

---

## Definition of Phase 13 Complete

Phase 13 is complete when all of the following are true simultaneously:

1. `npm run lint`, `npx tsc --noEmit`, and `npm run build` all pass with zero errors or warnings from `fiddlers_green-frontend/`
2. The HTML document structure is valid — no nested `<main>` elements
3. All four main routes (`/catalog`, `/heritage`, `/contact`, `/chat`) have distinct `metadata` exports
4. `public/robots.txt` and `app/sitemap.ts` exist
5. `next.config.ts` has `poweredByHeader: false`
6. FastAPI docs are disabled by environment variable
7. `inquiry_type` is validated to `Literal["general", "wholesale"]` in the backend
8. Both `.env.example` files are complete with inline comments
9. `docker compose up --build` produces two healthy containers
10. `CLAUDE.md` is updated with a Phase 13 COMPLETE section and Phase 14 remains NOT STARTED
11. All changes are committed to `main` and pushed

When all 11 conditions are met, Phase 13 is closed and Phase 14 (VPS Deployment with NGINX + Domain + SSL) may begin.

---

## CLAUDE.md Phase 13 Completion Template

When Phase 13 is complete, replace the current "Status: NOT STARTED" stub in `CLAUDE.md` with the following structure (fill in actual details from the completed work):

```markdown
## Phase 13 Completed — Final Production Polish & QA

### What was fixed
- **HTML structure:** Removed nested `<main>` elements from all route page.tsx files
  (`/catalog`, `/heritage`, `/contact`, `/chat`); outer wrapper changed to `<div>`.
  The single `<main>` in `app/layout.tsx` remains as the correct landmark.
- **Per-route metadata:** Added `metadata` exports to all four main routes.
- **`robots.txt`:** Created `public/robots.txt` allowing all crawlers on all routes.
- **Sitemap:** Created `app/sitemap.ts` generating `/sitemap.xml` for all public routes.
- **`next.config.ts`:** Added `poweredByHeader: false`.
- **Backend: FastAPI docs:** Disabled via `DISABLE_DOCS` environment variable.
- **Backend: `inquiry_type` validation:** Changed `Optional[str]` to
  `Optional[Literal["general", "wholesale"]]` in `ContactRequest`.
- **Accessibility:** Added `aria-label` and `aria-expanded` to Navbar hamburger button;
  added Escape key handler to close mobile menu.
- **Configuration:** Both `.env.example` files updated with inline comments for every
  variable; `NEXT_PUBLIC_SITE_URL` added to frontend; `DISABLE_DOCS` added to backend;
  `docker-compose.yml` env file reference resolved.

### Known limitations carried forward
- Hero content entrance (`fadeUp` variants on eyebrow, headline, body, CTA) does not
  respect `prefers-reduced-motion`. This is a pre-existing gap from Phase 9 — the fix
  risks re-introducing an SSR/hydration mismatch that was ruled out in Phase 11.
  Deferred to future polish if a safe fix is found.

### Validation completed
- `npm run lint` — no errors
- `npx tsc --noEmit` — no errors
- `npm run build` — production build clean, all routes generated including `/sitemap.xml`
- `docker compose up --build` — both containers `Up (healthy)`, `/health` returns `{"status":"ok"}`
- Accessibility: keyboard navigation verified on all interactive components
- Security: `/contact` returns 422 on invalid `inquiry_type`; client bundle contains no secrets
```

---

*This plan was authored for Claude CLI execution. Do not skip steps. Inspect before editing. Validate after every meaningful change. Do not proceed to Phase 14 until all 11 completion conditions are met.*
