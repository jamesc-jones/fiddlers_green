"use client";

import { useState, type FormEvent } from "react";
import { postJson } from "@/lib/api";

type Status = "idle" | "loading" | "success" | "error";

interface ContactResponse {
  ok: boolean;
  detail: string;
}

const inputClasses =
  "w-full bg-transparent border border-white/20 px-4 py-3 font-body text-brand-cream focus:outline-none focus:border-brand-gold";

const labelClasses =
  "block font-body text-xs tracking-[0.2em] uppercase text-brand-gold mb-2";

export default function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [inquiryType, setInquiryType] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [detail, setDetail] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setStatus("loading");

    try {
      const response = await postJson<ContactResponse>("/contact", {
        name,
        email,
        message,
        inquiry_type: inquiryType || undefined,
      });
      setDetail(response.detail);
      setStatus("success");
    } catch (error) {
      setDetail(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again later."
      );
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <p className="font-body text-base text-brand-cream text-center">
        {detail}
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 text-left">
      <div>
        <label htmlFor="name" className={labelClasses}>
          Name
        </label>
        <input
          id="name"
          type="text"
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
          className={inputClasses}
        />
      </div>

      <div>
        <label htmlFor="email" className={labelClasses}>
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className={inputClasses}
        />
      </div>

      <div>
        <label htmlFor="inquiry_type" className={labelClasses}>
          Inquiry Type <span className="normal-case text-white/40">(optional)</span>
        </label>
        <input
          id="inquiry_type"
          type="text"
          value={inquiryType}
          onChange={(event) => setInquiryType(event.target.value)}
          className={inputClasses}
        />
      </div>

      <div>
        <label htmlFor="message" className={labelClasses}>
          Message
        </label>
        <textarea
          id="message"
          required
          rows={5}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          className={`${inputClasses} resize-none`}
        />
      </div>

      {status === "error" && (
        <p className="font-body text-sm text-red-400">{detail}</p>
      )}

      <button
        type="submit"
        disabled={status === "loading"}
        className="mt-2 inline-flex items-center justify-center border border-brand-gold text-brand-gold px-8 py-3 font-body text-sm tracking-[0.15em] uppercase transition-colors duration-300 hover:bg-brand-gold hover:text-black disabled:opacity-50"
      >
        {status === "loading" ? "Sending..." : "Send Message"}
      </button>
    </form>
  );
}
