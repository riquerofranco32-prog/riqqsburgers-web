import { getAllTenants } from '@/lib/tenants'
import type { Restaurant } from '@/lib/getRestaurant'
import HomeClient from './components/HomeClient'

export const metadata = {
  title: 'Takefyy — Tu menú digital, tus pedidos por WhatsApp',
  description: 'Sin apps, sin complicaciones. Menú digital y pedidos directos por WhatsApp.',
}

export default async function HomePage() {
  const tenants = await getAllTenants()
  const restaurants: Restaurant[] = tenants.map(t => ({
    slug: t.slug,
    name: t.name,
    tagline: t.tagline ?? '',
    phone: t.whatsapp_number,
    instagram: t.instagram_handle ?? '',
    logo: t.logo_url ?? '',
    accent_color: t.primary_color ?? '#FF6B35',
    address: t.address ?? '',
    schedule: t.schedule ?? '',
    is_open: t.is_open ?? true,
    brand: (t.brand as Restaurant['brand']) ?? null,
    menu: { categories: [] },
  }))
  return <HomeClient restaurants={restaurants} />
}
