import { createServerClient } from './supabase'
import type { Tenant, Category, Product } from '@/types/supabase'

export type { Tenant }

export async function getTenant(slug: string): Promise<Tenant | null> {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('tenants')
    .select('*')
    .eq('slug', slug)
    .eq('active', true)
    .single()
  if (error || !data) return null
  return data as Tenant
}

export async function getAllTenants(): Promise<Tenant[]> {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('tenants')
    .select('*')
    .eq('active', true)
    .order('name')
  if (error || !data) return []
  return data as Tenant[]
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
