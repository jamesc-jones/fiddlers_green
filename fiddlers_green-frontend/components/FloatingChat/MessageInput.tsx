"use client";

import { forwardRef, useState, type FormEvent } from "react";

interface MessageInputProps {
  onSend: (text: string) => void;
  loading: boolean;
}

const MessageInput = forwardRef<HTMLInputElement, MessageInputProps>(
  function MessageInput({ onSend, loading }, ref) {
    const [value, setValue] = useState("");

    function handleSubmit(event: FormEvent) {
      event.preventDefault();
      const trimmed = value.trim();
      if (!trimmed || loading) return;

      setValue("");
      onSend(trimmed);
    }

    return (
      <form
        onSubmit={handleSubmit}
        className="flex gap-2 border-t border-white/10 p-3"
      >
        <input
          ref={ref}
          type="text"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Type a message..."
          aria-label="Chat message"
          disabled={loading}
          className="flex-1 min-w-0 bg-transparent border border-white/20 px-3 py-2 text-base font-body text-brand-cream focus:outline-none focus:border-brand-gold disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={loading}
          className="border border-brand-gold text-brand-gold px-4 py-2 font-body text-sm uppercase tracking-[0.1em] transition-colors duration-300 hover:bg-brand-gold hover:text-black disabled:opacity-50"
        >
          Send
        </button>
      </form>
    );
  }
);

export default MessageInput;
