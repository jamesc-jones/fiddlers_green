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

  function handleAction(promise: Promise<void>) {
    setError("");
    promise.catch((err) =>
      setError(err instanceof Error ? err.message : "Could not update cart.")
    );
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
          cart.items.map((item) => (
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
                  onClick={() =>
                    handleAction(updateQuantity(item.product_id, item.quantity - 1))
                  }
                  className="text-brand-gold text-lg px-2 hover:text-brand-cream transition-colors"
                >
                  −
                </button>
                <span className="font-body text-sm text-brand-cream w-4 text-center">
                  {item.quantity}
                </span>
                <button
                  aria-label="Increase quantity"
                  onClick={() => handleAction(addToCart(item.product_id, 1))}
                  className="text-brand-gold text-lg px-2 hover:text-brand-cream transition-colors"
                >
                  +
                </button>
                <button
                  onClick={() => handleAction(removeFromCart(item.product_id))}
                  className="font-body text-xs tracking-[0.15em] uppercase text-brand-gold hover:underline"
                >
                  Remove
                </button>
              </div>
            </div>
          ))
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
