"use client";

import { motion } from "framer-motion";

export default function CovenantChain() {
  return (
    <div className="max-w-2xl mx-auto text-center">
      <h2 className="font-display text-3xl md:text-4xl text-brand-cream">
        The Covenant Chain
      </h2>
      <p className="mt-6 text-base md:text-lg text-brand-smoke leading-relaxed">
        A chain of silver, not iron — one that must be polished and renewed by
        each generation so it never rusts, never breaks, and never binds too
        tightly. It links nations together in an alliance of mutual obligation
        and care.
      </p>
      <motion.blockquote
        animate={{
          boxShadow: [
            "0 0 0px rgba(201,168,76,0)",
            "-8px 0 20px rgba(201,168,76,0.18)",
            "0 0 0px rgba(201,168,76,0)",
          ],
        }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        className="mt-10 border-l-2 border-brand-gold pl-6 text-left font-display text-xl md:text-2xl italic text-brand-gold"
      >
        &ldquo;As long as the grass is green, as long as the water flows
        downhill, as long as the sun rises in the east.&rdquo;
      </motion.blockquote>
    </div>
  );
}
