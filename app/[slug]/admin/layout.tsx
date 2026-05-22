import { createServerClient } from '@/lib/supabase'
import { createAuthClient } from '@/lib/auth'
import { redirect } from 'next/navigation'
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

  const authClient = await createAuthClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) redirect('/login')

  const db = createServerClient()

  const { data: rawTenant } = await db
    .from('tenants')
    .select('id, name, slug')
    .eq('slug', slug)
    .maybeSingle()

  const tenant = rawTenant as Pick<Tenant, 'id' | 'name' | 'slug'> | null
  if (!tenant) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0d0d0d' }}>
        <div className="text-center" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ color: '#fff', fontWeight: 600, fontSize: 18 }}>
            Restaurante &quot;{slug}&quot; no encontrado
          </p>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>
            Verificá que el slug existe en Supabase
          </p>
          <a href="/admin" style={{ color: '#FF6B35', fontSize: 14 }}>
            → Ir al panel Takefyy
          </a>
        </div>
      </div>
    )
  }

  // Superadmin puede acceder a cualquier tenant; admin solo al suyo
  const { data: tenantUser } = await db
    .from('tenant_users')
    .select('role, tenant_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!tenantUser) redirect('/login')
  if (tenantUser.role !== 'superadmin' && tenantUser.tenant_id !== tenant.id) redirect('/login')

  return (
    <AdminShell slug={slug} tenantName={tenant.name} userEmail={user.email ?? ''}>
      {children}
    </AdminShell>
  )
}
