"use client";

// Phase 16.3 — this is now a client component with its own lightweight
// GET /products fetch, deliberately separate from InteractiveCatalog's
// fetch of the same endpoint. A shared-fetch refactor of the whole page's
// component tree was considered and rejected as higher-risk than a
// duplicated cheap request (see Phase 16.3 planning notes). Item counts
// use the same groupProductsForDisplay helper as CategorySection so the
// two can never drift out of sync.
import { useEffect, useState } from "react";
import Link from "next/link";
import type { CategoryMeta } from "@/data/categories";
import { getJson } from "@/lib/api";
import { groupProductsForDisplay, type PublicProduct } from "@/lib/catalogGrouping";

export default function TableOfContents({
  categories,
}: {
  categories: CategoryMeta[];
}) {
  const [products, setProducts] = useState<PublicProduct[] | null>(null);

  useEffect(() => {
    getJson<PublicProduct[]>("/products")
      .then(setProducts)
      .catch(() => setProducts([]));
  }, []);

  return (
    <nav
      aria-label="Catalog contents"
      className="mx-auto max-w-3xl px-6 md:px-10 py-16 md:py-20"
    >
      <p className="font-body text-xs tracking-[0.3em] text-white/40 uppercase text-center">
        Contents
      </p>

      <ul className="mt-8 divide-y divide-white/10" role="list">
        {categories.map((category, i) => {
          // Phase 17 — every category now leads into its own dedicated page
          // rather than scrolling to a section on this page (Flower/Hash
          // joined Gummies here for consistent navigation). Kept as an
          // explicit list rather than "always true" so a future category
          // without a dedicated page still falls back to anchor-scrolling.
          const isExperience = ["flower", "hash", "gummies"].includes(category.id);
          const LinkComponent = isExperience ? Link : "a";
          const href = isExperience
            ? `/catalog/${category.id}`
            : `#${category.anchor}`;
          const itemCount = products ? groupProductsForDisplay(products, category.id).length : null;

          return (
            <li key={category.id}>
              <LinkComponent
                href={href}
                className="group flex items-baseline py-4 transition-colors duration-200"
              >
                <span className="font-body text-xs text-white/30 tabular-nums">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="font-display italic text-xl md:text-3xl text-brand-cream group-hover:text-brand-gold transition-colors duration-200">
                  {category.label}
                </span>
                <span
                  className="flex-1 mx-3 md:mx-4 border-b border-dotted border-white/15 translate-y-[-4px]"
                  aria-hidden="true"
                />
                <span className="hidden sm:inline font-body text-xs text-white/30 uppercase tracking-[0.15em]">
                  {itemCount !== null ? `${itemCount} items` : "..."}
                </span>
              </LinkComponent>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
