import { redirect } from 'next/navigation'
import { createAuthClient } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase'
import SuperAdminShell from '@/components/admin/SuperAdminShell'

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

  return <SuperAdminShell>{children}</SuperAdminShell>
}
