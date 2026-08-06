"use client";

// Global cart state, shared between Navbar, /cart, and /catalog. Mirrors
// AuthContext's structure exactly (same Context/Provider/hook shape, same
// localStorage-free, token-driven approach — the cart has no persistence
// of its own on the client; it's a live mirror of the backend's per-user
// cart, refreshed on login/logout via AuthContext's own token/user state).
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getJson, postJson, putJson, deleteJson } from "@/lib/api";

export interface CartItem {
  id: string;
  product_id: string;
  product_name: string;
  product_category: string;
  // Backend serializes Decimal as a string (e.g. "15.00"), not a JSON
  // number, to avoid float precision loss — confirmed against the live
  // API during Phase 16.
  product_price: string | null;
  quantity: number;
  added_at: string;
}

interface CartState {
  items: CartItem[];
  total_items: number;
  total_price: string | null;
}

interface CartContextValue {
  cart: CartState | null;
  isLoading: boolean;
  addToCart: (productId: string, quantity?: number) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const { token, user } = useAuth();
  const [cart, setCart] = useState<CartState | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const refreshCart = useCallback(async () => {
    if (!token) {
      setCart(null);
      return;
    }
    setIsLoading(true);
    try {
      setCart(await getJson<CartState>("/cart", token));
    } catch (err) {
      console.error("[CartContext] refreshCart failed:", err);
      // No re-throw: refreshCart's only caller is the effect below, which
      // has nothing to catch it. State stays whatever it was (null on
      // first load), which is already the correct "no data yet" state.
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  // Re-sync whenever auth state changes: load on login, clear on logout.
  // Every mutation below sets state directly from that call's own
  // response, so this is the only fetch-on-a-dependency-change this
  // context performs.
  useEffect(() => {
    if (user && token) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      refreshCart();
    } else {
      setCart(null);
    }
  }, [user, token, refreshCart]);

  async function addToCart(productId: string, quantity = 1) {
    if (!token) return;
    try {
      setCart(
        await postJson<CartState>(
          "/cart/add",
          { product_id: productId, quantity },
          token
        )
      );
    } catch (err) {
      console.error("[CartContext] addToCart failed:", err);
      throw err;
    }
  }

  async function updateQuantity(productId: string, quantity: number) {
    if (!token) return;
    try {
      setCart(
        await putJson<CartState>(
          "/cart/update",
          { product_id: productId, quantity },
          token
        )
      );
    } catch (err) {
      console.error("[CartContext] updateQuantity failed:", err);
      throw err;
    }
  }

  async function removeFromCart(productId: string) {
    if (!token) return;
    try {
      setCart(
        await deleteJson<CartState>(
          "/cart/remove",
          { product_id: productId },
          token
        )
      );
    } catch (err) {
      console.error("[CartContext] removeFromCart failed:", err);
      throw err;
    }
  }

  const value: CartContextValue = {
    cart,
    isLoading,
    addToCart,
    updateQuantity,
    removeFromCart,
    refreshCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
