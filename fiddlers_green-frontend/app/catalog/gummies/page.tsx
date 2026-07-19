"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";

import GummiesHero from "@/components/catalog/gummies/GummiesHero";
import GummiesEntrySelector from "@/components/catalog/gummies/GummiesEntrySelector";
import StrengthSelector from "@/components/catalog/gummies/StrengthSelector";

type Stage = "entry" | "strength";

// Brief pause so the selected state is visible before the route changes.
const NAVIGATE_DELAY_MS = 350;

export default function GummiesPage() {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("entry");
  const [entry, setEntry] = useState<string | null>(null);
  // Reserved for a later phase (e.g. passing full selection context
  // downstream); navigation itself is driven by handleStrengthSelect below.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [strength, setStrength] = useState<string | null>(null);

  function handleStrengthSelect(strength: string) {
    setStrength(strength);

    setTimeout(() => {
      router.push(`/catalog/gummies/${strength}`);
    }, NAVIGATE_DELAY_MS);
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6">
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
      </AnimatePresence>
    </main>
  );
}
