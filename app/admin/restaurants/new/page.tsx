'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import BackButton from '@/components/BackButton'

function toSlug(name: string) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

const inputStyle = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: 10,
  fontSize: 14,
  background: 'var(--dash-surface-2)',
  border: '1.5px solid var(--dash-border)',
  color: 'var(--dash-text)',
  outline: 'none',
  boxSizing: 'border-box' as const,
  transition: 'border-color 0.15s',
  fontFamily: 'var(--font-sans)',
}

const labelStyle = {
  display: 'block',
  fontSize: 12,
  fontWeight: 600,
  color: 'var(--dash-muted)',
  marginBottom: 6,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.06em',
}

export default function NewRestaurantPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [slugEdited, setSlugEdited] = useState(false)
  const [form, setForm] = useState({
    name: '',
    slug: '',
    whatsapp_number: '',
    tagline: '',
    accent_color: '#FF6B35',
    active: true,
  })

  function handleNameChange(name: string) {
    setForm(f => ({
      ...f,
      name,
      slug: slugEdited ? f.slug : toSlug(name),
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/admin/restaurants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug: form.slug,
        name: form.name,
        tagline: form.tagline,
        whatsapp_number: form.whatsapp_number,
        accent_color: form.accent_color,
        is_open: form.active,
      }),
    })

    if (res.ok) {
      router.push('/admin/restaurants')
    } else {
      const data = await res.json()
      setError(data.error ?? 'Error al crear el restaurante')
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 560 }}>
      <div style={{ marginBottom: 24 }}>
        <BackButton href="/admin/restaurants" label="Restaurantes" />
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--dash-text)', letterSpacing: '-0.02em', marginTop: 12, marginBottom: 4 }}>
          Nuevo restaurante
        </h1>
        <p style={{ fontSize: 14, color: 'var(--dash-muted)' }}>
          Completá los datos para agregar un nuevo restaurante a Takefyy.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

        {/* Name */}
        <div>
          <label style={labelStyle}>Nombre del restaurante *</label>
          <input
            type="text"
            value={form.name}
            onChange={e => handleNameChange(e.target.value)}
            placeholder="Ej: Riqq's Burgers"
            required
            style={inputStyle}
            onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
            onBlur={e => (e.currentTarget.style.borderColor = 'var(--dash-border)')}
          />
        </div>

        {/* Slug */}
        <div>
          <label style={labelStyle}>Slug (URL) *</label>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: 'var(--dash-muted)', pointerEvents: 'none' }}>
              takefyy.com/
            </span>
            <input
              type="text"
              value={form.slug}
              onChange={e => { setSlugEdited(true); setForm(f => ({ ...f, slug: e.target.value })) }}
              placeholder="mi-restaurante"
              required
              pattern="[a-z0-9-]+"
              title="Solo letras minúsculas, números y guiones"
              style={{ ...inputStyle, paddingLeft: 112, fontFamily: 'var(--font-mono)' }}
              onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
              onBlur={e => (e.currentTarget.style.borderColor = 'var(--dash-border)')}
            />
          </div>
          <p style={{ fontSize: 11, color: 'var(--dash-muted)', marginTop: 4 }}>
            Solo minúsculas, números y guiones. Se genera automáticamente desde el nombre.
          </p>
        </div>

        {/* WhatsApp */}
        <div>
          <label style={labelStyle}>Número de WhatsApp *</label>
          <input
            type="text"
            value={form.whatsapp_number}
            onChange={e => setForm(f => ({ ...f, whatsapp_number: e.target.value }))}
            placeholder="549261XXXXXXX"
            required
            style={inputStyle}
            onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
            onBlur={e => (e.currentTarget.style.borderColor = 'var(--dash-border)')}
          />
          <p style={{ fontSize: 11, color: 'var(--dash-muted)', marginTop: 4 }}>
            Con código de país sin +. Ej: 549261XXXXXXX
          </p>
        </div>

        {/* Tagline */}
        <div>
          <label style={labelStyle}>Descripción / Tagline</label>
          <input
            type="text"
            value={form.tagline}
            onChange={e => setForm(f => ({ ...f, tagline: e.target.value }))}
            placeholder="Ej: Amor a primera mordida 🍔"
            style={inputStyle}
            onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
            onBlur={e => (e.currentTarget.style.borderColor = 'var(--dash-border)')}
          />
        </div>

        {/* Color */}
        <div>
          <label style={labelStyle}>Color principal</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <input
              type="color"
              value={form.accent_color}
              onChange={e => setForm(f => ({ ...f, accent_color: e.target.value }))}
              style={{ width: 44, height: 44, borderRadius: 10, border: '1.5px solid var(--dash-border)', background: 'none', cursor: 'pointer', padding: 2 }}
            />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--dash-muted)' }}>
              {form.accent_color}
            </span>
          </div>
        </div>

        {/* Active toggle */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--dash-surface-2)', border: '1px solid var(--dash-border)', borderRadius: 10, padding: '12px 14px' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--dash-text)' }}>Restaurante activo</div>
            <div style={{ fontSize: 12, color: 'var(--dash-muted)', marginTop: 2 }}>Visible para los clientes al crear</div>
          </div>
          <button
            type="button"
            onClick={() => setForm(f => ({ ...f, active: !f.active }))}
            style={{
              width: 48, height: 26, borderRadius: 13,
              background: form.active ? 'var(--accent)' : 'var(--dash-border)',
              border: 'none', cursor: 'pointer', position: 'relative',
              transition: 'background 0.2s', flexShrink: 0,
            }}
          >
            <span style={{
              position: 'absolute', top: 3,
              left: form.active ? 26 : 4,
              width: 20, height: 20, borderRadius: '50%',
              background: '#fff', transition: 'left 0.2s',
            }} />
          </button>
        </div>

        {error && (
          <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', color: '#ef4444', fontSize: 13 }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
          <button
            type="submit"
            disabled={loading}
            style={{
              flex: 1, padding: '11px 0', borderRadius: 10,
              background: 'var(--accent)', color: '#fff',
              fontWeight: 600, fontSize: 14, border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              transition: 'filter 0.15s',
              fontFamily: 'var(--font-sans)',
            }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.filter = 'brightness(1.1)' }}
            onMouseLeave={e => { e.currentTarget.style.filter = '' }}
          >
            {loading ? 'Creando...' : 'Crear restaurante'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            style={{
              padding: '11px 20px', borderRadius: 10,
              background: 'var(--dash-surface-2)', color: 'var(--dash-muted)',
              fontWeight: 500, fontSize: 14,
              border: '1px solid var(--dash-border)', cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
            }}
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}
