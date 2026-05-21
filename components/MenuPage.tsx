'use client'

import { useState, useCallback } from 'react'
import Image from 'next/image'
import type { Tenant, Category, Product } from '@/types/supabase'
import { CheckoutModal } from '@/components/CheckoutModal'
import { CartDrawer } from '@/components/menu/CartDrawer'
import { CartButton } from '@/components/menu/CartButton'
import { useCart, type CartItem } from '@/context/CartContext'

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return '$' + n.toLocaleString('es-AR')
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function IGIcon() {
  return (
    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
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
      <div
        className="absolute inset-0 rounded-full m-[2px] overflow-hidden z-10 flex items-center justify-center"
        style={{ backgroundColor: tenant.background_color }}
      >
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

function ItemCard({
  product,
  category,
  onAgregar,
}: {
  product: Product
  category?: Category
  onAgregar: () => void
}) {
  const { items, updateQuantity } = useCart()
  const cartItem = items.find(i => i.product_id === product.id)
  const cantidad = cartItem?.quantity ?? 0
  const [added, setAdded] = useState(false)

  function handleAdd() {
    onAgregar()
    setAdded(true)
    setTimeout(() => setAdded(false), 900)
  }

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
                onClick={() => updateQuantity(product.id, cantidad - 1)}
                className="w-7 h-7 rounded-full border border-[var(--color-accent)]/50 text-[var(--color-accent)] font-bold flex items-center justify-center hover:bg-[var(--color-accent)]/10 active:scale-90 transition-all leading-none"
              >
                −
              </button>
              <span className="font-bold text-white w-5 text-center text-sm">{cantidad}</span>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: Image with "+" overlaid */}
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
            <span className="text-[2.5rem]">{category?.emoji ?? '🍽️'}</span>
          </div>
        )}
        <button
          onClick={handleAdd}
          disabled={!product.available}
          className={`absolute bottom-1.5 right-1.5 w-8 h-8 font-black text-sm rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-all leading-none z-10 ${
            product.available
              ? 'bg-[var(--color-accent)] text-black hover:opacity-90'
              : 'bg-[#333] text-[#666] cursor-not-allowed'
          }`}
        >
          {added ? '✓' : '+'}
        </button>
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
  const { items } = useCart()
  const [categoriaActiva, setCategoriaActiva] = useState<string>(categories[0]?.name ?? '')
  const [gridKey, setGridKey] = useState(0)
  const [showCart, setShowCart] = useState(false)
  const [showCheckout, setShowCheckout] = useState(false)

  const { addItem } = useCart()

  const productosFiltrados = products.filter(p => {
    const cat = categories.find(c => c.id === p.category_id)
    return cat?.name === categoriaActiva
  })

  const agregar = useCallback((product: Product) => {
    const cat = categories.find(c => c.id === product.category_id)
    addItem({
      product_id: product.id,
      name: product.name,
      price: product.price,
      image_url: product.image_url,
      category_name: cat?.name ?? null,
    })
  }, [addItem, categories])

  function cambiarCategoria(name: string) {
    if (name === categoriaActiva) return
    setCategoriaActiva(name)
    setGridKey(k => k + 1)
  }

  // CheckoutModal needs CartItem in the old shape — build adapter
  const checkoutCart = items.map(i => ({
    product: products.find(p => p.id === i.product_id) ?? {
      id: i.product_id,
      name: i.name,
      price: i.price,
      image_url: i.image_url ?? null,
      badge: null,
      description: null,
      available: true,
      tenant_id: tenant.id,
      category_id: null,
      sort_order: 0,
      created_at: '',
    } as Product,
    cantidad: i.quantity,
  }))

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
      <div
        className="sticky top-0 z-30 backdrop-blur-md border-b border-[#1a1a1a] px-4 py-3.5"
        style={{ backgroundColor: `${tenant.background_color}F2` }}
      >
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
            {productosFiltrados.map(product => {
              const cat = categories.find(c => c.id === product.category_id)
              return (
                <ItemCard
                  key={product.id}
                  product={product}
                  category={cat}
                  onAgregar={() => agregar(product)}
                />
              )
            })}
          </div>
        )}
      </main>

      {/* ── Floating Cart Button ──────────────────────────────────────────── */}
      <CartButton onClick={() => setShowCart(true)} accentColor={tenant.primary_color} />

      {/* ── Cart Drawer ───────────────────────────────────────────────────── */}
      {showCart && (
        <CartDrawer
          tenantId={tenant.id}
          whatsappNumber={tenant.whatsapp_number}
          onClose={() => setShowCart(false)}
          onCheckout={() => { setShowCart(false); setShowCheckout(true) }}
        />
      )}

      {/* ── Checkout Modal (for detailed orders with delivery info) ───────── */}
      {showCheckout && (
        <CheckoutModal
          cart={checkoutCart}
          tenant={tenant}
          onClose={() => setShowCheckout(false)}
        />
      )}
    </div>
  )
}
