'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import Link from 'next/link'
import { createSupabaseBrowser } from '@/lib/supabase'
const supabase = createSupabaseBrowser()
import type { Order } from '@/types/supabase'

function fmtARS(n: number) {
  return '$ ' + n.toLocaleString('es-AR')
}

function fmtFecha(iso: string) {
  return new Date(iso).toLocaleString('es-AR', {
    day: '2-digit', month: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
}

const STATUS_META: Record<string, { label: string; color: string }> = {
  nuevo:      { label: 'Nuevo',          color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  preparando: { label: 'En preparación', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  listo:      { label: 'Listo',          color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  entregado:  { label: 'Entregado',      color: 'bg-zinc-500/20 text-zinc-400 border-zinc-700' },
  // legacy
  pending:   { label: 'Pendiente',   color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  confirmed: { label: 'Confirmado',  color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  delivered: { label: 'Entregado',   color: 'bg-zinc-500/20 text-zinc-400 border-zinc-700' },
  cancelled: { label: 'Cancelado',   color: 'bg-red-500/20 text-red-400 border-red-500/30' },
}

const STATUS_FLOW = ['nuevo', 'preparando', 'listo', 'entregado'] as const

export function OrdersTable({ initialOrders, slug }: { initialOrders: Order[]; slug: string }) {
  const [orders, setOrders] = useState(initialOrders)
  const [expanded, setExpanded] = useState<string | null>(null)

  async function updateStatus(orderId: string, status: string) {
    await supabase.from('orders').update({ status }).eq('id', orderId)
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o))
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
        <h2 className="font-bold font-[family-name:var(--font-syne)]">Pedidos recientes</h2>
        <span className="text-xs text-zinc-500">{orders.length} pedidos</span>
      </div>

      {orders.length === 0 ? (
        <div className="py-14 text-center">
          <p className="text-3xl mb-2">📋</p>
          <p className="text-sm text-zinc-500">Aún no hay pedidos. ¡Compartí el menú!</p>
        </div>
      ) : (
        <div className="divide-y divide-zinc-800/70">
          {orders.map(order => {
            const meta = STATUS_META[order.status] ?? { label: order.status, color: 'bg-zinc-800 text-zinc-400 border-zinc-700' }
            const isOpen = expanded === order.id

            return (
              <div key={order.id}>
                <button
                  onClick={() => setExpanded(isOpen ? null : order.id)}
                  className="w-full px-5 py-3.5 flex items-center gap-3 hover:bg-zinc-800/40 transition-colors text-left"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        href={`/${slug}/admin/pedidos/${order.order_ref}`}
                        className="font-semibold text-sm hover:underline"
                        style={{ color: 'var(--accent)' }}
                        onClick={e => e.stopPropagation()}
                      >
                        #{order.order_ref ?? order.id.slice(0, 6)} →
                      </Link>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${meta.color}`}>
                        {meta.label}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {order.customer_name} · {fmtFecha(order.created_at)}
                    </p>
                  </div>
                  <span className="font-bold text-yellow-400 text-sm flex-shrink-0">{fmtARS(order.total)}</span>
                  {isOpen
                    ? <ChevronUp className="w-4 h-4 text-zinc-500 flex-shrink-0" />
                    : <ChevronDown className="w-4 h-4 text-zinc-500 flex-shrink-0" />
                  }
                </button>

                {isOpen && (
                  <div className="px-5 pb-4 bg-zinc-800/20">
                    <div className="flex flex-col gap-1 text-sm mb-3 pt-1">
                      {order.customer_phone && (
                        <p><span className="text-zinc-500">Tel:</span> <span className="text-zinc-200">{order.customer_phone}</span></p>
                      )}
                      <p>
                        <span className="text-zinc-500">Servicio:</span>{' '}
                        <span className="text-zinc-200">
                          {order.delivery_type === 'domicilio'
                            ? `🛵 Domicilio${order.address ? ` — ${order.address}` : ''}`
                            : '📍 Retiro en local'}
                        </span>
                      </p>
                      <p>
                        <span className="text-zinc-500">Pago:</span>{' '}
                        <span className="text-zinc-200">
                          {order.payment_method === 'mercadopago' ? '💳 MercadoPago' : '💵 Efectivo'}
                        </span>
                      </p>
                    </div>

                    {Array.isArray(order.items) && order.items.length > 0 && (
                      <div className="bg-zinc-900 rounded-xl p-3 mb-3 flex flex-col gap-1.5">
                        {(order.items as { name: string; quantity: number; price: number }[]).map((item, i) => (
                          <div key={i} className="flex justify-between text-xs text-zinc-400">
                            <span>{item.quantity}× {item.name}</span>
                            <span>{fmtARS(item.price * item.quantity)}</span>
                          </div>
                        ))}
                        <div className="border-t border-zinc-800 pt-1.5 flex justify-between text-xs font-semibold text-white">
                          <span>Total</span>
                          <span className="text-yellow-400">{fmtARS(order.total)}</span>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2 flex-wrap">
                      {STATUS_FLOW.map(s => {
                        const m = STATUS_META[s]
                        return (
                          <button
                            key={s}
                            onClick={() => updateStatus(order.id, s)}
                            className={`text-xs px-3 py-1.5 rounded-full border transition-all font-medium ${
                              order.status === s
                                ? `${m.color} font-bold`
                                : 'bg-transparent text-zinc-500 border-zinc-700 hover:text-white hover:border-zinc-500'
                            }`}
                          >
                            {m.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
