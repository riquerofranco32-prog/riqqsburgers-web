'use client'

import Link from 'next/link'

interface TenantRowProps {
  tenant: {
    id: string
    name: string
    slug: string
    tagline?: string | null
    active: boolean
  }
  isLast: boolean
}

export default function TenantRow({ tenant, isLast }: TenantRowProps) {
  return (
    <div
      onMouseEnter={e => (e.currentTarget.style.background = 'var(--dash-surface-2)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 140px 100px 180px',
        padding: '16px 24px',
        alignItems: 'center',
        borderBottom: isLast ? 'none' : '1px solid var(--dash-border)',
        transition: 'background 0.15s',
        background: 'transparent',
      }}
    >
      {/* Nombre */}
      <div>
        <p style={{ color: 'var(--dash-text)', fontWeight: 600, fontSize: 15, marginBottom: 2 }}>
          {tenant.name}
        </p>
        {tenant.tagline && (
          <p style={{ color: 'var(--dash-muted)', fontSize: 12 }}>{tenant.tagline}</p>
        )}
      </div>

      {/* Slug */}
      <span style={{
        color: 'var(--dash-muted)',
        fontSize: 13,
        fontFamily: 'var(--font-mono, monospace)',
        background: 'var(--dash-surface-2)',
        padding: '3px 8px',
        borderRadius: 6,
        border: '1px solid var(--dash-border)',
      }}>
        /{tenant.slug}
      </span>

      {/* Badge estado */}
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 10px',
        borderRadius: 20,
        fontSize: 12,
        fontWeight: 600,
        background: tenant.active ? 'rgba(34,197,94,0.12)' : 'var(--dash-surface-2)',
        color: tenant.active ? '#22c55e' : 'var(--dash-muted)',
        border: `1px solid ${tenant.active ? 'rgba(34,197,94,0.25)' : 'var(--dash-border)'}`,
      }}>
        <span style={{
          width: 6, height: 6,
          borderRadius: '50%',
          background: tenant.active ? '#22c55e' : 'var(--dash-muted)',
          display: 'inline-block',
        }} />
        {tenant.active ? 'Activo' : 'Inactivo'}
      </span>

      {/* Acciones */}
      <div style={{ display: 'flex', gap: 8 }}>
        <Link
          href={`/${tenant.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--dash-text)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--dash-muted)')}
          style={{
            fontSize: 12,
            color: 'var(--dash-muted)',
            textDecoration: 'none',
            padding: '5px 10px',
            borderRadius: 7,
            border: '1px solid var(--dash-border)',
            transition: 'color 0.15s',
          }}
        >
          Ver ↗
        </Link>
        <Link
          href={`/${tenant.slug}/admin`}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,107,53,0.15)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          style={{
            fontSize: 12,
            color: 'var(--accent)',
            textDecoration: 'none',
            padding: '5px 10px',
            borderRadius: 7,
            border: '1px solid rgba(255,107,53,0.3)',
            transition: 'background 0.15s',
          }}
        >
          Admin →
        </Link>
      </div>
    </div>
  )
}
