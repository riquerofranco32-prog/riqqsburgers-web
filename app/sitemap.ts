import type { MetadataRoute } from "next";
import { getAllTenants } from "@/lib/tenants";
import { getAllPosts } from "@/lib/blog";

const SITE = "https://takefyy.com";

/** Landing pages SEO — ordered by priority */
const LANDING_PAGES: MetadataRoute.Sitemap = [
  { url: `${SITE}`, changeFrequency: "monthly", priority: 1.0 },
  { url: `${SITE}/menu-digital`, changeFrequency: "monthly", priority: 0.95 },
  { url: `${SITE}/carta-digital`, changeFrequency: "monthly", priority: 0.95 },
  { url: `${SITE}/menu-qr`, changeFrequency: "monthly", priority: 0.9 },
  {
    url: `${SITE}/pedidos-whatsapp`,
    changeFrequency: "monthly",
    priority: 0.9,
  },
  {
    url: `${SITE}/software-restaurantes`,
    changeFrequency: "monthly",
    priority: 0.9,
  },
  {
    url: `${SITE}/hamburgueserias`,
    changeFrequency: "monthly",
    priority: 0.9,
  },
  { url: `${SITE}/pizzerias`, changeFrequency: "monthly", priority: 0.9 },
  {
    url: `${SITE}/dark-kitchens`,
    changeFrequency: "monthly",
    priority: 0.85,
  },
  /* Community pages */
  { url: `${SITE}/explorar`, changeFrequency: "daily", priority: 0.9 },
  { url: `${SITE}/ofertas`, changeFrequency: "daily", priority: 0.85 },
  { url: `${SITE}/blog`, changeFrequency: "weekly", priority: 0.9 },
];

/** Comparison pages */
const VS_PAGES: MetadataRoute.Sitemap = [
  { url: `${SITE}/vs/olaclick`, changeFrequency: "monthly", priority: 0.8 },
  { url: `${SITE}/vs/pedix`, changeFrequency: "monthly", priority: 0.8 },
  { url: `${SITE}/vs/fudo`, changeFrequency: "monthly", priority: 0.8 },
  { url: `${SITE}/vs/wabox`, changeFrequency: "monthly", priority: 0.8 },
  { url: `${SITE}/vs/todomenu`, changeFrequency: "monthly", priority: 0.8 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const [tenants, posts] = await Promise.all([getAllTenants(), getAllPosts()]);

  const restaurantUrls: MetadataRoute.Sitemap = tenants.map((t) => ({
    url: `${SITE}/${t.slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const blogPostUrls: MetadataRoute.Sitemap = posts.map((p) => ({
    url: `${SITE}/blog/${p.slug}`,
    lastModified: new Date(p.dateModified ?? p.date),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  return [
    ...LANDING_PAGES.map((p) => ({ ...p, lastModified: now })),
    ...VS_PAGES.map((p) => ({ ...p, lastModified: now })),
    ...blogPostUrls,
    ...restaurantUrls,
  ];
}
