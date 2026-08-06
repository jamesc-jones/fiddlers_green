"use client";

import { useCallback, useEffect, useState } from "react";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { deleteJson, getJson, postJson } from "@/lib/api";
import ProductListing from "@/components/cart/ProductListing";

interface CartItem {
  id: string;
  product_id: string;
  product_name: string;
  product_category: string;
  // Backend serializes Decimal as a string (e.g. "15.00"), not a JSON
  // number, to avoid float precision loss — confirmed against the live
  // API, not assumed.
  product_price: string | null;
  quantity: number;
  added_at: string;
}

interface CartResponse {
  items: CartItem[];
  total_items: number;
  total_price: string | null;
}

function formatCurrency(value: number): string {
  return `$${value.toFixed(2)}`;
}

export default function CartView() {
  const { token, isLoading, isAllowed } = useRequireAuth();

  const [cart, setCart] = useState<CartResponse | null>(null);
  const [error, setError] = useState("");

  const refreshCart = useCallback(async () => {
    if (!token) return;
    const data = await getJson<CartResponse>("/cart", token);
    setCart(data);
  }, [token]);

  useEffect(() => {
    if (isAllowed && token) {
      // Loading the cart on mount is a one-time sync with the backend, not
      // an event — react-hooks/set-state-in-effect's stricter reading of
      // this pattern doesn't have a non-effect alternative here without
      // pulling in a data-fetching library, which is out of scope.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      refreshCart().catch(() =>
        setError("Could not load your cart. Please try again.")
      );
    }
  }, [isAllowed, token, refreshCart]);

  async function handleAddProduct(productId: string) {
    if (!token) return;
    setError("");
    const data = await postJson<CartResponse>(
      "/cart/add",
      { product_id: productId, quantity: 1 },
      token
    );
    setCart(data);
  }

  async function handleRemove(itemProductId: string) {
    if (!token) return;
    setError("");
    try {
      const data = await deleteJson<CartResponse>(
        "/cart/remove",
        { product_id: itemProductId },
        token
      );
      setCart(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove item.");
    }
  }

  if (isLoading || !isAllowed) {
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
                  Qty: {item.quantity} ·{" "}
                  {item.product_price !== null
                    ? formatCurrency(Number(item.product_price) * item.quantity)
                    : "Price unavailable"}
                </p>
              </div>
              <button
                onClick={() => handleRemove(item.product_id)}
                className="font-body text-xs tracking-[0.15em] uppercase text-brand-gold hover:underline"
              >
                Remove
              </button>
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
        <ProductListing onAdd={handleAddProduct} />
      </div>
    </div>
  );
}
