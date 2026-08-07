// Phase 16.3 — category metadata only. Product data itself now comes from
// the backend (GET /products) via lib/catalogGrouping.ts; this file no
// longer holds a `products` array (see data/products.ts, retired in this
// phase once every consumer below was migrated).

export interface CategoryMeta {
  id: string;
  label: string;
  description: string;
  anchor: string;
}

export const CATEGORIES_META: CategoryMeta[] = [
  {
    id: "flower",
    label: "Flower",
    description:
      "Hand-trimmed and slow-cured in small batches, grown on Tyendinaga land.",
    anchor: "flower",
  },
  {
    id: "hash",
    label: "Hash",
    description:
      "Traditionally pressed using cold-water separation, finished by hand.",
    anchor: "hash",
  },
  {
    id: "gummies",
    label: "Gummies",
    description:
      "Small-batch infused gummies, dosed consistently and made without artificial dyes.",
    anchor: "gummies",
  },
];
