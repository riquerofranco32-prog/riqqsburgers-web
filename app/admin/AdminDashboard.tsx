'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface TenantRow {
  id: string
  slug: string
  name: string
  tagline: string | null
  logo_url: string | null
  whatsapp_number: string
  instagram_handle: string | null
  primary_color: string | null
  active: boolean
  created_at: string
}

function slugify(str: string) {
  return str
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

const EMPTY_FORM = {
  name: '', slug: '', tagline: '', whatsapp_number: '',
  instagram: '', logo_url: '', accent_color: '#FF6B35',
}

export default function AdminDashboard() {
  const router = useRouter()
  const [restaurants, setRestaurants] = useState<TenantRow[]>([])
  const [loading, setLoading]         = useState(true)
  const [showForm, setShowForm]       = useState(false)
  const [form, setForm]               = useState(EMPTY_FORM)
  const [saving, setSaving]           = useState(false)
  const [formError, setFormError]     = useState('')
  const [newSlug, setNewSlug]         = useState<string | null>(null)
  const [deletingId, setDeletingId]   = useState<string | null>(null)

  const load = useCallback(async () => {
    const res = await fetch('/api/admin/restaurants')
    if (res.ok) setRestaurants(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  function setField(key: keyof typeof EMPTY_FORM, val: string) {
    setForm(f => ({ ...f, [key]: val }))
    setFormError('')
  }

  // Auto-generate slug from name
  function handleNameChange(val: string) {
    setForm(f => ({
      ...f,
      name: val,
      slug: slugify(val),
    }))
    setFormError('')
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setFormError('')

    const res = await fetch('/api/admin/restaurants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    const data = await res.json() as { slug?: string; error?: string }
    if (!res.ok) {
      setFormError(data.error ?? 'Error al crear el restaurante')
      setSaving(false)
      return
    }

    setNewSlug(data.slug ?? null)
    setForm(EMPTY_FORM)
    setSaving(false)
    await load()
  }

  async function toggleActive(r: TenantRow) {
    await fetch(`/api/admin/restaurants/${r.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !r.active }),
    })
    setRestaurants(prev => prev.map(x => x.id === r.id ? { ...x, active: !x.active } : x))
  }

  async function handleDelete(r: TenantRow) {
    if (!confirm(`¿Eliminar "${r.name}"? Esta acción no se puede deshacer.`)) return
    setDeletingId(r.id)
    await fetch(`/api/admin/restaurants/${r.id}`, { method: 'DELETE' })
    setRestaurants(prev => prev.filter(x => x.id !== r.id))
    setDeletingId(null)
  }

  async function handleLogout() {
    await fetch('/api/admin/auth', { method: 'DELETE' })
    router.refresh()
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg)' }}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-10 px-6 h-14 flex items-center justify-between"
        style={{ backgroundColor: 'var(--surface)', borderBottom: '1px solid var(--border)' }}
      >
        <span
          className="font-black text-lg"
          style={{ color: 'var(--accent)', fontFamily: "'Plus Jakarta Sans', system-ui" }}
        >
          Takefyy Admin
        </span>
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setShowForm(v => !v); setNewSlug(null); setFormError('') }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold text-white transition-all hover:opacity-90"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            <span className="text-base leading-none">{showForm ? '×' : '+'}</span>
            {showForm ? 'Cancelar' : 'Nuevo restaurante'}
          </button>
          <button
            onClick={handleLogout}
            className="text-sm px-3 py-2 rounded-full transition-colors hover:bg-[var(--surface-2)]"
            style={{ color: 'var(--text-muted)' }}
          >
            Salir
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 flex flex-col gap-6">

        {/* ── Success banner ─────────────────────────────────────────── */}
        {newSlug && (
          <div
            className="rounded-2xl p-5 flex flex-col gap-3"
            style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}
          >
            <p className="font-bold text-green-800">✅ Restaurante creado correctamente</p>
            <div className="flex flex-wrap gap-2">
              <Link
                href={`/${newSlug}`}
                target="_blank"
                className="text-sm font-medium px-3 py-1.5 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 transition-colors"
              >
                Ver catálogo →
              </Link>
              <Link
                href={`/${newSlug}/admin`}
                target="_blank"
                className="text-sm font-medium px-3 py-1.5 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 transition-colors"
              >
                Ir al panel admin →
              </Link>
            </div>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Ahora podés agregar categorías y productos desde el panel del restaurante.
            </p>
          </div>
        )}

        {/* ── Add restaurant form ────────────────────────────────────── */}
        {showForm && (
          <div
            className="rounded-2xl p-6 shadow-sm"
            style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <h2 className="font-bold text-lg mb-5" style={{ color: 'var(--text-primary)' }}>
              Nuevo restaurante
            </h2>

            <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              {/* Name */}
              <div className="sm:col-span-2">
                <Field label="Nombre del negocio *">
                  <input
                    value={form.name}
                    onChange={e => handleNameChange(e.target.value)}
                    placeholder="Ej: Riqq's Burgers"
                    required
                  />
                </Field>
              </div>

              {/* Slug */}
              <div className="sm:col-span-2">
                <Field label="URL slug *" hint={`takefyy.vercel.app/${form.slug || 'mi-negocio'}`}>
                  <input
                    value={form.slug}
                    onChange={e => setField('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    placeholder="mi-negocio"
                    required
                    pattern="[a-z0-9-]+"
                  />
                </Field>
              </div>

              {/* Tagline */}
              <div className="sm:col-span-2">
                <Field label="Tagline">
                  <input
                    value={form.tagline}
                    onChange={e => setField('tagline', e.target.value)}
                    placeholder="Ej: Amor a primera mordida 🍔"
                  />
                </Field>
              </div>

              {/* WhatsApp */}
              <Field label="WhatsApp (con código de país) *" hint="Ej: 5491112345678">
                <input
                  value={form.whatsapp_number}
                  onChange={e => setField('whatsapp_number', e.target.value.replace(/\D/g, ''))}
                  placeholder="5491112345678"
                  required
                />
              </Field>

              {/* Instagram */}
              <Field label="Instagram (sin @)">
                <input
                  value={form.instagram}
                  onChange={e => setField('instagram', e.target.value.replace('@', ''))}
                  placeholder="minegocio"
                />
              </Field>

              {/* Logo */}
              <div className="sm:col-span-2">
                <Field label="URL del logo">
                  <input
                    value={form.logo_url}
                    onChange={e => setField('logo_url', e.target.value)}
                    placeholder="https://..."
                    type="url"
                  />
                </Field>
              </div>

              {/* Accent color */}
              <Field label="Color de acento">
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={form.accent_color}
                    onChange={e => setField('accent_color', e.target.value)}
                    className="w-10 h-10 rounded-lg cursor-pointer border-0 p-0.5 bg-transparent"
                  />
                  <input
                    value={form.accent_color}
                    onChange={e => setField('accent_color', e.target.value)}
                    placeholder="#FF6B35"
                    className="flex-1"
                  />
                </div>
              </Field>

              {formError && (
                <p className="sm:col-span-2 text-red-500 text-sm">{formError}</p>
              )}

              <div className="sm:col-span-2 flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setForm(EMPTY_FORM); setFormError('') }}
                  className="px-5 py-2.5 rounded-xl text-sm font-medium transition-colors"
                  style={{ color: 'var(--text-secondary)', backgroundColor: 'var(--surface-2)' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-60"
                  style={{ backgroundColor: 'var(--accent)' }}
                >
                  {saving ? 'Creando...' : 'Crear restaurante'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── Restaurant list ────────────────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold" style={{ color: 'var(--text-primary)' }}>
              Restaurantes ({restaurants.length})
            </h2>
          </div>

          {loading ? (
            <div className="flex flex-col gap-3">
              {[1, 2].map(i => (
                <div key={i} className="h-20 rounded-2xl animate-pulse" style={{ backgroundColor: 'var(--surface)' }} />
              ))}
            </div>
          ) : restaurants.length === 0 ? (
            <div
              className="rounded-2xl p-10 text-center"
              style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              <p className="text-4xl mb-3">🍔</p>
              <p style={{ color: 'var(--text-muted)' }} className="text-sm">
                No hay restaurantes todavía.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {restaurants.map(r => (
                <div
                  key={r.id}
                  className="rounded-2xl p-4 flex items-center gap-4 transition-all"
                  style={{
                    backgroundColor: 'var(--surface)',
                    border: `1px solid ${r.active ? 'var(--border)' : '#fca5a5'}`,
                    opacity: r.active ? 1 : 0.7,
                  }}
                >
                  {/* Logo */}
                  <div
                    className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center text-xl"
                    style={{ backgroundColor: 'var(--surface-2)' }}
                  >
                    {r.logo_url ? (
                      <Image src={r.logo_url} alt={r.name} width={48} height={48} className="w-full h-full object-cover" unoptimized />
                    ) : '🍔'}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                        {r.name}
                      </p>
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                        style={{
                          backgroundColor: r.active ? '#dcfce7' : '#fee2e2',
                          color: r.active ? '#166534' : '#991b1b',
                        }}
                      >
                        {r.active ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      /{r.slug}
                    </p>
                  </div>

                  {/* Accent dot */}
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: r.primary_color ?? '#FF6B35' }}
                  />

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Link
                      href={`/${r.slug}`}
                      target="_blank"
                      title="Ver catálogo"
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-colors hover:bg-[var(--surface-2)]"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      🔗
                    </Link>
                    <Link
                      href={`/${r.slug}/admin`}
                      target="_blank"
                      title="Panel admin"
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-colors hover:bg-[var(--surface-2)]"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      ⚙️
                    </Link>
                    <button
                      onClick={() => toggleActive(r)}
                      title={r.active ? 'Desactivar' : 'Activar'}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-colors hover:bg-[var(--surface-2)]"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {r.active ? '⏸' : '▶️'}
                    </button>
                    <button
                      onClick={() => handleDelete(r)}
                      disabled={deletingId === r.id}
                      title="Eliminar"
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-colors hover:bg-red-50 disabled:opacity-40"
                      style={{ color: '#ef4444' }}
                    >
                      🗑
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

// ── Field helper ──────────────────────────────────────────────────────────────
function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-semibold uppercase tracking-wide block mb-1.5" style={{ color: 'var(--text-secondary)' }}>
        {label}
        {hint && <span className="ml-2 normal-case font-normal" style={{ color: 'var(--text-muted)' }}>{hint}</span>}
      </label>
      <div
        className="[&_input]:w-full [&_input]:px-4 [&_input]:py-2.5 [&_input]:rounded-xl [&_input]:text-sm [&_input]:outline-none [&_input]:transition-all"
        style={{
          '--input-bg': 'var(--surface-2)',
          '--input-border': 'var(--border)',
        } as React.CSSProperties}
      >
        <style>{`
          .\\[\\&_input\\]\\:w-full input {
            background-color: var(--surface-2);
            border: 1.5px solid var(--border);
            color: var(--text-primary);
          }
          .\\[\\&_input\\]\\:w-full input:focus { border-color: var(--accent); }
          .\\[\\&_input\\]\\:w-full input::placeholder { color: var(--text-muted); }
        `}</style>
        {children}
      </div>
    </div>
  )
}
