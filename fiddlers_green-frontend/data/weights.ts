// Phase 16.3.1 — weight keys and display labels for Flower/Hash weight
// variants. Keys and order must match backend WEIGHT_VARIANTS exactly
// (repositories/product.py) — these are the values stored in a variant
// Product's `variant_option` column.

export const WEIGHT_OPTIONS = [
  { key: "g", label: "1g" },
  { key: "hq", label: "3.5g" },
  { key: "q", label: "7g" },
  { key: "half_oz", label: "14g" },
  { key: "oz", label: "28g" },
] as const;

export type WeightKey = (typeof WEIGHT_OPTIONS)[number]["key"];

export const WEIGHT_ORDER: readonly string[] = WEIGHT_OPTIONS.map((w) => w.key);

export function weightLabel(key: string): string {
  return WEIGHT_OPTIONS.find((w) => w.key === key)?.label ?? key;
}
