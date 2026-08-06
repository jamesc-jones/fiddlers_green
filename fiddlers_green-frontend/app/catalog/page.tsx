import type { Metadata } from "next";
import { CATEGORIES } from "@/data/products";
import CatalogCover from "@/components/catalog/CatalogCover";
import TableOfContents from "@/components/catalog/TableOfContents";
import InteractiveCatalog from "@/components/catalog/InteractiveCatalog";

export const metadata: Metadata = {
  title: "Catalog",
  description:
    "Explore the Fiddler's Green catalog — premium flower, hash, and Haney Pot gummies from Tyendinaga.",
};

export default function CatalogPage() {
  return (
    <div className="min-h-screen">
      <CatalogCover categories={CATEGORIES} />
      <TableOfContents categories={CATEGORIES} />
      <InteractiveCatalog categories={CATEGORIES} />
    </div>
  );
}