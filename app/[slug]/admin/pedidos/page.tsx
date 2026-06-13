import { createServerClient } from '@/lib/supabase'
import type { Metadata } from 'next'
import type { Tenant, Order } from '@/types/supabase'
import { OrdersTable } from '@/components/admin/OrdersTable'
import BackButton from '@/components/BackButton'
import { Clock, ChefHat, CheckCircle, DollarSign } from 'lucide-react'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Pedidos' }

function startOfDay(d: Date): Date {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  return r;
}

export default async function PedidosPage(
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const db = createServerClient()

  const { data: rawTenant } = await db
    .from('tenants')
    .select('id')
    .eq('slug', slug)
    .maybeSingle()

  const tenant = rawTenant as Pick<Tenant, 'id'> | null
  if (!tenant) return null

  const { data: rawOrders } = await db
    .from('orders')
    .select('*')
    .eq('tenant_id', tenant.id)
    .order('created_at', { ascending: false })
    .limit(100)

  const orders = (rawOrders ?? []) as Order[]

  // Compute daily stats
  const today = startOfDay(new Date())
  const pendingOrdersCount = orders.filter(o => o.status === 'pending' || o.status === 'nuevo').length
  const activeOrdersCount = orders.filter(o => o.status === 'confirmed' || o.status === 'preparando' || o.status === 'preparing').length
  const readyOrdersCount = orders.filter(o => o.status === 'ready' || o.status === 'listo').length
  
  const todayDeliveredOrders = orders.filter(o => 
    (o.status === 'delivered' || o.status === 'entregado') && 
    new Date(o.created_at) >= today
  )
  const todaySales = todayDeliveredOrders.reduce((sum, o) => sum + o.total, 0)

  return (
    <div className="p-5 md:p-8 flex flex-col gap-6 max-w-5xl">
      <BackButton href={`/${slug}/admin`} label="Dashboard" />
      <div>
        <h1 className="text-xl font-bold font-[family-name:var(--font-syne)] text-zinc-100">Pedidos</h1>
        <p className="text-xs text-zinc-500 mt-0.5">Gestión y control de pedidos en tiempo real</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Pending */}
        <div style={{
          background: 'linear-gradient(145deg, var(--dash-surface, #1e1e1e) 0%, rgba(28,33,40,0.95) 100%)',
          border: '1px solid var(--dash-border, rgba(255,255,255,0.08))',
          borderRadius: 12,
          padding: 14,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
        }}>
          <div style={{
            background: 'rgba(245,158,11,0.1)',
            padding: 8,
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Clock style={{ color: '#f59e0b', width: 18, height: 18 }} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 11, color: 'var(--dash-muted, #888)', fontWeight: 500 }}>Pendientes</p>
            <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: 'var(--dash-text, #fff)', fontFamily: 'var(--font-mono, monospace)' }}>
              {pendingOrdersCount}
            </p>
          </div>
        </div>

        {/* Preparing */}
        <div style={{
          background: 'linear-gradient(145deg, var(--dash-surface, #1e1e1e) 0%, rgba(28,33,40,0.95) 100%)',
          border: '1px solid var(--dash-border, rgba(255,255,255,0.08))',
          borderRadius: 12,
          padding: 14,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
        }}>
          <div style={{
            background: 'rgba(59,130,246,0.1)',
            padding: 8,
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <ChefHat style={{ color: '#60a5fa', width: 18, height: 18 }} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 11, color: 'var(--dash-muted, #888)', fontWeight: 500 }}>En Cocina</p>
            <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: 'var(--dash-text, #fff)', fontFamily: 'var(--font-mono, monospace)' }}>
              {activeOrdersCount}
            </p>
          </div>
        </div>

        {/* Ready */}
        <div style={{
          background: 'linear-gradient(145deg, var(--dash-surface, #1e1e1e) 0%, rgba(28,33,40,0.95) 100%)',
          border: '1px solid var(--dash-border, rgba(255,255,255,0.08))',
          borderRadius: 12,
          padding: 14,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
        }}>
          <div style={{
            background: 'rgba(34,197,94,0.1)',
            padding: 8,
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <CheckCircle style={{ color: '#4ade80', width: 18, height: 18 }} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 11, color: 'var(--dash-muted, #888)', fontWeight: 500 }}>Listos</p>
            <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: 'var(--dash-text, #fff)', fontFamily: 'var(--font-mono, monospace)' }}>
              {readyOrdersCount}
            </p>
          </div>
        </div>

        {/* Today's Sales */}
        <div style={{
          background: 'linear-gradient(145deg, var(--dash-surface, #1e1e1e) 0%, rgba(28,33,40,0.95) 100%)',
          border: '1px solid var(--dash-border, rgba(255,255,255,0.08))',
          borderRadius: 12,
          padding: 14,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
        }}>
          <div style={{
            background: 'rgba(255,107,53,0.1)',
            padding: 8,
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <DollarSign style={{ color: 'var(--accent, #ff6b35)', width: 18, height: 18 }} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 11, color: 'var(--dash-muted, #888)', fontWeight: 500 }}>Ventas Hoy</p>
            <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: 'var(--dash-text, #fff)', fontFamily: 'var(--font-mono, monospace)' }}>
              {"$ " + todaySales.toLocaleString("es-AR")}
            </p>
          </div>
        </div>
      </div>

      <OrdersTable initialOrders={orders} slug={slug} tenantId={tenant.id} />
    </div>
  )
}
