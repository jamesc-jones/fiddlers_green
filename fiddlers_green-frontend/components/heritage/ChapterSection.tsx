"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

const EASE = [0.22, 1, 0.36, 1] as const;

interface ChapterSectionProps {
  label?: string;
  children: ReactNode;
  className?: string;
}

export default function ChapterSection({ label, children, className }: ChapterSectionProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.section
      initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
      whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
      animate={shouldReduceMotion ? { opacity: 1, y: 0 } : undefined}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.8, ease: EASE }}
      className={`py-24 md:py-36 px-6 md:px-10 max-w-4xl mx-auto ${className ?? ""}`}
    >
      {label && (
        <p className="mb-4 font-body text-xs md:text-sm uppercase tracking-[0.3em] text-brand-gold">
          {label}
        </p>
      )}
      {children}
    </motion.section>
  );
}
