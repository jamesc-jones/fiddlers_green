"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import type { Product } from "@/data/products";
import type { PublicProduct } from "@/components/catalog/InteractiveCatalog";

export default function CatalogProductActions({
  staticProduct,
  backendProducts,
}: {
  staticProduct: Product;
  backendProducts: PublicProduct[] | null;
}) {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState("");

  // Matching is by exact product name — the only correlation key
  // available between the static catalog and the backend Product table
  // (the static catalog's ids are hand-written slugs with no relationship
  // to backend UUIDs). Fragile by nature; the mismatch-logging pass in
  // InteractiveCatalog surfaces drift during development. Fail closed:
  // no match, no button — never a broken button pointing at nothing.
  const match = backendProducts?.find((p) => p.name === staticProduct.name) ?? null;

  if (!match) return null;

  // Anonymous users get no cart controls at all: CartContext.addToCart
  // silently no-ops without a token (there's no anonymous cart), so
  // rendering the button here would offer an action that does nothing
  // with no feedback. Same fail-closed pattern as the no-match case above.
  if (!user) return null;

  async function handleAdd() {
    setIsAdding(true);
    setError("");
    try {
      await addToCart(match!.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add item.");
    } finally {
      setIsAdding(false);
    }
  }

  return (
    <div className="mt-2">
      <button
        onClick={handleAdd}
        disabled={isAdding}
        className="inline-flex items-center justify-center border border-brand-gold text-brand-gold px-4 py-2 font-body text-xs tracking-[0.15em] uppercase transition-colors duration-300 hover:bg-brand-gold hover:text-black disabled:opacity-50"
      >
        {isAdding ? "Adding..." : "Add to Cart"}
      </button>
      {error && (
        <p role="alert" className="mt-1 font-body text-xs text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
