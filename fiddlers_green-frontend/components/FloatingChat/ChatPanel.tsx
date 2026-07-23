"use client";

import { forwardRef } from "react";
import { motion } from "framer-motion";
import type { ChatMessage } from "@/hooks/useChatMessages";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";

interface ChatPanelProps {
  messages: ChatMessage[];
  loading: boolean;
  onSend: (text: string) => void;
  onClose: () => void;
}

const FAQ_QUESTIONS = ["Track Order", "Return Policy", "Contact Support"] as const;

const ChatPanel = forwardRef<HTMLInputElement, ChatPanelProps>(
  function ChatPanel({ messages, loading, onSend, onClose }, inputRef) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.98 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        role="dialog"
        aria-modal="true"
        aria-label="Budtender chat"
        className={[
          "fixed z-[60]",
          "bottom-24 right-6",
          "w-[calc(100vw-3rem)] max-w-sm",
          "h-[70vh] max-h-[520px]",
          "flex flex-col",
          "bg-black border border-white/10",
          "shadow-[0_8px_40px_rgba(0,0,0,0.5)]",
        ].join(" ")}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <span className="font-display italic text-lg text-brand-gold">
            Budtender
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close chat"
            className="text-white/60 hover:text-white transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-5 h-5"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {messages.length === 0 ? (
          <div className="flex-1 overflow-y-auto p-4">
            <p className="font-display italic text-lg text-brand-cream mb-4">
              How can I help?
            </p>
            <div className="flex flex-col gap-2">
              {FAQ_QUESTIONS.map((question) => (
                <button
                  key={question}
                  type="button"
                  onClick={() => onSend(question)}
                  className="text-left border border-white/20 px-4 py-3 font-body text-sm text-brand-cream transition-colors duration-200 hover:border-brand-gold hover:text-brand-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <MessageList messages={messages} loading={loading} />
        )}
        <MessageInput ref={inputRef} onSend={onSend} loading={loading} />
      </motion.div>
    );
  }
);

export default ChatPanel;
