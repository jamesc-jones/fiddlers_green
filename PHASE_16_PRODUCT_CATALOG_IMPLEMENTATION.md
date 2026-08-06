# Phase 16 — Product Catalog Integration: Implementation Checklist

This is a **planning checklist only** — no code has been written, no files have
been modified, and no migrations have been run to produce this document.

**Roadmap source:** `PHASES_14_15_16_ROADMAP_AND_TUTORIALS.md`'s "Phase 16 —
Product Catalog Integration" section. (Not `PHASES_17_18_ROADMAP_AND_TUTORIALS.md`
— that file covers Phase 17 "Final Production Polish + QA + Deploy Ready" and
Phase 18 "VPS Deployment / DigitalOcean Production" only; it contains no
Phase 16 content.)

**File path note:** paths below use this repo's actual flat backend layout
(`fiddlers_green-backend/{db_models,models,routes,repositories}/`) — there is
no `app/` subdirectory anywhere in this backend, confirmed by direct
inspection before writing this checklist.

## Two open decisions — resolve before implementation starts

- [ ] **Price column:** add a new `price NUMERIC(10,2)` column to `products`,
      keeping the existing `pricing` (varchar) column as-is, or deprecating
      it? (Dropping a column is a more destructive migration than adding
      one — needs an explicit choice, not an assumption.)
- [ ] **`ProductCard.tsx` "Add to Cart":** does this phase add a real
      Add-to-Cart button to the catalog grid, or does `CartView.tsx` keep its
      current manual "enter a Product ID" form for this phase, with
      catalog→cart wiring deferred? The roadmap's own text implies the
      former ("Cart integration upgrade") but doesn't explicitly require a
      new UI control on `ProductCard`.

---

## Backend

- [ ] Create `fiddlers_green-backend/models/product.py` — move
      `ProductCreateRequest`, `ProductUpdateRequest`, `ProductResponse` out
      of `routes/admin.py` (where they currently live inline) into this new
      file, matching the convention every other route already follows
      (`models/auth.py`, `models/cart.py`, `models/chat.py`, `models/contact.py`).
      Add a new public-facing response shape here too (name/category/description/
      price/image_url/is_active — no admin-only fields).
- [ ] Create `fiddlers_green-backend/repositories/product.py` — typed async
      functions (`list_active_products`, `get_product_by_id`, etc.), matching
      `repositories/contact.py` / `repositories/user.py` / `repositories/cart.py`'s
      existing pattern. `routes/admin.py`'s current inline `select(Product)`
      queries move here too, so admin and public routes share one data-access
      layer.
- [ ] Create `fiddlers_green-backend/routes/products.py` — `GET /products`,
      public (no `Depends(require_admin)` / `require_customer)`), returns only
      `is_active=True` rows. Supports category filtering and name search per
      the roadmap; confirm whether price-range filtering is in scope (see
      open decision note above the roadmap doesn't specify it).
- [ ] Register the new router in `fiddlers_green-backend/main.py` — one
      import line, one `app.include_router(...)` call, same minimal pattern
      as every prior router registration (B-8, B-11, B-17).
- [ ] Update `fiddlers_green-backend/db_models/product.py` — add `image_url`
      (nullable string) and the resolved price column (see open decision).
- [ ] Update `fiddlers_green-backend/routes/admin.py` — import
      `ProductCreateRequest`/`ProductUpdateRequest`/`ProductResponse` from the
      new `models/product.py` instead of defining them inline; swap inline
      queries for calls into the new `repositories/product.py`. No route
      signatures, no auth dependencies, no response shapes change.

**✅ Validation checkpoint — Backend:**
- [ ] `GET /products` reachable with no Authorization header, returns only active products
- [ ] `/admin/products` create/list/update/delete still work exactly as before (regression check)
- [ ] No change to `dependencies/auth.py`, `routes/auth.py`, or any `Depends(require_admin)` / `Depends(require_customer)` usage anywhere

---

## Database

- [ ] Generate one Alembic migration via
      `docker compose exec backend alembic revision --autogenerate -m "expand_product_schema"`
      (same workflow as B-13 — host-side Alembic can't reach the DB container,
      its port isn't published).
- [ ] Inspect the generated migration before applying: confirm it only adds
      columns to `products` (`image_url`, the new price column) — does **not**
      touch `users`, `cart_items`, or `contact_submissions`.
- [ ] Apply via `docker compose exec backend alembic upgrade head`.
- [ ] Confirm rollback path: `alembic downgrade -1` removes only the new
      columns, no data loss to existing rows' `name`/`category`/`pricing`/etc.

**✅ Validation checkpoint — Database:**
- [ ] `docker compose exec db psql -U fg_user -d fiddlers_green -c "\d products"` shows the new columns with correct types
- [ ] Existing product rows (created during Phase 15 validation) still have their original data intact after migration

---

## Frontend

- [ ] Replace `app/catalog/page.tsx`'s static `import { CATEGORIES } from "@/data/products"` with a fetch to `GET /products`, grouped client-side into the same `Category[]` shape `CatalogCover`, `TableOfContents`, and `CategorySection` already expect — so those three components require **zero changes**.
- [ ] Update `components/catalog/ProductCard.tsx` to render price (and image_url with a fallback to the existing per-category placeholder SVGs in `public/images/catalog/`) from real backend data instead of the static `Product` type's `image`/`type` fields.
- [ ] Decide fate of `data/products.ts` — keep (its types may still serve the untouched `/catalog/gummies` experience) or retire once nothing imports it. **Confirm `/catalog/gummies` (driven entirely by `data/strengths.ts`/`data/entryOptions.ts`, verified unrelated to `data/products.ts`) is not touched.**
- [ ] Confirm `app/catalog/[category]/page.tsx` (currently a redirect stub to `/catalog`) is left as-is unless this phase explicitly adds per-category dynamic pages — not required by the roadmap text as written.

**✅ Validation checkpoint — Frontend:**
- [ ] `/catalog` renders identically in visual structure/styling to today, with real backend data instead of static
- [ ] `npm run lint`, `npx tsc --noEmit`, `npm run build` all clean
- [ ] No change to dark/gold Tailwind brand classes or existing component visual structure — only the data source changes

---

## Cart Integration

- [ ] Update `fiddlers_green-backend/repositories/cart.py`'s `get_cart()` to eager-load the related `Product` row (`selectinload(CartItem.product)`) to avoid N+1 queries once the response needs product fields.
- [ ] Update `fiddlers_green-backend/models/cart.py`'s `CartItemResponse` to include product name/image/price (nested or flattened — implementation detail, not a contract change to `CartAddRequest`/`CartRemoveRequest`). Update `CartResponse.from_items` to compute real per-line and total subtotals from the new numeric price field.
- [ ] Update `fiddlers_green-frontend/components/cart/CartView.tsx` to render name/image/price/subtotal instead of the raw product UUID currently shown.
- [ ] **Do not touch:** `routes/cart.py`'s route signatures or `Depends(require_customer)` usage; `repositories/cart.py`'s `add_to_cart`/`remove_from_cart` function signatures; the `user_id == current_user.id` ownership filter anywhere — cart ownership/security logic stays exactly as validated in Phase 15's B-16 through B-18 and Phase 15.1.

**✅ Validation checkpoint — Cart Integration:**
- [ ] `GET /cart` response includes product name/image/price and a correct subtotal per line and total
- [ ] Cross-user cart isolation still holds — re-run the same two-user isolation check from B-18/Phase 15.1 (User B never sees or can remove User A's items)
- [ ] Cart quantity-increment and idempotent-remove behavior (verified in B-14) unchanged

---

## Testing

- [ ] Full Docker rebuild (`docker compose up --build -d`) — new route + new migration require this, per the established pattern from every prior phase with backend changes.
- [ ] Playwright: `GET /products` returns real data anonymously (no token)
- [ ] Playwright: `/catalog` renders using backend data, not the static import (verify by checking a product created via `/admin/products` appears on `/catalog` without a frontend rebuild)
- [ ] Playwright: category filtering and name search both work against `GET /products`
- [ ] Playwright: cart shows real product name/image/price/subtotal after adding an item
- [ ] Playwright: re-run the existing security checks from `PHASE_15_1_AUTH_UI_INTEGRATION.md` (customer blocked from `/admin/products`, cross-user cart isolation, logout clears state) as a regression pass — Phase 16 must not weaken anything Phase 15/15.1 already validated
- [ ] Playwright: admin create/list product still functional (regression)
- [ ] Screenshots captured for: catalog page with backend-driven products, cart with enriched product display

**✅ Validation checkpoint — Testing:**
- [ ] All checks above pass against a clean `docker compose down -v && up --build -d` (matching B-18's clean-room validation standard)
- [ ] Zero console errors/warnings during the full Playwright run (matching Phase 15.1's standard)

---

## Explicitly out of scope for Phase 16 (per your constraints)

- Auth logic, JWT handling, `dependencies/auth.py`
- RBAC / permission dependencies (`require_admin`, `require_customer`)
- Cart ownership/security logic (`user_id` filtering)
- Docker / deployment configuration (`docker-compose.yml`, Dockerfiles)
- Any change to `PHASES_17_18_ROADMAP_AND_TUTORIALS.md` (unrelated to this phase)
