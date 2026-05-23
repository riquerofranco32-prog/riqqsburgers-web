import { getAllTenants } from '@/lib/tenants'
import Link from 'next/link'
import RestaurantCard from '@/components/admin/RestaurantCard'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Restaurantes — Takefyy Admin' }

export default async function RestaurantsPage() {
  const tenants = await getAllTenants()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--dash-text)', letterSpacing: '-0.02em', marginBottom: 4 }}>
            Restaurantes
          </h1>
          <p style={{ fontSize: 14, color: 'var(--dash-muted)' }}>
            {tenants.length} {tenants.length === 1 ? 'restaurante activo' : 'restaurantes activos'}
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

      {/* Grid */}
      {tenants.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 0', color: 'var(--dash-muted)', fontSize: 14 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🍽️</div>
          <p>No hay restaurantes todavía.</p>
          <Link href="/admin/restaurants/new" style={{ color: 'var(--accent)', textDecoration: 'none', marginTop: 8, display: 'inline-block' }}>
            Agregar el primero →
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {tenants.map(tenant => (
            <RestaurantCard key={tenant.id} tenant={tenant} />
          ))}
        </div>
      )}
    </div>
  )
}
