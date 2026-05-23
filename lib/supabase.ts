import { createClient } from '@supabase/supabase-js'
import { createBrowserClient } from '@supabase/ssr'

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Para queries con service role (bypassa RLS) — solo server, NO lee sesión
export const createServerClient = () =>
  createClient(URL, SERVICE_ROLE ?? ANON_KEY)

// Browser client — solo para 'use client'
export const createSupabaseBrowser = () => createBrowserClient(URL, ANON_KEY)
