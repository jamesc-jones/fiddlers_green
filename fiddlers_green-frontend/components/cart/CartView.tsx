"use client";

import { useState } from "react";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useCart } from "@/contexts/CartContext";
import ProductListing from "@/components/cart/ProductListing";

function formatCurrency(value: number): string {
  return `$${value.toFixed(2)}`;
}

export default function CartView() {
  const { isLoading: authLoading, isAllowed } = useRequireAuth();
  const { cart, addToCart, updateQuantity, removeFromCart } = useCart();
  const [error, setError] = useState("");
  // Phase 17 Step 6 — tracks which single cart line item currently has a
  // request in flight, and which of its actions triggered it (same
  // per-item pending-id pattern already used by ProductListing.tsx below
  // on this same page). Previously these buttons had no loading/disabled
  // feedback at all, so a rapid double-click on +/−/Remove could fire two
  // overlapping requests for the same item. Tracking the action type too
  // (not just the product) so, e.g., a +/− click never makes the Remove
  // button say "Removing..." for the same item.
  const [pending, setPending] = useState<{ productId: string; action: "quantity" | "remove" } | null>(null);

  function handleAction(
    productId: string,
    action: "quantity" | "remove",
    promise: Promise<void>
  ) {
    setError("");
    setPending({ productId, action });
    promise
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Could not update cart.")
      )
      .finally(() => setPending(null));
  }

  if (authLoading || !isAllowed) {
    return (
      <p className="font-body text-brand-smoke text-center">Loading...</p>
    );
  }

  return (
    <div className="max-w-2xl mx-auto text-left">
      <div
        data-testid="cart-items"
        className="border border-white/10 divide-y divide-white/10"
      >
        {cart && cart.items.length > 0 ? (
          cart.items.map((item) => {
            const isPending = pending?.productId === item.product_id;
            const isRemoving = isPending && pending?.action === "remove";
            return (
              <div
                key={item.id}
                className="flex items-center justify-between px-4 py-3"
              >
                <div className="font-body text-sm text-brand-cream">
                  <p className="text-brand-cream">{item.product_name}</p>
                  <p className="text-brand-smoke text-xs uppercase tracking-wide">
                    {item.product_category}
                  </p>
                  <p className="text-brand-smoke text-xs">
                    {item.product_price !== null
                      ? formatCurrency(Number(item.product_price) * item.quantity)
                      : "Price unavailable"}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    aria-label="Decrease quantity"
                    disabled={isPending}
                    onClick={() =>
                      handleAction(
                        item.product_id,
                        "quantity",
                        updateQuantity(item.product_id, item.quantity - 1)
                      )
                    }
                    className="text-brand-gold text-lg px-2 hover:text-brand-cream transition-colors disabled:opacity-30 disabled:pointer-events-none"
                  >
                    −
                  </button>
                  <span className="font-body text-sm text-brand-cream w-4 text-center">
                    {item.quantity}
                  </span>
                  <button
                    aria-label="Increase quantity"
                    disabled={isPending}
                    onClick={() =>
                      handleAction(item.product_id, "quantity", addToCart(item.product_id, 1))
                    }
                    className="text-brand-gold text-lg px-2 hover:text-brand-cream transition-colors disabled:opacity-30 disabled:pointer-events-none"
                  >
                    +
                  </button>
                  <button
                    disabled={isPending}
                    onClick={() =>
                      handleAction(item.product_id, "remove", removeFromCart(item.product_id))
                    }
                    className="font-body text-xs tracking-[0.15em] uppercase text-brand-gold hover:underline disabled:opacity-50 disabled:pointer-events-none disabled:no-underline"
                  >
                    {isRemoving ? "Removing..." : "Remove"}
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <p className="px-4 py-6 text-center font-body text-brand-smoke">
            Your cart is empty.
          </p>
        )}
      </div>

      {cart && (
        <div
          data-testid="cart-summary"
          className="mt-4 font-body text-sm text-brand-smoke text-center"
        >
          <p>Total items: {cart.total_items}</p>
          <p>
            Total:{" "}
            {cart.total_price !== null
              ? formatCurrency(Number(cart.total_price))
              : "Total unavailable"}
          </p>
        </div>
      )}

      {error && (
        <p role="alert" className="mt-4 font-body text-sm text-red-400 text-center">
          {error}
        </p>
      )}

      <div className="mt-14">
        <ProductListing onAdd={addToCart} />
      </div>
    </div>
  );
}
