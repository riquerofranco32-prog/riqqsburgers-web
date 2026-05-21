'use client'

import { useState } from 'react'
import { ChevronDown, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import type { Order } from '@/types/supabase'

function fmtARS(n: number) {
  return '$' + n.toLocaleString('es-AR')
}

function fmtHora(iso: string) {
  return new Date(iso).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
}

type StatusOption = {
  value: string
  label: string
  badge: string
}

const STATUS_OPTIONS: StatusOption[] = [
  { value: 'nuevo',      label: 'Nuevo',      badge: 'bg-yellow-500/20 text-yellow-400' },
  { value: 'preparando', label: 'Preparando', badge: 'bg-blue-500/20 text-blue-400' },
  { value: 'listo',      label: 'Listo',      badge: 'bg-green-500/20 text-green-400' },
  { value: 'entregado',  label: 'Entregado',  badge: 'bg-green-500/20 text-green-400' },
  { value: 'cancelled',  label: 'Cancelado',  badge: 'bg-red-500/20 text-red-400' },
  // legacy compat
  { value: 'pending',    label: 'Pendiente',  badge: 'bg-yellow-500/20 text-yellow-400' },
  { value: 'confirmed',  label: 'Confirmado', badge: 'bg-blue-500/20 text-blue-400' },
  { value: 'delivered',  label: 'Entregado',  badge: 'bg-green-500/20 text-green-400' },
]

function getStatusMeta(status: string): StatusOption {
  return STATUS_OPTIONS.find(s => s.value === status) ?? {
    value: status, label: status, badge: 'bg-zinc-800 text-zinc-500',
  }
}

function StatusDropdown({ orderId, currentStatus }: { orderId: string; currentStatus: string }) {
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState(currentStatus)
  const [busy, setBusy] = useState(false)
  const meta = getStatusMeta(status)
  const flowOptions = STATUS_OPTIONS.slice(0, 5)

  async function handleChange(next: string) {
    setOpen(false)
    if (next === status) return
    const prev = status
    setStatus(next)
    setBusy(true)
    try {
      const { error } = await supabase.from('orders').update({ status: next }).eq('id', orderId)
      if (error) throw error
      toast.success('Estado actualizado')
    } catch {
      setStatus(prev)
      toast.error('Error al actualizar')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen(v => !v)}
        disabled={busy}
        className={`flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full transition-colors duration-150 ${meta.badge} disabled:opacity-50 hover:opacity-80`}
      >
        {meta.label}
        <ChevronDown className={`w-3 h-3 transition-transform duration-150 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-8 z-20 bg-zinc-800 border border-zinc-700 rounded-xl shadow-2xl overflow-hidden min-w-[140px]">
            {flowOptions.map(opt => (
              <button
                key={opt.value}
                onClick={() => handleChange(opt.value)}
                className={`w-full text-left px-3 py-2.5 text-xs font-medium transition-colors duration-150 hover:bg-zinc-700 ${opt.value === status ? 'text-yellow-400' : 'text-zinc-300'}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

interface RecentOrdersTableProps {
  orders: Order[]
  slug: string
  loading?: boolean
}

export function RecentOrdersTable({ orders, slug, loading = false }: RecentOrdersTableProps) {
  if (loading) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
          <div className="h-3 w-36 bg-zinc-800 rounded animate-pulse" />
          <div className="h-3 w-16 bg-zinc-800 rounded animate-pulse" />
        </div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="px-5 py-3.5 border-b border-zinc-800/40 flex items-center gap-4">
            <div className="h-2.5 w-14 bg-zinc-800 rounded animate-pulse" />
            <div className="h-2.5 w-12 bg-zinc-800 rounded animate-pulse" />
            <div className="h-2.5 flex-1 bg-zinc-800 rounded animate-pulse" />
            <div className="h-2.5 w-18 bg-zinc-800 rounded animate-pulse" />
            <div className="h-6 w-20 bg-zinc-800 rounded-full animate-pulse" />
          </div>
        ))}
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-800">
          <h2 className="text-sm font-semibold text-zinc-200">Pedidos recientes</h2>
        </div>
        <div className="py-16 flex flex-col items-center gap-3 text-zinc-600">
          <span className="text-5xl">📋</span>
          <p className="text-sm">Aún no hay pedidos hoy</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-200">Pedidos recientes</h2>
        <Link
          href={`/${slug}/admin/pedidos`}
          className="flex items-center gap-1 text-xs text-zinc-500 hover:text-yellow-400 transition-colors duration-150"
        >
          Ver todos <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px]">
          <thead>
            <tr className="border-b border-zinc-800/50">
              {['#', 'Hora', 'Items', 'Total', 'Estado'].map((h, i) => (
                <th
                  key={h}
                  className={`py-2.5 text-[11px] uppercase tracking-wider text-zinc-500 font-medium ${i === 0 ? 'pl-5 pr-3 text-left' : i === 4 ? 'pl-3 pr-5 text-right' : 'px-3 text-left'} ${i === 3 ? 'text-right' : ''}`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/40">
            {orders.slice(0, 10).map(order => {
              const items = order.items as { name: string; quantity: number }[]
              const summary = items
                .slice(0, 2)
                .map(i => `${i.quantity}× ${i.name.split(' ')[0]}`)
                .join(', ') + (items.length > 2 ? ` +${items.length - 2}` : '')

              return (
                <tr
                  key={order.id}
                  className="hover:bg-zinc-800/30 transition-colors duration-150"
                >
                  <td className="pl-5 pr-3 py-3 text-xs font-mono text-zinc-400">
                    {order.order_ref ?? order.id.slice(0, 8)}
                  </td>
                  <td className="px-3 py-3 text-xs text-zinc-500 tabular-nums">
                    {fmtHora(order.created_at)}
                  </td>
                  <td className="px-3 py-3 text-xs text-zinc-300 max-w-[200px] truncate">
                    {summary}
                  </td>
                  <td className="px-3 py-3 text-xs font-mono text-right text-zinc-200">
                    {fmtARS(order.total)}
                  </td>
                  <td className="pl-3 pr-5 py-3 text-right">
                    <StatusDropdown orderId={order.id} currentStatus={order.status} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
