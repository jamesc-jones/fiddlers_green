"use client";

import { motion } from "framer-motion";

export default function StrengthButton({
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
      whileHover={
        disabled
          ? undefined
          : { scale: 1.05, boxShadow: "0 0 28px rgba(201,168,76,0.35)" }
      }
      whileTap={disabled ? undefined : { scale: 0.97 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={[
        "font-body text-sm md:text-base tracking-[0.15em] uppercase",
        "py-4 md:py-5 border rounded-sm",
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
