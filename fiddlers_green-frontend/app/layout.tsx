import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import "./globals.css";

// ─── Fonts ────────────────────────────────────────────────────────────────────

const displayFont = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["300", "400", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

const bodyFont = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  display: "swap",
});

// ─── Metadata ─────────────────────────────────────────────────────────────────

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Fiddler's Green | Premium Indigenous Cannabis",
    template: "%s | Fiddler's Green",
  },
  description:
    "Premium cannabis, made in Tyendinaga. By Indigenous, for the world.",
  keywords: ["cannabis", "Indigenous", "Tyendinaga", "premium", "Haudenosaunee"],
  authors: [{ name: "Fiddler's Green" }],
  openGraph: {
    type: "website",
    locale: "en_CA",
    siteName: "Fiddler's Green",
    title: "Fiddler's Green | Premium Indigenous Cannabis",
    description:
      "Premium cannabis, made in Tyendinaga. By Indigenous, for the world.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Fiddler's Green",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Fiddler's Green",
    description: "Premium cannabis, made in Tyendinaga.",
  },
};

// ─── Root layout ──────────────────────────────────────────────────────────────

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${displayFont.variable} ${bodyFont.variable}`}
      suppressHydrationWarning
    >
      <body className="bg-black text-brand-cream antialiased min-h-screen flex flex-col">
        <Navbar />
        {/*
          pt-16 md:pt-20 offsets the fixed Navbar height so page content
          doesn't slide underneath it. Match these values if you change
          the Navbar's h-16 / h-20 classes.
        */}
        <main className="flex-1 pt-16 md:pt-20">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
