"use client";

import { useCallback, useEffect, useState } from "react";
import { getJson } from "@/lib/api";

interface Product {
  id: string;
  name: string;
  category: string;
  description: string | null;
  // Backend serializes Decimal as a string (e.g. "15.00"), not a JSON
  // number, to avoid float precision loss — confirmed against the live
  // API, not assumed.
  price: string | null;
  is_active: boolean;
}

export default function ProductListing({
  onAdd,
}: {
  onAdd: (productId: string) => Promise<void>;
}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState("");
  const [addingId, setAddingId] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    const data = await getJson<Product[]>("/products");
    setProducts(data);
  }, []);

  useEffect(() => {
    // Loading the product list on mount is a one-time sync with the
    // backend, not an event — same react-hooks/set-state-in-effect
    // tradeoff already documented in CartView.tsx.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchProducts().catch(() => setError("Could not load products."));
  }, [fetchProducts]);

  async function handleAdd(productId: string) {
    setAddingId(productId);
    setError("");
    try {
      await onAdd(productId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add item.");
    } finally {
      setAddingId(null);
    }
  }

  return (
    <div>
      <p className="font-body text-xs tracking-[0.2em] uppercase text-brand-gold text-center mb-6">
        Products
      </p>

      {products.length === 0 ? (
        <p className="text-center font-body text-brand-smoke">
          No products available.
        </p>
      ) : (
        <div data-testid="product-listing" className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {products.map((product) => (
            <div
              key={product.id}
              className="border border-white/10 p-4 flex flex-col gap-2"
            >
              <p className="font-display text-xl text-brand-cream">
                {product.name}
              </p>
              <p className="font-body text-xs uppercase tracking-wide text-brand-smoke">
                {product.category}
              </p>
              <p className="font-body text-brand-gold">
                {product.price !== null
                  ? `$${Number(product.price).toFixed(2)}`
                  : "Price unavailable"}
              </p>
              <button
                onClick={() => handleAdd(product.id)}
                disabled={addingId === product.id}
                className="mt-2 inline-flex items-center justify-center border border-brand-gold text-brand-gold px-4 py-2 font-body text-xs tracking-[0.15em] uppercase transition-colors duration-300 hover:bg-brand-gold hover:text-black disabled:opacity-50"
              >
                {addingId === product.id ? "Adding..." : "Add to Cart"}
              </button>
            </div>
          ))}
        </div>
      )}

      {error && (
        <p role="alert" className="mt-4 font-body text-sm text-red-400 text-center">
          {error}
        </p>
      )}
    </div>
  );
}
