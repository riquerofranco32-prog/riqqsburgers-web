'use client'

import { KPICard } from '@/components/admin/KPICard'
import { SalesChart } from '@/components/admin/SalesChart'
import { CategoryChart } from '@/components/admin/CategoryChart'
import { OrdersTable } from '@/components/admin/OrdersTable'
import type { Tenant, Order } from '@/types/supabase'

function fmtARS(n: number) {
  return '$ ' + n.toLocaleString('es-AR')
}

function isToday(iso: string) {
  return new Date(iso).toDateString() === new Date().toDateString()
}

export default function AdminDashboard({ tenant, orders }: {
  tenant: Tenant
  orders: Order[]
}) {
  const todayOrders = orders.filter(o => isToday(o.created_at))
  const totalHoy = todayOrders.reduce((s, o) => s + o.total, 0)
  const ticketPromedio = todayOrders.length > 0 ? Math.round(totalHoy / todayOrders.length) : 0

  const itemCounts: Record<string, { name: string; qty: number }> = {}
  for (const order of orders) {
    if (!Array.isArray(order.items)) continue
    for (const item of order.items as { name: string; quantity: number }[]) {
      if (!itemCounts[item.name]) itemCounts[item.name] = { name: item.name, qty: 0 }
      itemCounts[item.name].qty += item.quantity
    }
  }
  const topProduct = Object.values(itemCounts).sort((a, b) => b.qty - a.qty)[0]

  void tenant

  return (
    <div className="p-5 md:p-8 flex flex-col gap-6 max-w-5xl">

      <div>
        <h1 className="text-xl font-bold font-[family-name:var(--font-syne)]">Dashboard</h1>
        <p className="text-xs text-zinc-500 mt-0.5">Resumen de actividad</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPICard title="Pedidos hoy" value={String(todayOrders.length)} delta="+2" deltaType="up" />
        <KPICard title="Ventas hoy" value={fmtARS(totalHoy)} delta="+12%" deltaType="up" accent />
        <KPICard title="Ticket promedio" value={fmtARS(ticketPromedio)} deltaType="neutral" />
        <KPICard
          title="Top producto"
          value={topProduct?.name ?? '—'}
          sub={topProduct ? `${topProduct.qty} unidades` : undefined}
        />
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-4">
        <SalesChart />
        <CategoryChart />
      </div>

      {/* Orders */}
      <OrdersTable initialOrders={orders} />

    </div>
  )
}
