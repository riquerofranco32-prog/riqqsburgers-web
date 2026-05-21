'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowser } from '@/lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const supabase = createSupabaseBrowser()

      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })

      if (authError) {
        setError(`Auth error: ${authError.message}`)
        setLoading(false)
        return
      }

      if (!data.user) {
        setError('No se obtuvo usuario del servidor.')
        setLoading(false)
        return
      }

      const { data: tenantUser, error: tuError } = await supabase
        .from('tenant_users')
        .select('tenant_id')
        .eq('user_id', data.user.id)
        .single()

      if (tuError) {
        setError(`tenant_users error: ${tuError.message}`)
        setLoading(false)
        return
      }

      const tenantId = (tenantUser as { tenant_id: string } | null)?.tenant_id

      if (!tenantId) {
        setError('No tenés acceso a ningún negocio.')
        setLoading(false)
        return
      }

      const { data: tenantData, error: tError } = await supabase
        .from('tenants')
        .select('slug')
        .eq('id', tenantId)
        .single()

      if (tError) {
        setError(`tenants error: ${tError.message}`)
        setLoading(false)
        return
      }

      const slug = (tenantData as { slug: string } | null)?.slug

      if (slug) {
        router.push(`/${slug}/admin`)
      } else {
        setError('No se encontró el negocio.')
        setLoading(false)
      }
    } catch (err) {
      setError(`Error inesperado: ${err instanceof Error ? err.message : String(err)}`)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0f0d0b] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-extrabold font-[family-name:var(--font-syne)]">Panel Admin</h1>
          <p className="text-[#888] text-sm mt-1">Ingresá con tu cuenta</p>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-semibold text-[#888] uppercase tracking-wide block mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="admin@ejemplo.com"
              className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white text-sm placeholder-[#444] outline-none focus:border-[#f5c518] transition-colors min-h-[48px]"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#888] uppercase tracking-wide block mb-1.5">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white text-sm placeholder-[#444] outline-none focus:border-[#f5c518] transition-colors min-h-[48px]"
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#f5c518] text-black font-bold py-3.5 rounded-xl hover:bg-amber-400 active:scale-[0.98] transition-all min-h-[52px] disabled:opacity-50"
          >
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  )
}
