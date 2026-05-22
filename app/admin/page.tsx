import { getAllTenants } from '@/lib/tenants'
import Link from 'next/link'
import TenantRow from '@/components/admin/TenantRow'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Restaurantes — Takefyy Admin' }

export default async function SuperAdminPage() {
  const tenants = await getAllTenants()

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1100 }}>

      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 32,
      }}>
        <div>
          <h1 style={{ color: 'var(--dash-text)', fontSize: 26, fontWeight: 700, marginBottom: 4 }}>
            Restaurantes
          </h1>
          <p style={{ color: 'var(--dash-muted)', fontSize: 14 }}>
            {tenants.length} negocio{tenants.length !== 1 ? 's' : ''} registrado{tenants.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link
          href="/admin/restaurants/new"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: 'var(--accent)',
            color: 'white',
            padding: '10px 20px',
            borderRadius: 10,
            fontWeight: 600,
            fontSize: 14,
            textDecoration: 'none',
          }}
        >
          + Nuevo restaurante
        </Link>
      </div>

      {/* KPI rápidos */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 16,
        marginBottom: 32,
      }}>
        {[
          { label: 'Total', value: tenants.length, sub: 'restaurantes' },
          { label: 'Activos', value: tenants.filter(t => t.active).length, sub: 'en línea' },
          { label: 'Inactivos', value: tenants.filter(t => !t.active).length, sub: 'pausados' },
        ].map(kpi => (
          <div key={kpi.label} style={{
            background: 'var(--dash-surface)',
            border: '1px solid var(--dash-border)',
            borderRadius: 12,
            padding: '20px 24px',
          }}>
            <p style={{ color: 'var(--dash-muted)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
              {kpi.label}
            </p>
            <p style={{ color: 'var(--accent)', fontSize: 32, fontWeight: 800, lineHeight: 1, marginBottom: 4 }}>
              {kpi.value}
            </p>
            <p style={{ color: 'var(--dash-muted)', fontSize: 13 }}>{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* Tabla */}
      <div style={{
        background: 'var(--dash-surface)',
        border: '1px solid var(--dash-border)',
        borderRadius: 16,
        overflow: 'hidden',
      }}>
        {/* Header tabla */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 140px 100px 180px',
          padding: '12px 24px',
          borderBottom: '1px solid var(--dash-border)',
          background: 'var(--dash-surface-2)',
        }}>
          {['Restaurante', 'Slug', 'Estado', 'Acciones'].map(h => (
            <span key={h} style={{
              color: 'var(--dash-muted)',
              fontSize: 11,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}>
              {h}
            </span>
          ))}
        </div>

        {/* Filas */}
        {tenants.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--dash-muted)' }}>
            No hay restaurantes todavía.{' '}
            <Link href="/admin/restaurants/new" style={{ color: 'var(--accent)' }}>
              Crear el primero →
            </Link>
          </div>
        ) : (
          tenants.map((tenant, i) => (
            <TenantRow
              key={tenant.id}
              tenant={tenant}
              isLast={i === tenants.length - 1}
            />
          ))
        )}
      </div>
    </div>
  )
}
