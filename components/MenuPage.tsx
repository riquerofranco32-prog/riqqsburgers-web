'use client'

import { useState, useCallback } from 'react'
import Image from 'next/image'
import type { Tenant, Category, Product } from '@/types/supabase'
import { CheckoutModal } from '@/components/CheckoutModal'

// ── Types ─────────────────────────────────────────────────────────────────────

export type CartItem = { product: Product; cantidad: number }

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return '$' + n.toLocaleString('es-AR')
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function IGIcon() {
  return (
    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
    </svg>
  )
}

function WAIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={`fill-current ${className}`} viewBox="0 0 24 24">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  )
}

// ── Animated Logo ─────────────────────────────────────────────────────────────

function AnimatedLogo({ tenant }: { tenant: Tenant }) {
  return (
    <div className="relative w-20 h-20 flex-shrink-0">
      <div
        className="absolute inset-[-3px] rounded-full animate-spin-slow"
        style={{
          background: `conic-gradient(from 0deg, ${tenant.primary_color} 0%, ${tenant.secondary_color} 30%, transparent 55%, transparent 70%, ${tenant.primary_color} 100%)`,
        }}
      />
      <div className="absolute inset-0 rounded-full m-[2px] overflow-hidden z-10 flex items-center justify-center"
        style={{ backgroundColor: tenant.background_color }}>
        {tenant.logo_url ? (
          <Image
            src={tenant.logo_url}
            alt={tenant.name}
            width={72}
            height={72}
            className="object-cover w-full h-full"
            priority
            unoptimized={tenant.logo_url.startsWith('/')}
          />
        ) : (
          <span className="text-4xl">🍔</span>
        )}
      </div>
    </div>
  )
}

// ── Item Card ─────────────────────────────────────────────────────────────────

function ItemCard({ product, cantidad, onAgregar, onQuitar }: {
  product: Product
  cantidad: number
  onAgregar: () => void
  onQuitar: () => void
}) {
  return (
    <div className="card-hover bg-[#1a1a1a] rounded-2xl border border-[#2a2a2a] flex flex-row overflow-hidden min-h-[104px]">

      {/* LEFT: Info */}
      <div className="flex-1 flex flex-col justify-between p-3 pr-2 min-w-0">
        <div className="min-w-0">
          {product.badge && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[var(--color-accent)] text-black leading-tight inline-block mb-1">
              {product.badge.replace(/^[^ ]+ /, '')}
            </span>
          )}
          <h3 className="font-bold text-white text-sm leading-snug font-[family-name:var(--font-syne)] line-clamp-2">
            {product.name}
          </h3>
          {product.description && (
            <p className="text-[#888] text-[11px] mt-1 leading-relaxed line-clamp-2">
              {product.description}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 mt-2">
          <span className="font-bold text-[var(--color-accent)] text-base">{fmt(product.price)}</span>
          {cantidad > 0 && (
            <div className="flex items-center gap-1 ml-1">
              <button
                onClick={onQuitar}
                className="w-7 h-7 rounded-full border border-[var(--color-accent)]/50 text-[var(--color-accent)] font-bold flex items-center justify-center hover:bg-[var(--color-accent)]/10 active:scale-90 transition-all leading-none"
              >
                −
              </button>
              <span className="font-bold text-white w-5 text-center text-sm">{cantidad}</span>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: Image 100×100 with "+" overlaid */}
      <div className="relative w-[100px] h-[100px] flex-shrink-0 self-center m-2 rounded-xl overflow-hidden">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            className="object-cover"
            sizes="100px"
            unoptimized={product.image_url.startsWith('/')}
          />
        ) : (
          <div className="absolute inset-0 bg-[#111] flex items-center justify-center">
            <span className="text-[2.5rem]">🍽️</span>
          </div>
        )}
        <button
          onClick={onAgregar}
          className="absolute bottom-1.5 right-1.5 w-8 h-8 bg-[var(--color-accent)] text-black font-black text-xl rounded-full flex items-center justify-center shadow-lg hover:opacity-90 active:scale-90 transition-all leading-none z-10"
        >
          +
        </button>
      </div>
    </div>
  )
}

// ── Cart Drawer ───────────────────────────────────────────────────────────────

function CartDrawer({ cart, onQuitar, onAgregar, onClose, onPedir }: {
  cart: CartItem[]
  onQuitar: (id: string) => void
  onAgregar: (product: Product) => void
  onClose: () => void
  onPedir: () => void
}) {
  const total = cart.reduce((acc, c) => acc + c.product.price * c.cantidad, 0)

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#111] w-full max-w-sm h-full flex flex-col shadow-2xl border-l border-[#2a2a2a]">

        <div className="flex items-center justify-between px-5 py-4 border-b border-[#2a2a2a]">
          <h2 className="font-bold text-lg font-[family-name:var(--font-syne)]">Tu pedido</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-[#1a1a1a] flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#2a2a2a] transition-colors text-lg leading-none">×</button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-[#888]">
              <span className="text-6xl opacity-50">🛒</span>
              <p className="text-sm">Tu carrito está vacío</p>
            </div>
          ) : cart.map(c => (
            <div key={c.product.id} className="flex items-center gap-3 bg-[#1a1a1a] rounded-xl p-3 border border-[#2a2a2a]">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{c.product.name}</p>
                <p className="text-[var(--color-accent)] text-sm font-bold">{fmt(c.product.price * c.cantidad)}</p>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button onClick={() => onQuitar(c.product.id)} className="w-7 h-7 rounded-full border border-[#333] text-[#888] font-bold flex items-center justify-center hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] active:scale-90 transition-all leading-none">−</button>
                <span className="w-4 text-center font-bold text-sm">{c.cantidad}</span>
                <button onClick={() => onAgregar(c.product)} className="w-7 h-7 rounded-full bg-[var(--color-accent)] text-black font-bold flex items-center justify-center hover:opacity-90 active:scale-90 transition-all leading-none">+</button>
              </div>
            </div>
          ))}
        </div>

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

// ── Main Component ────────────────────────────────────────────────────────────

export function MenuPage({ tenant, categories, products }: {
  tenant: Tenant
  categories: Category[]
  products: Product[]
}) {
  const [cart, setCart] = useState<CartItem[]>([])
  const [categoriaActiva, setCategoriaActiva] = useState<string>(categories[0]?.name ?? '')
  const [gridKey, setGridKey] = useState(0)
  const [showCart, setShowCart] = useState(false)
  const [showCheckout, setShowCheckout] = useState(false)

  const productosFiltrados = products.filter(p => {
    const cat = categories.find(c => c.id === p.category_id)
    return cat?.name === categoriaActiva
  })

  const totalItems = cart.reduce((acc, c) => acc + c.cantidad, 0)
  const totalPrecio = cart.reduce((acc, c) => acc + c.product.price * c.cantidad, 0)

  const agregar = useCallback((product: Product) => {
    setCart(prev => {
      const found = prev.find(c => c.product.id === product.id)
      if (found) return prev.map(c => c.product.id === product.id ? { ...c, cantidad: c.cantidad + 1 } : c)
      return [...prev, { product, cantidad: 1 }]
    })
  }, [])

  const quitar = useCallback((id: string) => {
    setCart(prev => {
      const found = prev.find(c => c.product.id === id)
      if (!found) return prev
      if (found.cantidad === 1) return prev.filter(c => c.product.id !== id)
      return prev.map(c => c.product.id === id ? { ...c, cantidad: c.cantidad - 1 } : c)
    })
  }, [])

  function cambiarCategoria(name: string) {
    if (name === categoriaActiva) return
    setCategoriaActiva(name)
    setGridKey(k => k + 1)
  }

  function abrirCheckout() {
    setShowCart(false)
    setShowCheckout(true)
  }

  return (
    <div
      className="min-h-screen pb-36"
      style={{
        '--color-accent': tenant.primary_color,
        '--color-secondary': tenant.secondary_color,
        '--color-bg': tenant.background_color,
        backgroundColor: tenant.background_color,
      } as React.CSSProperties}
    >
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <header className="flex flex-col items-center gap-4 pt-10 pb-7 px-4 text-center relative">
        <div
          className="absolute top-8 left-1/2 -translate-x-1/2 w-40 h-40 rounded-full blur-3xl pointer-events-none"
          style={{ backgroundColor: `${tenant.primary_color}0D` }}
        />
        <AnimatedLogo tenant={tenant} />
        <div className="flex flex-col items-center gap-1">
          <h1 className="text-2xl font-extrabold tracking-tight font-[family-name:var(--font-syne)]">
            {tenant.name}
          </h1>
          {tenant.tagline && (
            <p className="text-[#888] text-[14px]">{tenant.tagline}</p>
          )}
        </div>
        {tenant.instagram_handle && (
          <a
            href={`https://instagram.com/${tenant.instagram_handle}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-[#888] hover:text-[var(--color-accent)] transition-colors duration-200"
          >
            <IGIcon />
            <span>@{tenant.instagram_handle}</span>
          </a>
        )}
      </header>

      {/* ── Divider ──────────────────────────────────────────────────────── */}
      <div className="h-px bg-gradient-to-r from-transparent via-[#2a2a2a] to-transparent mx-6 mb-0" />

      {/* ── Category Tabs ─────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-30 backdrop-blur-md border-b border-[#1a1a1a] px-4 py-3.5"
        style={{ backgroundColor: `${tenant.background_color}F2` }}>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide max-w-lg mx-auto">
          {categories.map(cat => {
            const isActive = cat.name === categoriaActiva
            return (
              <button
                key={cat.id}
                onClick={() => cambiarCategoria(cat.name)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold transition-all duration-200 border min-h-[40px] ${
                  isActive
                    ? 'text-[#0f0d0b]'
                    : 'tab-inactive bg-[#2a2520] text-[#999] border-[#2a2520] hover:text-white'
                }`}
                style={isActive ? {
                  backgroundColor: tenant.primary_color,
                  borderColor: tenant.primary_color,
                  color: '#0f0d0b',
                } : undefined}
              >
                {cat.emoji && <span className="text-base leading-none">{cat.emoji}</span>}
                {cat.name}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Menu List ─────────────────────────────────────────────────────── */}
      <main className="max-w-lg mx-auto px-4 pt-5">
        {productosFiltrados.length === 0 ? (
          <p className="text-center text-[#555] text-sm py-10">Sin productos en esta categoría.</p>
        ) : (
          <div key={gridKey} className="flex flex-col gap-3 menu-grid-enter">
            {productosFiltrados.map(product => (
              <ItemCard
                key={product.id}
                product={product}
                cantidad={cart.find(c => c.product.id === product.id)?.cantidad ?? 0}
                onAgregar={() => agregar(product)}
                onQuitar={() => quitar(product.id)}
              />
            ))}
          </div>
        )}
      </main>

      {/* ── Sticky Cart Bar ───────────────────────────────────────────────── */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-40 transition-all duration-300 ease-out ${
          totalItems > 0 ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'
        }`}
      >
        <div className="h-px bg-gradient-to-r from-transparent via-[var(--color-accent)]/60 to-transparent" />
        <div className="backdrop-blur-xl px-4 py-3 flex items-center gap-3 max-w-lg mx-auto"
          style={{ backgroundColor: `${tenant.background_color}F2` }}>
          <button
            onClick={() => setShowCart(true)}
            className="flex items-center gap-2.5 flex-1 min-w-0"
          >
            <span className="flex-shrink-0 text-black font-black text-xs rounded-full w-6 h-6 flex items-center justify-center"
              style={{ backgroundColor: tenant.primary_color }}>
              {totalItems}
            </span>
            <span className="text-[#888] text-xs truncate">
              {cart.map(c => c.product.name.split(' ')[0]).join(', ')}
            </span>
            <span className="font-bold text-white flex-shrink-0 ml-auto">{fmt(totalPrecio)}</span>
          </button>
          <button
            onClick={abrirCheckout}
            className="flex-shrink-0 text-black font-bold py-2.5 px-4 rounded-xl flex items-center gap-1.5 hover:opacity-90 active:scale-95 transition-all text-sm min-h-[44px]"
            style={{ backgroundColor: tenant.primary_color }}
          >
            Confirmar
          </button>
        </div>
        <div className="h-safe-bottom" style={{ backgroundColor: `${tenant.background_color}F2` }} />
      </div>

      {/* ── Cart Drawer ───────────────────────────────────────────────────── */}
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
          tenant={tenant}
          onClose={() => setShowCheckout(false)}
        />
      )}
    </div>
  )
}
