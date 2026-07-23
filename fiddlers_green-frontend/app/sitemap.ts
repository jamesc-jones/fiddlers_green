import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const ROUTES = ["/", "/catalog", "/catalog/gummies", "/heritage", "/contact", "/chat"];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return ROUTES.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified,
  }));
}
