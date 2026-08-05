# Admin Access Guide

## Overview

Phase 15 implemented:

- JWT authentication
- Role-based access control (RBAC)
- `customer` role
- `admin` role

There is intentionally no public admin registration flow. `POST /auth/register`
always creates a user with `role = customer` — this is enforced server-side in
`repositories/user.py`'s `create_user()`, which hardcodes `role: str = "customer"`
as its default and is never called with anything else from the `/auth/register`
route. There is no API endpoint anywhere that lets a client set `role=admin`.
Promotion to admin is a deliberate, DB-side-only operation.

## Creating an Admin User

1. Register a normal user through:

   ```
   POST /auth/register
   ```

   or through the frontend:

   ```
   /register
   ```

   (Password must be at least 8 characters — enforced by `RegisterRequest`'s
   Pydantic validator in `models/auth.py`.)

2. Login through:

   ```
   /login
   ```

3. Promote the user to admin directly in PostgreSQL, because admin privileges
   are controlled server-side and there is no API path to grant them.

   Connect to the database (verified against the running container — table
   and column names below are exact, not assumed):

   ```bash
   docker compose exec db psql -U fg_user -d fiddlers_green
   ```

   The `users` table (confirmed via `\d users` against the live database):

   ```
   Table "public.users"
       Column     |           Type           | Nullable
   ---------------+--------------------------+----------
    id            | uuid                     | not null
    email         | character varying(255)   | not null
    password_hash | character varying(255)   | not null
    role          | character varying(50)    | not null
    is_active     | boolean                  | not null
    created_at    | timestamp with time zone | not null
    updated_at    | timestamp with time zone | not null
   ```

   Update the `role` column from `customer` to `admin` for the target user:

   ```sql
   UPDATE users SET role = 'admin' WHERE email = 'your_test_user@example.com';
   ```

   Or as a single non-interactive command (the pattern used throughout Phase
   15's own validation, e.g. `PHASE_15_EXECUTION_PROGRESS.md`'s B-11 and B-18
   entries):

   ```bash
   docker compose exec db psql -U fg_user -d fiddlers_green -c \
     "UPDATE users SET role='admin' WHERE email='your_test_user@example.com';"
   ```

## Signing In Through The UI

1. Start the stack:

   ```bash
   docker compose up --build
   ```

2. Navigate to:

   ```
   /login
   ```

3. Enter the promoted admin's credentials.

4. After successful authentication, the Navbar (`components/Navbar/index.tsx`)
   updates via `AuthContext`:
   - Cart link appears
   - Account link appears
   - Admin link appears (only when `role === "admin"`)
   - Logout replaces Login/Register

5. Navigate to:

   ```
   /admin/products
   ```

   Expected: the admin product management page loads, listing existing
   products and a form to create new ones.

### A verified detail: logout/re-login is not actually required

If you promote a user's role in the database **while they're already
logged in**, the Admin link appears on the very next page load or
navigation — no logout/login cycle needed. This was directly verified during
Phase 15.1's Playwright validation (see `PHASE_15_1_AUTH_UI_INTEGRATION.md`):
`dependencies/auth.py`'s `get_current_user` only reads the `sub` (email)
claim out of the JWT and then re-fetches the live `User` row from the
database on every request — it never trusts the token's own embedded `role`
claim for authorization. So the already-issued token immediately reflects
the new role.

That said, the workflow below still logs out and back in — it's the more
robust instruction to give a test script or another developer, since it
doesn't depend on this specific implementation detail continuing to hold in
the future, and it guarantees a fully fresh, unambiguous state for
screenshots or CI runs.

## The Repeatable Admin Workflow

```
Register user
      |
      v
Login as customer
      |
      v
Promote role in PostgreSQL
      |
      v
Logout
      |
      v
Login again
      |
      v
Navbar shows Admin
      |
      v
/admin/products accessible
```

This is the same sequence used for the admin test user in Phase 15's own
`B-18` and `B-11` validation, and again in Phase 15.1's Playwright validation
— reuse it as the standard setup for:

- Phase 16 (Product Catalog Integration) testing
- Phase 17 (production QA)
- Phase 18 (DigitalOcean deployment smoke tests)

## Validation Checklist

- [ ] Login succeeds
- [ ] JWT token stored correctly (`localStorage` key `fg_auth_token`, per `contexts/AuthContext.tsx`)
- [ ] Navbar changes from Login/Register to authenticated navigation
- [ ] Admin link appears
- [ ] `/admin/products` loads
- [ ] Customer users cannot access admin pages
- [ ] Logout removes authentication state

## Important Security Note

- Never hardcode admin credentials in application code, tests, or committed files.
- Never expose admin promotion endpoints publicly unless intentionally designed with its own authorization guard — none currently exists in this codebase, and none should be added without a deliberate design decision.
- Production admin creation should use a controlled process (e.g. a one-off, access-restricted script or manual DB operation performed by an operator with production database credentials) — not the local-dev `docker compose exec db psql` pattern documented above, which assumes an open local Postgres container with no production data.
