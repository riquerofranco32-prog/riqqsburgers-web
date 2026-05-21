'use client'

import { useState, useCallback } from 'react'
import Image from 'next/image'
import { MENU, CATEGORIAS, RESTAURANT_NAME, SLOGAN, INSTAGRAM, type MenuItem, type CartItem } from '@/data/menu'
import { CheckoutModal } from '@/components/CheckoutModal'

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return '$' + n.toLocaleString('es-AR')
}

// ── Logo animado ──────────────────────────────────────────────────────────────

function AnimatedLogo() {
  return (
    <div className="relative w-24 h-24 flex-shrink-0">
      {/* Spinning gradient ring */}
      <div
        className="absolute inset-[-3px] rounded-full animate-spin-slow"
        style={{
          background: 'conic-gradient(from 0deg, #F5A623 0%, #FF6B35 30%, transparent 55%, transparent 70%, #F5A623 100%)',
        }}
      />
      {/* Dark gap between ring and logo */}
      <div className="absolute inset-0 rounded-full bg-[#0d0d0d] m-[2px] overflow-hidden z-10 flex items-center justify-center">
        <Image
          src="/logo.png"
          alt={RESTAURANT_NAME}
          width={88}
          height={88}
          className="object-cover w-full h-full"
          priority
        />
      </div>
    </div>
  )
}

// ── Instagram icon ────────────────────────────────────────────────────────────

function IGIcon() {
  return (
    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
    </svg>
  )
}

// ── WhatsApp icon ─────────────────────────────────────────────────────────────

function WAIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={`fill-current ${className}`} viewBox="0 0 24 24">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  )
}

// ── Item Card ─────────────────────────────────────────────────────────────────

const CATEGORY_EMOJI: Record<string, string> = {
  Burgers: '🍔', Promos: '🔥', Bebidas: '🥤',
}

function ItemCard({ item, cantidad, onAgregar, onQuitar }: {
  item: MenuItem
  cantidad: number
  onAgregar: () => void
  onQuitar: () => void
}) {
  return (
    <div className="card-hover relative bg-[#1a1a1a] rounded-2xl border border-[#2a2a2a] flex flex-col overflow-hidden">

      {/* Badge */}
      {item.tag && (
        <span className="absolute top-2 right-2 z-10 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F5A623] text-black leading-tight">
          {item.tag.replace(/^[^ ]+ /, '')}
        </span>
      )}

      {/* Image zone */}
      <div className="bg-[#111] flex items-center justify-center overflow-hidden h-32 relative">
        {item.imagen ? (
          <Image
            src={item.imagen}
            alt={item.nombre}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 50vw, 33vw"
          />
        ) : (
          <span className="text-[3.5rem] select-none">{CATEGORY_EMOJI[item.categoria]}</span>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col gap-2 p-3 flex-1">
        <div className="flex-1">
          <h3 className="font-bold text-white text-sm leading-snug font-[family-name:var(--font-syne)]">
            {item.nombre}
          </h3>
          {item.descripcion && (
            <p className="text-[#888] text-[11px] mt-1 leading-relaxed line-clamp-2">
              {item.descripcion}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between mt-1">
          <span className="font-bold text-[#F5A623] text-[1.05rem]">{fmt(item.precio)}</span>

          {cantidad === 0 ? (
            <button
              onClick={onAgregar}
              className="bg-[#F5A623] text-black text-xs font-bold px-3 py-1.5 rounded-full hover:bg-amber-400 active:scale-95 transition-all min-h-[36px]"
            >
              + Agregar
            </button>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                onClick={onQuitar}
                className="w-8 h-8 rounded-full border border-[#F5A623]/50 text-[#F5A623] font-bold flex items-center justify-center hover:bg-[#F5A623]/10 active:scale-90 transition-all text-base leading-none"
              >
                −
              </button>
              <span className="font-bold text-white w-4 text-center text-sm">{cantidad}</span>
              <button
                onClick={onAgregar}
                className="w-8 h-8 rounded-full bg-[#F5A623] text-black font-bold flex items-center justify-center hover:bg-amber-400 active:scale-90 transition-all text-base leading-none"
              >
                +
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Cart Drawer ───────────────────────────────────────────────────────────────

function CartDrawer({ cart, onQuitar, onAgregar, onClose, onPedir }: {
  cart: CartItem[]
  onQuitar: (id: number) => void
  onAgregar: (item: MenuItem) => void
  onClose: () => void
  onPedir: () => void
}) {
  const total = cart.reduce((acc, c) => acc + c.item.precio * c.cantidad, 0)

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#111] w-full max-w-sm h-full flex flex-col shadow-2xl border-l border-[#2a2a2a]">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#2a2a2a]">
          <h2 className="font-bold text-lg font-[family-name:var(--font-syne)]">Tu pedido</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-[#1a1a1a] flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#2a2a2a] transition-colors text-lg leading-none">×</button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-[#888]">
              <span className="text-6xl opacity-50">🛒</span>
              <p className="text-sm">Tu carrito está vacío</p>
            </div>
          ) : cart.map(c => (
            <div key={c.item.id} className="flex items-center gap-3 bg-[#1a1a1a] rounded-xl p-3 border border-[#2a2a2a]">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{c.item.nombre}</p>
                <p className="text-[#F5A623] text-sm font-bold">{fmt(c.item.precio * c.cantidad)}</p>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button onClick={() => onQuitar(c.item.id)} className="w-7 h-7 rounded-full border border-[#333] text-[#888] font-bold flex items-center justify-center hover:border-[#F5A623] hover:text-[#F5A623] active:scale-90 transition-all leading-none">−</button>
                <span className="w-4 text-center font-bold text-sm">{c.cantidad}</span>
                <button onClick={() => onAgregar(c.item)} className="w-7 h-7 rounded-full bg-[#F5A623] text-black font-bold flex items-center justify-center hover:bg-amber-400 active:scale-90 transition-all leading-none">+</button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div className="p-4 border-t border-[#2a2a2a] flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <span className="text-[#888] text-sm">Total estimado</span>
              <span className="font-bold text-xl text-white">{fmt(total)}</span>
            </div>
            <button
              onClick={onPedir}
              className="w-full bg-[#25D366] text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 hover:bg-[#20c15e] active:scale-[0.98] transition-all"
            >
              <WAIcon />
              Enviar pedido por WhatsApp
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function Home() {
  const [cart, setCart] = useState<CartItem[]>([])
  const [categoriaActiva, setCategoriaActiva] = useState<string>('Burgers')
  const [gridKey, setGridKey] = useState(0)
  const [showCart, setShowCart] = useState(false)
  const [showCheckout, setShowCheckout] = useState(false)

  const itemsFiltrados = MENU.filter(i => i.categoria === categoriaActiva)
  const totalItems = cart.reduce((acc, c) => acc + c.cantidad, 0)
  const totalPrecio = cart.reduce((acc, c) => acc + c.item.precio * c.cantidad, 0)

  const agregar = useCallback((item: MenuItem) => {
    setCart(prev => {
      const found = prev.find(c => c.item.id === item.id)
      if (found) return prev.map(c => c.item.id === item.id ? { ...c, cantidad: c.cantidad + 1 } : c)
      return [...prev, { item, cantidad: 1 }]
    })
  }, [])

  const quitar = useCallback((id: number) => {
    setCart(prev => {
      const found = prev.find(c => c.item.id === id)
      if (!found) return prev
      if (found.cantidad === 1) return prev.filter(c => c.item.id !== id)
      return prev.map(c => c.item.id === id ? { ...c, cantidad: c.cantidad - 1 } : c)
    })
  }, [])

  function cambiarCategoria(cat: string) {
    if (cat === categoriaActiva) return
    setCategoriaActiva(cat)
    setGridKey(k => k + 1)
  }

  function abrirCheckout() {
    setShowCart(false)
    setShowCheckout(true)
  }

  return (
    <div className="min-h-screen bg-[#0d0d0d] pb-36">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="flex flex-col items-center gap-4 pt-10 pb-7 px-4 text-center relative">
        {/* Subtle radial glow behind logo */}
        <div className="absolute top-8 left-1/2 -translate-x-1/2 w-40 h-40 rounded-full bg-[#F5A623]/5 blur-3xl pointer-events-none" />

        <AnimatedLogo />

        <div className="flex flex-col items-center gap-1">
          <h1 className="text-3xl font-extrabold tracking-tight font-[family-name:var(--font-syne)]">
            {RESTAURANT_NAME}
          </h1>
          <p className="text-[#888] text-sm">{SLOGAN} 🍔</p>
        </div>

        <a
          href={`https://instagram.com/${INSTAGRAM}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs text-[#888] hover:text-[#F5A623] transition-colors duration-200 group"
        >
          <IGIcon />
          <span>@{INSTAGRAM}</span>
        </a>
      </header>

      {/* ── Divider ─────────────────────────────────────────────────────────── */}
      <div className="h-px bg-gradient-to-r from-transparent via-[#2a2a2a] to-transparent mx-6 mb-0" />

      {/* ── Category Tabs ───────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-30 bg-[#0d0d0d]/95 backdrop-blur-md border-b border-[#1a1a1a] px-4 py-3.5">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide max-w-lg mx-auto">
          {CATEGORIAS.map(cat => {
            const isActive = cat === categoriaActiva
            return (
              <button
                key={cat}
                onClick={() => cambiarCategoria(cat)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold transition-all duration-200 border min-h-[40px] ${
                  isActive
                    ? 'bg-[#F5A623] text-black border-[#F5A623] shadow-brand-sm'
                    : 'tab-inactive bg-transparent text-[#888] border-[#2a2a2a] hover:text-white'
                }`}
              >
                <span className="text-base leading-none">{CATEGORY_EMOJI[cat]}</span>
                {cat}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Menu Grid ───────────────────────────────────────────────────────── */}
      <main className="max-w-lg mx-auto px-4 pt-5">
        <div
          key={gridKey}
          className="grid grid-cols-2 md:grid-cols-3 gap-3 menu-grid-enter"
        >
          {itemsFiltrados.map(item => (
            <ItemCard
              key={item.id}
              item={item}
              cantidad={cart.find(c => c.item.id === item.id)?.cantidad ?? 0}
              onAgregar={() => agregar(item)}
              onQuitar={() => quitar(item.id)}
            />
          ))}
        </div>
      </main>

      {/* ── Sticky Cart Bar ─────────────────────────────────────────────────── */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-40 transition-all duration-300 ease-out ${
          totalItems > 0 ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'
        }`}
      >
        {/* Golden top border */}
        <div className="h-px bg-gradient-to-r from-transparent via-[#F5A623]/60 to-transparent" />

        <div className="bg-[#0d0d0d]/95 backdrop-blur-xl px-4 py-3 flex items-center gap-3 max-w-lg mx-auto">
          {/* Items badge + info */}
          <button
            onClick={() => setShowCart(true)}
            className="flex items-center gap-2.5 flex-1 min-w-0"
          >
            <span className="flex-shrink-0 bg-[#F5A623] text-black font-black text-xs rounded-full w-6 h-6 flex items-center justify-center">
              {totalItems}
            </span>
            <span className="text-[#888] text-xs truncate">
              {cart.map(c => c.item.nombre.split(' ')[0]).join(', ')}
            </span>
            <span className="font-bold text-white flex-shrink-0 ml-auto">{fmt(totalPrecio)}</span>
          </button>

          {/* Checkout Button */}
          <button
            onClick={abrirCheckout}
            className="flex-shrink-0 bg-[#f5c518] text-black font-bold py-2.5 px-4 rounded-xl flex items-center gap-1.5 hover:bg-amber-400 active:scale-95 transition-all text-sm min-h-[44px]"
          >
            Confirmar
          </button>
        </div>

        {/* Safe area */}
        <div className="bg-[#0d0d0d]/95 h-safe-bottom" />
      </div>

      {/* ── Cart Drawer ──────────────────────────────────────────────────────── */}
      {showCart && (
        <CartDrawer
          cart={cart}
          onQuitar={quitar}
          onAgregar={agregar}
          onClose={() => setShowCart(false)}
          onPedir={abrirCheckout}
        />
      )}

      {showCheckout && (
        <CheckoutModal
          cart={cart}
          onClose={() => setShowCheckout(false)}
        />
      )}
    </div>
  )
}
