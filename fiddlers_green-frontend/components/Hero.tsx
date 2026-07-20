"use client";

import Link from "next/link";
import { motion } from "framer-motion";

// ─── Animation variants ───────────────────────────────────────────────────────
// Defined outside the component so they're not recreated on every render.
// Sequenced via `custom` delay steps: background -> eyebrow -> headline -> body -> CTA.

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay, duration: 0.9, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

const backgroundFade = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 1.4, ease: "easeOut" as const } },
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function Hero() {
  return (
    <section className="relative min-h-screen overflow-hidden flex items-center">
      {/* ── Layer 1: Background ─────────────────────────────────────────────── */}
      <motion.div
        variants={backgroundFade}
        initial="hidden"
        animate="visible"
        className={[
          "absolute inset-0",
          "bg-[radial-gradient(circle_at_50%_20%,_#1c2b22_0%,_#0d1410_45%,_#000000_100%)]",
        ].join(" ")}
      />

      {/* ── Layer 1.5: Northern lights (atmospheric, no canvas) ────────────── */}
      <motion.div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.12] mix-blend-screen"
        style={{
          backgroundImage:
            "linear-gradient(120deg, rgba(56,189,148,0.4) 0%, rgba(16,90,90,0.2) 25%, rgba(80,60,140,0.25) 50%, rgba(56,189,148,0.4) 75%, rgba(16,90,90,0.2) 100%)",
          backgroundSize: "200% 200%",
        }}
        animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* ── Layer 2: Overlay ────────────────────────────────────────────────── */}
      <div
        className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-black/85"
        aria-hidden="true"
      />

      {/* ── Layer 3: Content ────────────────────────────────────────────────── */}
      <div className="relative z-10 mx-auto max-w-4xl px-6 md:px-10 text-center">
        <motion.p
          variants={fadeUp}
          custom={0.3}
          initial="hidden"
          animate="visible"
          className="font-body text-xs md:text-sm tracking-[0.3em] text-brand-gold uppercase"
        >
          Made in Tyendinaga
        </motion.p>

        <motion.h1
          variants={fadeUp}
          custom={0.55}
          initial="hidden"
          animate="visible"
          className="mt-6 font-display italic text-4xl sm:text-5xl md:text-7xl leading-tight text-brand-cream"
        >
          By Indigenous.
          <br />
          For the World.
        </motion.h1>

        <motion.p
          variants={fadeUp}
          custom={0.8}
          initial="hidden"
          animate="visible"
          className="mt-6 font-body text-base md:text-lg text-white/60 max-w-xl mx-auto leading-relaxed"
        >
          Premium cannabis rooted in Haudenosaunee land and craft, grown with
          intention and shared with the world.
        </motion.p>

        <motion.div
          variants={fadeUp}
          custom={1.05}
          initial="hidden"
          animate="visible"
          className="mt-10"
        >
          <Link
            href="/catalog"
            className={[
              "inline-flex items-center justify-center",
              "min-h-12 px-8 py-3",
              "font-body text-sm tracking-[0.15em] uppercase",
              "border border-brand-gold text-brand-gold",
              "transition-colors duration-300",
              "hover:bg-brand-gold hover:text-black",
            ].join(" ")}
          >
            Enter Catalog
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
