"use client";

import { motion, useReducedMotion } from "framer-motion";

const EASE = [0.22, 1, 0.36, 1] as const;

interface TimelineItem {
  year: string;
  description: string;
}

const TIMELINE_ITEMS: TimelineItem[] = [
  {
    year: "1784",
    description:
      "Captain John Deserontyon leads Mohawk families to settle at the Bay of Quinte following the American Revolution.",
  },
  {
    year: "1793",
    description:
      "The Crown formally grants the Tyendinaga Mohawk Territory in recognition of Haudenosaunee alliance and loyalty.",
  },
  {
    year: "1850s",
    description:
      "Tyendinaga grows as a self-governing community, sustaining language, farming, and traditional governance.",
  },
  {
    year: "Today",
    description:
      "Tyendinaga remains a living Mohawk community, carrying its treaties and traditions forward into the present.",
  },
];

export default function HeritageTimeline() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="max-w-2xl mx-auto relative pl-8 md:pl-10">
      <div className="absolute left-2 md:left-2.5 top-0 bottom-0 w-px bg-brand-gold/30" />
      <div className="space-y-12">
        {TIMELINE_ITEMS.map((item, index) => (
          <motion.div
            key={item.year}
            initial={shouldReduceMotion ? false : { opacity: 0, x: -16 }}
            whileInView={shouldReduceMotion ? undefined : { opacity: 1, x: 0 }}
            animate={shouldReduceMotion ? { opacity: 1, x: 0 } : undefined}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
            className="relative"
          >
            <motion.span
              initial={shouldReduceMotion ? false : { scale: 1, opacity: 0.7 }}
              whileInView={
                shouldReduceMotion ? undefined : { scale: [1, 1.3, 1], opacity: [0.7, 1, 1] }
              }
              animate={shouldReduceMotion ? { scale: 1, opacity: 1 } : undefined}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 + 0.3, ease: EASE }}
              className="absolute -left-8 md:-left-10 top-1 h-2 w-2 rounded-full bg-brand-gold"
            />
            <p className="font-display text-xl md:text-2xl text-brand-gold">
              {item.year}
            </p>
            <p className="mt-2 text-base md:text-lg text-brand-smoke leading-relaxed">
              {item.description}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
