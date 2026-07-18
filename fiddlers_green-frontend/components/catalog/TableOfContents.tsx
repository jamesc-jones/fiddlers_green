import type { Category } from "@/data/products";

export default function TableOfContents({
  categories,
}: {
  categories: Category[];
}) {
  return (
    <nav
      aria-label="Catalog contents"
      className="mx-auto max-w-3xl px-6 md:px-10 py-16 md:py-20"
    >
      <p className="font-body text-xs tracking-[0.3em] text-white/40 uppercase text-center">
        Contents
      </p>

      <ul className="mt-8 divide-y divide-white/10" role="list">
        {categories.map((category, i) => (
          <li key={category.id}>
            <a
              href={`#${category.anchor}`}
              className="group flex items-baseline py-4 transition-colors duration-200"
            >
              <span className="font-body text-xs text-white/30 tabular-nums">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="font-display italic text-xl md:text-3xl text-brand-cream group-hover:text-brand-gold transition-colors duration-200">
                {category.label}
              </span>
              <span
                className="flex-1 mx-3 md:mx-4 border-b border-dotted border-white/15 translate-y-[-4px]"
                aria-hidden="true"
              />
              <span className="hidden sm:inline font-body text-xs text-white/30 uppercase tracking-[0.15em]">
                {category.products.length} items
              </span>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
