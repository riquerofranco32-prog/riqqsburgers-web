import { createServerClient } from './supabase'
import type { Tenant, Category, Product } from '@/types/supabase'

export type { Tenant }

// Admin use: finds tenant regardless of active status
export async function getTenant(slug: string): Promise<Tenant | null> {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('tenants')
    .select('*')
    .eq('slug', slug)
    .maybeSingle()
  if (error || !data) return null
  return data as Tenant
}

// Public use: only returns tenant if active = true
export async function getActiveTenant(slug: string): Promise<Tenant | null> {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('tenants')
    .select('*')
    .eq('slug', slug)
    .eq('active', true)
    .maybeSingle()
  if (error || !data) return null
  return data as Tenant
}

export async function getAllTenants() {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('tenants')
    .select('id, slug, name, tagline, active, primary_color, logo_url, whatsapp_number, created_at')
    .order('created_at', { ascending: false })
  if (error || !data) return []
  return data
}

export async function getTenantProducts(tenantId: string): Promise<Product[]> {
  const supabase = createServerClient()
  const { data } = await supabase
    .from('products')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('available', true)
    .order('sort_order')
  return (data ?? []) as Product[]
}

export async function getTenantCategories(tenantId: string): Promise<Category[]> {
  const supabase = createServerClient()
  const { data } = await supabase
    .from('categories')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('active', true)
    .order('sort_order')
  return (data ?? []) as Category[]
}
