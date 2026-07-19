"use client";

import { motion } from "framer-motion";

export default function EntryOptionCard({
  label,
  selected,
  disabled,
  onSelect,
}: {
  label: string;
  selected: boolean;
  disabled: boolean;
  onSelect: () => void;
}) {
  return (
    <motion.button
      type="button"
      aria-pressed={selected}
      disabled={disabled}
      onClick={onSelect}
      whileHover={disabled ? undefined : { scale: 1.04 }}
      whileTap={disabled ? undefined : { scale: 0.98 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={[
        "font-body text-base md:text-lg tracking-[0.15em] uppercase",
        "px-8 py-10 md:py-12 border rounded-sm text-center",
        "transition-[color,background-color,border-color,opacity] duration-300 ease-out",
        "disabled:cursor-not-allowed disabled:opacity-40",
        selected
          ? "bg-brand-gold border-brand-gold text-black"
          : "border-white/20 text-brand-cream hover:border-brand-gold",
      ].join(" ")}
    >
      {label}
    </motion.button>
  );
}
