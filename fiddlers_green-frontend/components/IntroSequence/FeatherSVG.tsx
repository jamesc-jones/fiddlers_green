"use client";

import { motion } from "framer-motion";

export const FEATHER_DURATION = 0.65;

// Minimal line-art silhouette — a curved shaft plus tapering barb strokes,
// generated rather than hand-traced so the taper stays clean and legible at
// small sizes. No fill, no cartoon outline: just linework.
const BARB_COUNT = 14;
const SHAFT_PATH = "M30,6 C38,50 22,90 30,140 C34,170 24,190 26,210";

const BARBS = Array.from({ length: BARB_COUNT }, (_, i) => {
  const t = i / (BARB_COUNT - 1);
  const y = 20 + t * 180;
  const shaftX = 30 + Math.sin(t * Math.PI * 1.3) * 8;
  const envelope = Math.sin(t * Math.PI);
  const length = 6 + envelope * 16;
  const side = i % 2 === 0 ? 1 : -1;
  const angle = (35 * Math.PI) / 180;
  return {
    x1: shaftX,
    y1: y,
    x2: shaftX + side * Math.cos(angle) * length,
    y2: y + Math.sin(angle) * length,
  };
});

export default function FeatherSVG({ delay }: { delay: number }) {
  return (
    <motion.div
      aria-hidden="true"
      className="absolute left-[42%] top-[24%]"
      // Softer, more neutral drift: shorter travel, narrower rotation swing,
      // and a symmetric easeInOut instead of the brand's snappier ease-out —
      // this should read as ambient, not as an arriving "feature."
      initial={{ opacity: 0, x: -16, y: -12, rotate: -3 }}
      animate={{ opacity: [0, 0.85, 0.85, 0], x: 16, y: 16, rotate: 2 }}
      transition={{
        opacity: { delay, duration: FEATHER_DURATION, times: [0, 0.25, 0.75, 1], ease: "easeInOut" },
        x: { delay, duration: FEATHER_DURATION, ease: "easeInOut" },
        y: { delay, duration: FEATHER_DURATION, ease: "easeInOut" },
        rotate: { delay, duration: FEATHER_DURATION, ease: "easeInOut" },
      }}
    >
      <svg viewBox="0 0 60 220" className="h-32 md:h-44 w-auto">
        <path
          d={SHAFT_PATH}
          fill="none"
          stroke="var(--color-brand-gold)"
          strokeWidth={1.5}
          strokeLinecap="round"
          opacity={0.8}
        />
        {BARBS.map((barb, i) => (
          <line
            key={i}
            x1={barb.x1}
            y1={barb.y1}
            x2={barb.x2}
            y2={barb.y2}
            stroke="var(--color-brand-cream)"
            strokeWidth={1}
            strokeLinecap="round"
            opacity={0.5}
          />
        ))}
      </svg>
    </motion.div>
  );
}
