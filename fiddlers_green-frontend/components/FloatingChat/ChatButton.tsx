"use client";

import { forwardRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

interface ChatButtonProps {
  isOpen: boolean;
  onClick: () => void;
}

const ChatButton = forwardRef<HTMLButtonElement, ChatButtonProps>(
  function ChatButton({ isOpen, onClick }, ref) {
    const shouldReduceMotion = useReducedMotion();
    // Subtle attention cue while closed only; stops the instant it opens.
    const pulse = !isOpen && !shouldReduceMotion;

    return (
      <motion.button
        ref={ref}
        type="button"
        onClick={onClick}
        aria-label={isOpen ? "Close chat" : "Open chat"}
        aria-expanded={isOpen}
        animate={pulse ? { scale: [1, 1.06, 1] } : { scale: 1 }}
        transition={
          pulse
            ? { duration: 2, repeat: Infinity, ease: "easeInOut" }
            : { duration: 0.2 }
        }
        className={[
          "fixed bottom-6 right-6 z-[60]",
          "flex items-center justify-center",
          "w-14 h-14 rounded-full",
          "bg-brand-gold text-black",
          "shadow-[0_4px_20px_rgba(0,0,0,0.4)]",
          "transition-colors duration-300 hover:bg-brand-gold/90",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2 focus-visible:ring-offset-black",
        ].join(" ")}
      >
        <AnimatePresence mode="wait" initial={false}>
          {isOpen ? (
            <motion.svg
              key="close"
              initial={{ opacity: 0, rotate: -45 }}
              animate={{ opacity: 1, rotate: 0 }}
              exit={{ opacity: 0, rotate: 45 }}
              transition={{ duration: 0.2 }}
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-6 h-6"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </motion.svg>
          ) : (
            <motion.svg
              key="chat"
              initial={{ opacity: 0, rotate: 45 }}
              animate={{ opacity: 1, rotate: 0 }}
              exit={{ opacity: 0, rotate: -45 }}
              transition={{ duration: 0.2 }}
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-6 h-6"
            >
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
            </motion.svg>
          )}
        </AnimatePresence>
      </motion.button>
    );
  }
);

export default ChatButton;
