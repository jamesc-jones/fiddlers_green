"use client";

import { motion } from "framer-motion";

// Templates remount on every navigation within this segment (including into
// [strength]), so a simple enter animation here doubles as the page transition
// without needing a client-side AnimatePresence wrapper around the root layout.
export default function GummiesTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
