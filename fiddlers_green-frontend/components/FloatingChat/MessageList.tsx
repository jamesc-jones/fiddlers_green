"use client";

import { useEffect, useRef } from "react";
import type { ChatMessage } from "@/hooks/useChatMessages";

interface MessageListProps {
  messages: ChatMessage[];
  loading: boolean;
}

export default function MessageList({ messages, loading }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages, loading]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3">
      {messages.length === 0 && (
        <p className="font-body text-sm text-white/40">
          Ask the Fiddler&apos;s Green Budtender about our products.
        </p>
      )}
      {messages.map((msg, index) => (
        <div
          key={index}
          className={msg.role === "user" ? "text-right" : "text-left"}
        >
          <p
            className={[
              "inline-block px-3 py-2 max-w-[85%] font-body text-sm",
              msg.role === "user"
                ? "bg-brand-gold text-black"
                : "bg-white/10 text-brand-cream",
            ].join(" ")}
          >
            {msg.content}
          </p>
        </div>
      ))}
      {loading && (
        <p className="font-body text-sm text-white/40">Thinking...</p>
      )}
      <div ref={bottomRef} />
    </div>
  );
}
