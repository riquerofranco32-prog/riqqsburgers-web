import { createServerClient } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import { MenuPage } from '@/components/MenuPage'
import type { Metadata } from 'next'
import type { Tenant, Category, Product } from '@/types/supabase'

export const revalidate = 60

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params
  const supabase = createServerClient()
  const { data } = await supabase
    .from('tenants')
    .select('name, tagline')
    .eq('slug', slug)
    .single()

  const tenant = data as { name: string; tagline: string | null } | null
  if (!tenant) return { title: 'No encontrado' }

  return {
    title: `${tenant.name} — Pedí online`,
    description: tenant.tagline ?? undefined,
  }
}

export default async function Page(
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const supabase = createServerClient()

  const { data: rawTenant } = await supabase
    .from('tenants')
    .select('*')
    .eq('slug', slug)
    .eq('active', true)
    .single()

  const tenant = rawTenant as Tenant | null
  if (!tenant) notFound()

  const [{ data: rawCats }, { data: rawProds }] = await Promise.all([
    supabase.from('categories').select('*').eq('tenant_id', tenant.id).eq('active', true).order('sort_order'),
    supabase.from('products').select('*').eq('tenant_id', tenant.id).eq('available', true).order('sort_order'),
  ])

  const categories = (rawCats ?? []) as Category[]
  const products = (rawProds ?? []) as Product[]

  return (
    <MenuPage
      tenant={tenant}
      categories={categories}
      products={products}
    />
  )
}
