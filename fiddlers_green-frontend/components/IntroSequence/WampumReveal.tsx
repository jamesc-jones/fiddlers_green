"use client";

import { motion } from "framer-motion";

const FADE_IN = 0.35;
const HOLD = 0.25;
const FADE_OUT = 0.3;

export const WAMPUM_DURATION = FADE_IN + HOLD + FADE_OUT;

const ROWS = 4;
const COLS = 18;
const PURPLE_ROWS = new Set([1, 2]);

const VIEW_WIDTH = 320;
const VIEW_HEIGHT = 32;
const MARGIN_X = 8;
const MARGIN_Y = 7;
const BEAD_RADIUS = 1.5;

const SPACING_X = (VIEW_WIDTH - MARGIN_X * 2) / (COLS - 1);
const SPACING_Y = (VIEW_HEIGHT - MARGIN_Y * 2) / (ROWS - 1);

const BEADS = Array.from({ length: ROWS }, (_, row) =>
  Array.from({ length: COLS }, (_, col) => ({
    row,
    col,
    cx: MARGIN_X + col * SPACING_X,
    cy: MARGIN_Y + row * SPACING_Y,
    isPurple: PURPLE_ROWS.has(row),
  }))
).flat();

// Presence, not performance: one fade in, a brief hold, one fade out. No
// per-bead animation, no pulsing, no loop — the belt is only ever shown
// still, exactly as on the Heritage page.
export default function WampumReveal({ delay }: { delay: number }) {
  return (
    <motion.svg
      aria-hidden="true"
      viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
      className="absolute bottom-14 md:bottom-20 left-1/2 -translate-x-1/2 h-8 md:h-10 w-[280px] md:w-[380px]"
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 1, 1, 0] }}
      transition={{
        delay,
        duration: WAMPUM_DURATION,
        times: [0, FADE_IN / WAMPUM_DURATION, (FADE_IN + HOLD) / WAMPUM_DURATION, 1],
        ease: "easeInOut",
      }}
    >
      <rect x={0} y={0} width={VIEW_WIDTH} height={VIEW_HEIGHT} fill="#f5f0e8" />
      {BEADS.map((bead) => (
        <circle
          key={`${bead.row}-${bead.col}`}
          cx={bead.cx}
          cy={bead.cy}
          r={BEAD_RADIUS}
          fill={bead.isPurple ? "#4b2e5a" : "#f5f0e8"}
        />
      ))}
    </motion.svg>
  );
}
