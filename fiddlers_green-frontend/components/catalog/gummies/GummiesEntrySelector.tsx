"use client";

import { useState } from "react";
import { ENTRY_OPTIONS } from "@/data/entryOptions";
import EntryOptionCard from "@/components/catalog/gummies/EntryOptionCard";

export default function GummiesEntrySelector({
  onSelect,
}: {
  onSelect: (id: string) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);

  function handleSelect(id: string) {
    if (selected) return;
    // Selected/disabled styling below is what's actually visible during the
    // parent's exit fade — no separate delay needed here, the AnimatePresence
    // transition in the page already gives the selection a beat to register.
    setSelected(id);
    onSelect(id);
  }

  return (
    <div className="mx-auto max-w-2xl px-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
        {ENTRY_OPTIONS.map((option) => (
          <EntryOptionCard
            key={option.id}
            label={option.label}
            selected={selected === option.id}
            disabled={selected !== null && selected !== option.id}
            onSelect={() => handleSelect(option.id)}
          />
        ))}
      </div>
    </div>
  );
}
