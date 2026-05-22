import { createClient } from '@supabase/supabase-js'
import { createBrowserClient, createServerClient as createSSRServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Para queries con service role (bypassa RLS) — NO lee sesión de usuario
export const createServerClient = () =>
  createClient(URL, SERVICE_ROLE ?? ANON_KEY)

// Para leer sesión del usuario en server components — lee cookies SSR
export const createAuthClient = async () => {
  const cookieStore = await cookies()
  return createSSRServerClient(URL, ANON_KEY, {
    cookies: {
      getAll() { return cookieStore.getAll() },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {} // read-only en server components — ignorar
      },
    },
  })
}

// Browser client — solo para 'use client'
export const createSupabaseBrowser = () => createBrowserClient(URL, ANON_KEY)
export const supabase = createBrowserClient(URL, ANON_KEY) // singleton legacy
