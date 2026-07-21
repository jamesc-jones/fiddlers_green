import ChatWidget from "@/components/chat/ChatWidget";

export default function ChatPage() {
  return (
    <main className="min-h-screen px-6 md:px-10 py-16">
      <div className="max-w-2xl mx-auto text-center mb-10">
        <p className="font-body text-xs md:text-sm tracking-[0.3em] text-brand-gold uppercase">
          Ask Us
        </p>
        <h1 className="mt-4 font-display italic text-4xl md:text-5xl text-brand-cream">
          Budtender
        </h1>
      </div>
      <ChatWidget />
    </main>
  );
}
