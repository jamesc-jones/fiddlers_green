"use client";

import { useState, type FormEvent } from "react";
import { useChatMessages } from "@/hooks/useChatMessages";

export default function ChatWidget() {
  const { messages, loading, sendMessage } = useChatMessages();
  const [input, setInput] = useState("");

  async function handleSend(event: FormEvent) {
    event.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    setInput("");
    await sendMessage(trimmed);
  }

  return (
    <div className="flex flex-col h-[70vh] max-w-2xl mx-auto border border-white/10">
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 && (
          <p className="font-body text-sm text-white/40">
            Ask the Fiddler&apos;s Green Budtender about our products.
          </p>
        )}
        {messages.map((msg, index) => (
          <div key={index} className={msg.role === "user" ? "text-right" : "text-left"}>
            <p
              className={[
                "inline-block px-4 py-2 max-w-[80%] font-body text-sm",
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
      </div>

      <form
        onSubmit={handleSend}
        className="flex gap-3 border-t border-white/10 p-4"
      >
        <input
          type="text"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Type a message..."
          aria-label="Chat message"
          className="flex-1 bg-transparent border border-white/20 px-4 py-2 font-body text-brand-cream focus:outline-none focus:border-brand-gold"
        />
        <button
          type="submit"
          disabled={loading}
          className="border border-brand-gold text-brand-gold px-6 py-2 font-body text-sm uppercase tracking-[0.1em] transition-colors duration-300 hover:bg-brand-gold hover:text-black disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}
