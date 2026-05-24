'use client'

import { useState, useEffect, useMemo } from 'react'
import { ChevronDown, ChevronUp, Search, X } from 'lucide-react'
import Link from 'next/link'
import { createSupabaseBrowser } from '@/lib/supabase'
import type { Order } from '@/types/supabase'

function fmtARS(n: number) { return '$ ' + n.toLocaleString('es-AR') }

function fmtFecha(iso: string) {
  return new Date(iso).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

function vibrate(pattern: number | number[]) {
  if (typeof window !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(pattern)
}

// ── Media query hook ─────────────────────────────────────────────────────────

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 640px)')
    setIsMobile(mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  return isMobile
}

// ── Status helpers ───────────────────────────────────────────────────────────

const STATUS_META: Record<string, { label: string; bg: string; color: string; border: string }> = {
  pending:    { label: 'Pendiente',   bg: 'rgba(245,158,11,0.12)',  color: '#f59e0b', border: 'rgba(245,158,11,0.3)' },
  nuevo:      { label: 'Nuevo',       bg: 'rgba(245,158,11,0.12)',  color: '#f59e0b', border: 'rgba(245,158,11,0.3)' },
  confirmed:  { label: 'Confirmado',  bg: 'rgba(59,130,246,0.12)',  color: '#60a5fa', border: 'rgba(59,130,246,0.3)' },
  preparando: { label: 'Preparando',  bg: 'rgba(59,130,246,0.12)',  color: '#60a5fa', border: 'rgba(59,130,246,0.3)' },
  ready:      { label: 'Listo',       bg: 'rgba(34,197,94,0.12)',   color: '#4ade80', border: 'rgba(34,197,94,0.3)' },
  listo:      { label: 'Listo',       bg: 'rgba(34,197,94,0.12)',   color: '#4ade80', border: 'rgba(34,197,94,0.3)' },
  delivered:  { label: 'Entregado',   bg: 'rgba(113,113,122,0.12)', color: '#a1a1aa', border: 'rgba(113,113,122,0.3)' },
  entregado:  { label: 'Entregado',   bg: 'rgba(113,113,122,0.12)', color: '#a1a1aa', border: 'rgba(113,113,122,0.3)' },
  cancelled:  { label: 'Cancelado',   bg: 'rgba(239,68,68,0.12)',   color: '#f87171', border: 'rgba(239,68,68,0.3)' },
}

const STATUS_FLOW = [
  { key: 'pending',   label: 'Pendiente' },
  { key: 'confirmed', label: 'Confirmado' },
  { key: 'ready',     label: 'Listo' },
  { key: 'delivered', label: 'Entregado' },
] as const

const FILTER_PILLS = [
  { key: 'all',       label: 'Todos' },
  { key: 'pending',   label: 'Pendientes' },
  { key: 'confirmed', label: 'Confirmados' },
  { key: 'ready',     label: 'Listos' },
  { key: 'delivered', label: 'Entregados' },
  { key: 'cancelled', label: 'Cancelados' },
] as const

type FilterKey = typeof FILTER_PILLS[number]['key']

function getStatusMeta(status: string) {
  return STATUS_META[status] ?? { label: status, bg: 'rgba(113,113,122,0.12)', color: '#a1a1aa', border: 'rgba(113,113,122,0.3)' }
}

function StatusBadge({ status }: { status: string }) {
  const meta = getStatusMeta(status)
  return (
    <span style={{
      display: 'inline-block', padding: '3px 9px', borderRadius: 999,
      fontSize: 11, fontWeight: 700,
      background: meta.bg, color: meta.color,
      border: `1px solid ${meta.border}`, whiteSpace: 'nowrap',
    }}>
      {meta.label}
    </span>
  )
}

function paymentLabel(method: string) {
  if (method === 'transfer') return '📲 Transfer'
  if (method === 'mercadopago') return '📲 MP'
  return '💵 Efectivo'
}

function deliveryLabel(type: string) {
  return (type === 'delivery' || type === 'domicilio') ? '🚚 Delivery' : '🏠 Retiro'
}

function matchesFilter(order: Order, filter: FilterKey): boolean {
  if (filter === 'all') return true
  const s = order.status
  if (filter === 'pending')   return s === 'pending' || s === 'nuevo'
  if (filter === 'confirmed') return s === 'confirmed' || s === 'preparando'
  if (filter === 'ready')     return s === 'ready' || s === 'listo'
  if (filter === 'delivered') return s === 'delivered' || s === 'entregado'
  if (filter === 'cancelled') return s === 'cancelled'
  return false
}

// ── Mobile card layout ────────────────────────────────────────────────────────

function MobileOrderCard({
  order, slug, isNew, onUpdateStatus,
}: {
  order: Order
  slug: string
  isNew: boolean
  onUpdateStatus: (id: string, status: string) => Promise<void>
}) {
  return (
    <div style={{
      background: isNew ? 'rgba(255,107,53,0.08)' : 'var(--dash-surface)',
      border: '1px solid var(--dash-border)',
      borderRadius: 14, padding: 16, marginBottom: 10,
      transition: 'background 1s ease',
    }}>
      {/* Row 1: ref + status */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Link
            href={`/${slug}/admin/pedidos/${order.order_ref ?? order.id}`}
            style={{ color: 'var(--accent)', fontWeight: 700, fontSize: 14, textDecoration: 'none', fontFamily: 'var(--font-mono, monospace)' }}
          >
            #{order.order_ref ?? order.id.slice(0, 6)}
          </Link>
          {isNew && (
            <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 999, fontWeight: 700, background: 'rgba(255,107,53,0.2)', color: '#ff6b35', border: '1px solid rgba(255,107,53,0.4)' }}>
              🔔 Nuevo
            </span>
          )}
        </div>
        <StatusBadge status={order.status} />
      </div>

      {/* Row 2: customer + delivery */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--dash-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '60%' }}>
          {order.customer_name ?? '—'}
        </span>
        <span style={{ fontSize: 12, color: 'var(--dash-muted)' }}>
          {deliveryLabel(order.delivery_type)}
        </span>
      </div>

      {/* Row 3: total + payment + time */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontWeight: 800, fontSize: 18, color: 'var(--accent)' }}>
          {fmtARS(order.total)}
        </span>
        <span style={{ fontSize: 12, color: 'var(--dash-muted)' }}>
          {paymentLabel(order.payment_method)} · {fmtFecha(order.created_at)}
        </span>
      </div>

      {/* Status pills — horizontal scroll */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
        {STATUS_FLOW.map(({ key, label }) => {
          const m = getStatusMeta(key)
          const isCurrent = order.status === key ||
            (key === 'pending' && order.status === 'nuevo') ||
            (key === 'confirmed' && order.status === 'preparando') ||
            (key === 'ready' && order.status === 'listo') ||
            (key === 'delivered' && order.status === 'entregado')
          return (
            <button
              key={key}
              onClick={() => { vibrate(40); onUpdateStatus(order.id, key) }}
              style={{
                flexShrink: 0, padding: '6px 14px', borderRadius: 999,
                fontSize: 12, fontWeight: 600, cursor: 'pointer',
                transition: 'all 0.15s', border: '1px solid',
                background: isCurrent ? m.bg : 'transparent',
                color: isCurrent ? m.color : 'var(--dash-muted)',
                borderColor: isCurrent ? m.border : 'var(--dash-border)',
                minHeight: 34,
                WebkitTapHighlightColor: 'transparent', userSelect: 'none',
              }}
            >
              {label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function OrdersTable({ initialOrders, slug, tenantId }: { initialOrders: Order[]; slug: string; tenantId: string }) {
  const [orders, setOrders] = useState(initialOrders)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [newOrderIds, setNewOrderIds] = useState<Set<string>>(new Set())
  const [filter, setFilter] = useState<FilterKey>('all')
  const [search, setSearch] = useState('')
  const isMobile = useIsMobile()

  useEffect(() => {
    const supabase = createSupabaseBrowser()
    const channel = supabase
      .channel(`orders:${tenantId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders', filter: `tenant_id=eq.${tenantId}` }, (payload) => {
        const incoming = payload.new as Order
        setOrders(prev => {
          if (prev.some(o => o.id === incoming.id)) return prev
          return [incoming, ...prev]
        })
        setNewOrderIds(prev => { const s = new Set(prev); s.add(incoming.id); return s })
        setTimeout(() => { setNewOrderIds(prev => { const s = new Set(prev); s.delete(incoming.id); return s }) }, 8000)
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [tenantId])

  async function updateStatus(orderId: string, status: string) {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o))
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error('Failed')
      vibrate(40)
    } catch {
      vibrate([50, 30, 50])
    }
  }

  const counts = useMemo(() => {
    const map: Record<string, number> = { all: orders.length }
    FILTER_PILLS.slice(1).forEach(({ key }) => { map[key] = orders.filter(o => matchesFilter(o, key)).length })
    return map
  }, [orders])

  const filtered = useMemo(() => {
    let list = orders.filter(o => matchesFilter(o, filter))
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(o => o.customer_name?.toLowerCase().includes(q) || o.order_ref?.toLowerCase().includes(q))
    }
    return list
  }, [orders, filter, search])

  return (
    <div style={{ background: 'var(--dash-surface)', border: '1px solid var(--dash-border)', borderRadius: 16, overflow: 'hidden' }}>

      {/* Header */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--dash-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--dash-text)' }}>
          Pedidos
          <span style={{ marginLeft: 8, fontSize: 12, fontWeight: 400, color: 'var(--dash-muted)' }}>{orders.length} en total</span>
        </h2>
        <div style={{ position: 'relative', minWidth: isMobile ? '100%' : 200 }}>
          <Search style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: 'var(--dash-muted)' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por cliente o ref..."
            style={{
              background: 'var(--dash-surface-2)', border: '1px solid var(--dash-border)',
              borderRadius: 8, paddingLeft: 30, paddingRight: search ? 30 : 10,
              paddingTop: 8, paddingBottom: 8,
              fontSize: 16, // prevent iOS zoom
              color: 'var(--dash-text)', outline: 'none', width: '100%',
            }}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--dash-muted)', display: 'flex', padding: 0, WebkitTapHighlightColor: 'transparent' }}>
              <X style={{ width: 12, height: 12 }} />
            </button>
          )}
        </div>
      </div>

      {/* Filter pills */}
      <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--dash-border)', display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none' }}>
        {FILTER_PILLS.map(pill => {
          const isActive = filter === pill.key
          return (
            <button
              key={pill.key}
              onClick={() => setFilter(pill.key)}
              style={{
                flexShrink: 0, padding: '5px 12px', borderRadius: 999,
                fontSize: isMobile ? 13 : 12, fontWeight: 600, border: '1px solid',
                cursor: 'pointer', transition: 'all 0.15s',
                background: isActive ? 'var(--accent)' : 'var(--dash-surface-2)',
                color: isActive ? '#fff' : 'var(--dash-muted)',
                borderColor: isActive ? 'var(--accent)' : 'var(--dash-border)',
                minHeight: isMobile ? 36 : 'auto',
                WebkitTapHighlightColor: 'transparent', userSelect: 'none',
              }}
            >
              {pill.label} ({counts[pill.key] ?? 0})
            </button>
          )
        })}
      </div>

      {/* Content */}
      {filtered.length === 0 ? (
        <div style={{ padding: '56px 20px', textAlign: 'center', color: 'var(--dash-muted)' }}>
          <p style={{ fontSize: 32, marginBottom: 8 }}>📋</p>
          <p style={{ fontSize: 14 }}>{search ? 'Sin resultados' : 'No hay pedidos en esta categoría'}</p>
        </div>
      ) : isMobile ? (
        // ── Mobile: cards ──
        <div style={{ padding: '12px 12px 4px' }}>
          {filtered.map(order => (
            <MobileOrderCard
              key={order.id}
              order={order}
              slug={slug}
              isNew={newOrderIds.has(order.id)}
              onUpdateStatus={updateStatus}
            />
          ))}
        </div>
      ) : (
        // ── Desktop: accordion rows ──
        <div>
          {filtered.map(order => {
            const isOpen = expanded === order.id
            const isNew = newOrderIds.has(order.id)

            return (
              <div
                key={order.id}
                style={{
                  background: isNew ? 'rgba(255,107,53,0.06)' : undefined,
                  borderBottom: '1px solid var(--dash-border)',
                  transition: 'background 1s ease',
                }}
              >
                <button
                  onClick={() => setExpanded(isOpen ? null : order.id)}
                  style={{
                    width: '100%', padding: '12px 20px', display: 'flex', alignItems: 'center',
                    gap: 12, background: 'none', border: 'none', cursor: 'pointer',
                    textAlign: 'left', transition: 'background 0.15s', WebkitTapHighlightColor: 'transparent',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--dash-surface-2)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <Link
                        href={`/${slug}/admin/pedidos/${order.order_ref ?? order.id}`}
                        style={{ color: 'var(--accent)', fontWeight: 600, fontSize: 13, textDecoration: 'none', fontFamily: 'var(--font-mono, monospace)' }}
                        onClick={e => e.stopPropagation()}
                      >
                        #{order.order_ref ?? order.id.slice(0, 6)}
                      </Link>
                      <StatusBadge status={order.status} />
                      {isNew && (
                        <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 999, fontWeight: 700, background: 'rgba(255,107,53,0.2)', color: '#ff6b35', border: '1px solid rgba(255,107,53,0.4)' }}>
                          🔔 Nuevo
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--dash-muted)', marginTop: 2 }}>
                      {order.customer_name ?? '—'} · {deliveryLabel(order.delivery_type)} · {paymentLabel(order.payment_method)} · {fmtFecha(order.created_at)}
                    </p>
                  </div>
                  <span style={{ fontWeight: 700, color: '#f59e0b', fontSize: 14, flexShrink: 0 }}>{fmtARS(order.total)}</span>
                  {isOpen
                    ? <ChevronUp style={{ width: 16, height: 16, color: 'var(--dash-muted)', flexShrink: 0 }} />
                    : <ChevronDown style={{ width: 16, height: 16, color: 'var(--dash-muted)', flexShrink: 0 }} />
                  }
                </button>

                {isOpen && (
                  <div style={{ padding: '0 20px 16px', background: 'rgba(0,0,0,0.15)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13, marginBottom: 12, paddingTop: 4 }}>
                      {order.customer_phone && <p><span style={{ color: 'var(--dash-muted)' }}>Tel:</span> <span style={{ color: 'var(--dash-text)' }}>{order.customer_phone}</span></p>}
                      {(order.customer_address ?? order.address) && <p><span style={{ color: 'var(--dash-muted)' }}>Dirección:</span> <span style={{ color: 'var(--dash-text)' }}>{order.customer_address ?? order.address}</span></p>}
                      {order.notes && <p><span style={{ color: 'var(--dash-muted)' }}>Notas:</span> <span style={{ color: 'var(--dash-text)' }}>{order.notes}</span></p>}
                    </div>

                    {Array.isArray(order.items) && order.items.length > 0 && (
                      <div style={{ background: 'var(--dash-surface)', borderRadius: 10, padding: 12, marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {(order.items as { name: string; quantity: number; price: number }[]).map((item, i) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--dash-muted)' }}>
                            <span>{item.quantity}× {item.name}</span>
                            <span>{fmtARS(item.price * item.quantity)}</span>
                          </div>
                        ))}
                        <div style={{ borderTop: '1px solid var(--dash-border)', paddingTop: 6, display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700, color: 'var(--dash-text)' }}>
                          <span>Total</span>
                          <span style={{ color: '#f59e0b' }}>{fmtARS(order.total)}</span>
                        </div>
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {STATUS_FLOW.map(({ key, label }) => {
                        const m = getStatusMeta(key)
                        const isCurrent = order.status === key ||
                          (key === 'pending' && order.status === 'nuevo') ||
                          (key === 'confirmed' && order.status === 'preparando') ||
                          (key === 'ready' && order.status === 'listo') ||
                          (key === 'delivered' && order.status === 'entregado')
                        return (
                          <button
                            key={key}
                            onClick={() => { vibrate(40); updateStatus(order.id, key) }}
                            style={{
                              padding: '5px 12px', borderRadius: 999, fontSize: 12, fontWeight: 600,
                              cursor: 'pointer', transition: 'all 0.15s', border: '1px solid',
                              background: isCurrent ? m.bg : 'transparent',
                              color: isCurrent ? m.color : 'var(--dash-muted)',
                              borderColor: isCurrent ? m.border : 'var(--dash-border)',
                              WebkitTapHighlightColor: 'transparent', userSelect: 'none',
                            }}
                          >
                            {label}
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
