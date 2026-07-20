"use client";

import { motion } from "framer-motion";

const EASE = [0.22, 1, 0.36, 1] as const;

const LINK_COUNT = 5;
const STAGGER = 0.07;
const LINK_FADE = 0.3;
const HOLD = 0.12;
const GROUP_FADE_OUT = 0.3;

// Small, fixed (non-random) offsets so the links emerge with a slightly
// uneven, hand-timed cadence rather than a perfectly uniform metronome tick.
// Deterministic values only — real randomness would cause an SSR/client
// hydration mismatch (same class of bug as Hero.tsx's reduced-motion note).
const DELAY_JITTER = [0, 0.02, -0.015, 0.025, -0.01];
const FADE_JITTER = [0, 0.03, -0.02, 0.02, -0.03];

const LINK_DELAYS = Array.from({ length: LINK_COUNT }, (_, i) => i * STAGGER + DELAY_JITTER[i]);
const LINK_FADES = Array.from({ length: LINK_COUNT }, (_, i) => LINK_FADE + FADE_JITTER[i]);
const LAST_LINK_END = Math.max(...LINK_DELAYS.map((d, i) => d + LINK_FADES[i]));

export const CHAIN_DURATION = LAST_LINK_END + HOLD + GROUP_FADE_OUT;

const LINK_WIDTH = 30;
const LINK_HEIGHT = 18;
const OVERLAP = 12;
const VIEW_WIDTH = LINK_COUNT * (LINK_WIDTH - OVERLAP) + OVERLAP;
const VIEW_HEIGHT = 40;

// Pure opacity — no scale, no movement. Links fade in with a soft, gradual
// (not front-loaded) curve so consecutive links visually overlap as a wave
// rather than reading as discrete "pops," then the whole formation fades
// out together as a single group.
export default function ChainFormation({ delay }: { delay: number }) {
  const groupFadeOutDelay = delay + LAST_LINK_END + HOLD;

  return (
    <motion.svg
      aria-hidden="true"
      viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-8 md:h-10 w-auto"
      initial={{ opacity: 1 }}
      animate={{ opacity: 0 }}
      transition={{ delay: groupFadeOutDelay, duration: GROUP_FADE_OUT, ease: EASE }}
    >
      {Array.from({ length: LINK_COUNT }, (_, i) => {
        const cx = LINK_WIDTH / 2 + i * (LINK_WIDTH - OVERLAP);
        const cy = VIEW_HEIGHT / 2;
        const rotation = i % 2 === 0 ? 0 : 90;
        return (
          <motion.ellipse
            key={i}
            cx={cx}
            cy={cy}
            rx={LINK_WIDTH / 2}
            ry={LINK_HEIGHT / 2}
            transform={`rotate(${rotation} ${cx} ${cy})`}
            fill="none"
            stroke="var(--color-brand-gold)"
            strokeWidth={1.75}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.75 }}
            transition={{ delay: delay + LINK_DELAYS[i], duration: LINK_FADES[i], ease: "easeInOut" }}
          />
        );
      })}
    </motion.svg>
  );
}
