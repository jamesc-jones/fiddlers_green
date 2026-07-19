"use client";

import { motion } from "framer-motion";

// A minimal rounded silhouette — reads as "gummy bear" without literal
// cartoon detail, kept low-opacity so it stays ambient, not decorative clutter.
function GummyShape({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 120" className={className} aria-hidden="true">
      <circle cx="32" cy="18" r="14" fill="currentColor" />
      <circle cx="68" cy="18" r="14" fill="currentColor" />
      <path
        d="M50 20c22 0 38 18 38 42s-17 44-38 44S12 86 12 62s16-42 38-42Z"
        fill="currentColor"
      />
    </svg>
  );
}

const ambientBears = [
  { className: "top-6 left-[8%] w-16 md:w-20 text-brand-gold/10", duration: 7, delay: 0 },
  { className: "top-24 right-[10%] w-12 md:w-16 text-brand-cream/10", duration: 8.5, delay: 1.2 },
  { className: "bottom-10 left-[16%] w-10 md:w-14 text-brand-gold/10", duration: 6.5, delay: 0.6 },
  { className: "bottom-16 right-[20%] w-14 md:w-20 text-brand-cream/10", duration: 9, delay: 2 },
];

export default function GummiesHero() {
  return (
    <section className="relative min-h-[60vh] md:min-h-[70vh] flex flex-col items-center justify-center overflow-hidden px-6">
      {ambientBears.map((bear, i) => (
        <motion.div
          key={i}
          className={`absolute pointer-events-none ${bear.className}`}
          animate={{ y: [0, -14, 0], rotate: [0, 4, 0] }}
          transition={{
            duration: bear.duration,
            delay: bear.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <GummyShape className="w-full h-auto" />
        </motion.div>
      ))}

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 text-center"
      >
        <p className="font-body text-xs md:text-sm tracking-[0.3em] text-brand-gold uppercase">
          Fiddler&apos;s Green Gummies
        </p>
        <h1 className="mt-4 font-display italic text-6xl md:text-8xl text-brand-cream">
          Haney Pot
        </h1>
        <p className="mt-5 font-body text-base md:text-lg text-white/60 max-w-md mx-auto leading-relaxed">
          Choose your strength to continue.
        </p>
      </motion.div>
    </section>
  );
}
