import { createServerClient } from '@/lib/supabase'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createServerClient as createSSRClient } from '@supabase/ssr'
import type { Metadata } from 'next'
import type { Tenant, Order } from '@/types/supabase'
import AdminDashboard from '@/components/AdminDashboard'

export const metadata: Metadata = { title: 'Panel Admin' }

export default async function AdminPage(
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

  const { data: rawOrders } = await db
    .from('orders')
    .select('*')
    .eq('tenant_id', tenant.id)
    .order('created_at', { ascending: false })
    .limit(20)

  const orders = (rawOrders ?? []) as Order[]

  return (
    <AdminDashboard
      tenant={tenant}
      orders={orders}
      userEmail={user.email ?? ''}
    />
  )
}
