"use client";

// Single fetch point for backend product data on the catalog page — one
// GET /products call for the whole page, not one per category or per
// card. CatalogCover and TableOfContents stay untouched server-rendered
// siblings; only the category/product grid needs to know about backend
// data, so only that part of the tree moves into this client component.
import { useEffect, useState } from "react";
import type { Category } from "@/data/products";
import { getJson } from "@/lib/api";
import CategorySection from "@/components/catalog/CategorySection";

export interface PublicProduct {
  id: string;
  name: string;
  category: string;
  description: string | null;
  price: string | null;
  is_active: boolean;
  // Added in Phase 16.2 — only meaningful for gummy configuration products
  // (see components/catalog/gummies/GummyVariantActions.tsx). NULL for
  // every Flower/Hash/named-Gummies product.
  dosage: string | null;
  variant_option: string | null;
}

export default function InteractiveCatalog({ categories }: { categories: Category[] }) {
  const [backendProducts, setBackendProducts] = useState<PublicProduct[] | null>(null);

  useEffect(() => {
    getJson<PublicProduct[]>("/products")
      .then(setBackendProducts)
      .catch(() => setBackendProducts([]));
  }, []);

  useEffect(() => {
    if (!backendProducts) return;
    const backendNames = new Set(backendProducts.map((p) => p.name));
    for (const category of categories) {
      for (const staticProduct of category.products) {
        if (!backendNames.has(staticProduct.name)) {
          console.warn(
            `[Catalog] No backend product match for "${staticProduct.name}" ` +
              `(static id: ${staticProduct.id}). Add to Cart hidden for this ` +
              `item — check for a name mismatch with the backend Product table.`
          );
        }
      }
    }
  }, [backendProducts, categories]);

  return (
    <>
      {categories.map((category) => (
        <CategorySection key={category.id} category={category} backendProducts={backendProducts} />
      ))}
    </>
  );
}
