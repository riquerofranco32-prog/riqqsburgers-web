import type { MetadataRoute } from 'next'
import { getAllTenants } from '@/lib/tenants'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const tenants = await getAllTenants()

  const restaurantUrls: MetadataRoute.Sitemap = tenants.map(t => ({
    url: `https://takefyy.com/${t.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.7,
  }))

  return [
    {
      url: 'https://takefyy.com',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 1.0,
    },
    ...restaurantUrls,
  ]
}
