import { createClient } from '@supabase/supabase-js'
import { createBrowserClient } from '@supabase/ssr'

// Factory — para usar en login y componentes client
export const createSupabaseBrowser = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

// Singleton client — compatibilidad con imports existentes (AdminDashboard, CheckoutModal, ProductsAdmin)
// createBrowserClient guarda la sesión en cookies, legible por server components
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Cliente servidor (service role) — para server components y route handlers
export const createServerClient = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
