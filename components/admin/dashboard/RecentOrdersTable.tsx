'use client'

import { useState, useEffect } from 'react'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { createSupabaseBrowser } from '@/lib/supabase'
import type { Order } from '@/types/supabase'

function fmtARS(n: number) {
  return '$' + n.toLocaleString('es-AR')
}

function fmtHora(iso: string) {
  return new Date(iso).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
}

const STATUS_BADGE: Record<string, { label: string; bg: string; color: string }> = {
  pending:    { label: 'Pendiente',   bg: 'rgba(245,158,11,0.12)',  color: '#f59e0b' },
  nuevo:      { label: 'Nuevo',       bg: 'rgba(245,158,11,0.12)',  color: '#f59e0b' },
  confirmed:  { label: 'Confirmado',  bg: 'rgba(59,130,246,0.12)',  color: '#60a5fa' },
  preparando: { label: 'Preparando',  bg: 'rgba(59,130,246,0.12)',  color: '#60a5fa' },
  ready:      { label: 'Listo',       bg: 'rgba(34,197,94,0.12)',   color: '#4ade80' },
  listo:      { label: 'Listo',       bg: 'rgba(34,197,94,0.12)',   color: '#4ade80' },
  delivered:  { label: 'Entregado',   bg: 'rgba(113,113,122,0.15)', color: '#a1a1aa' },
  entregado:  { label: 'Entregado',   bg: 'rgba(113,113,122,0.15)', color: '#a1a1aa' },
  cancelled:  { label: 'Cancelado',   bg: 'rgba(239,68,68,0.12)',   color: '#f87171' },
}

function StatusBadge({ status }: { status: string }) {
  const meta = STATUS_BADGE[status] ?? { label: status, bg: 'rgba(113,113,122,0.12)', color: '#a1a1aa' }
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 8px',
      borderRadius: 999,
      fontSize: 11,
      fontWeight: 600,
      background: meta.bg,
      color: meta.color,
      whiteSpace: 'nowrap',
    }}>
      {meta.label}
    </span>
  )
}

function deliveryLabel(type: string) {
  const isDelivery = type === 'delivery' || type === 'domicilio'
  return isDelivery ? '🚚 Delivery' : '🏠 Retiro'
}

function paymentLabel(method: string) {
  if (method === 'mercadopago') return '📲 MP'
  if (method === 'transfer') return '📲 Transfer'
  return '💵 Efectivo'
}

interface RecentOrdersTableProps {
  orders: Order[]
  slug: string
  tenantId: string
  loading?: boolean
  maxRows?: number
}

export function RecentOrdersTable({ orders: initialOrders, slug, tenantId, loading = false, maxRows = 10 }: RecentOrdersTableProps) {
  const [orders, setOrders] = useState(initialOrders)

  useEffect(() => {
    setOrders(initialOrders)
  }, [initialOrders])

  useEffect(() => {
    const supabase = createSupabaseBrowser()
    const channel = supabase
      .channel(`recent-orders:${tenantId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders', filter: `tenant_id=eq.${tenantId}` },
        (payload) => {
          const incoming = payload.new as Order
          setOrders(prev => {
            if (prev.some(o => o.id === incoming.id)) return prev
            return [incoming, ...prev].slice(0, 10)
          })
          toast.success(`Nuevo pedido #${incoming.order_ref} 🛒`, { duration: 5000 })
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [tenantId])

  if (loading) {
    return (
      <div className="bg-dash-surface border border-dash-border rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-dash-border flex items-center justify-between">
          <div className="h-3 w-36 bg-dash-surface-2 rounded animate-pulse" />
          <div className="h-3 w-16 bg-dash-surface-2 rounded animate-pulse" />
        </div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="px-5 py-3.5 border-b border-dash-border/40 flex items-center gap-4">
            <div className="h-2.5 w-14 bg-dash-surface-2 rounded animate-pulse" />
            <div className="h-2.5 flex-1 bg-dash-surface-2 rounded animate-pulse" />
            <div className="h-6 w-20 bg-dash-surface-2 rounded-full animate-pulse" />
          </div>
        ))}
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <div className="bg-dash-surface border border-dash-border rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-dash-border">
          <h2 className="text-sm font-semibold text-dash-text">Pedidos recientes</h2>
        </div>
        <div className="py-16 flex flex-col items-center gap-3 text-dash-muted">
          <span className="text-5xl">📋</span>
          <p className="text-sm">Aún no hay pedidos hoy</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-dash-surface border border-dash-border rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-dash-border flex items-center justify-between">
        <h2 className="text-sm font-semibold text-dash-text">Pedidos recientes</h2>
        <Link
          href={`/${slug}/admin/pedidos`}
          className="flex items-center gap-1 text-xs text-dash-muted hover:text-accent transition-colors duration-150"
        >
          Ver todos <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[620px]">
          <thead>
            <tr className="border-b border-dash-border/50">
              {['#', 'Hora', 'Cliente', 'Tipo', 'Pago', 'Total', 'Estado'].map((h, i) => (
                <th
                  key={h}
                  className={`py-2.5 text-[11px] uppercase tracking-wider text-dash-muted font-medium
                    ${i === 0 ? 'pl-5 pr-3 text-left' : i === 6 ? 'pl-3 pr-5 text-right' : 'px-3 text-left'}
                    ${i === 5 ? 'text-right' : ''}`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {orders.slice(0, maxRows).map((order, idx) => (
              <tr
                key={order.id}
                className="transition-colors duration-150"
                style={{
                  borderBottom: idx < Math.min(orders.length, maxRows) - 1 ? '1px solid var(--dash-border)' : undefined,
                  cursor: 'default',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--dash-surface-2)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <td className="pl-5 pr-3 py-3 text-xs font-mono">
                  <Link
                    href={`/${slug}/admin/pedidos/${order.order_ref ?? order.id}`}
                    style={{ color: 'var(--accent)', textDecoration: 'none' }}
                    className="hover:underline"
                  >
                    #{order.order_ref ?? order.id.slice(0, 6)}
                  </Link>
                </td>
                <td className="px-3 py-3 text-xs text-dash-muted tabular-nums">
                  {fmtHora(order.created_at)}
                </td>
                <td className="px-3 py-3 text-xs text-dash-text max-w-[120px] truncate">
                  {order.customer_name ?? '—'}
                </td>
                <td className="px-3 py-3 text-xs text-dash-muted whitespace-nowrap">
                  {deliveryLabel(order.delivery_type)}
                </td>
                <td className="px-3 py-3 text-xs text-dash-muted whitespace-nowrap">
                  {paymentLabel(order.payment_method)}
                </td>
                <td className="px-3 py-3 text-xs font-mono text-right text-dash-text">
                  {fmtARS(order.total)}
                </td>
                <td className="pl-3 pr-5 py-3 text-right">
                  <StatusBadge status={order.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {orders.length > maxRows && (
        <div style={{ borderTop: '1px solid var(--dash-border)', padding: '10px 20px' }}>
          <Link
            href={`/${slug}/admin/pedidos`}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, fontSize: 13, color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}
          >
            Ver todos los pedidos <ArrowRight style={{ width: 14, height: 14 }} />
          </Link>
        </div>
      )}
    </div>
  )
}
