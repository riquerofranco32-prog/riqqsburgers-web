import { getAllRestaurants } from '@/lib/getRestaurant'
import HomeClient from './components/HomeClient'

export const metadata = {
  title: 'Takefyy — Tu menú digital, tus pedidos por WhatsApp',
  description: 'Sin apps, sin complicaciones. Menú digital y pedidos directos por WhatsApp.',
}

export default async function HomePage() {
  const restaurants = await getAllRestaurants()
  return <HomeClient restaurants={restaurants} />
}
