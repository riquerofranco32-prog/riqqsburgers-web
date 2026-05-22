import fs from 'fs/promises'
import path from 'path'
import { createServerClient } from '@/lib/supabase'
import type { Tenant, Category, Product } from '@/types/supabase'

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
  address: string
  schedule: string
  is_open: boolean
  menu: {
    categories: MenuCategory[]
  }
}

function mapToRestaurant(
  tenant: Tenant,
  categories: Category[],
  products: Product[],
): Restaurant {
  return {
    slug: tenant.slug,
    name: tenant.name,
    tagline: tenant.tagline ?? '',
    phone: tenant.whatsapp_number,
    instagram: tenant.instagram_handle ?? '',
    logo: tenant.logo_url ?? '',
    accent_color: tenant.primary_color ?? '#FF6B35',
    address: tenant.address ?? '',
    schedule: tenant.schedule ?? '',
    is_open: tenant.is_open ?? true,
    menu: {
      categories: categories.map(cat => ({
        id: cat.id,
        name: cat.name,
        emoji: cat.emoji ?? '🍽️',
        items: products
          .filter(p => p.category_id === cat.id && p.available)
          .sort((a, b) => a.sort_order - b.sort_order)
          .map(p => ({
            id: p.id,
            name: p.name,
            description: p.description ?? '',
            price: p.price,
            image: p.image_url ?? '',
            badge: p.badge ?? null,
          })),
      })),
    },
  }
}

export async function getRestaurant(slug: string): Promise<Restaurant | null> {
  // 1. Supabase (fuente principal en producción)
  try {
    const supabase = createServerClient()
    const { data: tenant } = await supabase
      .from('tenants')
      .select('*')
      .eq('slug', slug)
      .eq('active', true)
      .single()

    if (tenant) {
      const [{ data: categories }, { data: products }] = await Promise.all([
        supabase.from('categories').select('*').eq('tenant_id', tenant.id).eq('active', true).order('sort_order'),
        supabase.from('products').select('*').eq('tenant_id', tenant.id).eq('available', true).order('sort_order'),
      ])
      return mapToRestaurant(
        tenant as Tenant,
        (categories ?? []) as Category[],
        (products ?? []) as Product[],
      )
    }
  } catch {}

  // 2. JSON local (fallback para dev / restaurantes migrados)
  try {
    const filePath = path.join(process.cwd(), 'data', 'restaurants', `${slug}.json`)
    const content = await fs.readFile(filePath, 'utf-8')
    return JSON.parse(content) as Restaurant
  } catch {
    return null
  }
}

export async function getAllRestaurants(): Promise<Restaurant[]> {
  // 1. Supabase
  try {
    const supabase = createServerClient()
    const { data: tenants } = await supabase
      .from('tenants')
      .select('*')
      .eq('active', true)
      .order('created_at', { ascending: false })

    if (tenants && tenants.length > 0) {
      return (tenants as Tenant[]).map(t => mapToRestaurant(t, [], []))
    }
  } catch {}

  // 2. JSON local
  try {
    const dir = path.join(process.cwd(), 'data', 'restaurants')
    const files = await fs.readdir(dir)
    return await Promise.all(
      files
        .filter(f => f.endsWith('.json'))
        .map(async f => {
          const content = await fs.readFile(path.join(dir, f), 'utf-8')
          return JSON.parse(content) as Restaurant
        }),
    )
  } catch {
    return []
  }
}
