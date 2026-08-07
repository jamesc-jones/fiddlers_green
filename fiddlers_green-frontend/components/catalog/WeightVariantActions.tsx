"use client";

// Phase 16.3.1 — inline weight picker + Add to Cart for a grouped
// Flower/Hash card (one base product, multiple weight-variant Products).
// Mirrors CatalogProductActions.tsx's fail-closed anonymous-user handling;
// the weight selection itself can never be "no match" the way gummy
// configurator selections can, since `variants` here is already the
// resolved set of Products for this base name.
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import type { WeightVariant } from "@/lib/catalogGrouping";
import { weightLabel } from "@/data/weights";

function formatCurrency(value: string | null): string {
  return value !== null ? `$${Number(value).toFixed(2)}` : "Price unavailable";
}

export default function WeightVariantActions({ variants }: { variants: WeightVariant[] }) {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [selectedId, setSelectedId] = useState(variants[0]?.id ?? "");
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState("");

  if (variants.length === 0) return null;

  const selected = variants.find((v) => v.id === selectedId) ?? variants[0];

  async function handleAdd() {
    setIsAdding(true);
    setError("");
    try {
      await addToCart(selected.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add item.");
    } finally {
      setIsAdding(false);
    }
  }

  return (
    <div className="mt-2">
      <div className="flex flex-wrap gap-1.5">
        {variants.map((variant) => (
          <button
            key={variant.id}
            type="button"
            aria-pressed={variant.id === selectedId}
            onClick={() => setSelectedId(variant.id)}
            className={[
              "border px-2 py-1 font-body text-[11px] tracking-wide uppercase transition-colors duration-200",
              variant.id === selectedId
                ? "border-brand-gold text-brand-gold"
                : "border-white/20 text-white/50 hover:border-white/40 hover:text-white/70",
            ].join(" ")}
          >
            {weightLabel(variant.weightKey)}
          </button>
        ))}
      </div>

      <p className="mt-2 font-body text-xs text-brand-smoke">{formatCurrency(selected.price)}</p>

      {user ? (
        <>
          <button
            onClick={handleAdd}
            disabled={isAdding}
            className="mt-2 inline-flex items-center justify-center border border-brand-gold text-brand-gold px-4 py-2 font-body text-xs tracking-[0.15em] uppercase transition-colors duration-300 hover:bg-brand-gold hover:text-black disabled:opacity-50"
          >
            {isAdding ? "Adding..." : "Add to Cart"}
          </button>
          {error && (
            <p role="alert" className="mt-1 font-body text-xs text-red-400">
              {error}
            </p>
          )}
        </>
      ) : (
        <p className="mt-2 font-body text-xs text-brand-smoke">Sign in to add this to your cart.</p>
      )}
    </div>
  );
}
