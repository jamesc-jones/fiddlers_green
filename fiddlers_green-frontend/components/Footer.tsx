import Link from "next/link";

const FOOTER_LINKS = [
  { label: "Catalog", href: "/catalog" },
  { label: "Heritage", href: "/heritage" },
  { label: "Chat", href: "/chat" },
  { label: "Contact", href: "/contact" },
] as const;

export default function Footer() {
  return (
    <footer className="bg-black border-t border-white/10">
      <div className="mx-auto max-w-7xl px-6 md:px-10 py-12 flex flex-col items-center gap-6 text-center">
        <span className="font-display italic text-xl text-brand-gold">
          Fiddler&apos;s Green
        </span>

        <ul className="flex flex-wrap items-center justify-center gap-6" role="list">
          {FOOTER_LINKS.map(({ label, href }) => (
            <li key={href}>
              <Link
                href={href}
                className="font-body text-xs tracking-[0.15em] uppercase text-white/60 transition-colors duration-200 hover:text-brand-gold"
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>

        <p className="font-body text-[11px] tracking-[0.2em] uppercase text-white/40">
          Made in Tyendinaga · By Indigenous · For the World
        </p>
      </div>
    </footer>
  );
}
