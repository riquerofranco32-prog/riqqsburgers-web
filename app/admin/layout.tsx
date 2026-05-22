import { redirect } from 'next/navigation'
import { createAuthClient } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase'
import AdminSidebarNav from '@/components/admin/AdminSidebarNav'
import TakefyyLogo from '@/components/TakefyyLogo'
import Link from 'next/link'

export const metadata = { title: 'Takefyy Admin' }

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const authClient = await createAuthClient()
  const { data: { user } } = await authClient.auth.getUser()

  if (!user) redirect('/login')

  const db = createServerClient()
  const { data: tuData } = await db
    .from('tenant_users')
    .select('role')
    .eq('user_id', user.id)
    .eq('role', 'superadmin')
    .maybeSingle()

  if (!tuData) redirect('/login')

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--dash-bg)', fontFamily: 'var(--font-sans)' }}>

      {/* Sidebar */}
      <aside style={{
        width: 240,
        background: 'var(--dash-surface)',
        borderRight: '1px solid var(--dash-border)',
        position: 'fixed',
        top: 0, bottom: 0, left: 0,
        display: 'flex',
        flexDirection: 'column',
        zIndex: 40,
      }}>
        <div style={{ padding: '18px 16px', borderBottom: '1px solid var(--dash-border)', color: 'var(--dash-text)' }}>
          <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
            <TakefyyLogo size="sm" />
          </Link>
        </div>
        <AdminSidebarNav />
      </aside>

      {/* Main */}
      <div style={{ marginLeft: 240, flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <header style={{
          height: 56,
          borderBottom: '1px solid var(--dash-border)',
          background: 'var(--dash-surface)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          position: 'sticky',
          top: 0,
          zIndex: 30,
        }}>
          <span style={{ color: 'var(--dash-text)', fontSize: 14, fontWeight: 500 }}>
            Hola, Franco 👋
          </span>
          <span style={{ color: 'var(--dash-muted)', fontSize: 12 }} suppressHydrationWarning>
            {new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </span>
        </header>

        <main style={{ flex: 1, padding: '28px 28px', overflowY: 'auto' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
