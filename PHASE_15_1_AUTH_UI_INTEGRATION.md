# Phase 15.1 — Frontend Authentication UI Integration

Phase 15 (`phase-15-shopping-cart-complete`) shipped a fully working backend:
JWT auth, RBAC, admin/customer routers, and the shopping cart API. None of it
was reachable from the site — there was no Login/Register entry point in the
Navbar, and no frontend code called `/auth/*`, `/admin/*`, `/customer/*`, or
`/cart/*` at all. This phase closes that gap: a full frontend auth experience,
wired to the real backend, with role-aware navigation and three new
protected pages.

No backend code was modified. No new npm dependency was added.

## Files changed

**New:**
- `fiddlers_green-frontend/contexts/AuthContext.tsx` — global auth state (React Context)
- `fiddlers_green-frontend/hooks/useRequireAuth.ts` — route-guard hook, optionally role-scoped
- `fiddlers_green-frontend/components/auth/LoginForm.tsx`
- `fiddlers_green-frontend/components/auth/RegisterForm.tsx`
- `fiddlers_green-frontend/components/account/AccountView.tsx`
- `fiddlers_green-frontend/components/cart/CartView.tsx`
- `fiddlers_green-frontend/components/admin/AdminProductsView.tsx`
- `fiddlers_green-frontend/app/login/page.tsx`
- `fiddlers_green-frontend/app/register/page.tsx`
- `fiddlers_green-frontend/app/account/page.tsx`
- `fiddlers_green-frontend/app/cart/page.tsx`
- `fiddlers_green-frontend/app/admin/products/page.tsx`
- `screenshots/phase-15-1-auth-ui/` — Playwright validation screenshots (below)

**Modified:**
- `fiddlers_green-frontend/lib/api.ts` — added `getJson`, `deleteJson`, and an optional `token` param on `postJson` (backward compatible — existing two-arg callers in `ContactForm.tsx` and `useChatMessages.ts` are unaffected)
- `fiddlers_green-frontend/components/Navbar/index.tsx` — added auth-aware links (desktop + mobile), logout button
- `fiddlers_green-frontend/app/layout.tsx` — wraps `<body>` content in `<AuthProvider>`

## Authentication flow

**Architecture decision — React Context, not a new library.** This is the
first cross-component shared state the frontend has ever needed (every prior
async action — contact form, chat — lived entirely inside one component
subtree). A React Context is the smallest tool that fits, and it's the
pattern the Next.js 16 docs themselves prescribe for sharing state from a
Server Component layout into Client Component children
(`node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md`,
confirmed unchanged in this version before writing any code, per `AGENTS.md`).

**Token storage — `localStorage`, key `fg_auth_token`.** The existing
codebase already uses browser storage deliberately: `sessionStorage` for the
Phase 9 intro's "seen this session" flag and `FloatingChat`'s per-session
dismissal. A login is explicitly *not* session-scoped — it should survive
closing the tab — so `localStorage` is the natural sibling for
persistent-not-session data, not a new pattern.

**Flow:**
1. `AuthProvider` (mounted once, in `layout.tsx`, wrapping `Navbar` + `main` + `Footer` + `FloatingChat` so all of them share one instance) reads `fg_auth_token` from `localStorage` on mount and calls `GET /auth/me` with it — validating against the live backend rather than trusting a client-decoded JWT payload, so an expired or tampered token is caught immediately rather than assumed valid.
2. `login(email, password)` calls `POST /auth/login`, then `GET /auth/me` with the returned token, then persists the token and sets `user` state.
3. `register(email, password)` calls `POST /auth/register`, then immediately calls `login()` — the backend's `/auth/register` deliberately does not return a token ("register separately," per its own docstring), but chaining a login call keeps the UX to one step from the user's perspective.
4. Every authenticated API call (`/auth/me`, `/cart/*`, `/admin/products*`, `/customer/*`) passes the token via `lib/api.ts`'s new `token` parameter, which sets `Authorization: Bearer <token>`.
5. `logout()` clears `localStorage` and both `user`/`token` state.
6. `useRequireAuth(role?)` — used identically by `/account`, `/cart`, and `/admin/products` — redirects to `/login` if there's no user, or (when `role` is given) if the user's role doesn't match. It does not distinguish "not logged in" from "wrong role" in the redirect target; both land on `/login`. This is intentional: it avoids leaking "this page exists but you're not allowed" information to an unauthorized customer.

**Navbar role-awareness** (`getAuthLinks` in `Navbar/index.tsx`):
- Logged out: Login, Register.
- Customer: Cart, Account.
- Admin: Cart, Account, Admin (linking to `/admin/products`).
- Logout is rendered as a separate `<button>` (not a `Link`, since it's an action) whenever a user is present, in both the desktop nav and the mobile full-screen menu.

**A live, non-obvious backend behavior confirmed during testing:** promoting a
user to admin via `UPDATE users SET role='admin'` takes effect on their
*already-issued* JWT immediately, with no re-login required. This is because
`dependencies/auth.py`'s `get_current_user` only reads the `sub` (email)
claim from the token and then re-fetches the live `User` row from the
database for every request — it never trusts the token's own `role` claim
for authorization. Confirmed live: the Navbar's "Admin" link appeared for a
promoted user on the very next page load, using the same token issued before
promotion.

## Known limitation / deviation — cart product discovery

The cart page (`components/cart/CartView.tsx`) takes a raw backend product
UUID as input, not a name picked from a catalog. This is a genuine,
pre-existing gap, not something introduced here: `db_models/product.py`'s
own docstring says the `Product` table is "Not yet read by the frontend
(which uses `data/products.ts`)" — the static frontend catalog and the
backend's `products` table are unrelated data sources (per the root
`CLAUDE.md`'s description of the two projects as independent). The cart
API's own `CartItemResponse` also only returns `product_id` — no joined
name/price — so even a populated cart view can't show a friendly product
name without additional data.

Fixing this properly means either wiring the static catalog to backend
product rows, or adding a product-listing endpoint the frontend can query —
both real backend/architecture changes, out of scope for an auth-UI task and
explicitly against the instruction not to modify backend code without a
frontend-integration requirement forcing it. This wasn't judged to force a
backend change: the cart page is fully functional end-to-end against the
real API (add, view, remove, quantity increment) without one — it just
identifies products by ID rather than name. Documented here rather than
silently shipped as a finished catalog integration.

## Lint deviation — `react-hooks/set-state-in-effect`

Three call sites (`contexts/AuthContext.tsx`, `components/cart/CartView.tsx`,
`components/admin/AdminProductsView.tsx`) needed a targeted
`eslint-disable-next-line react-hooks/set-state-in-effect`. This is a new
React-Compiler-linked lint rule bundled with this project's React 19 / Next
16 toolchain that flags `setState` calls reachable synchronously within an
effect body — including, in practice, the extremely common "fetch on mount,
setState with the result" pattern. This codebase had never needed that
pattern before Phase 15.1 (every prior async call was triggered by a user
action — form submit, chat send — never automatically on mount), so there
was no existing precedent to follow. The rule's own suggested alternative
for this exact case is `useSyncExternalStore`, which would be a real
architecture shift for three isolated data-loads; a full data-fetching
library (SWR/React Query) was ruled out as a new dependency contradicting
"don't introduce a new framework or architecture." Suppressing narrowly,
with an inline comment at each site, was judged the smallest-diff option
that doesn't change how the rest of the app is built.

## Playwright validation results

Run against the full Docker stack (`docker compose up --build -d`, all
three containers healthy) at `http://localhost:3000`, backend at
`http://localhost:8000`.

| Check | Result |
|---|---|
| Anonymous: Navbar shows Login/Register | ✅ |
| Anonymous: no Cart/Account/Admin links present | ✅ |
| Anonymous: `/cart` redirects to `/login` | ✅ |
| Anonymous: `/admin/products` redirects to `/login` | ✅ |
| Customer: register → auto-login → redirect to `/account` | ✅ |
| Customer: JWT persisted, `GET /auth/me` populates profile correctly (email, role) | ✅ |
| Customer: Navbar shows Cart/Account/Logout, no Admin | ✅ |
| Customer: `/cart` loads, real `GET /cart` returns `{"items":[],"total_items":0}` | ✅ |
| Customer: add to cart (`POST /cart/add`, qty 2) reflects in UI (`total_items: 2`) | ✅ |
| Customer: remove from cart (`DELETE /cart/remove`) empties the cart | ✅ |
| Customer: `/admin/products` redirects away (blocked) | ✅ |
| Admin: promote via DB, Admin link appears without re-login (see note above) | ✅ |
| Admin: `/admin/products` loads real product list from `GET /admin/products` | ✅ |
| Admin: create product via form (`POST /admin/products`) appears in list immediately | ✅ |
| Logout: clears `localStorage` token and `user`/Navbar state (verified via `window.localStorage.getItem` returning `null` post-logout) | ✅ |
| Console errors/warnings across the entire session | 0 |

**Screenshots** (`screenshots/phase-15-1-auth-ui/`):
- `logged-out-navbar.png`
- `customer-navbar.png`
- `admin-navbar.png`
- `admin-page-loaded.png`

**One observed nuance, not a defect:** clicking Logout from a protected page
(e.g. `/cart`) lands on `/login`, not `/` — `Navbar`'s logout handler calls
`router.push("/")`, but the page's own `useRequireAuth` guard reacts to
`user` becoming `null` in the same tick and calls `router.replace("/login")`,
which wins the race. Logging out from a public page (e.g. `/`) behaves as
coded. Both outcomes are reasonable UX (a logged-out user leaving a
protected page landing on the login screen isn't wrong); not changed.

## Validation completed

- `npm run lint` — clean (after the three documented suppressions).
- `npx tsc --noEmit` — clean.
- `npm run build` — clean; all 15 routes generated, including the 4 new ones (`/login`, `/register`, `/account`, `/admin/products` — `/cart` was already counted as a route slot).
- Full Docker stack (`db`, `backend`, `frontend`) healthy throughout testing.
- No backend file was modified.
- No new npm dependency was added.
