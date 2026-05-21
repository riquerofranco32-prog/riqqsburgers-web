import { createServerClient } from '@/lib/supabase'
import type { Metadata } from 'next'
import type { Tenant, Category, Product } from '@/types/supabase'
import ProductsAdmin from '@/components/ProductsAdmin'

export const metadata: Metadata = { title: 'Administrar productos' }

export default async function ProductsPage(
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const db = createServerClient()

  const { data: rawTenant } = await db
    .from('tenants')
    .select('*')
    .eq('slug', slug)
    .single()

  const tenant = rawTenant as Tenant | null
  if (!tenant) return null

  const [{ data: rawCats }, { data: rawProds }] = await Promise.all([
    db.from('categories').select('*').eq('tenant_id', tenant.id).eq('active', true).order('sort_order'),
    db.from('products').select('*').eq('tenant_id', tenant.id).order('sort_order'),
  ])

  const categories = (rawCats ?? []) as Category[]
  const products = (rawProds ?? []) as Product[]

  return (
    <ProductsAdmin
      tenant={tenant}
      categories={categories}
      initialProducts={products}
    />
  )
}
