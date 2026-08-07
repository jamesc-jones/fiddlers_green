"use client";

// Single fetch point for backend product data on the catalog page — one
// GET /products call for the whole page, not one per category or per
// card. As of Phase 16.3 this is also the sole source of catalog content
// (name, type, description, image): data/products.ts has been retired.
import { useEffect, useState } from "react";
import type { CategoryMeta } from "@/data/categories";
import { getJson } from "@/lib/api";
import CategorySection from "@/components/catalog/CategorySection";
import type { PublicProduct } from "@/lib/catalogGrouping";

// Re-exported for existing consumers (e.g. GummyVariantActions.tsx) that
// import the type from this module's original location.
export type { PublicProduct };

export default function InteractiveCatalog({ categories }: { categories: CategoryMeta[] }) {
  const [backendProducts, setBackendProducts] = useState<PublicProduct[] | null>(null);

  useEffect(() => {
    getJson<PublicProduct[]>("/products")
      .then(setBackendProducts)
      .catch(() => setBackendProducts([]));
  }, []);

  return (
    <>
      {categories.map((category) => (
        <CategorySection key={category.id} category={category} backendProducts={backendProducts} />
      ))}
    </>
  );
}
