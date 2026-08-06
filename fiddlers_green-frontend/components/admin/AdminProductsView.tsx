"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { getJson, postJson } from "@/lib/api";

interface Product {
  id: string;
  name: string;
  category: string;
  description: string | null;
  dosage: string | null;
  pricing: string | null;
  is_active: boolean;
  variant_option: string | null;
}

const inputClasses =
  "w-full bg-transparent border border-white/20 px-4 py-3 font-body text-brand-cream focus:outline-none focus:border-brand-gold";

export default function AdminProductsView() {
  const { token, isLoading, isAllowed } = useRequireAuth("admin");

  const [products, setProducts] = useState<Product[]>([]);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [pricing, setPricing] = useState("");
  // Phase 16.2 — only meaningful for gummy configuration products
  // (category="gummies"); left blank for every other product, same as
  // the backend leaves both columns NULL when they're not sent.
  const [dosage, setDosage] = useState("");
  const [variantOption, setVariantOption] = useState("");
  const [error, setError] = useState("");

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
    try {
      await postJson<Product>(
        "/admin/products",
        {
          name,
          category,
          pricing: pricing || undefined,
          dosage: dosage || undefined,
          variant_option: variantOption || undefined,
        },
        token
      );
      setName("");
      setCategory("");
      setPricing("");
      setDosage("");
      setVariantOption("");
      await refreshProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create product.");
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
            <div key={product.id} className="px-4 py-3 flex items-center justify-between">
              <div className="font-body text-sm text-brand-cream">
                <p>{product.name}</p>
                <p className="text-brand-smoke text-xs uppercase tracking-wide">
                  {product.category} {product.pricing ? `· ${product.pricing}` : ""}
                  {product.variant_option ? ` · ${product.variant_option}` : ""}
                  {product.dosage ? ` · ${product.dosage}` : ""}
                </p>
              </div>
              <span
                className={`font-body text-xs uppercase tracking-wide ${
                  product.is_active ? "text-brand-gold" : "text-brand-smoke"
                }`}
              >
                {product.is_active ? "Active" : "Inactive"}
              </span>
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
        <input
          aria-label="Category"
          placeholder="Category"
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          className={inputClasses}
          required
        />
        <input
          aria-label="Pricing"
          placeholder="Pricing (optional)"
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
        <button
          type="submit"
          className="inline-flex items-center justify-center border border-brand-gold text-brand-gold px-8 py-3 font-body text-sm tracking-[0.15em] uppercase transition-colors duration-300 hover:bg-brand-gold hover:text-black"
        >
          Create Product
        </button>
      </form>

      {error && (
        <p role="alert" className="mt-4 font-body text-sm text-red-400 text-center">
          {error}
        </p>
      )}
    </div>
  );
}
