"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import GummiesHero from "@/components/catalog/gummies/GummiesHero";
import GummiesEntrySelector from "@/components/catalog/gummies/GummiesEntrySelector";
import StrengthSelector from "@/components/catalog/gummies/StrengthSelector";
import GummyVariantActions from "@/components/catalog/gummies/GummyVariantActions";

type Stage = "entry" | "strength" | "resolve";

export default function GummiesPage() {
  const [stage, setStage] = useState<Stage>("entry");
  const [entry, setEntry] = useState<string | null>(null);
  const [strength, setStrength] = useState<string | null>(null);

  function handleStrengthSelect(selectedStrength: string) {
    setStrength(selectedStrength);
    // Phase 16.2: resolution + Add to Cart happen in-page (no route change)
    // — the old /catalog/gummies/[strength] navigation lost the `entry`
    // dimension across the page boundary, and that stub route still exists
    // and still redirects back here for any stray/bookmarked direct links.
    setStage("resolve");
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <GummiesHero />

      <AnimatePresence mode="wait">
        {stage === "entry" && (
          <motion.div
            key="entry"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
          >
            <GummiesEntrySelector
              onSelect={(id) => {
                setEntry(id);
                setStage("strength");
              }}
            />
          </motion.div>
        )}

        {stage === "strength" && (
          <motion.div
            key="strength"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
          >
            <StrengthSelector
              entry={entry}
              onSelectStrength={handleStrengthSelect}
              onBack={() => setStage("entry")}
            />
          </motion.div>
        )}

        {stage === "resolve" && entry && strength && (
          <motion.div
            key="resolve"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
          >
            <GummyVariantActions
              entry={entry}
              strength={strength}
              onBack={() => setStage("strength")}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
