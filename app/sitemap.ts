import type { MetadataRoute } from "next";
import { getAllTenants } from "@/lib/tenants";
import { getAllPosts } from "@/lib/blog";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [tenants, posts] = await Promise.all([getAllTenants(), getAllPosts()]);

  const restaurantUrls: MetadataRoute.Sitemap = tenants.map((t) => ({
    url: `https://takefyy.com/${t.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const blogPostUrls: MetadataRoute.Sitemap = posts.map((p) => ({
    url: `https://takefyy.com/blog/${p.slug}`,
    lastModified: new Date(p.date),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  return [
    {
      url: "https://takefyy.com",
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 1.0,
    },
    {
      url: "https://takefyy.com/blog",
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.9,
    },
    ...blogPostUrls,
    ...restaurantUrls,
  ];
}
