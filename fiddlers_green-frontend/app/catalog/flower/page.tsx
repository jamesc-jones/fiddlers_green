import type { Metadata } from "next";
import Link from "next/link";
import { CATEGORIES } from "@/data/products";
import InteractiveCatalog from "@/components/catalog/InteractiveCatalog";

const category = CATEGORIES.find((c) => c.id === "flower")!;

export const metadata: Metadata = {
  title: category.label,
  description: category.description,
};

export default function FlowerPage() {
  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-6xl px-6 md:px-10 pt-16 md:pt-20">
        <Link
          href="/catalog"
          className="font-body text-xs tracking-[0.3em] text-white/40 uppercase hover:text-brand-gold transition-colors"
        >
          ← Catalog
        </Link>
      </div>
      <InteractiveCatalog categories={[category]} />
    </div>
  );
}
