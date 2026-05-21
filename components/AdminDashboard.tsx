'use client'

import { ShoppingCart, DollarSign, TrendingUp, Star } from 'lucide-react'
import { KPICard } from '@/components/admin/dashboard/KPICard'
import { SalesAreaChart } from '@/components/admin/dashboard/SalesAreaChart'
import { CategoryDonut } from '@/components/admin/dashboard/CategoryDonut'
import { RecentOrdersTable } from '@/components/admin/dashboard/RecentOrdersTable'
import { TopProductsList } from '@/components/admin/dashboard/TopProductsList'
import type { Order } from '@/types/supabase'
import type { DashboardKPIs, DailyRevenue, CategoryRevenue, TopProduct } from '@/types/dashboard'

function fmtARS(n: number) {
  return '$' + n.toLocaleString('es-AR')
}

function getGreeting(): string {
  const h = new Date().getHours()
  if (h >= 5 && h < 12) return 'Buen día'
  if (h >= 12 && h < 20) return 'Buenas tardes'
  return 'Buenas noches'
}

function getDateLabel(): string {
  const raw = new Intl.DateTimeFormat('es-AR', {
    weekday: 'long', day: 'numeric', month: 'long',
  }).format(new Date())
  // Capitalize only the first letter (weekday), leave rest as-is
  return raw.charAt(0).toUpperCase() + raw.slice(1)
}

interface AdminDashboardProps {
  tenantName: string
  slug: string
  kpis: DashboardKPIs
  salesData: DailyRevenue[]
  categoryData: CategoryRevenue[]
  recentOrders: Order[]
  topProducts: TopProduct[]
}

export default function AdminDashboard({
  tenantName,
  slug,
  kpis,
  salesData,
  categoryData,
  recentOrders,
  topProducts,
}: AdminDashboardProps) {
  const greeting = getGreeting()
  const dateLabel = getDateLabel()

  return (
    <div className="p-5 md:p-8 flex flex-col gap-6 max-w-6xl">

      {/* Greeting */}
      <div>
        <h1 className="text-xl font-bold font-[family-name:var(--font-syne)] text-zinc-100">
          {greeting}, {tenantName} 👋
        </h1>
        <p className="text-sm text-zinc-500 mt-1">{dateLabel}</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPICard
          label="Pedidos hoy"
          value={String(kpis.ordersToday)}
          change={kpis.ordersTodayChange}
          changeLabel="vs ayer"
          icon={ShoppingCart}
        />
        <KPICard
          label="Ventas hoy"
          value={fmtARS(kpis.revenueToday)}
          change={kpis.revenueTodayChange}
          changeLabel="vs ayer"
          icon={DollarSign}
        />
        <KPICard
          label="Ticket promedio"
          value={kpis.avgTicketToday > 0 ? fmtARS(kpis.avgTicketToday) : '—'}
          change={kpis.avgTicketChange}
          changeLabel="vs ayer"
          icon={TrendingUp}
        />
        <KPICard
          label="Top producto hoy"
          value={kpis.topProductToday?.name ?? '—'}
          sub={kpis.topProductToday ? `${kpis.topProductToday.qty} unidades hoy` : 'Sin pedidos aún'}
          icon={Star}
        />
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-4">
        <SalesAreaChart data={salesData} />
        <CategoryDonut data={categoryData} />
      </div>

      {/* Tables */}
      <div className="grid md:grid-cols-2 gap-4">
        <RecentOrdersTable orders={recentOrders} slug={slug} />
        <TopProductsList products={topProducts} />
      </div>

    </div>
  )
}
