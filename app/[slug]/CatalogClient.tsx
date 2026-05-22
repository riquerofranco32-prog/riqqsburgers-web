'use client'

import Image from 'next/image'
import { useState, useCallback, useEffect, useRef } from 'react'
import {
  MapPin, Clock, Phone, ShoppingBag, ChevronRight,
  X, Minus, Plus, Trash2,
} from 'lucide-react'
import type { Restaurant, MenuItem, RestaurantBrand } from '@/lib/getRestaurant'

type CartItem = MenuItem & { quantity: number }

function IGIcon() {
  return (
    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  )
}

function WAIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={`${className} fill-current flex-shrink-0`} viewBox="0 0 24 24">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  )
}

function fmt(n: number) {
  return '$' + n.toLocaleString('es-AR')
}

export default function CatalogClient({ restaurant }: { restaurant: Restaurant }) {
  const [activeCategory, setActiveCategory] = useState(
    restaurant.menu.categories[0]?.id ?? ''
  )
  const [cart, setCart] = useState<CartItem[]>([])
  const [cartOpen, setCartOpen] = useState(false)

  const addItem = useCallback((item: MenuItem) => {
    setCart(prev => {
      const found = prev.find(i => i.id === item.id)
      if (found) return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i)
      return [...prev, { ...item, quantity: 1 }]
    })
  }, [])

  const removeItem = useCallback((item: MenuItem) => {
    setCart(prev => {
      const found = prev.find(i => i.id === item.id)
      if (!found) return prev
      if (found.quantity === 1) return prev.filter(i => i.id !== item.id)
      return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity - 1 } : i)
    })
  }, [])

  const removeAll = useCallback((item: MenuItem) => {
    setCart(prev => prev.filter(i => i.id !== item.id))
  }, [])

  const getQty = (id: string) => cart.find(i => i.id === id)?.quantity ?? 0

  const totalItems = cart.reduce((s, i) => s + i.quantity, 0)
  const totalPrice = cart.reduce((s, i) => s + i.price * i.quantity, 0)

  const [popKey, setPopKey] = useState(0)
  const isFirstRender = useRef(true)
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return }
    setPopKey(k => k + 1)
  }, [totalItems])

  useEffect(() => {
    if (!cartOpen) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setCartOpen(false) }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [cartOpen])

  useEffect(() => {
    const b = restaurant.brand
    if (!b) return
    const root = document.documentElement
    root.style.setProperty('--bg', b.bg)
    root.style.setProperty('--surface', b.surface)
    root.style.setProperty('--surface-2', b.surface2)
    root.style.setProperty('--accent', b.accent)
    root.style.setProperty('--text-primary', b.text_primary)
    root.style.setProperty('--text-secondary', b.text_secondary)
    root.style.setProperty('--border', b.border)
    return () => {
      root.style.removeProperty('--bg')
      root.style.removeProperty('--surface')
      root.style.removeProperty('--surface-2')
      root.style.removeProperty('--accent')
      root.style.removeProperty('--text-primary')
      root.style.removeProperty('--text-secondary')
      root.style.removeProperty('--border')
    }
  }, [restaurant.brand])

  function handleWhatsApp() {
    const lines = cart.map(i => `• ${i.quantity}x ${i.name} — ${fmt(i.price * i.quantity)}`)
    const text = [
      `🍔 *Pedido - ${restaurant.name}*`,
      '',
      ...lines,
      '',
      `💰 *Total: ${fmt(totalPrice)}*`,
      '',
      '📍 ¿Me podés dar tu dirección?',
      '💳 ¿Cómo preferís pagar?',
    ].join('\n')
    window.open(`https://wa.me/${restaurant.phone}?text=${encodeURIComponent(text)}`)
  }

  const currentCategory = restaurant.menu.categories.find(c => c.id === activeCategory)

  const initials = restaurant.name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase()
  const logoSrc = restaurant.logo || ''
  const hasInfoBar = !!(restaurant.address || restaurant.schedule || restaurant.phone)
  const b: RestaurantBrand | null = restaurant.brand ?? null

  return (
    <div
      className="min-h-screen pb-28"
      style={{
        backgroundColor: 'var(--bg)',
        color: 'var(--text-primary)',
        '--accent': b?.accent ?? restaurant.accent_color,
      } as React.CSSProperties}
    >
      {/* ── Brand accent bar ───────────────────────────────────────────── */}
      {b && <div style={{ height: 3, backgroundColor: b.accent, width: '100%' }} />}

      {/* ── Banner ─────────────────────────────────────────────────────── */}
      <div
        className="h-32 relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, var(--accent) 0%, color-mix(in srgb, var(--accent) 70%, black) 100%)` }}
      >
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: 'radial-gradient(circle, white 1.5px, transparent 1.5px)',
            backgroundSize: '18px 18px',
          }}
        />
      </div>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header
        className="pb-6 px-4 flex flex-col items-center gap-4 border-b -mt-10"
        style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <div className="relative w-24 h-24 z-10">
          <div className="absolute rounded-full" style={{ inset: '-5px', backgroundColor: 'var(--surface)' }} />
          <div
            className="absolute inset-[-3px] rounded-full animate-spin-slow"
            style={{ background: `conic-gradient(from 0deg, var(--accent) 0%, var(--accent) 35%, transparent 55%, transparent 75%, var(--accent) 100%)` }}
          />
          <div className="absolute inset-0 m-[3px] rounded-full overflow-hidden z-10" style={{ backgroundColor: 'var(--surface-2)' }}>
            {logoSrc ? (
              <Image src={logoSrc} alt={restaurant.name} width={96} height={96} className="w-full h-full object-cover rounded-full" unoptimized />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-black text-2xl text-white" style={{ backgroundColor: 'var(--accent)' }}>
                {initials}
              </div>
            )}
          </div>
        </div>

        <div className="text-center">
          <h1
            className="text-2xl font-black tracking-tight"
            style={{
              color: 'var(--text-primary)',
              fontFamily: b?.display_font ?? "'Plus Jakarta Sans', system-ui, sans-serif",
              textTransform: b ? 'uppercase' : 'none',
              letterSpacing: b ? '0.04em' : undefined,
            }}
          >
            {restaurant.name}
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{restaurant.tagline}</p>
        </div>

        {restaurant.instagram && (
          <a
            href={`https://instagram.com/${restaurant.instagram}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm font-medium transition-opacity hover:opacity-70"
            style={{ color: 'var(--accent)' }}
          >
            <IGIcon />
            @{restaurant.instagram}
          </a>
        )}
      </header>

      {/* ── Info bar ───────────────────────────────────────────────────── */}
      {hasInfoBar && (
        <div
          className="overflow-x-auto scrollbar-hide border-b"
          style={{ backgroundColor: b ? '#111111' : 'var(--surface-2)', borderColor: 'var(--border)' }}
        >
          <div className="px-4 py-2.5 flex items-center gap-4 text-sm whitespace-nowrap w-max min-w-full">
            {restaurant.address && (
              <span className="flex items-center gap-1.5 flex-shrink-0" style={{ color: 'var(--text-secondary)' }}>
                <MapPin size={14} className="flex-shrink-0" style={{ color: b ? 'var(--accent)' : 'inherit' }} />
                {restaurant.address}
              </span>
            )}
            {restaurant.schedule && (
              <span className="flex items-center gap-1.5 flex-shrink-0" style={{ color: 'var(--text-secondary)' }}>
                <Clock size={14} className="flex-shrink-0" style={{ color: b ? 'var(--accent)' : 'inherit' }} />
                {restaurant.schedule}
              </span>
            )}
            {restaurant.phone && (
              <a
                href={`tel:${restaurant.phone}`}
                className="flex items-center gap-1.5 flex-shrink-0 transition-opacity hover:opacity-70"
                style={{ color: 'var(--text-secondary)' }}
              >
                <Phone size={14} className="flex-shrink-0" style={{ color: b ? 'var(--accent)' : 'inherit' }} />
                {restaurant.phone}
              </a>
            )}
            <span className="flex items-center gap-1.5 flex-shrink-0 ml-auto">
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: restaurant.is_open ? '#22c55e' : '#ef4444' }}
              />
              <span
                className="text-xs font-semibold"
                style={{ color: restaurant.is_open ? '#22c55e' : '#ef4444' }}
              >
                {restaurant.is_open ? 'Abierto ahora' : 'Cerrado'}
              </span>
            </span>
          </div>
        </div>
      )}

      {/* ── Stats row ─────────────────────────────────────────────────── */}
      <div
        className="px-4 py-3 flex items-center justify-around border-b text-center"
        style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <div>
          <p className="font-black text-base" style={{ color: 'var(--text-primary)' }}>
            {restaurant.menu.categories.reduce((s, c) => s + c.items.length, 0)}
          </p>
          <p className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>productos</p>
        </div>

        {restaurant.instagram ? (
          <a href={`https://instagram.com/${restaurant.instagram}`} target="_blank" rel="noopener noreferrer">
            <p className="font-black text-base" style={{ color: 'var(--accent)' }}>@{restaurant.instagram}</p>
            <p className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>instagram</p>
          </a>
        ) : (
          <div>
            <p className="font-black text-base" style={{ color: 'var(--text-primary)' }}>—</p>
            <p className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>instagram</p>
          </div>
        )}

        <button onClick={handleWhatsApp} disabled={totalItems === 0}>
          <p className="font-black text-base" style={{ color: '#25D366' }}>WhatsApp</p>
          <p className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>pedidos</p>
        </button>
      </div>

      {/* ── Category tabs ──────────────────────────────────────────────── */}
      <div
        className="px-4 py-3 flex gap-2 overflow-x-auto scrollbar-hide border-b sticky top-0 z-10"
        style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        {restaurant.menu.categories.map(cat => {
          const active = cat.id === activeCategory
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200"
              style={active
                ? { backgroundColor: 'var(--accent)', color: b ? '#1A1A1A' : '#fff', fontWeight: 700 }
                : { backgroundColor: 'var(--surface-2)', color: 'var(--text-secondary)' }}
            >
              <span>{cat.emoji}</span>
              <span>{cat.name}</span>
            </button>
          )
        })}
      </div>

      {/* ── Products grid ──────────────────────────────────────────────── */}
      <div className="px-4 pt-4">
        {currentCategory && currentCategory.items.length > 0 ? (
          <div key={activeCategory} className="grid grid-cols-2 gap-3 sm:grid-cols-3 menu-grid-enter">
            {currentCategory.items.map(item => {
              const qty = getQty(item.id)
              const soldOut = item.badge === 'Agotado'
              const badgeColor =
                item.badge === 'Popular' ? 'var(--secondary)' :
                item.badge === 'Nuevo'   ? '#3B82F6' :
                item.badge === 'Promo'   ? '#EF4444' :
                item.badge === 'Agotado' ? '#6B7280' : '#4CAF50'
              return (
                <div
                  key={item.id}
                  className={`group rounded-2xl overflow-hidden flex flex-col shadow-sm transition-all duration-200 hover:shadow-md${soldOut ? ' opacity-50' : ''}${b ? ' brand-card' : ''}`}
                  style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
                >
                  <div className="relative aspect-[4/3] overflow-hidden">
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 640px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-5xl" style={{ backgroundColor: 'var(--surface-2)' }}>
                        🍔
                      </div>
                    )}
                    {item.badge && (
                      <span
                        className="absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                        style={{ backgroundColor: badgeColor }}
                      >
                        {item.badge}
                      </span>
                    )}
                  </div>

                  <div className="p-3 flex flex-col flex-1 gap-2">
                    <div className="flex-1">
                      <p
                        className="font-bold text-sm leading-tight"
                        style={{
                          color: 'var(--text-primary)',
                          fontFamily: b?.display_font,
                          textTransform: b ? 'uppercase' : 'none',
                        }}
                      >
                        {item.name}
                      </p>
                      <p className="text-xs mt-1 line-clamp-3 leading-snug" style={{ color: 'var(--text-muted)' }}>
                        {item.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-auto pt-1">
                      <span className={b ? 'font-bold text-xl' : 'font-bold text-sm'} style={{ color: 'var(--accent)' }}>
                        {fmt(item.price)}
                      </span>

                      {qty === 0 ? (
                        <button
                          onClick={() => addItem(item)}
                          disabled={soldOut}
                          className="w-8 h-8 rounded-full font-bold text-xl leading-none flex items-center justify-center transition-all active:scale-90 hover:opacity-90 disabled:cursor-not-allowed"
                          style={{ backgroundColor: 'var(--accent)', color: b ? '#1A1A1A' : '#fff' }}
                        >
                          +
                        </button>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => removeItem(item)}
                            className="w-7 h-7 rounded-full font-bold flex items-center justify-center active:scale-90 transition-all border-2 bg-transparent"
                            style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}
                          >
                            −
                          </button>
                          <span className="text-sm font-bold w-4 text-center tabular-nums" style={{ color: 'var(--text-primary)' }}>
                            {qty}
                          </span>
                          <button
                            onClick={() => addItem(item)}
                            disabled={soldOut}
                            className="w-7 h-7 rounded-full font-bold flex items-center justify-center active:scale-90 transition-all disabled:cursor-not-allowed"
                            style={{ backgroundColor: 'var(--accent)', color: b ? '#1A1A1A' : '#fff' }}
                          >
                            +
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20" style={{ color: 'var(--text-muted)' }}>
            <p className="text-4xl mb-3">{currentCategory?.emoji ?? '🍽️'}</p>
            <p className="text-sm">Próximamente en esta categoría</p>
          </div>
        )}
      </div>

      {/* ── Sticky cart bar ────────────────────────────────────────────── */}
      {totalItems > 0 && (
        <div
          className="fixed bottom-0 left-0 right-0 z-50 animate-slide-up
                     md:left-1/2 md:right-auto md:w-full md:max-w-[480px] md:-translate-x-1/2 md:rounded-t-2xl overflow-hidden"
        >
          <button
            onClick={() => setCartOpen(true)}
            className="w-full flex items-center justify-between px-4 transition-all hover:brightness-95 active:scale-[0.99]"
            style={{
              backgroundColor: 'var(--accent)',
              color: b ? '#1A1A1A' : '#fff',
              paddingTop: '12px',
              paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
            }}
          >
            <span className="flex items-center gap-2 font-semibold text-sm">
              <ShoppingBag key={popKey} size={20} className="animate-pop flex-shrink-0" />
              {totalItems} {totalItems === 1 ? 'producto' : 'productos'}
            </span>
            <span className="font-bold text-lg">{fmt(totalPrice)}</span>
            <span className="flex items-center gap-0.5 text-sm font-medium opacity-80">
              Ver pedido <ChevronRight size={16} />
            </span>
          </button>
        </div>
      )}

      {/* ── Cart drawer ────────────────────────────────────────────────── */}
      {cartOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={() => setCartOpen(false)} />

          <div
            className="fixed z-50 bottom-0 left-0 right-0
                       md:top-0 md:bottom-0 md:left-auto md:right-0 md:w-96
                       flex flex-col max-h-[85vh] md:max-h-full
                       rounded-t-3xl md:rounded-none md:rounded-l-3xl
                       shadow-2xl animate-slide-up md:animate-none"
            style={{
              backgroundColor: 'var(--surface)',
              borderTop: b ? `2px solid ${b.accent}` : undefined,
            }}
          >
            {/* Handle (mobile only) */}
            <div className="flex justify-center pt-3 pb-1 md:hidden flex-shrink-0">
              <div className="w-10 h-1 rounded-full" style={{ backgroundColor: 'var(--border)' }} />
            </div>

            {/* Header */}
            <div
              className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0"
              style={{ borderColor: 'var(--border)' }}
            >
              <h2 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>Tu pedido</h2>
              <button
                onClick={() => setCartOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:opacity-70"
                style={{ backgroundColor: 'var(--surface-2)', color: 'var(--text-secondary)' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3">
              {cart.map(item => (
                <div key={item.id} className="flex items-center gap-3">
                  {/* Thumbnail */}
                  <div
                    className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center text-lg"
                    style={{ backgroundColor: 'var(--surface-2)' }}
                  >
                    {item.image ? (
                      <Image src={item.image} alt={item.name} width={40} height={40} className="w-full h-full object-cover" unoptimized />
                    ) : '🍔'}
                  </div>

                  {/* Name + price */}
                  <div className="flex-1 min-w-0 ml-0">
                    <p
                      className="text-sm font-semibold truncate leading-tight"
                      style={{
                        color: 'var(--text-primary)',
                        fontFamily: b?.display_font,
                        textTransform: b ? 'uppercase' : 'none',
                      }}
                    >
                      {item.name}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      {fmt(item.price)} c/u
                    </p>
                  </div>

                  {/* Qty controls */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => item.quantity === 1 ? removeAll(item) : removeItem(item)}
                      className="w-7 h-7 rounded-full flex items-center justify-center transition-all active:scale-90 border"
                      style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                    >
                      {item.quantity === 1 ? <Trash2 size={12} /> : <Minus size={12} />}
                    </button>
                    <span className="text-sm font-bold w-6 text-center tabular-nums" style={{ color: 'var(--text-primary)' }}>
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => addItem(item)}
                      className="w-7 h-7 rounded-full flex items-center justify-center text-white transition-all active:scale-90"
                      style={{ backgroundColor: 'var(--accent)' }}
                    >
                      <Plus size={12} />
                    </button>
                  </div>

                  {/* Subtotal */}
                  <span className="text-sm font-bold w-16 text-right flex-shrink-0" style={{ color: 'var(--text-primary)' }}>
                    {fmt(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            {/* Order summary */}
            <div className="border-t flex-shrink-0" style={{ borderColor: 'var(--border)' }}>
              <div className="px-5 py-4 flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Subtotal</span>
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{fmt(totalPrice)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span
                    className={b ? 'text-3xl' : 'font-black text-xl'}
                    style={{
                      color: b ? 'var(--accent)' : 'var(--text-primary)',
                      fontFamily: b?.display_font,
                    }}
                  >
                    Total
                  </span>
                  <span
                    className={b ? 'text-3xl' : 'font-black text-xl'}
                    style={{
                      color: b ? 'var(--accent)' : 'var(--text-primary)',
                      fontFamily: b?.display_font,
                    }}
                  >
                    {fmt(totalPrice)}
                  </span>
                </div>
              </div>
            </div>

            {/* WhatsApp CTA */}
            <div
              className="px-4 pt-3 flex-shrink-0 border-t"
              style={{
                paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
                borderColor: 'var(--border)',
              }}
            >
              <button
                onClick={() => { handleWhatsApp(); setCartOpen(false) }}
                className="w-full py-4 rounded-2xl font-bold text-lg text-white flex items-center justify-center gap-3 transition-all active:scale-[0.98] hover:brightness-110"
                style={{ backgroundColor: '#25D366' }}
              >
                <WAIcon />
                Pedir por WhatsApp
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
