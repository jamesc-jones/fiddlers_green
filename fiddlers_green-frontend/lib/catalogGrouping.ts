// Phase 16.3 — shared grouping logic for backend-driven catalog rendering.
// Used by both CategorySection.tsx (grid rendering) and TableOfContents.tsx
// (item counts) so the two can never drift out of sync.
import { WEIGHT_ORDER } from "@/data/weights";

export interface PublicProduct {
  id: string;
  name: string;
  category: string;
  description: string | null;
  price: string | null;
  is_active: boolean;
  // Only meaningful for gummy configuration products (Phase 16.2) or
  // Flower/Hash weight variants (Phase 16.3.1) — see WEIGHT_VARIANTS in
  // repositories/product.py for the reversed column-role convention
  // between the two uses. NULL for every flat/named product.
  dosage: string | null;
  variant_option: string | null;
  image_url: string | null;
  product_type: string | null;
}

export interface WeightVariant {
  id: string;
  weightKey: string;
  price: string | null;
}

export interface FlatDisplayItem {
  kind: "flat";
  key: string;
  product: PublicProduct;
}

export interface GroupedDisplayItem {
  kind: "grouped";
  key: string;
  baseName: string;
  category: string;
  description: string | null;
  image_url: string | null;
  product_type: string | null;
  variants: WeightVariant[];
}

export type DisplayItem = FlatDisplayItem | GroupedDisplayItem;

/**
 * Reproduces the pre-Phase-16.3 catalog shape from the flat list returned
 * by GET /products:
 * - gummies: dosage-configuration rows (variant_option set) are excluded
 *   entirely — those are only ever reachable via the /catalog/gummies
 *   wizard, so only the named flavors show here, same as before.
 * - flower/hash: weight-variant rows (variant_option set) are grouped by
 *   their shared `dosage` (the base product name) into one card per base
 *   name; everything else renders as a flat single-price card, unchanged.
 */
export function groupProductsForDisplay(
  products: PublicProduct[],
  categoryId: string
): DisplayItem[] {
  const categoryProducts = products.filter((p) => p.category === categoryId);

  if (categoryId === "gummies") {
    return categoryProducts
      .filter((p) => p.variant_option === null)
      .map((p) => ({ kind: "flat" as const, key: p.id, product: p }));
  }

  const flatItems: DisplayItem[] = [];
  const groups = new Map<string, PublicProduct[]>();

  for (const p of categoryProducts) {
    if (p.variant_option !== null && p.dosage !== null) {
      const existing = groups.get(p.dosage);
      if (existing) {
        existing.push(p);
      } else {
        groups.set(p.dosage, [p]);
      }
    } else {
      flatItems.push({ kind: "flat", key: p.id, product: p });
    }
  }

  const groupedItems: DisplayItem[] = Array.from(groups.entries()).map(
    ([baseName, variants]) => {
      const first = variants[0];
      const sorted = [...variants].sort(
        (a, b) =>
          WEIGHT_ORDER.indexOf(a.variant_option!) -
          WEIGHT_ORDER.indexOf(b.variant_option!)
      );
      return {
        kind: "grouped" as const,
        key: `group-${baseName}`,
        baseName,
        category: first.category,
        description: first.description,
        image_url: first.image_url,
        product_type: first.product_type,
        variants: sorted.map((v) => ({
          id: v.id,
          weightKey: v.variant_option!,
          price: v.price,
        })),
      };
    }
  );

  return [...flatItems, ...groupedItems];
}
