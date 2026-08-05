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
}

const inputClasses =
  "w-full bg-transparent border border-white/20 px-4 py-3 font-body text-brand-cream focus:outline-none focus:border-brand-gold";

export default function AdminProductsView() {
  const { token, isLoading, isAllowed } = useRequireAuth("admin");

  const [products, setProducts] = useState<Product[]>([]);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [pricing, setPricing] = useState("");
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
        { name, category, pricing: pricing || undefined },
        token
      );
      setName("");
      setCategory("");
      setPricing("");
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
