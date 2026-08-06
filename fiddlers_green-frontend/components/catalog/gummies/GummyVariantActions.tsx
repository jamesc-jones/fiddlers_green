"use client";

// Phase 16.2: resolves a gummy (entry, strength) selection to exactly one
// backend Product and offers Add to Cart via the existing CartContext —
// mirrors CatalogProductActions.tsx's fail-closed match pattern, applied
// to variant_option+dosage instead of name.
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { getJson } from "@/lib/api";
import { ENTRY_OPTIONS } from "@/data/entryOptions";
import type { PublicProduct } from "@/components/catalog/InteractiveCatalog";

function formatCurrency(value: string | null): string {
  return value !== null ? `$${Number(value).toFixed(2)}` : "Price unavailable";
}

export default function GummyVariantActions({
  entry,
  strength,
  onBack,
}: {
  entry: string;
  strength: string;
  onBack: () => void;
}) {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [products, setProducts] = useState<PublicProduct[] | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getJson<PublicProduct[]>("/products?category=gummies")
      .then(setProducts)
      .catch(() => setProducts([]));
  }, []);

  const entryLabel = ENTRY_OPTIONS.find((option) => option.id === entry)?.label ?? entry;

  async function handleAdd(productId: string) {
    setIsAdding(true);
    setError("");
    try {
      await addToCart(productId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add item.");
    } finally {
      setIsAdding(false);
    }
  }

  const backButton = (
    <button
      type="button"
      onClick={onBack}
      className="mb-6 py-2 text-xs tracking-[0.3em] text-white/40 uppercase hover:text-white transition"
    >
      ← Back
    </button>
  );

  if (products === null) {
    return (
      <div className="mx-auto max-w-md px-6 text-center">
        {backButton}
        <p className="font-body text-sm text-brand-smoke">Loading...</p>
      </div>
    );
  }

  const matches = products.filter(
    (p) => p.variant_option === entry && p.dosage === strength
  );

  // Zero matches: fail closed, no cart action offered. More than one
  // match: fail closed too — never guess which one the customer meant.
  // The backend's partial unique index on (variant_option, dosage) should
  // make this impossible, but the frontend does not trust that blindly.
  if (matches.length !== 1) {
    if (matches.length > 1) {
      console.warn(
        `[Gummies] Ambiguous match for entry="${entry}" strength="${strength}": ` +
          `${matches.length} backend products found. Add to Cart hidden — ` +
          `check for a duplicate variant_option+dosage combination.`
      );
    }
    return (
      <div className="mx-auto max-w-md px-6 text-center">
        {backButton}
        <p className="font-body text-xs tracking-[0.3em] text-white/40 uppercase mb-2">
          {entryLabel} · {strength}
        </p>
        <p className="font-body text-sm text-brand-smoke">
          This combination is currently unavailable.
        </p>
      </div>
    );
  }

  const match = matches[0];

  return (
    <div className="mx-auto max-w-md px-6 text-center">
      {backButton}
      <p className="font-body text-xs tracking-[0.3em] text-white/40 uppercase mb-2">
        {entryLabel} · {strength}
      </p>
      <h2 className="font-display text-2xl italic text-brand-cream mb-1">{match.name}</h2>
      <p className="font-body text-sm text-brand-smoke mb-6">{formatCurrency(match.price)}</p>

      {user ? (
        <>
          <button
            onClick={() => handleAdd(match.id)}
            disabled={isAdding}
            className="inline-flex items-center justify-center border border-brand-gold text-brand-gold px-8 py-3 font-body text-sm tracking-[0.15em] uppercase transition-colors duration-300 hover:bg-brand-gold hover:text-black disabled:opacity-50"
          >
            {isAdding ? "Adding..." : "Add to Cart"}
          </button>
          {error && (
            <p role="alert" className="mt-3 font-body text-xs text-red-400">
              {error}
            </p>
          )}
        </>
      ) : (
        // Anonymous users: same fail-closed rule as CatalogProductActions —
        // no cart control offered, since addToCart is a silent no-op
        // without a token.
        <p className="font-body text-xs text-brand-smoke">
          Sign in to add this to your cart.
        </p>
      )}
    </div>
  );
}
