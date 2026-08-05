import type { Metadata } from "next";
import CartView from "@/components/cart/CartView";

export const metadata: Metadata = {
  title: "Cart",
  description: "Your Fiddler's Green shopping cart.",
};

export default function CartPage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_50%_20%,_#141d17_0%,_#0a0d0a_55%,_#000000_100%)] px-6 md:px-10 py-24">
      <div className="max-w-2xl mx-auto text-center">
        <p className="font-body text-xs md:text-sm tracking-[0.3em] text-brand-gold uppercase">
          Your Selections
        </p>
        <h1 className="mt-6 mb-10 font-display italic text-4xl md:text-6xl text-brand-cream">
          Cart
        </h1>
        <CartView />
      </div>
    </div>
  );
}
