// ─── Types ────────────────────────────────────────────────────────────────────

export interface Product {
  id: string;
  name: string;
  category: string;
  type: string;
  description: string;
  image: string;
  featured: boolean;
}

export interface Category {
  id: string;
  label: string;
  description: string;
  anchor: string;
  products: Product[];
}

// ─── Static catalog data ───────────────────────────────────────────────────────
// Placeholder copy and imagery for the Phase 4 editorial catalog layout.
// Real product photography and copy will replace these in a later phase.

export const CATEGORIES: Category[] = [
  {
    id: "flower",
    label: "Flower",
    description:
      "Hand-trimmed and slow-cured in small batches, grown on Tyendinaga land.",
    anchor: "flower",
    products: [
      {
        id: "flower-cedar-haze",
        name: "Cedar Haze",
        category: "flower",
        type: "Sativa",
        description: "Bright and resinous, with notes of pine and citrus peel.",
        image: "/images/catalog/flower.svg",
        featured: true,
      },
      {
        id: "flower-turtle-island",
        name: "Turtle Island",
        category: "flower",
        type: "Hybrid",
        description: "A balanced cultivar with earthy depth and a smooth finish.",
        image: "/images/catalog/flower.svg",
        featured: false,
      },
      {
        id: "flower-midnight-water",
        name: "Midnight Water",
        category: "flower",
        type: "Indica",
        description: "Deep and grounding, best suited to slow evenings.",
        image: "/images/catalog/flower.svg",
        featured: false,
      },
      {
        id: "flower-longhouse-gold",
        name: "Longhouse Gold",
        category: "flower",
        type: "Hybrid",
        description: "A gently sweet profile with a warm, golden-hour effect.",
        image: "/images/catalog/flower.svg",
        featured: false,
      },
    ],
  },
  {
    id: "hash",
    label: "Hash",
    description:
      "Traditionally pressed using cold-water separation, finished by hand.",
    anchor: "hash",
    products: [
      {
        id: "hash-river-stone",
        name: "River Stone",
        category: "hash",
        type: "Full-Melt",
        description: "A soft, pliable texture with a clean mineral finish.",
        image: "/images/catalog/hash.svg",
        featured: true,
      },
      {
        id: "hash-black-ash",
        name: "Black Ash",
        category: "hash",
        type: "Dry-Sift",
        description: "Dense and dark, with a slow-burning, resinous character.",
        image: "/images/catalog/hash.svg",
        featured: false,
      },
      {
        id: "hash-amber-line",
        name: "Amber Line",
        category: "hash",
        type: "Bubble Hash",
        description: "Light amber tone with a smooth, rounded aroma.",
        image: "/images/catalog/hash.svg",
        featured: false,
      },
    ],
  },
  {
    id: "gummies",
    label: "Gummies",
    description:
      "Small-batch infused gummies, dosed consistently and made without artificial dyes.",
    anchor: "gummies",
    products: [
      {
        id: "gummies-sweetgrass",
        name: "Sweetgrass",
        category: "gummies",
        type: "10mg THC",
        description: "A soft herbal sweetness reminiscent of braided sweetgrass.",
        image: "/images/catalog/gummies.svg",
        featured: true,
      },
      {
        id: "gummies-wild-berry",
        name: "Wild Berry",
        category: "gummies",
        type: "10mg THC",
        description: "Tart forest berries balanced with a clean, even dose.",
        image: "/images/catalog/gummies.svg",
        featured: false,
      },
      {
        id: "gummies-stillwater",
        name: "Stillwater",
        category: "gummies",
        type: "5mg THC / 5mg CBD",
        description: "An even-keeled blend meant for a calm, steady evening.",
        image: "/images/catalog/gummies.svg",
        featured: false,
      },
      {
        id: "gummies-maple-ember",
        name: "Maple Ember",
        category: "gummies",
        type: "10mg THC",
        description: "Slow-cooked maple sweetness with a warm, smoky finish.",
        image: "/images/catalog/gummies.svg",
        featured: false,
      },
    ],
  },
];
