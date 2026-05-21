import { createServerClient } from '@/lib/supabase'
import type { Metadata } from 'next'
import type { Tenant, Category, Product, Order, OrderItem } from '@/types/supabase'
import type { DashboardKPIs, DailyRevenue, CategoryRevenue, TopProduct } from '@/types/dashboard'
import AdminDashboard from '@/components/AdminDashboard'

export const metadata: Metadata = { title: 'Panel Admin' }

// ── Helpers ───────────────────────────────────────────────────────────────────

function startOfDay(d: Date): Date {
  const r = new Date(d)
  r.setHours(0, 0, 0, 0)
  return r
}

function computeKPIs(orders: Order[]): DashboardKPIs {
  const today = startOfDay(new Date())
  const yesterday = new Date(today.getTime() - 86_400_000)

  const todayOrders = orders.filter(o => new Date(o.created_at) >= today)
  const yesterdayOrders = orders.filter(o => {
    const d = new Date(o.created_at)
    return d >= yesterday && d < today
  })

  const ordersToday = todayOrders.length
  const ordersYesterday = yesterdayOrders.length
  const ordersTodayChange = ordersYesterday > 0
    ? ((ordersToday - ordersYesterday) / ordersYesterday) * 100
    : null

  const revenueToday = todayOrders.reduce((s, o) => s + o.total, 0)
  const revenueYesterday = yesterdayOrders.reduce((s, o) => s + o.total, 0)
  const revenueTodayChange = revenueYesterday > 0
    ? ((revenueToday - revenueYesterday) / revenueYesterday) * 100
    : null

  const avgTicketToday = ordersToday > 0 ? Math.round(revenueToday / ordersToday) : 0
  const avgTicketYesterday = ordersYesterday > 0 ? Math.round(revenueYesterday / ordersYesterday) : 0
  const avgTicketChange = avgTicketYesterday > 0
    ? ((avgTicketToday - avgTicketYesterday) / avgTicketYesterday) * 100
    : null

  const itemMap: Record<string, { name: string; qty: number }> = {}
  for (const order of todayOrders) {
    for (const item of (order.items as OrderItem[])) {
      if (!itemMap[item.product_id]) itemMap[item.product_id] = { name: item.name, qty: 0 }
      itemMap[item.product_id].qty += item.quantity
    }
  }
  const topProductToday = Object.values(itemMap).sort((a, b) => b.qty - a.qty)[0] ?? null

  return {
    ordersToday, ordersTodayChange,
    revenueToday, revenueTodayChange,
    avgTicketToday, avgTicketChange,
    topProductToday,
  }
}

function computeSalesLast7Days(orders: Order[]): DailyRevenue[] {
  const result: DailyRevenue[] = []
  for (let i = 6; i >= 0; i--) {
    const day = startOfDay(new Date())
    day.setDate(day.getDate() - i)
    const nextDay = new Date(day.getTime() + 86_400_000)

    const dayTotal = orders
      .filter(o => { const d = new Date(o.created_at); return d >= day && d < nextDay })
      .reduce((s, o) => s + o.total, 0)

    // Label: "Lun", "Mar", ..., "Hoy"
    const isToday = i === 0
    const raw = day.toLocaleDateString('es-AR', { weekday: 'short' })
    const label = isToday ? 'Hoy' : raw.charAt(0).toUpperCase() + raw.slice(1).replace('.', '')
    result.push({ date: label, total: dayTotal })
  }
  return result
}

const CATEGORY_COLORS: Record<string, string> = {
  Burgers:  '#facc15',
  Promos:   '#fb923c',
  Bebidas:  '#60a5fa',
  Otros:    '#52525b',
}

function computeCategoryRevenue(
  orders: Order[],
  products: Product[],
  categories: Category[],
): CategoryRevenue[] {
  const catMap: Record<string, number> = {}
  for (const order of orders) {
    for (const item of (order.items as OrderItem[])) {
      const product = products.find(p => p.id === item.product_id)
      const category = product ? categories.find(c => c.id === product.category_id) : null
      const name = category?.name ?? 'Otros'
      catMap[name] = (catMap[name] ?? 0) + item.price * item.quantity
    }
  }
  return Object.entries(catMap)
    .map(([name, value]) => ({ name, value, color: CATEGORY_COLORS[name] ?? '#52525b' }))
    .sort((a, b) => b.value - a.value)
}

function computeTopProducts(
  orders: Order[],
  products: Product[],
  categories: Category[],
): TopProduct[] {
  const map: Record<string, {
    name: string; qty: number; revenue: number; productRef?: Product
  }> = {}

  for (const order of orders) {
    for (const item of (order.items as OrderItem[])) {
      if (!map[item.product_id]) {
        map[item.product_id] = {
          name: item.name, qty: 0, revenue: 0,
          productRef: products.find(p => p.id === item.product_id),
        }
      }
      map[item.product_id].qty += item.quantity
      map[item.product_id].revenue += item.price * item.quantity
    }
  }

  return Object.entries(map)
    .map(([product_id, data]) => {
      const cat = data.productRef
        ? categories.find(c => c.id === data.productRef!.category_id)
        : null
      return {
        product_id,
        name: data.name,
        category_name: cat?.name ?? null,
        category_emoji: cat?.emoji ?? null,
        quantity: data.qty,
        revenue: data.revenue,
      }
    })
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5)
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function AdminPage(
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const db = createServerClient()

  // Fetch tenant
  const { data: rawTenant } = await db
    .from('tenants')
    .select('*')
    .eq('slug', slug)
    .single()

  const tenant = rawTenant as Tenant | null
  if (!tenant) return null

  // Date range: 8 days ago (today + yesterday + 7-day chart)
  const eightDaysAgo = new Date()
  eightDaysAgo.setDate(eightDaysAgo.getDate() - 8)
  eightDaysAgo.setHours(0, 0, 0, 0)

  // Fetch all data in parallel
  const [
    { data: rawOrders },
    { data: rawProducts },
    { data: rawCategories },
  ] = await Promise.all([
    db.from('orders')
      .select('*')
      .eq('tenant_id', tenant.id)
      .gte('created_at', eightDaysAgo.toISOString())
      .order('created_at', { ascending: false }),
    db.from('products')
      .select('id, name, category_id, tenant_id, description, price, image_url, badge, available, sort_order, created_at')
      .eq('tenant_id', tenant.id),
    db.from('categories')
      .select('*')
      .eq('tenant_id', tenant.id)
      .eq('active', true),
  ])

  const orders = (rawOrders ?? []) as Order[]
  const products = (rawProducts ?? []) as Product[]
  const categories = (rawCategories ?? []) as Category[]

  // Compute all dashboard data server-side
  const kpis = computeKPIs(orders)
  const salesData = computeSalesLast7Days(orders)
  const categoryData = computeCategoryRevenue(orders, products, categories)
  const topProducts = computeTopProducts(orders, products, categories)
  const recentOrders = orders.slice(0, 10)

  return (
    <AdminDashboard
      tenantName={tenant.name}
      slug={slug}
      kpis={kpis}
      salesData={salesData}
      categoryData={categoryData}
      recentOrders={recentOrders}
      topProducts={topProducts}
    />
  )
}
