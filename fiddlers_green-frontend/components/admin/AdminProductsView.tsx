"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { deleteJson, getJson, postJson, putJson } from "@/lib/api";

interface Product {
  id: string;
  name: string;
  category: string;
  description: string | null;
  dosage: string | null;
  pricing: string | null;
  price: string | null;
  is_active: boolean;
  variant_option: string | null;
  sku: string | null;
  image_url: string | null;
  product_type: string | null;
}

// Phase 16.3 — matches backend models/product.py's KNOWN_CATEGORIES.
// Previously a free-text input; now that the frontend catalog renders
// live from this same category value (and the backend rejects anything
// outside this set with a 422), a free-text field would just be constant
// admin friction — same reasoning as the Phase 17 inquiry_type fix.
const KNOWN_CATEGORIES = ["flower", "hash", "gummies"] as const;

const inputClasses =
  "w-full bg-transparent border border-white/20 px-4 py-3 font-body text-brand-cream focus:outline-none focus:border-brand-gold";

export default function AdminProductsView() {
  const { token, isLoading, isAllowed } = useRequireAuth("admin");

  const [products, setProducts] = useState<Product[]>([]);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [pricing, setPricing] = useState("");
  // Phase 17 — required: the cart computes totals from this numeric field,
  // not from `pricing` (a display-only string). Previously missing from
  // this form entirely, which let products be created with no usable
  // price and silently broke cart totals for anyone who added them.
  const [price, setPrice] = useState("");
  // Phase 16.2 — only meaningful for gummy configuration products
  // (category="gummies"); left blank for every other product, same as
  // the backend leaves both columns NULL when they're not sent.
  const [dosage, setDosage] = useState("");
  const [variantOption, setVariantOption] = useState("");
  // Phase 16.3 — optional; backend fills a category-based placeholder
  // image and leaves product_type NULL when omitted, same as before this
  // form could set them at all.
  const [imageUrl, setImageUrl] = useState("");
  const [productType, setProductType] = useState("");
  const [error, setError] = useState("");

  // Phase 16.3.1 — separate form/state for weight-variant creation. Kept
  // entirely independent from the fields above: this posts to a different
  // endpoint (POST /admin/products/weight-variants) and creates 5 rows at
  // once rather than editing the single-product create form's shape.
  const [weightName, setWeightName] = useState("");
  const [weightCategory, setWeightCategory] = useState<"flower" | "hash">("flower");
  const [weightDescription, setWeightDescription] = useState("");
  const [pricePerGram, setPricePerGram] = useState("");
  const [isCreatingWeightVariants, setIsCreatingWeightVariants] = useState(false);
  const [weightError, setWeightError] = useState("");
  const [weightSuccess, setWeightSuccess] = useState("");

  // Phase 17 — Step 1B: minimal inline edit, price only. Keyed by product
  // id so at most one row is ever in edit mode; reuses the existing
  // PUT /admin/products/{id} endpoint (already supports partial updates
  // and already validates price > 0 — see Step 1A), not a new route.
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState("");
  // Phase 17 — Step 1C: optional staff-facing identifier, edited alongside
  // price. Left blank means "leave unchanged" (sent as undefined, matching
  // the create form's existing optional-field pattern below) — there's no
  // way to explicitly clear an existing sku from this minimal UI.
  const [editSku, setEditSku] = useState("");
  // Phase 17 Step 6 — none of Create/Save/Deactivate had any in-flight
  // feedback before this: a double-click could fire two overlapping
  // requests (e.g. two identical products from one "Create" double-click).
  const [isCreating, setIsCreating] = useState(false);
  // Save and Deactivate are mutually exclusive per product row (Deactivate
  // isn't offered while a row is mid-edit), so one shared pending-id
  // tracker is enough — same per-row pattern as CartView.tsx.
  const [pendingId, setPendingId] = useState<string | null>(null);

  const refreshProducts = useCallback(async () => {
    if (!token) return;
    const data = await getJson<Product[]>("/admin/products", token);
    setProducts(data);
  }, [token]);

  useEffect(() => {
    if (isAllowed && token) {
      // See the identical comment in components/cart/CartView.tsx — same
      // one-time mount-sync pattern, same lint-rule tradeoff.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      refreshProducts().catch(() =>
        setError("Could not load products. Please try again.")
      );
    }
  }, [isAllowed, token, refreshProducts]);

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    if (!token) return;
    setError("");
    setIsCreating(true);
    try {
      await postJson<Product>(
        "/admin/products",
        {
          name,
          category,
          pricing: pricing || undefined,
          price,
          dosage: dosage || undefined,
          variant_option: variantOption || undefined,
          image_url: imageUrl || undefined,
          product_type: productType || undefined,
        },
        token
      );
      setName("");
      setCategory("");
      setPricing("");
      setPrice("");
      setDosage("");
      setVariantOption("");
      setImageUrl("");
      setProductType("");
      await refreshProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create product.");
    } finally {
      setIsCreating(false);
    }
  }

  async function handleCreateWeightVariants(event: FormEvent) {
    event.preventDefault();
    if (!token) return;
    setWeightError("");
    setWeightSuccess("");
    setIsCreatingWeightVariants(true);
    try {
      await postJson<Product[]>(
        "/admin/products/weight-variants",
        {
          name: weightName,
          category: weightCategory,
          description: weightDescription || undefined,
          price_per_gram: pricePerGram,
        },
        token
      );
      setWeightSuccess(`Created 5 weight variants for "${weightName}".`);
      setWeightName("");
      setWeightDescription("");
      setPricePerGram("");
      await refreshProducts();
    } catch (err) {
      setWeightError(err instanceof Error ? err.message : "Could not create weight variants.");
    } finally {
      setIsCreatingWeightVariants(false);
    }
  }

  function startEdit(product: Product) {
    setError("");
    setEditingId(product.id);
    setEditPrice(product.price ?? "");
    setEditSku(product.sku ?? "");
  }

  async function handleSaveEdit(productId: string) {
    if (!token) return;
    setError("");
    setPendingId(productId);
    try {
      await putJson<Product>(
        `/admin/products/${productId}`,
        { price: editPrice, sku: editSku || undefined },
        token
      );
      setEditingId(null);
      await refreshProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update product.");
    } finally {
      setPendingId(null);
    }
  }

  async function handleDeactivate(productId: string) {
    if (!token) return;
    setError("");
    setPendingId(productId);
    try {
      await deleteJson<void>(`/admin/products/${productId}`, undefined, token);
      await refreshProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not deactivate product.");
    } finally {
      setPendingId(null);
    }
  }

  if (isLoading || !isAllowed) {
    return (
      <p className="font-body text-brand-smoke text-center">Loading...</p>
    );
  }

  return (
    <div className="max-w-2xl mx-auto text-left">
      <div data-testid="admin-product-list" className="border border-white/10 divide-y divide-white/10">
        {products.length > 0 ? (
          products.map((product) => (
            <div key={product.id} className="px-4 py-3 flex items-center justify-between gap-3">
              <div className="font-body text-sm text-brand-cream">
                <p>{product.name}</p>
                <p className="text-brand-smoke text-xs uppercase tracking-wide">
                  {product.category} {product.product_type ? `· ${product.product_type}` : ""}
                  {product.pricing ? ` · ${product.pricing}` : ""}
                  {product.variant_option ? ` · ${product.variant_option}` : ""}
                  {product.dosage ? ` · ${product.dosage}` : ""}
                </p>
                <p className="text-brand-smoke/50 text-[10px] tracking-wide">
                  ID: {product.id} · SKU: {product.sku ?? "No SKU"}
                </p>
              </div>

              {editingId === product.id ? (
                <div className="flex items-center gap-2">
                  <input
                    aria-label={`Edit price for ${product.name}`}
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={editPrice}
                    onChange={(event) => setEditPrice(event.target.value)}
                    className="w-24 bg-transparent border border-white/20 px-2 py-1 font-body text-sm text-brand-cream focus:outline-none focus:border-brand-gold"
                  />
                  <div className="flex flex-col gap-1">
                    <input
                      aria-label={`Edit SKU for ${product.name}`}
                      placeholder="e.g. FG-GUM-001"
                      value={editSku}
                      onChange={(event) => setEditSku(event.target.value)}
                      className="w-32 bg-transparent border border-white/20 px-2 py-1 font-body text-sm text-brand-cream focus:outline-none focus:border-brand-gold"
                    />
                    {/* Guidance only — not enforced. Backend validation is
                        unchanged: any non-blank string up to 64 chars. */}
                    <p className="text-brand-smoke/50 text-[10px] tracking-wide whitespace-nowrap">
                      Format: BRAND-CATEGORY-NUMBER (e.g. FG-GUM-001)
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={pendingId === product.id}
                    onClick={() => handleSaveEdit(product.id)}
                    className="font-body text-xs tracking-[0.15em] uppercase text-brand-gold hover:underline disabled:opacity-50 disabled:pointer-events-none disabled:no-underline"
                  >
                    {pendingId === product.id ? "Saving..." : "Save"}
                  </button>
                  <button
                    type="button"
                    disabled={pendingId === product.id}
                    onClick={() => setEditingId(null)}
                    className="font-body text-xs tracking-[0.15em] uppercase text-brand-smoke hover:underline disabled:opacity-50 disabled:pointer-events-none disabled:no-underline"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <span
                    className={`font-body text-xs uppercase tracking-wide ${
                      product.price !== null ? "text-brand-smoke" : "text-red-400"
                    }`}
                  >
                    {product.price !== null ? `$${product.price}` : "No price"}
                  </span>
                  <span
                    className={`font-body text-xs uppercase tracking-wide ${
                      product.is_active ? "text-brand-gold" : "text-brand-smoke"
                    }`}
                  >
                    {product.is_active ? "Active" : "Inactive"}
                  </span>
                  <button
                    type="button"
                    onClick={() => startEdit(product)}
                    className="font-body text-xs tracking-[0.15em] uppercase text-brand-gold hover:underline"
                  >
                    Edit
                  </button>
                  {product.is_active && (
                    <button
                      type="button"
                      disabled={pendingId === product.id}
                      onClick={() => handleDeactivate(product.id)}
                      className="font-body text-xs tracking-[0.15em] uppercase text-red-400 hover:underline disabled:opacity-50 disabled:pointer-events-none disabled:no-underline"
                    >
                      {pendingId === product.id ? "Deactivating..." : "Deactivate"}
                    </button>
                  )}
                </div>
              )}
            </div>
          ))
        ) : (
          <p className="px-4 py-6 text-center font-body text-brand-smoke">
            No products yet.
          </p>
        )}
      </div>

      <form onSubmit={handleCreate} aria-label="Create product" className="mt-10 flex flex-col gap-4">
        <p className="font-body text-xs tracking-[0.2em] uppercase text-brand-gold text-center">
          Add a Product
        </p>
        <input
          aria-label="Product name"
          placeholder="Name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          className={inputClasses}
          required
        />
        <select
          aria-label="Category"
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          className={inputClasses}
          required
        >
          <option value="" disabled>
            Select a category
          </option>
          {KNOWN_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <input
          aria-label="Price"
          placeholder="Price (e.g. 15.00)"
          type="number"
          step="0.01"
          min="0.01"
          value={price}
          onChange={(event) => setPrice(event.target.value)}
          className={inputClasses}
          required
        />
        <input
          aria-label="Pricing"
          placeholder="Pricing display text (optional, e.g. $15)"
          value={pricing}
          onChange={(event) => setPricing(event.target.value)}
          className={inputClasses}
        />
        <input
          aria-label="Dosage"
          placeholder="Dosage (optional, e.g. 2500mg)"
          value={dosage}
          onChange={(event) => setDosage(event.target.value)}
          className={inputClasses}
        />
        <input
          aria-label="Variant Option"
          placeholder="Variant Option (optional, gummy configurations only)"
          value={variantOption}
          onChange={(event) => setVariantOption(event.target.value)}
          className={inputClasses}
        />
        <input
          aria-label="Image URL"
          placeholder="Image URL (optional, defaults to category placeholder)"
          value={imageUrl}
          onChange={(event) => setImageUrl(event.target.value)}
          className={inputClasses}
        />
        <input
          aria-label="Product Type"
          placeholder="Product Type (optional, e.g. Sativa, 10mg THC)"
          value={productType}
          onChange={(event) => setProductType(event.target.value)}
          className={inputClasses}
        />
        <button
          type="submit"
          disabled={isCreating}
          className="inline-flex items-center justify-center border border-brand-gold text-brand-gold px-8 py-3 font-body text-sm tracking-[0.15em] uppercase transition-colors duration-300 hover:bg-brand-gold hover:text-black disabled:opacity-50"
        >
          {isCreating ? "Creating..." : "Create Product"}
        </button>
      </form>

      {error && (
        <p role="alert" className="mt-4 font-body text-sm text-red-400 text-center">
          {error}
        </p>
      )}

      <form
        onSubmit={handleCreateWeightVariants}
        aria-label="Create weight variants"
        className="mt-14 flex flex-col gap-4 border-t border-white/10 pt-10"
      >
        <p className="font-body text-xs tracking-[0.2em] uppercase text-brand-gold text-center">
          Add Weight Variants (Flower / Hash)
        </p>
        <p className="font-body text-xs text-brand-smoke text-center">
          Creates 5 products (1g / 3.5g / 7g / 14g / 28g) priced from a single per-gram rate.
        </p>
        <input
          aria-label="Weight variant base name"
          placeholder="Name (e.g. Cedar Haze)"
          value={weightName}
          onChange={(event) => setWeightName(event.target.value)}
          className={inputClasses}
          required
        />
        <select
          aria-label="Weight variant category"
          value={weightCategory}
          onChange={(event) => setWeightCategory(event.target.value as "flower" | "hash")}
          className={inputClasses}
          required
        >
          <option value="flower">flower</option>
          <option value="hash">hash</option>
        </select>
        <input
          aria-label="Weight variant price per gram"
          placeholder="Price per gram (e.g. 10.00)"
          type="number"
          step="0.01"
          min="0.01"
          value={pricePerGram}
          onChange={(event) => setPricePerGram(event.target.value)}
          className={inputClasses}
          required
        />
        <input
          aria-label="Weight variant description"
          placeholder="Description (optional)"
          value={weightDescription}
          onChange={(event) => setWeightDescription(event.target.value)}
          className={inputClasses}
        />
        <button
          type="submit"
          disabled={isCreatingWeightVariants}
          className="inline-flex items-center justify-center border border-brand-gold text-brand-gold px-8 py-3 font-body text-sm tracking-[0.15em] uppercase transition-colors duration-300 hover:bg-brand-gold hover:text-black disabled:opacity-50"
        >
          {isCreatingWeightVariants ? "Creating..." : "Create Weight Variants"}
        </button>
        {weightError && (
          <p role="alert" className="font-body text-sm text-red-400 text-center">
            {weightError}
          </p>
        )}
        {weightSuccess && (
          <p className="font-body text-sm text-brand-gold text-center">{weightSuccess}</p>
        )}
      </form>
    </div>
  );
}
