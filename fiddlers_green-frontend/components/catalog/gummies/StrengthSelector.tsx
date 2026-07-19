"use client";

import { useState } from "react";
import { STRENGTHS } from "@/data/strengths";
import { ENTRY_OPTIONS } from "@/data/entryOptions";
import StrengthButton from "@/components/catalog/gummies/StrengthButton";

export default function StrengthSelector({
  entry,
  onSelectStrength,
  onBack,
}: {
  entry: string | null;
  onSelectStrength: (strength: string) => void;
  onBack: () => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);

  const entryLabel = ENTRY_OPTIONS.find((option) => option.id === entry)?.label;

  function handleSelect(strength: string) {
    if (selected) return;
    setSelected(strength);
    onSelectStrength(strength);
  }

  return (
    <div className="mx-auto max-w-2xl px-6 pb-24 md:pb-32">
      <button
        type="button"
        onClick={onBack}
        className="mb-6 text-xs tracking-[0.3em] text-white/40 uppercase hover:text-white transition"
      >
        ← Back
      </button>

      {entryLabel && (
        <p className="mb-8 text-center font-body text-xs tracking-[0.3em] text-white/40 uppercase">
          {entryLabel}
        </p>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 md:gap-6">
        {STRENGTHS.map((strength) => (
          <StrengthButton
            key={strength}
            label={strength}
            selected={selected === strength}
            disabled={selected !== null && selected !== strength}
            onSelect={() => handleSelect(strength)}
          />
        ))}
      </div>
    </div>
  );
}
