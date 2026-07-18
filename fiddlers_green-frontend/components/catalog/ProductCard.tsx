import Image from "next/image";
import type { Product } from "@/data/products";

export default function ProductCard({ product }: { product: Product }) {
  return (
    <div className="group flex flex-col">
      <div
        className={[
          "relative aspect-[4/5] w-full overflow-hidden bg-brand-charcoal",
          "transition-[transform,box-shadow] duration-500 ease-out",
          "group-hover:scale-[1.03] group-hover:shadow-[0_0_32px_rgba(201,168,76,0.25)]",
        ].join(" ")}
      >
        <Image
          src={product.image}
          alt={product.name}
          fill
          unoptimized
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
          className="object-cover transition-[filter] duration-500 ease-out group-hover:brightness-110"
        />
      </div>

      <div className="mt-4">
        <p className="font-body text-[11px] tracking-[0.2em] text-brand-gold uppercase">
          {product.type}
        </p>
        <h3 className="mt-1 font-display text-xl md:text-2xl text-brand-cream">
          {product.name}
        </h3>
      </div>
    </div>
  );
}
