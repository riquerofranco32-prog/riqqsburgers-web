import { getAllTenants } from '@/lib/tenants'
import HomeClient from './components/HomeClient'

export const metadata = {
  title: 'Takefyy — Tu carta, online en minutos',
  description: 'Creá el menú digital de tu restaurante y recibí pedidos por WhatsApp. Sin apps, sin comisiones.',
}

export default async function HomePage() {
  const tenants = await getAllTenants()
  return <HomeClient restaurantCount={tenants.length} />
}
