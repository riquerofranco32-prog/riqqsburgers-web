'use client'

import Image from 'next/image'
import { useState, useCallback, useEffect, useRef } from 'react'
import { ShoppingBag, ChevronRight, X, Minus, Plus, Trash2 } from 'lucide-react'
import type { Restaurant, MenuItem, RestaurantBrand } from '@/lib/getRestaurant'
import CheckoutModal from '@/components/CheckoutModal'
import InfoRotator from '@/components/menu/InfoRotator'

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
  const [checkoutOpen, setCheckoutOpen] = useState(false)

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
  const b: RestaurantBrand | null = restaurant.brand ?? null
  const accent = b?.accent ?? restaurant.accent_color

  const infoItems = [
    restaurant.address  && { icon: '📍', text: restaurant.address },
    restaurant.phone    && { icon: '📞', text: restaurant.phone },
    restaurant.schedule && { icon: '🕐', text: restaurant.schedule },
    restaurant.instagram && { icon: '📸', text: `@${restaurant.instagram}` },
  ].filter(Boolean) as { icon: string; text: string }[]

  return (
    <div
      className="min-h-screen pb-28"
      style={{
        backgroundColor: 'var(--bg)',
        color: 'var(--text-primary)',
        '--accent': accent,
      } as React.CSSProperties}
    >
      {/* ── Header compacto (sticky, mobile-first) ─────────────────────── */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '12px 16px',
          position: 'sticky',
          top: 0,
          zIndex: 40,
          background: 'var(--surface)',
          borderBottom: '1px solid var(--border)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        }}
      >
        {/* Logo circular */}
        <div style={{ position: 'relative', width: 48, height: 48, flexShrink: 0 }}>
          <div
            style={{
              position: 'absolute',
              inset: -2,
              borderRadius: '50%',
              background: `conic-gradient(from 0deg, ${accent} 0%, ${accent} 35%, transparent 55%, transparent 75%, ${accent} 100%)`,
            }}
            className="animate-spin-slow"
          />
          <div
            style={{
              position: 'absolute',
              inset: 2,
              borderRadius: '50%',
              overflow: 'hidden',
              background: 'var(--surface-2)',
            }}
          >
            {logoSrc ? (
              <Image src={logoSrc} alt={restaurant.name} width={44} height={44} className="w-full h-full object-cover" unoptimized />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-black text-sm text-white" style={{ backgroundColor: accent }}>
                {initials}
              </div>
            )}
          </div>
        </div>

        {/* Nombre + info rotante */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1
            style={{
              fontSize: 16,
              fontWeight: 800,
              color: 'var(--text-primary)',
              fontFamily: b?.display_font ?? 'inherit',
              textTransform: b ? 'uppercase' : 'none',
              letterSpacing: b ? '0.03em' : undefined,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              lineHeight: 1.2,
              marginBottom: 2,
            }}
          >
            {restaurant.name}
          </h1>
          <InfoRotator items={infoItems} accent={accent} />
        </div>

        {/* Badge abierto/cerrado */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          flexShrink: 0,
          padding: '4px 10px',
          borderRadius: 20,
          fontSize: 11,
          fontWeight: 600,
          background: restaurant.is_open ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
          color: restaurant.is_open ? '#22c55e' : '#ef4444',
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor', display: 'inline-block' }} />
          {restaurant.is_open ? 'Abierto' : 'Cerrado'}
        </div>
      </header>

      {/* ── Category tabs (sticky bajo el header) ──────────────────────── */}
      <div
        className="categories-bar"
        style={{
          position: 'sticky',
          top: 72,
          zIndex: 30,
          background: 'var(--bg)',
          borderBottom: '1px solid var(--border)',
          overflowX: 'auto',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
          display: 'flex',
          gap: 8,
          padding: '10px 16px',
        } as React.CSSProperties}
      >
        {restaurant.menu.categories.map(cat => {
          const isActive = cat.id === activeCategory
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200"
              style={isActive
                ? { backgroundColor: accent, color: b ? '#1A1A1A' : '#fff', fontWeight: 700 }
                : { backgroundColor: 'var(--surface-2)', color: 'var(--text-secondary)' }}
            >
              <span>{cat.emoji}</span>
              <span>{cat.name}</span>
            </button>
          )
        })}
      </div>

      {/* ── Products grid (mobile-first) ───────────────────────────────── */}
      <div className="pt-3 pb-4">
        {currentCategory && currentCategory.items.length > 0 ? (
          <div key={activeCategory} className="menu-grid menu-grid-enter">
            {currentCategory.items.map(item => {
              const qty = getQty(item.id)
              const soldOut = item.badge === 'Agotado'
              const badgeColor =
                item.badge === 'Popular' ? accent :
                item.badge === 'Nuevo'   ? '#3B82F6' :
                item.badge === 'Promo'   ? '#EF4444' :
                item.badge === 'Agotado' ? '#6B7280' : '#4CAF50'

              return (
                <div
                  key={item.id}
                  className={`product-card-mobile${soldOut ? ' opacity-50' : ''}${b ? ' brand-card' : ''}`}
                >
                  {/* Imagen */}
                  <div style={{ position: 'relative', width: 72, height: 72, flexShrink: 0 }}>
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="product-image object-cover"
                        style={{ borderRadius: 10 }}
                        sizes="72px"
                        unoptimized
                      />
                    ) : (
                      <div className="product-image flex items-center justify-center text-3xl" style={{ background: 'var(--surface-2)', borderRadius: 10 }}>
                        🍔
                      </div>
                    )}
                    {item.badge && (
                      <span style={{
                        position: 'absolute', top: -4, right: -4,
                        fontSize: 9, fontWeight: 700, padding: '2px 6px',
                        borderRadius: 20, color: 'white', backgroundColor: badgeColor,
                        whiteSpace: 'nowrap',
                      }}>
                        {item.badge}
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="product-info" style={{ flex: 1, minWidth: 0 }}>
                    <p
                      className="product-name"
                      style={{
                        fontFamily: b?.display_font,
                        textTransform: b ? 'uppercase' : 'none',
                      }}
                    >
                      {item.name}
                    </p>
                    {item.description && (
                      <p className="product-desc">{item.description}</p>
                    )}
                    <p className="product-price" style={{ color: accent }}>{fmt(item.price)}</p>
                  </div>

                  {/* Controles cantidad */}
                  <div style={{ flexShrink: 0 }}>
                    {qty === 0 ? (
                      <button
                        onClick={() => addItem(item)}
                        disabled={soldOut}
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: '50%',
                          background: soldOut ? 'var(--surface-2)' : accent,
                          color: b ? '#1A1A1A' : 'white',
                          border: 'none',
                          fontSize: 22,
                          fontWeight: 300,
                          cursor: soldOut ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          WebkitTapHighlightColor: 'transparent',
                          transition: 'transform 0.1s ease',
                        } as React.CSSProperties}
                        onTouchStart={e => { if (!soldOut) e.currentTarget.style.transform = 'scale(0.9)' }}
                        onTouchEnd={e => { e.currentTarget.style.transform = 'scale(1)' }}
                      >
                        +
                      </button>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <button
                          onClick={() => removeItem(item)}
                          style={{
                            width: 28, height: 28, borderRadius: '50%',
                            border: `2px solid ${accent}`,
                            background: 'transparent', color: accent,
                            fontSize: 18, fontWeight: 300,
                            cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            WebkitTapHighlightColor: 'transparent',
                          } as React.CSSProperties}
                        >
                          −
                        </button>
                        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', minWidth: 16, textAlign: 'center' }}>
                          {qty}
                        </span>
                        <button
                          onClick={() => addItem(item)}
                          disabled={soldOut}
                          style={{
                            width: 28, height: 28, borderRadius: '50%',
                            background: accent, color: b ? '#1A1A1A' : 'white',
                            border: 'none', fontSize: 18, fontWeight: 300,
                            cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            WebkitTapHighlightColor: 'transparent',
                          } as React.CSSProperties}
                        >
                          +
                        </button>
                      </div>
                    )}
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

            {/* CTA */}
            <div
              className="px-4 pt-3 flex-shrink-0 border-t"
              style={{
                paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
                borderColor: 'var(--border)',
              }}
            >
              <button
                onClick={() => { setCartOpen(false); setCheckoutOpen(true) }}
                className="w-full py-4 rounded-2xl font-bold text-lg text-white flex items-center justify-center gap-3 transition-all active:scale-[0.98] hover:brightness-110"
                style={{ backgroundColor: 'var(--accent)' }}
              >
                Hacer pedido →
              </button>
            </div>
          </div>
        </>
      )}

      {/* Checkout modal */}
      <CheckoutModal
        isOpen={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        cart={cart.map(i => ({ id: i.id, name: i.name, price: i.price, quantity: i.quantity }))}
        onClearCart={() => setCart([])}
        tenant={{
          id: restaurant.id,
          name: restaurant.name,
          slug: restaurant.slug,
          whatsapp_number: restaurant.phone,
          delivery_cost: restaurant.delivery_cost,
          primary_color: restaurant.primary_color,
        }}
      />
    </div>
  )
}
