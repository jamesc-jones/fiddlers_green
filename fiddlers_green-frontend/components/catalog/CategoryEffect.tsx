"use client";

import { motion } from "framer-motion";

const SMOKE_WISPS = [
  { left: "30%", size: 60, duration: 9, delay: 0, opacity: 0.18 },
  { left: "50%", size: 44, duration: 8, delay: 1.2, opacity: 0.24 },
  { left: "68%", size: 54, duration: 10.5, delay: 2.4, opacity: 0.15 },
];

const SPARKLE_DOTS = [
  { top: "18%", left: "22%", delay: 0 },
  { top: "34%", left: "72%", delay: 0.6 },
  { top: "58%", left: "40%", delay: 1.2 },
  { top: "72%", left: "64%", delay: 1.8 },
  { top: "48%", left: "14%", delay: 2.4 },
];

function SmokeDrift() {
  return (
    <>
      {SMOKE_WISPS.map((wisp, index) => (
        <motion.div
          key={index}
          initial={{ y: 0, opacity: wisp.opacity }}
          animate={{ y: -8, opacity: 0 }}
          transition={{
            duration: wisp.duration,
            delay: wisp.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute bottom-[20%] rounded-full bg-white/30 blur-xl"
          style={{
            left: wisp.left,
            width: wisp.size,
            height: wisp.size,
          }}
        />
      ))}
    </>
  );
}

function SparkleDots() {
  return (
    <>
      {SPARKLE_DOTS.map((dot, index) => (
        <motion.span
          key={index}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{
            duration: 2.4,
            delay: dot.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute h-1 w-1 rounded-full bg-brand-gold"
          style={{ top: dot.top, left: dot.left }}
        />
      ))}
    </>
  );
}

export default function CategoryEffect({ category }: { category: string }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {category === "hash" && <SmokeDrift />}
      {category === "flower" && <SparkleDots />}
    </div>
  );
}
