import { getRestaurant } from '@/lib/getRestaurant'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import CatalogClient from './CatalogClient'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const restaurant = await getRestaurant(slug)
  if (!restaurant) return { title: 'No encontrado — Takefyy' }
  return {
    title: `${restaurant.name} — Takefyy`,
    description: restaurant.tagline,
  }
}

export default async function RestaurantPage({ params }: Props) {
  const { slug } = await params
  const restaurant = await getRestaurant(slug)
  if (!restaurant) notFound()
  return <CatalogClient restaurant={restaurant} />
}
