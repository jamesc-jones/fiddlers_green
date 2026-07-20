"use client";

import { motion } from "framer-motion";

const EASE = [0.22, 1, 0.36, 1] as const;

export default function LogoReveal({ delay }: { delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: EASE }}
      className="relative z-10 pointer-events-none select-none text-center"
    >
      <p className="font-display italic text-3xl md:text-5xl text-brand-cream">
        Fiddler&apos;s Green
      </p>
      <p className="mt-2 font-body text-[10px] md:text-xs tracking-[0.35em] uppercase text-brand-gold">
        Tyendinaga · Indigenous
      </p>
    </motion.div>
  );
}
