import Image from "next/image";
import type { DisplayItem } from "@/lib/catalogGrouping";
import CategoryEffect from "@/components/catalog/CategoryEffect";
import CatalogProductActions from "@/components/catalog/CatalogProductActions";
import WeightVariantActions from "@/components/catalog/WeightVariantActions";

export default function ProductCard({
  item,
  priority = false,
}: {
  item: DisplayItem;
  priority?: boolean;
}) {
  const name = item.kind === "flat" ? item.product.name : item.baseName;
  const category = item.kind === "flat" ? item.product.category : item.category;
  const imageUrl = item.kind === "flat" ? item.product.image_url : item.image_url;
  const productType = item.kind === "flat" ? item.product.product_type : item.product_type;

  return (
    <div className="group flex flex-col">
      <div
        className={[
          "relative aspect-[4/5] w-full overflow-hidden bg-brand-charcoal",
          "transition-[transform,box-shadow] duration-500 ease-out",
          "group-hover:scale-[1.03] group-hover:shadow-[0_0_32px_rgba(201,168,76,0.25)]",
        ].join(" ")}
      >
        {imageUrl && (
          <Image
            src={imageUrl}
            alt={name}
            fill
            priority={priority}
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className="object-cover transition-[filter] duration-500 ease-out group-hover:brightness-110"
          />
        )}
        <CategoryEffect category={category} />
      </div>

      <div className="mt-4">
        {productType && (
          <p className="font-body text-[11px] tracking-[0.2em] text-brand-gold uppercase">
            {productType}
          </p>
        )}
        <h3 className="mt-1 font-display text-xl md:text-2xl text-brand-cream">{name}</h3>
        {item.kind === "flat" ? (
          <CatalogProductActions product={item.product} />
        ) : (
          <WeightVariantActions variants={item.variants} />
        )}
      </div>
    </div>
  );
}
