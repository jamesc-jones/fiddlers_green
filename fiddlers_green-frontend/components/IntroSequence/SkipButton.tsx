"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";

export default function SkipButton({ onSkip }: { onSkip: () => void }) {
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Move focus into the overlay so keyboard/screen-reader users immediately
  // know how to dismiss it, rather than being stranded behind a fixed layer.
  useEffect(() => {
    buttonRef.current?.focus();
  }, []);

  return (
    <motion.button
      ref={buttonRef}
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onSkip();
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3, duration: 0.4 }}
      className="absolute bottom-6 right-6 md:bottom-10 md:right-10 font-body text-xs tracking-[0.3em] uppercase text-white/50 hover:text-white focus-visible:text-white transition-colors duration-200"
    >
      Skip
    </motion.button>
  );
}
