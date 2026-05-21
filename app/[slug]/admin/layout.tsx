import { createServerClient } from '@/lib/supabase'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createServerClient as createSSRClient } from '@supabase/ssr'
import AdminShell from '@/components/admin/AdminShell'
import type { Tenant } from '@/types/supabase'

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}) {
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
    .select('id, name, slug')
    .eq('slug', slug)
    .single()

  const tenant = rawTenant as Pick<Tenant, 'id' | 'name' | 'slug'> | null
  if (!tenant) redirect('/login')

  const { data: tenantUser } = await db
    .from('tenant_users')
    .select('role')
    .eq('user_id', user.id)
    .eq('tenant_id', tenant.id)
    .single()

  if (!tenantUser) redirect('/login')

  return (
    <AdminShell slug={slug} tenantName={tenant.name} userEmail={user.email ?? ''}>
      {children}
    </AdminShell>
  )
}
