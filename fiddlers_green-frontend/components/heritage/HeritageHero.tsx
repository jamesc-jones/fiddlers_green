"use client";

import { motion } from "framer-motion";

export default function HeritageHero() {
  return (
    <section className="min-h-screen flex items-center justify-center bg-[linear-gradient(to_bottom,#000_0%,var(--color-brand-charcoal)_60%,#000_100%)] py-40 md:py-56 px-6 md:px-10">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-3xl mx-auto text-center"
      >
        <p className="mb-6 text-xs md:text-sm uppercase tracking-widest text-brand-gold">
          Our Heritage
        </p>
        <h1 className="font-display text-4xl md:text-6xl leading-tight text-brand-cream">
          A Story Carried Forward
        </h1>
        <p className="mt-6 text-base md:text-lg text-brand-smoke">
          Rooted in Tyendinaga, guided by the agreements that came before us.
        </p>
      </motion.div>
    </section>
  );
}
