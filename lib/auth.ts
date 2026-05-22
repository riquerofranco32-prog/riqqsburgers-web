import { createServerClient as createSSRClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createServerClient } from './supabase'

export type UserRole = 'superadmin' | 'admin' | null

// SSR client that reads Supabase Auth session from cookies
export async function createAuthClient() {
  const cookieStore = await cookies()
  return createSSRClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll() {},
      },
    }
  )
}

export async function getUserRole(userId: string): Promise<{
  role: UserRole
  tenantId: string | null
  tenantSlug: string | null
}> {
  const supabase = createServerClient()

  const { data } = await supabase
    .from('tenant_users')
    .select('role, tenant_id, tenants(slug)')
    .eq('user_id', userId)
    .order('role', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!data) return { role: null, tenantId: null, tenantSlug: null }

  return {
    role: data.role as UserRole,
    tenantId: data.tenant_id,
    tenantSlug: (data.tenants as unknown as { slug: string } | null)?.slug ?? null,
  }
}
