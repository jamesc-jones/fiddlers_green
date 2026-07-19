export const ENTRY_OPTIONS = [
  { id: "classic", label: "Classic Gummies" },
  { id: "high", label: "High Potency" },
  { id: "bulk", label: "Bulk / Wholesale" },
  { id: "sampler", label: "Sampler Packs" },
] as const;

export type EntryOptionId = (typeof ENTRY_OPTIONS)[number]["id"];
