'use client'

import { useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import type { Tenant, Order } from '@/types/supabase'

function fmtARS(n: number) {
  return '$ ' + n.toLocaleString('es-AR')
}

function fmtFecha(iso: string) {
  return new Date(iso).toLocaleString('es-AR', {
    day: '2-digit', month: '2-digit', year: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-400',
  confirmed: 'bg-blue-500/20 text-blue-400',
  delivered: 'bg-green-500/20 text-green-400',
  cancelled: 'bg-red-500/20 text-red-400',
}

export default function AdminDashboard({ tenant, orders, userEmail }: {
  tenant: Tenant
  orders: Order[]
  userEmail: string
}) {
  const router = useRouter()
  const [orderList, setOrderList] = useState(orders)

  const totalHoy = orderList
    .filter(o => new Date(o.created_at).toDateString() === new Date().toDateString())
    .reduce((sum, o) => sum + o.total, 0)

  async function updateStatus(orderId: string, status: string) {
    await supabase.from('orders').update({ status }).eq('id', orderId)
    setOrderList(prev => prev.map(o => o.id === orderId ? { ...o, status } : o))
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-[#0f0d0b] text-white">

      {/* Header */}
      <header className="border-b border-[#2a2a2a] px-4 py-3 flex items-center justify-between max-w-4xl mx-auto">
        <div>
          <h1 className="font-bold font-[family-name:var(--font-syne)]">{tenant.name}</h1>
          <p className="text-[#555] text-xs">Panel Admin · {userEmail}</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/${tenant.slug}/admin/productos`}
            className="bg-[#f5c518] text-black text-sm font-bold px-3 py-2 rounded-xl hover:bg-amber-400 transition-colors"
          >
            Productos
          </Link>
          <Link
            href={`/${tenant.slug}`}
            target="_blank"
            className="bg-[#1a1a1a] text-[#888] text-sm px-3 py-2 rounded-xl hover:text-white border border-[#2a2a2a] transition-colors"
          >
            Ver menú ↗
          </Link>
          <button
            onClick={handleLogout}
            className="text-[#555] text-sm hover:text-white transition-colors"
          >
            Salir
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 flex flex-col gap-6">

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div className="bg-[#1a1a1a] rounded-2xl p-4 border border-[#2a2a2a]">
            <p className="text-[#888] text-xs mb-1">Pedidos hoy</p>
            <p className="text-2xl font-bold font-[family-name:var(--font-syne)]">
              {orderList.filter(o => new Date(o.created_at).toDateString() === new Date().toDateString()).length}
            </p>
          </div>
          <div className="bg-[#1a1a1a] rounded-2xl p-4 border border-[#2a2a2a]">
            <p className="text-[#888] text-xs mb-1">Ventas hoy</p>
            <p className="text-2xl font-bold font-[family-name:var(--font-syne)] text-[#f5c518]">
              {fmtARS(totalHoy)}
            </p>
          </div>
          <div className="bg-[#1a1a1a] rounded-2xl p-4 border border-[#2a2a2a]">
            <p className="text-[#888] text-xs mb-1">Total pedidos</p>
            <p className="text-2xl font-bold font-[family-name:var(--font-syne)]">{orderList.length}</p>
          </div>
        </div>

        {/* Orders */}
        <div>
          <h2 className="font-bold text-lg font-[family-name:var(--font-syne)] mb-3">Pedidos recientes</h2>

          {orderList.length === 0 ? (
            <div className="text-center py-12 text-[#555]">
              <p className="text-4xl mb-2">📋</p>
              <p className="text-sm">Aún no hay pedidos. ¡Compartí el menú!</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {orderList.map(order => (
                <div key={order.id} className="bg-[#1a1a1a] rounded-2xl border border-[#2a2a2a] p-4">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm">{order.order_ref}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${STATUS_COLORS[order.status] ?? 'bg-[#2a2a2a] text-[#888]'}`}>
                          {STATUS_LABELS[order.status] ?? order.status}
                        </span>
                      </div>
                      <p className="text-[#555] text-xs mt-0.5">{fmtFecha(order.created_at)}</p>
                    </div>
                    <span className="font-bold text-[#f5c518] flex-shrink-0">{fmtARS(order.total)}</span>
                  </div>

                  <div className="flex flex-col gap-1 mb-3">
                    {order.customer_name && <p className="text-sm"><span className="text-[#555]">Nombre:</span> {order.customer_name}</p>}
                    {order.customer_phone && <p className="text-sm"><span className="text-[#555]">Tel:</span> {order.customer_phone}</p>}
                    <p className="text-sm">
                      <span className="text-[#555]">Servicio:</span>{' '}
                      {order.delivery_type === 'domicilio' ? `🛵 Domicilio${order.address ? ` — ${order.address}` : ''}` : '📍 Retiro en local'}
                    </p>
                    <p className="text-sm"><span className="text-[#555]">Pago:</span> {order.payment_method === 'mercadopago' ? '💳 MercadoPago' : '💵 Efectivo'}</p>
                  </div>

                  {Array.isArray(order.items) && order.items.length > 0 && (
                    <div className="bg-[#111] rounded-xl p-3 mb-3 flex flex-col gap-1">
                      {(order.items as { name: string; quantity: number; price: number }[]).map((item, i) => (
                        <div key={i} className="flex justify-between text-xs text-[#aaa]">
                          <span>{item.quantity}× {item.name}</span>
                          <span>{fmtARS(item.price * item.quantity)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Estado selector */}
                  <div className="flex gap-2 flex-wrap">
                    {Object.entries(STATUS_LABELS).map(([val, label]) => (
                      <button
                        key={val}
                        onClick={() => updateStatus(order.id, val)}
                        className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                          order.status === val
                            ? 'bg-[#f5c518] text-black border-[#f5c518] font-bold'
                            : 'bg-transparent text-[#555] border-[#2a2a2a] hover:text-white'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
