import fs from 'fs/promises'
import path from 'path'

export interface MenuItem {
  id: string
  name: string
  description: string
  price: number
  image: string
  badge: string | null
}

export interface MenuCategory {
  id: string
  name: string
  emoji: string
  items: MenuItem[]
}

export interface Restaurant {
  slug: string
  name: string
  tagline: string
  phone: string
  instagram: string
  logo: string
  accent_color: string
  menu: {
    categories: MenuCategory[]
  }
}

export async function getRestaurant(slug: string): Promise<Restaurant | null> {
  try {
    const filePath = path.join(process.cwd(), 'data', 'restaurants', `${slug}.json`)
    const content = await fs.readFile(filePath, 'utf-8')
    return JSON.parse(content) as Restaurant
  } catch {
    return null
  }
}

export async function getAllRestaurants(): Promise<Restaurant[]> {
  try {
    const dir = path.join(process.cwd(), 'data', 'restaurants')
    const files = await fs.readdir(dir)
    const restaurants = await Promise.all(
      files
        .filter(f => f.endsWith('.json'))
        .map(async f => {
          const content = await fs.readFile(path.join(dir, f), 'utf-8')
          return JSON.parse(content) as Restaurant
        })
    )
    return restaurants
  } catch {
    return []
  }
}
