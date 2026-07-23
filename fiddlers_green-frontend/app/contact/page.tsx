import type { Metadata } from "next";
import ContactForm from "@/components/contact/ContactForm";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Reach out to Fiddler's Green with questions about our products, wholesale inquiries, or our Tyendinaga roots.",
};

export default function ContactPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(circle_at_50%_20%,_#141d17_0%,_#0a0d0a_55%,_#000000_100%)] px-6 md:px-10 py-24">
      <div className="max-w-2xl mx-auto text-center">
        <p className="font-body text-xs md:text-sm tracking-[0.3em] text-brand-gold uppercase">
          Get in Touch
        </p>
        <h1 className="mt-6 font-display italic text-4xl md:text-6xl text-brand-cream">
          Contact
        </h1>
        <p className="mt-6 mb-10 font-body text-base md:text-lg text-brand-smoke leading-relaxed">
          Have a question about our products or Tyendinaga roots? Send us a
          message below.
        </p>
        <ContactForm />
      </div>
    </div>
  );
}
