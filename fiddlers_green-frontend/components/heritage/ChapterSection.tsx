"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

const EASE = [0.22, 1, 0.36, 1] as const;

interface ChapterSectionProps {
  label?: string;
  children: ReactNode;
  className?: string;
}

export default function ChapterSection({ label, children, className }: ChapterSectionProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.8, ease: EASE }}
      className={`py-24 md:py-36 px-6 md:px-10 max-w-4xl mx-auto ${className ?? ""}`}
    >
      {label && (
        <p className="mb-4 text-xs md:text-sm uppercase tracking-widest text-brand-gold">
          {label}
        </p>
      )}
      {children}
    </motion.section>
  );
}
