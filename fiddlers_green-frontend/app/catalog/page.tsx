import { CATEGORIES } from "@/data/products";
import CatalogCover from "@/components/catalog/CatalogCover";
import TableOfContents from "@/components/catalog/TableOfContents";
import CategorySection from "@/components/catalog/CategorySection";

export default function CatalogPage() {
  return (
    <main className="min-h-screen">
      <CatalogCover categories={CATEGORIES} />
      <TableOfContents categories={CATEGORIES} />
      {CATEGORIES.map((category) => (
        <CategorySection key={category.id} category={category} />
      ))}
    </main>
  );
}