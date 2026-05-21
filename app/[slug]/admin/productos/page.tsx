import { createServerClient } from '@/lib/supabase'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createServerClient as createSSRClient } from '@supabase/ssr'
import type { Metadata } from 'next'
import type { Tenant, Category, Product } from '@/types/supabase'
import ProductsAdmin from '@/components/ProductsAdmin'

export const metadata: Metadata = { title: 'Administrar productos' }

export default async function ProductsPage(
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const cookieStore = await cookies()

  const ssrClient = createSSRClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll() {},
      },
    }
  )

  const { data: { user } } = await ssrClient.auth.getUser()
  if (!user) redirect('/login')

  const db = createServerClient()

  const { data: rawTenant } = await db
    .from('tenants')
    .select('*')
    .eq('slug', slug)
    .single()

  const tenant = rawTenant as Tenant | null
  if (!tenant) redirect('/login')

  const { data: tenantUser } = await db
    .from('tenant_users')
    .select('role')
    .eq('user_id', user.id)
    .eq('tenant_id', tenant.id)
    .single()

  if (!tenantUser) redirect('/login')

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
