"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { deleteJson, getJson, postJson } from "@/lib/api";

interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  added_at: string;
}

interface CartResponse {
  items: CartItem[];
  total_items: number;
}

const inputClasses =
  "w-full bg-transparent border border-white/20 px-4 py-3 font-body text-brand-cream focus:outline-none focus:border-brand-gold";

export default function CartView() {
  const { token, isLoading, isAllowed } = useRequireAuth();

  const [cart, setCart] = useState<CartResponse | null>(null);
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState(1);
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

  async function handleAdd(event: FormEvent) {
    event.preventDefault();
    if (!token || !productId) return;
    setError("");
    try {
      const data = await postJson<CartResponse>(
        "/cart/add",
        { product_id: productId, quantity },
        token
      );
      setCart(data);
      setProductId("");
      setQuantity(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add item.");
    }
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
    <div className="max-w-lg mx-auto text-left">
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
                <p className="text-brand-smoke text-xs uppercase tracking-wide">
                  Product
                </p>
                <p className="truncate max-w-[220px]">{item.product_id}</p>
                <p className="text-brand-smoke text-xs">
                  Qty: {item.quantity}
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
        <p
          data-testid="cart-total"
          className="mt-4 font-body text-sm text-brand-smoke text-center"
        >
          Total items: {cart.total_items}
        </p>
      )}

      <form
        onSubmit={handleAdd}
        aria-label="Add to cart"
        className="mt-10 flex flex-col gap-4"
      >
        <p className="font-body text-xs tracking-[0.2em] uppercase text-brand-gold text-center">
          Add a Product
        </p>
        <input
          aria-label="Product ID"
          placeholder="Product ID"
          value={productId}
          onChange={(event) => setProductId(event.target.value)}
          className={inputClasses}
          required
        />
        <input
          aria-label="Quantity"
          type="number"
          min={1}
          value={quantity}
          onChange={(event) => setQuantity(Number(event.target.value))}
          className={inputClasses}
        />
        <button
          type="submit"
          className="inline-flex items-center justify-center border border-brand-gold text-brand-gold px-8 py-3 font-body text-sm tracking-[0.15em] uppercase transition-colors duration-300 hover:bg-brand-gold hover:text-black"
        >
          Add to Cart
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
