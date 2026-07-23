"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { useChatMessages } from "@/hooks/useChatMessages";
import ChatButton from "./ChatButton";
import ChatPanel from "./ChatPanel";

const AUTO_OPEN_DELAY_MS = 2000;
const DISMISSED_SESSION_KEY = "fg-chat-dismissed";

export default function FloatingChat() {
  const pathname = usePathname();
  const { messages, loading, sendMessage } = useChatMessages();
  const [isOpen, setIsOpen] = useState(false);

  const buttonRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus management: move focus into the panel's input as soon as it opens.
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  // One-time delayed auto-open: only on initial mount, only if the user's
  // first page this session is home, and never again once dismissed.
  useEffect(() => {
    if (pathname !== "/") return;
    if (sessionStorage.getItem(DISMISSED_SESSION_KEY) === "1") return;

    const timer = setTimeout(() => {
      if (sessionStorage.getItem(DISMISSED_SESSION_KEY) === "1") return;
      setIsOpen(true);
    }, AUTO_OPEN_DELAY_MS);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ESC closes the panel while it's open.
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        close();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Lock body scroll on mobile viewports while the panel is open.
  useEffect(() => {
    if (!isOpen) {
      document.body.style.overflow = "";
      return;
    }

    const isMobile = window.matchMedia("(max-width: 767px)").matches;
    if (isMobile) {
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  function close() {
    setIsOpen(false);
    sessionStorage.setItem(DISMISSED_SESSION_KEY, "1");
    buttonRef.current?.focus();
  }

  function handleToggle() {
    if (isOpen) {
      close();
    } else {
      setIsOpen(true);
    }
  }

  // Hidden on /chat — that route already has its own dedicated ChatWidget.
  if (pathname === "/chat") return null;

  return (
    <>
      <ChatButton ref={buttonRef} isOpen={isOpen} onClick={handleToggle} />
      <AnimatePresence>
        {isOpen && (
          <ChatPanel
            ref={inputRef}
            messages={messages}
            loading={loading}
            onSend={sendMessage}
            onClose={close}
          />
        )}
      </AnimatePresence>
    </>
  );
}
