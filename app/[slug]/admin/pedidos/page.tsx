import { createServerClient } from '@/lib/supabase'
import type { Metadata } from 'next'
import type { Tenant, Order } from '@/types/supabase'
import { OrdersTable } from '@/components/admin/OrdersTable'

export const metadata: Metadata = { title: 'Pedidos' }

export default async function PedidosPage(
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const db = createServerClient()

  const { data: rawTenant } = await db
    .from('tenants')
    .select('id')
    .eq('slug', slug)
    .single()

  const tenant = rawTenant as Pick<Tenant, 'id'> | null
  if (!tenant) return null

  const { data: rawOrders } = await db
    .from('orders')
    .select('*')
    .eq('tenant_id', tenant.id)
    .order('created_at', { ascending: false })
    .limit(100)

  const orders = (rawOrders ?? []) as Order[]

  return (
    <div className="p-5 md:p-8 flex flex-col gap-6 max-w-5xl">
      <div>
        <h1 className="text-xl font-bold font-[family-name:var(--font-syne)]">Pedidos</h1>
        <p className="text-xs text-zinc-500 mt-0.5">Todos los pedidos recientes</p>
      </div>
      <OrdersTable initialOrders={orders} />
    </div>
  )
}
