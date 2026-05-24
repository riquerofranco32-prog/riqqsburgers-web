'use client'

import { useState, useCallback, useEffect } from 'react'
import { X, Minus, Plus, Trash2, Search } from 'lucide-react'
import type { Restaurant, MenuItem, RestaurantBrand } from '@/lib/getRestaurant'
import CheckoutModal from '@/components/CheckoutModal'
import InfoRotator from '@/components/menu/InfoRotator'

type CartItem = MenuItem & { quantity: number }

function fmt(n: number) {
  return '$' + n.toLocaleString('es-AR')
}

export default function CatalogClient({ restaurant }: { restaurant: Restaurant }) {
  const CART_KEY = `cart_${restaurant.slug}`

  const [activeCategory, setActiveCategory] = useState(
    restaurant.menu.categories[0]?.id ?? ''
  )
  const [animKey, setAnimKey] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null)
  const [cart, setCart] = useState<CartItem[]>(() => {
    if (typeof window === 'undefined') return []
    try {
      const saved = localStorage.getItem(`cart_${restaurant.slug}`)
      return saved ? JSON.parse(saved) : []
    } catch { return [] }
  })
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

  useEffect(() => {
    try { localStorage.setItem(CART_KEY, JSON.stringify(cart)) } catch {}
  }, [cart, CART_KEY])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedItem) setSelectedItem(null)
        else if (cartOpen) setCartOpen(false)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [cartOpen, selectedItem])

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

  const b: RestaurantBrand | null = restaurant.brand ?? null
  const accent = b?.accent ?? restaurant.accent_color

  const infoItems = [
    restaurant.address   && { icon: '📍', text: restaurant.address },
    restaurant.phone     && { icon: '📞', text: restaurant.phone },
    restaurant.schedule  && { icon: '🕐', text: restaurant.schedule },
    restaurant.instagram && { icon: '📸', text: `@${restaurant.instagram}` },
  ].filter(Boolean) as { icon: string; text: string }[]

  const badgeMap: Record<string, { bg: string; color: string; label: string }> = {
    'Popular': { bg: '#fef08a', color: '#854d0e', label: '🔥 Popular' },
    'Nuevo':   { bg: '#bfdbfe', color: '#1e40af', label: '✨ Nuevo' },
    'Promo':   { bg: '#fecaca', color: '#991b1b', label: '🏷️ Promo' },
    'Agotado': { bg: '#e5e7eb', color: '#374151', label: '😴 Agotado' },
  }

  const currentCategory = restaurant.menu.categories.find(c => c.id === activeCategory)

  const filteredProducts = searchQuery.trim()
    ? restaurant.menu.categories
        .flatMap(c => c.items)
        .filter(i => i.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : currentCategory?.items ?? []

  const SEARCH_HEIGHT = 60
  const CATS_HEIGHT = 80

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: '#F5F5F5', color: 'var(--text-primary)', '--accent': accent } as React.CSSProperties}
    >

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header style={{ position: 'relative', height: 200, overflow: 'hidden' }}>
        {restaurant.banner_url ? (
          <>
            <img
              src={restaurant.banner_url}
              alt={restaurant.name}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.6), rgba(0,0,0,0.2))',
            }} />
          </>
        ) : (
          <div style={{
            position: 'absolute', inset: 0,
            background: accent,
          }}>
            {/* Grain overlay for solid bg */}
            <div style={{
              position: 'absolute', inset: 0, opacity: 0.06,
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
              backgroundSize: '150px 150px',
            }} />
          </div>
        )}

        {/* Content */}
        <div style={{
          position: 'relative', zIndex: 1,
          height: '100%', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '0 20px',
          maxWidth: 640, margin: '0 auto',
        }}>
          {/* Status badge top-right */}
          <div style={{ position: 'absolute', top: 14, right: 16 }}>
            <span style={{
              padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
              background: restaurant.is_open ? 'rgba(34,197,94,0.85)' : 'rgba(239,68,68,0.85)',
              color: '#fff', backdropFilter: 'blur(6px)',
            }}>
              {restaurant.is_open ? '● Abierto' : '● Cerrado'}
            </span>
          </div>

          {/* Logo */}
          {restaurant.logo && (
            <div style={{
              width: 56, height: 56, borderRadius: 16,
              overflow: 'hidden', marginBottom: 10,
              border: '2px solid rgba(255,255,255,0.3)',
              boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
            }}>
              <img src={restaurant.logo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          )}

          <h1 style={{
            fontSize: 28, fontWeight: 800, color: '#fff',
            textAlign: 'center', lineHeight: 1.1, marginBottom: 8,
            textShadow: '0 2px 8px rgba(0,0,0,0.3)',
          }}>
            {restaurant.name}
          </h1>

          {infoItems.length > 0 && (
            <div style={{ color: 'rgba(255,255,255,0.85)' }}>
              <InfoRotator items={infoItems} accent="#fff" />
            </div>
          )}
        </div>
      </header>

      {/* ── Search bar ──────────────────────────────────────────────────────── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 40,
        background: '#F5F5F5',
        padding: '10px 16px',
      }}>
        <div style={{
          maxWidth: 640, margin: '0 auto', position: 'relative',
        }}>
          <Search
            size={16}
            style={{
              position: 'absolute', left: 16, top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)', pointerEvents: 'none',
            }}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Buscar productos..."
            style={{
              width: '100%',
              borderRadius: 999,
              border: '1px solid var(--border)',
              padding: '12px 20px 12px 40px',
              background: '#fff',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              fontSize: 14,
              color: 'var(--text-primary)',
              outline: 'none',
              boxSizing: 'border-box',
              fontFamily: 'inherit',
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute', right: 14, top: '50%',
                transform: 'translateY(-50%)',
                background: 'var(--border)', border: 'none',
                width: 20, height: 20, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: 'var(--text-muted)',
              }}
            >
              <X size={11} />
            </button>
          )}
        </div>
      </div>

      {/* ── Categorías ──────────────────────────────────────────────────────── */}
      {!searchQuery && (
        <div style={{
          position: 'sticky',
          top: SEARCH_HEIGHT,
          zIndex: 39,
          background: '#F5F5F5',
          paddingBottom: 4,
        }}>
          <div
            className="categories-bar"
            style={{
              display: 'flex',
              gap: 8,
              padding: '8px 16px 10px',
              overflowX: 'auto',
              scrollbarWidth: 'none',
              WebkitOverflowScrolling: 'touch',
            }}
          >
            {restaurant.menu.categories.map(cat => {
              const isActive = activeCategory === cat.id
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    if (cat.id !== activeCategory) {
                      setActiveCategory(cat.id)
                      setAnimKey(k => k + 1)
                    }
                  }}
                  style={{
                    flexShrink: 0,
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', gap: 3,
                    padding: '10px 14px',
                    borderRadius: 16,
                    border: isActive ? 'none' : '1px solid var(--border)',
                    fontWeight: isActive ? 700 : 500,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    background: isActive ? accent : '#fff',
                    color: isActive ? 'white' : 'var(--text-secondary)',
                    boxShadow: isActive ? `0 4px 12px ${accent}40` : 'none',
                    WebkitTapHighlightColor: 'transparent',
                    minWidth: 60,
                  }}
                >
                  <span style={{ fontSize: 24, lineHeight: 1 }}>{cat.emoji}</span>
                  <span style={{ fontSize: 11, whiteSpace: 'nowrap' }}>{cat.name}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Productos ───────────────────────────────────────────────────────── */}
      <div style={{
        maxWidth: 640,
        margin: '0 auto',
        padding: '8px 12px 120px',
      }}>
        {searchQuery && (
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10, paddingLeft: 4 }}>
            {filteredProducts.length} resultado{filteredProducts.length !== 1 ? 's' : ''} para &ldquo;{searchQuery}&rdquo;
          </p>
        )}

        {filteredProducts.length > 0 ? (
          <div key={animKey} className={searchQuery ? '' : 'menu-grid-enter'}>
            {filteredProducts.map((item) => {
              const qty = getQty(item.id)
              const soldOut = item.badge === 'Agotado'
              const badgeInfo = item.badge ? badgeMap[item.badge] : null

              return (
                <div
                  key={item.id}
                  onClick={() => !soldOut && setSelectedItem(item)}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 12,
                    background: '#fff',
                    borderRadius: 16,
                    padding: 14,
                    marginBottom: 8,
                    opacity: soldOut ? 0.55 : 1,
                    boxShadow: qty > 0
                      ? `0 2px 12px ${accent}25`
                      : '0 1px 4px rgba(0,0,0,0.06)',
                    border: `1px solid ${qty > 0 ? accent + '35' : 'transparent'}`,
                    cursor: soldOut ? 'default' : 'pointer',
                    WebkitTapHighlightColor: 'transparent',
                    transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
                  }}
                >
                  {/* Info (left) */}
                  <div style={{ flex: 1, minWidth: 0, paddingRight: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', lineHeight: 1.3 }}>
                        {item.name}
                      </span>
                    </div>

                    {badgeInfo && (
                      <span style={{
                        display: 'inline-block',
                        fontSize: 10, fontWeight: 700,
                        padding: '2px 7px', borderRadius: 6,
                        background: badgeInfo.bg, color: badgeInfo.color,
                        marginBottom: 5,
                      }}>
                        {badgeInfo.label}
                      </span>
                    )}

                    {item.description && (
                      <p style={{
                        fontSize: 12,
                        color: 'var(--text-muted)',
                        margin: '0 0 8px',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical' as React.CSSProperties['WebkitBoxOrient'],
                        overflow: 'hidden',
                        lineHeight: 1.45,
                      }}>
                        {item.description}
                      </p>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: 800, fontSize: 16, color: accent }}>
                        {fmt(item.price)}
                      </span>

                      {/* Qty stepper (inline, when > 0 and no image) */}
                      {!item.image && !soldOut && qty > 0 && (
                        <div
                          onClick={e => e.stopPropagation()}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            background: 'var(--surface-2)', borderRadius: 20, padding: '4px 8px',
                          }}
                        >
                          <button
                            onClick={() => removeItem(item)}
                            style={{
                              width: 26, height: 26, borderRadius: '50%',
                              background: 'var(--border)', border: 'none',
                              color: 'var(--text-primary)', fontSize: 18,
                              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}
                          >−</button>
                          <span style={{ fontWeight: 700, fontSize: 14, minWidth: 18, textAlign: 'center' }}>{qty}</span>
                          <button
                            onClick={() => addItem(item)}
                            style={{
                              width: 26, height: 26, borderRadius: '50%',
                              background: accent, border: 'none', color: 'white', fontSize: 18,
                              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}
                          >+</button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Image (right) + add button */}
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        style={{ width: 90, height: 90, borderRadius: 12, objectFit: 'cover', display: 'block' }}
                      />
                    ) : (
                      <div style={{
                        width: 90, height: 90, borderRadius: 12,
                        background: 'var(--surface-2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 32,
                      }}>🍽️</div>
                    )}

                    {/* + button or qty stepper on image */}
                    {!soldOut && (
                      qty === 0 ? (
                        <button
                          onClick={e => { e.stopPropagation(); addItem(item) }}
                          style={{
                            position: 'absolute', bottom: -6, right: -6,
                            width: 32, height: 32, borderRadius: '50%',
                            background: accent, color: 'white',
                            border: '2.5px solid #fff',
                            fontSize: 22, fontWeight: 300,
                            cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: `0 2px 8px ${accent}60`,
                            transition: 'transform 0.1s ease',
                            WebkitTapHighlightColor: 'transparent',
                          }}
                          onTouchStart={e => (e.currentTarget.style.transform = 'scale(0.88)')}
                          onTouchEnd={e => (e.currentTarget.style.transform = 'scale(1)')}
                        >+</button>
                      ) : (
                        <div
                          onClick={e => e.stopPropagation()}
                          style={{
                            position: 'absolute', bottom: -10, right: -6,
                            display: 'flex', alignItems: 'center', gap: 4,
                            background: '#fff',
                            borderRadius: 20, padding: '3px 6px',
                            boxShadow: `0 2px 8px ${accent}50`,
                            border: `1px solid ${accent}30`,
                          }}
                        >
                          <button
                            onClick={() => removeItem(item)}
                            style={{
                              width: 24, height: 24, borderRadius: '50%',
                              background: accent + '15', border: 'none',
                              color: accent, fontSize: 16,
                              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}
                          >−</button>
                          <span style={{ fontWeight: 700, fontSize: 13, minWidth: 16, textAlign: 'center', color: 'var(--text-primary)' }}>{qty}</span>
                          <button
                            onClick={() => addItem(item)}
                            style={{
                              width: 24, height: 24, borderRadius: '50%',
                              background: accent, border: 'none', color: 'white', fontSize: 16,
                              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}
                          >+</button>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
            <p style={{ fontSize: 36, marginBottom: 12 }}>
              {searchQuery ? '🔍' : (currentCategory?.emoji ?? '🍽️')}
            </p>
            <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 4, color: 'var(--text-secondary)' }}>
              {searchQuery ? 'Sin resultados' : 'Próximamente'}
            </p>
            <p style={{ fontSize: 13 }}>
              {searchQuery ? `No hay productos que coincidan con "${searchQuery}"` : 'Productos en esta categoría próximamente'}
            </p>
          </div>
        )}
      </div>

      {/* ── Cart bar ────────────────────────────────────────────────────────── */}
      {totalItems > 0 && !selectedItem && (
        <button
          onClick={() => setCartOpen(true)}
          style={{
            position: 'fixed',
            bottom: 16,
            left: 16,
            right: 16,
            zIndex: 60,
            display: 'flex',
            alignItems: 'center',
            background: accent,
            color: 'white',
            border: 'none',
            borderRadius: 16,
            padding: '16px 20px',
            cursor: 'pointer',
            boxShadow: `0 8px 32px ${accent}55`,
            WebkitTapHighlightColor: 'transparent',
            maxWidth: 608,
            margin: '0 auto',
          } as React.CSSProperties}
        >
          {/* Left: count badge */}
          <span style={{
            background: '#fff',
            color: accent,
            borderRadius: 20, padding: '2px 10px',
            fontSize: 13, fontWeight: 800,
            minWidth: 28, textAlign: 'center',
          }}>
            {totalItems}
          </span>

          {/* Center: label */}
          <span style={{
            flex: 1, textAlign: 'center',
            fontWeight: 700, fontSize: 15,
          }}>
            Ver pedido
          </span>

          {/* Right: price */}
          <span style={{ fontWeight: 800, fontSize: 15 }}>
            {fmt(totalPrice)}
          </span>
        </button>
      )}

      {/* ── Cart drawer ─────────────────────────────────────────────────────── */}
      {cartOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={() => setCartOpen(false)}
          />

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
            <div className="flex justify-center pt-3 pb-1 md:hidden flex-shrink-0">
              <div className="w-10 h-1 rounded-full" style={{ backgroundColor: 'var(--border)' }} />
            </div>

            <div
              className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0"
              style={{ borderColor: 'var(--border)' }}
            >
              <h2 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>Tu pedido</h2>
              <button
                onClick={() => setCartOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:opacity-70 transition-opacity"
                style={{ backgroundColor: 'var(--surface-2)', color: 'var(--text-secondary)' }}
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3">
              {cart.map(item => (
                <div key={item.id} className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center text-lg"
                    style={{ backgroundColor: 'var(--surface-2)' }}
                  >
                    {item.image
                      ? <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : '🍔'}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate leading-tight" style={{ color: 'var(--text-primary)' }}>
                      {item.name}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      {fmt(item.price)} c/u
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => item.quantity === 1 ? removeAll(item) : removeItem(item)}
                      className="w-7 h-7 rounded-full flex items-center justify-center active:scale-90 border"
                      style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                    >
                      {item.quantity === 1 ? <Trash2 size={12} /> : <Minus size={12} />}
                    </button>
                    <span className="text-sm font-bold w-6 text-center tabular-nums" style={{ color: 'var(--text-primary)' }}>
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => addItem(item)}
                      className="w-7 h-7 rounded-full flex items-center justify-center text-white active:scale-90"
                      style={{ backgroundColor: accent }}
                    >
                      <Plus size={12} />
                    </button>
                  </div>

                  <span className="text-sm font-bold w-16 text-right flex-shrink-0" style={{ color: 'var(--text-primary)' }}>
                    {fmt(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t flex-shrink-0" style={{ borderColor: 'var(--border)' }}>
              <div className="px-5 py-4 flex justify-between items-center">
                <span className="font-black text-xl" style={{ color: 'var(--text-primary)' }}>Total</span>
                <span className="font-black text-xl" style={{ color: accent }}>{fmt(totalPrice)}</span>
              </div>
            </div>

            <div
              className="px-4 pt-3 flex-shrink-0 border-t"
              style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))', borderColor: 'var(--border)' }}
            >
              <button
                onClick={() => { setCartOpen(false); setCheckoutOpen(true) }}
                className="w-full py-4 rounded-2xl font-bold text-lg text-white flex items-center justify-center gap-3 active:scale-[0.98] hover:brightness-110 transition-all"
                style={{ backgroundColor: accent }}
              >
                Hacer pedido →
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── Product detail bottom sheet ─────────────────────────────────────── */}
      {selectedItem && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={() => setSelectedItem(null)}
          />
          <div
            className="fixed bottom-0 left-0 right-0 z-50 animate-slide-up"
            style={{
              background: 'var(--surface)',
              borderRadius: '24px 24px 0 0',
              maxHeight: '80vh',
              overflowY: 'auto',
              maxWidth: 640,
              margin: '0 auto',
              boxShadow: '0 -8px 48px rgba(0,0,0,0.25)',
              borderTop: `2px solid ${accent}`,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 0' }}>
              <div style={{ width: 40, height: 4, borderRadius: 2, background: 'var(--border)' }} />
            </div>

            {selectedItem.image ? (
              <img
                src={selectedItem.image}
                alt={selectedItem.name}
                style={{ width: '100%', height: 220, objectFit: 'cover', marginTop: 12 }}
              />
            ) : (
              <div style={{ width: '100%', height: 160, background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 56, marginTop: 12 }}>
                🍽️
              </div>
            )}

            <div style={{ padding: '20px 20px 32px' }}>
              {selectedItem.badge && (() => {
                const bInfo = badgeMap[selectedItem.badge ?? '']
                return bInfo ? (
                  <span style={{ display: 'inline-block', fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: bInfo.bg, color: bInfo.color, marginBottom: 10 }}>
                    {bInfo.label}
                  </span>
                ) : null
              })()}

              <h2 style={{ fontWeight: 800, fontSize: 22, color: 'var(--text-primary)', marginBottom: 8, lineHeight: 1.2 }}>
                {selectedItem.name}
              </h2>

              {selectedItem.description && (
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 16 }}>
                  {selectedItem.description}
                </p>
              )}

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                <span style={{ fontWeight: 900, fontSize: 26, color: accent }}>
                  {fmt(selectedItem.price)}
                </span>
                {getQty(selectedItem.id) > 0 && (
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                    En carrito: {getQty(selectedItem.id)}
                  </span>
                )}
              </div>

              {getQty(selectedItem.id) === 0 ? (
                <button
                  onClick={() => { addItem(selectedItem); setSelectedItem(null) }}
                  style={{
                    width: '100%', background: accent, color: 'white',
                    border: 'none', borderRadius: 14, padding: '16px',
                    fontSize: 16, fontWeight: 700, cursor: 'pointer',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  Agregar al pedido →
                </button>
              ) : (
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--surface-2)', borderRadius: 12, padding: '8px 12px', flex: 1, justifyContent: 'space-between' }}>
                    <button onClick={() => removeItem(selectedItem)} style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--border)', border: 'none', color: 'var(--text-primary)', fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                    <span style={{ fontWeight: 800, fontSize: 18, minWidth: 28, textAlign: 'center' }}>{getQty(selectedItem.id)}</span>
                    <button onClick={() => addItem(selectedItem)} style={{ width: 36, height: 36, borderRadius: '50%', background: accent, border: 'none', color: 'white', fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                  </div>
                  <button
                    onClick={() => setSelectedItem(null)}
                    style={{ padding: '0 20px', height: 52, background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', cursor: 'pointer', whiteSpace: 'nowrap' }}
                  >
                    Listo ✓
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ── Checkout modal ───────────────────────────────────────────────────── */}
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
