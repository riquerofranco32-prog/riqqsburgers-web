import { createServerClient } from '@/lib/supabase'
import Link from 'next/link'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Restaurantes — Takefyy Admin' }

export default async function AdminPage() {
  const db = createServerClient()

  const { data: tenants } = await db
    .from('tenants')
    .select('id, name, slug, active, created_at')
    .order('created_at', { ascending: false })

  const list = tenants ?? []

  return (
    <div style={{ padding: '28px 28px', display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--dash-text)', letterSpacing: '-0.02em', marginBottom: 4 }}>
            Restaurantes
          </h1>
          <p style={{ fontSize: 14, color: 'var(--dash-muted)' }}>
            {list.length} {list.length === 1 ? 'restaurante' : 'restaurantes'} en la plataforma
          </p>
        </div>
        <Link href="/admin/restaurants/new" style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '10px 20px', borderRadius: 10,
          background: 'var(--accent)', color: '#fff',
          fontWeight: 600, fontSize: 14, textDecoration: 'none',
          flexShrink: 0,
        }}>
          + Nuevo restaurante
        </Link>
      </div>

      {/* Table */}
      <div style={{
        background: 'var(--dash-surface)',
        border: '1px solid var(--dash-border)',
        borderRadius: 14,
        overflow: 'hidden',
      }}>
        {list.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 0', color: 'var(--dash-muted)', fontSize: 14 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🍽️</div>
            <p>No hay restaurantes todavía.</p>
            <Link href="/admin/restaurants/new" style={{ color: 'var(--accent)', textDecoration: 'none', marginTop: 8, display: 'inline-block' }}>
              Agregar el primero →
            </Link>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--dash-border)' }}>
                {['Nombre', 'Slug', 'Estado', 'Acciones'].map(h => (
                  <th key={h} style={{
                    padding: '12px 20px',
                    textAlign: 'left',
                    fontSize: 11,
                    fontWeight: 600,
                    color: 'var(--dash-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {list.map((tenant, i) => (
                <tr
                  key={tenant.id}
                  style={{ borderBottom: i < list.length - 1 ? '1px solid var(--dash-border)' : 'none' }}
                >
                  <td style={{ padding: '14px 20px', fontSize: 14, fontWeight: 500, color: 'var(--dash-text)' }}>
                    {tenant.name}
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <span style={{
                      fontFamily: 'var(--font-mono, monospace)',
                      fontSize: 12,
                      color: 'var(--dash-muted)',
                      background: 'var(--dash-surface-2)',
                      padding: '2px 8px',
                      borderRadius: 6,
                    }}>
                      /{tenant.slug}
                    </span>
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <span style={{
                      fontSize: 11,
                      fontWeight: 600,
                      padding: '3px 10px',
                      borderRadius: 20,
                      background: tenant.active ? 'rgba(34,197,94,0.1)' : 'var(--dash-surface-2)',
                      color: tenant.active ? '#22c55e' : 'var(--dash-muted)',
                      border: `1px solid ${tenant.active ? 'rgba(34,197,94,0.25)' : 'var(--dash-border)'}`,
                    }}>
                      {tenant.active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Link
                        href={`/${tenant.slug}`}
                        target="_blank"
                        style={{
                          fontSize: 12, fontWeight: 500,
                          color: 'var(--dash-muted)',
                          textDecoration: 'none',
                          padding: '5px 12px',
                          borderRadius: 6,
                          border: '1px solid var(--dash-border)',
                          transition: 'color 0.15s',
                        }}
                      >
                        Ver menú ↗
                      </Link>
                      <Link
                        href={`/${tenant.slug}/admin`}
                        style={{
                          fontSize: 12, fontWeight: 500,
                          color: 'var(--accent)',
                          textDecoration: 'none',
                          padding: '5px 12px',
                          borderRadius: 6,
                          border: '1px solid rgba(255,107,53,0.25)',
                          background: 'rgba(255,107,53,0.08)',
                          transition: 'background 0.15s',
                        }}
                      >
                        Panel admin →
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
