"use client";

import { motion } from "framer-motion";

const EASE = [0.22, 1, 0.36, 1] as const;

export default function HeritageHero() {
  return (
    <section className="min-h-screen flex items-center justify-center bg-[linear-gradient(to_bottom,#000_0%,var(--color-brand-charcoal)_60%,#000_100%)] py-40 md:py-56 px-6 md:px-10">
      <div className="max-w-3xl mx-auto text-center">
        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: EASE }}
          className="mb-6 font-body text-xs md:text-sm uppercase tracking-[0.3em] text-brand-gold"
        >
          Our Heritage
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: EASE }}
        >
          <h1 className="font-display italic text-4xl md:text-6xl leading-tight text-brand-cream">
            A Story Carried Forward
          </h1>
          <p className="mt-6 text-base md:text-lg text-brand-smoke">
            Rooted in Tyendinaga, guided by the agreements that came before us.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
