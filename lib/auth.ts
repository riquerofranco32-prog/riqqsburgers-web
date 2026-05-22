import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Para leer sesión del usuario en server components — lee cookies SSR
// Solo importar desde server components o route handlers, nunca desde client
export const createAuthClient = async () => {
  const cookieStore = await cookies()
  return createServerClient(URL, ANON_KEY, {
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
