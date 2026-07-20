"use client";

import { motion } from "framer-motion";
import type { Category } from "@/data/products";
import ProductCard from "@/components/catalog/ProductCard";

// Section-level entrance only — the one animation permitted at this level.
const sectionVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] as const },
  },
};

export default function CategorySection({ category }: { category: Category }) {
  return (
    <motion.section
      id={category.anchor}
      className="py-20 md:py-28 scroll-mt-24"
      variants={sectionVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
    >
      <div className="mx-auto max-w-6xl px-6 md:px-10">
        <div className="max-w-2xl">
          <h2 className="font-display italic text-4xl md:text-5xl text-brand-cream">
            {category.label}
          </h2>
          <p className="mt-4 font-body text-base md:text-lg text-white/60 leading-relaxed">
            {category.description}
          </p>
        </div>

        <div className="mt-12 md:mt-16 grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12 md:gap-x-8 md:gap-y-16">
          {category.products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </motion.section>
  );
}
