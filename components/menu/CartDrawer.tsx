'use client'

import { ShoppingCart, Trash2, Plus, Minus } from 'lucide-react'
import { useCart } from '@/context/CartContext'
import { sendWhatsAppOrder } from '@/lib/whatsapp'
import { useState } from 'react'

function WAIcon() {
  return (
    <svg className="w-5 h-5 fill-current flex-shrink-0" viewBox="0 0 24 24">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}

function fmtARS(n: number) {
  return '$' + n.toLocaleString('es-AR')
}

interface CartDrawerProps {
  tenantId: string
  tenantName: string
  slug: string
  whatsappNumber: string
  onClose: () => void
  onCheckout: () => void
}

export function CartDrawer({ tenantId, whatsappNumber, onClose }: CartDrawerProps) {
  const { items, totalPrice, updateQuantity, removeItem } = useCart()
  const [sendingWA, setSendingWA] = useState(false)

  async function handleWhatsApp() {
    if (items.length === 0) return
    setSendingWA(true)
    try {
      await sendWhatsAppOrder({ tenantId, whatsappNumber, items, total: totalPrice })
    } finally {
      setSendingWA(false)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="relative bg-zinc-900 border-l border-zinc-800 w-full max-w-sm h-full flex flex-col shadow-2xl animate-slide-in-right">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 flex-shrink-0">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-yellow-400" />
            <h2 className="font-bold text-lg font-[family-name:var(--font-syne)]">Tu pedido</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors text-lg leading-none"
          >
            ×
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2.5">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-zinc-500">
              <ShoppingCart className="w-14 h-14 opacity-20" />
              <p className="text-sm">Tu carrito está vacío</p>
            </div>
          ) : (
            items.map(item => (
              <div
                key={item.product_id}
                className="flex items-center gap-3 bg-zinc-800 rounded-2xl p-3 border border-zinc-700/50"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-white truncate">{item.name}</p>
                  <p className="text-yellow-400 text-sm font-bold mt-0.5">
                    {fmtARS(item.price)} c/u
                  </p>
                </div>

                {/* Qty controls */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                    className="w-7 h-7 rounded-full border border-zinc-600 text-zinc-400 font-bold flex items-center justify-center hover:border-yellow-400/60 hover:text-yellow-400 active:scale-90 transition-all"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-5 text-center font-bold text-sm text-white">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                    className="w-7 h-7 rounded-full bg-yellow-400 text-black font-bold flex items-center justify-center hover:bg-amber-400 active:scale-90 transition-all"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                {/* Subtotal + delete */}
                <div className="flex flex-col items-end gap-1.5 flex-shrink-0 min-w-[60px]">
                  <span className="text-sm font-bold text-white">{fmtARS(item.price * item.quantity)}</span>
                  <button
                    onClick={() => removeItem(item.product_id)}
                    className="text-zinc-600 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="p-4 border-t border-zinc-800 flex flex-col gap-3 flex-shrink-0">
            <div className="flex justify-between items-center px-1">
              <span className="text-zinc-400 text-sm">Total</span>
              <span className="font-bold text-xl text-white">{fmtARS(totalPrice)}</span>
            </div>

            <button
              onClick={handleWhatsApp}
              disabled={sendingWA}
              className="w-full bg-[#25D366] hover:bg-[#1ebe5d] active:scale-[0.98] text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2.5 transition-all disabled:opacity-60"
            >
              <WAIcon />
              {sendingWA ? 'Abriendo WhatsApp...' : 'Pedir por WhatsApp'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
