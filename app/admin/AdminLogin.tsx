'use client'

import { useState } from 'react'
import TakefyyLogo from '@/components/TakefyyLogo'

export default function AdminLogin() {
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/admin/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })

    if (res.ok) {
      window.location.href = '/admin'
    } else {
      setError('Contraseña incorrecta')
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: 'var(--bg)' }}
    >
      <div
        className="w-full max-w-sm rounded-3xl p-8 shadow-sm"
        style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <div className="flex flex-col items-center mb-8 gap-3">
          <TakefyyLogo size="lg" />
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Panel de gestión de restaurantes
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide block mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={e => { setPassword(e.target.value); setError('') }}
              placeholder="••••••••"
              required
              className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
              style={{
                backgroundColor: 'var(--surface-2)',
                border: `1.5px solid ${error ? '#ef4444' : 'var(--border)'}`,
                color: 'var(--text-primary)',
              }}
            />
            {error && <p className="text-red-500 text-xs mt-1.5">{error}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-bold text-sm text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-60"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            {loading ? 'Verificando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
