'use client'

import { ShoppingCart } from 'lucide-react'
import { useCart } from '@/context/CartContext'

interface CartButtonProps {
  onClick: () => void
  accentColor?: string
}

function fmtARS(n: number) {
  return '$' + n.toLocaleString('es-AR')
}

export function CartButton({ onClick, accentColor = '#FACC15' }: CartButtonProps) {
  const { totalItems, totalPrice } = useCart()

  if (totalItems === 0) return null

  return (
    <div className="fixed bottom-6 right-4 z-40">
      <button
        onClick={onClick}
        className="flex items-center gap-3 rounded-2xl shadow-2xl px-4 py-3 text-black font-bold active:scale-95 transition-all"
        style={{ backgroundColor: accentColor }}
      >
        <div className="relative">
          <ShoppingCart className="w-5 h-5" />
          <span className="absolute -top-2 -right-2 bg-black text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center leading-none">
            {totalItems > 9 ? '9+' : totalItems}
          </span>
        </div>
        <span className="text-sm font-bold">{fmtARS(totalPrice)}</span>
      </button>
    </div>
  )
}
