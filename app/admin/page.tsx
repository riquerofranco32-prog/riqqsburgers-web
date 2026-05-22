import { createServerClient } from '@/lib/supabase'
import { getAllTenants } from '@/lib/tenants'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

function KPICard({ label, value, sub, accent = false }: {
  label: string; value: string; sub?: string; accent?: boolean
}) {
  return (
    <div style={{ background: 'var(--dash-surface)', border: '1px solid var(--dash-border)', borderRadius: 14, padding: '20px 24px' }}>
      <div style={{ fontSize: 11, color: 'var(--dash-muted)', fontWeight: 600, marginBottom: 10, textTransform: 'uppercase' as const, letterSpacing: '0.08em' }}>
        {label}
      </div>
      <div style={{ fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.02em', color: accent ? 'var(--accent)' : 'var(--dash-text)', lineHeight: 1 }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 12, color: 'var(--dash-muted)', marginTop: 6 }}>{sub}</div>}
    </div>
  )
}

export default async function AdminHomePage() {
  const db = createServerClient()

  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const [tenants, { data: monthOrders }, { data: recentTenants }] = await Promise.all([
    getAllTenants(),
    db.from('orders').select('total, tenant_id').gte('created_at', startOfMonth.toISOString()),
    db.from('tenants').select('id, slug, name, active, created_at').order('created_at', { ascending: false }).limit(8),
  ])

  const orders = monthOrders ?? []
  const monthRevenue = orders.reduce((s, o) => s + (o.total ?? 0), 0)

  const tenantOrderCount: Record<string, number> = {}
  for (const o of orders) {
    tenantOrderCount[o.tenant_id] = (tenantOrderCount[o.tenant_id] ?? 0) + 1
  }
  const topTenantId = Object.entries(tenantOrderCount).sort(([, a], [, b]) => b - a)[0]?.[0]
  const topTenant = tenants.find(t => t.id === topTenantId)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
        <KPICard label="Restaurantes activos" value={String(tenants.length)} sub="registrados en Supabase" accent />
        <KPICard label="Pedidos este mes" value={String(orders.length)} sub={`$${monthRevenue.toLocaleString('es-AR')} en ventas`} />
        <KPICard label="Más activo este mes" value={topTenant?.name ?? '—'} sub={topTenant ? `${tenantOrderCount[topTenant.id]} pedidos` : 'Sin datos'} />
        <KPICard label="Ingresos proyectados" value={`$${(tenants.length * 4999).toLocaleString('es-AR')}`} sub="plan base · por mes" />
      </div>

      {/* Quick actions */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' as const }}>
        <Link href="/admin/restaurants/new" style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '10px 20px', borderRadius: 10,
          background: 'var(--accent)', color: '#fff',
          fontWeight: 600, fontSize: 14, textDecoration: 'none',
        }}>
          + Agregar restaurante
        </Link>
        <Link href="/admin/restaurants" style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '10px 20px', borderRadius: 10,
          background: 'var(--dash-surface)', color: 'var(--dash-text)',
          fontWeight: 500, fontSize: 14, textDecoration: 'none',
          border: '1px solid var(--dash-border)',
        }}>
          Ver todos los restaurantes →
        </Link>
      </div>

      {/* Recent table */}
      <div style={{ background: 'var(--dash-surface)', border: '1px solid var(--dash-border)', borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--dash-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--dash-text)' }}>Restaurantes recientes</span>
          <Link href="/admin/restaurants" style={{ fontSize: 12, color: 'var(--accent)', textDecoration: 'none' }}>Ver todos →</Link>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' as const }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--dash-border)' }}>
              {['Nombre', 'Slug', 'Estado', 'Acción'].map(h => (
                <th key={h} style={{ padding: '10px 20px', textAlign: 'left' as const, fontSize: 11, fontWeight: 600, color: 'var(--dash-muted)', textTransform: 'uppercase' as const, letterSpacing: '0.08em' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(recentTenants ?? []).map((t, i) => (
              <tr key={t.id} style={{ borderBottom: i < (recentTenants?.length ?? 0) - 1 ? '1px solid var(--dash-border)' : 'none' }}>
                <td style={{ padding: '12px 20px', fontSize: 14, fontWeight: 500, color: 'var(--dash-text)' }}>{t.name}</td>
                <td style={{ padding: '12px 20px' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--dash-muted)', background: 'var(--dash-surface-2)', padding: '2px 8px', borderRadius: 6 }}>
                    /{t.slug}
                  </span>
                </td>
                <td style={{ padding: '12px 20px' }}>
                  <span style={{
                    fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20,
                    background: t.active ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
                    color: t.active ? '#22c55e' : '#ef4444',
                    border: `1px solid ${t.active ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'}`,
                  }}>
                    {t.active ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td style={{ padding: '12px 20px' }}>
                  <Link href={`/${t.slug}/admin`} style={{ fontSize: 12, color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}>
                    Panel →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
