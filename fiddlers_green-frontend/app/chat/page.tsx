import type { Metadata } from "next";
import ChatWidget from "@/components/chat/ChatWidget";

export const metadata: Metadata = {
  title: "Budtender",
  description:
    "Ask our AI Budtender anything about Fiddler's Green products, strains, and cannabis guidance.",
};

export default function ChatPage() {
  return (
    <div className="min-h-screen px-6 md:px-10 py-16">
      <div className="max-w-2xl mx-auto text-center mb-10">
        <p className="font-body text-xs md:text-sm tracking-[0.3em] text-brand-gold uppercase">
          Ask Us
        </p>
        <h1 className="mt-4 font-display italic text-4xl md:text-5xl text-brand-cream">
          Budtender
        </h1>
      </div>
      <ChatWidget />
    </div>
  );
}
