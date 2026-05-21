'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface PendingOrder {
  items: { name: string; quantity: number; price: number }[]
  total: number
  tenantName: string
  waNumber: string
  tenantId: string
  slug: string
}

function fmtARS(n: number) {
  return '$' + n.toLocaleString('es-AR')
}

function sanitizePhone(raw: string): string {
  let n = raw.replace(/[\s\-\(\)\+]/g, '')
  if (n.startsWith('0054')) n = '54' + n.slice(4)
  if (n.startsWith('0')) n = '549' + n.slice(1)
  if (n.startsWith('54') && !n.startsWith('549')) n = '549' + n.slice(2)
  if (!n.startsWith('54') && n.length >= 8) n = '549' + n
  return n
}

interface Props {
  paymentId: string | null
  status: string | null
}

export default function SuccessView({ paymentId, status }: Props) {
  const [order, setOrder] = useState<PendingOrder | null>(null)

  useEffect(() => {
    try {
      const raw = localStorage.getItem('mp_pending_order')
      if (raw) {
        const parsed = JSON.parse(raw) as PendingOrder
        setOrder(parsed)
        // Clear cart and pending order
        localStorage.removeItem('mp_pending_order')
        localStorage.removeItem(`cart_${parsed.tenantId}`)
      }
    } catch {}
  }, [])

  const approved = status === 'approved'

  if (!approved) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] flex flex-col items-center justify-center px-4 text-white">
        <div className="w-full max-w-md text-center flex flex-col items-center gap-6">
          <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center text-5xl">❌</div>
          <div>
            <h1 className="text-2xl font-bold font-[family-name:var(--font-syne)]">Pago no completado</h1>
            <p className="text-zinc-500 mt-2 text-sm">
              {status === 'pending'
                ? 'Tu pago está pendiente de confirmación.'
                : 'El pago no pudo procesarse. Podés intentarlo de nuevo o pedir por WhatsApp.'}
            </p>
          </div>
          <Link
            href={order ? `/${order.slug}` : '/'}
            className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-4 rounded-2xl flex items-center justify-center transition-all"
          >
            ← Volver al menú
          </Link>
        </div>
      </div>
    )
  }

  const waMessage = order
    ? encodeURIComponent(
        `🍔 *Pedido ${order.tenantName}*\n` +
        `✅ *Pago confirmado por Mercado Pago*\n` +
        (paymentId ? `ID: ${paymentId}\n` : '') +
        `\n` +
        order.items.map(i => `• ${i.quantity}x ${i.name}  ${fmtARS(i.price * i.quantity)}`).join('\n') +
        `\n\n💰 Total: ${fmtARS(order.total)}`
      )
    : null

  const waUrl = order && waMessage
    ? `https://wa.me/${sanitizePhone(order.waNumber)}?text=${waMessage}`
    : null

  return (
    <div className="min-h-screen bg-[#0d0d0d] flex flex-col items-center justify-center px-4 text-white">
      <div className="w-full max-w-md flex flex-col gap-6">

        {/* Header */}
        <div className="text-center flex flex-col items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center text-5xl animate-bounce-once">
            ✅
          </div>
          <div>
            <h1 className="text-2xl font-bold font-[family-name:var(--font-syne)]">¡Pago confirmado!</h1>
            <p className="text-zinc-400 mt-1 text-sm">
              Tu pedido fue pagado exitosamente por Mercado Pago.
            </p>
            {paymentId && (
              <p className="text-zinc-600 text-xs mt-1">ID: {paymentId}</p>
            )}
          </div>
        </div>

        {/* Order summary */}
        {order && (
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-4 flex flex-col gap-3">
            <p className="text-[11px] uppercase tracking-wider text-zinc-500 font-medium">
              Resumen del pedido
            </p>
            <div className="flex flex-col gap-2">
              {order.items.map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-zinc-400">{item.quantity}× {item.name}</span>
                  <span className="text-white font-semibold">{fmtARS(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-[#2a2a2a] pt-2 flex justify-between font-bold">
              <span>Total</span>
              <span className="text-[#F5A623]">{fmtARS(order.total)}</span>
            </div>
          </div>
        )}

        {/* WA CTA */}
        {waUrl ? (
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-green-500 hover:bg-green-400 active:scale-[0.98] text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3 transition-all text-base"
          >
            <svg className="w-5 h-5 fill-current flex-shrink-0" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Avisar al local por WhatsApp
          </a>
        ) : (
          <Link
            href="/"
            className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-4 rounded-2xl flex items-center justify-center transition-all"
          >
            Volver al inicio
          </Link>
        )}

        {order && (
          <Link
            href={`/${order.slug}`}
            className="text-center text-zinc-600 text-sm hover:text-zinc-400 transition-colors"
          >
            Volver al menú
          </Link>
        )}
      </div>
    </div>
  )
}
