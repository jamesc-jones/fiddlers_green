import Link from "next/link";
import type { Category } from "@/data/products";

export default function CatalogCover({
  categories,
}: {
  categories: Category[];
}) {
  return (
    <section className="relative min-h-[70vh] md:min-h-[80vh] flex flex-col items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_50%_20%,_#141d17_0%,_#0a0d0a_55%,_#000000_100%)]">
      <div className="relative z-10 mx-auto max-w-3xl px-6 text-center">
        <p className="font-body text-xs md:text-sm tracking-[0.3em] text-brand-gold uppercase">
          Fiddler&apos;s Green
        </p>

        <h1 className="mt-6 font-display italic text-5xl md:text-7xl text-brand-cream">
          Catalog
        </h1>

        <p className="mt-6 font-body text-base md:text-lg text-white/60 max-w-lg mx-auto leading-relaxed">
          A curated selection, grown and crafted in Tyendinaga.
        </p>

        <ul
          className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3"
          role="list"
        >
          {categories.map((category) => {
            const isExperience = category.id === "gummies";
            const LinkComponent = isExperience ? Link : "a";
            const href = isExperience
              ? `/catalog/${category.id}`
              : `#${category.anchor}`;

            return (
              <li key={category.id}>
                <LinkComponent
                  href={href}
                  className="font-body text-sm tracking-[0.15em] uppercase text-white/50 hover:text-brand-gold transition-[color,text-shadow] duration-300 ease-out hover:[text-shadow:0_0_12px_rgba(201,168,76,0.4)]"
                >
                  {category.label}
                </LinkComponent>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
