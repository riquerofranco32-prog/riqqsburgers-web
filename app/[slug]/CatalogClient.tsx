'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { X, Minus, Plus, Trash2, Search, ShoppingBag } from 'lucide-react'
import type { Restaurant, MenuItem, RestaurantBrand } from '@/lib/getRestaurant'
import CheckoutModal from '@/components/CheckoutModal'
import InfoRotator from '@/components/menu/InfoRotator'

type CartItem = MenuItem & { quantity: number }

function fmt(n: number) {
  return '$' + n.toLocaleString('es-AR')
}

// Badge system
const BADGE_META: Record<string, { bg: string; color: string; icon: string; label: string }> = {
  'Popular':  { bg: '#fff3cd', color: '#92400e', icon: '🔥', label: 'Popular' },
  'Nuevo':    { bg: '#dbeafe', color: '#1e40af', icon: '✨', label: 'Nuevo' },
  'Promo':    { bg: '#fce7f3', color: '#9d174d', icon: '🏷️', label: 'Promo' },
  'Agotado':  { bg: '#f3f4f6', color: '#6b7280', icon: '😴', label: 'Agotado' },
}

function Badge({ badge }: { badge: string }) {
  const meta = BADGE_META[badge]
  if (!meta) return null
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 3,
      fontSize: 10, fontWeight: 700,
      padding: '2px 7px', borderRadius: 6,
      background: meta.bg, color: meta.color,
    }}>
      {meta.icon} {meta.label}
    </span>
  )
}

export default function CatalogClient({ restaurant }: { restaurant: Restaurant }) {
  const CART_KEY = `cart_${restaurant.slug}`
  const productsRef = useRef<HTMLDivElement>(null)

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
  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0)
  const hasDelivery = restaurant.delivery_cost > 0

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

  // Apply brand CSS variables
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

  // Derived: light/dark text on accent background
  function hexToLuma(hex: string) {
    const c = hex.replace('#', '')
    const r = parseInt(c.slice(0, 2), 16)
    const g = parseInt(c.slice(2, 4), 16)
    const bl = parseInt(c.slice(4, 6), 16)
    return 0.299 * r + 0.587 * g + 0.114 * bl
  }
  const accentIsDark = hexToLuma(accent) < 140
  const onAccent = accentIsDark ? '#fff' : '#111'

  const infoItems = [
    restaurant.schedule  && { icon: '🕐', text: restaurant.schedule },
    restaurant.address   && { icon: '📍', text: restaurant.address },
    restaurant.phone     && { icon: '📞', text: restaurant.phone },
    restaurant.instagram && { icon: '📸', text: `@${restaurant.instagram}` },
  ].filter(Boolean) as { icon: string; text: string }[]

  const currentCategory = restaurant.menu.categories.find(c => c.id === activeCategory)

  const filteredProducts = searchQuery.trim()
    ? restaurant.menu.categories
        .flatMap(c => c.items)
        .filter(i => i.name.toLowerCase().includes(searchQuery.toLowerCase()) || i.description?.toLowerCase().includes(searchQuery.toLowerCase()))
    : currentCategory?.items ?? []

  function changeCategory(catId: string) {
    if (catId === activeCategory) return
    setActiveCategory(catId)
    setAnimKey(k => k + 1)
    // Scroll to top of products area
    productsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const SEARCH_HEIGHT = 60
  const BG = b?.bg ?? '#F4F4F4'
  const SURFACE = b?.surface ?? '#FFFFFF'
  const SURFACE2 = b?.surface2 ?? '#F0F0F0'
  const BORDER = b?.border ?? '#E8E8E8'
  const TEXT_PRIMARY = b?.text_primary ?? '#111111'
  const TEXT_SECONDARY = b?.text_secondary ?? '#555555'
  const TEXT_MUTED = '#999999'

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: BG,
        color: TEXT_PRIMARY,
        '--accent': accent,
        '--surface': SURFACE,
        '--surface-2': SURFACE2,
        '--border': BORDER,
        '--text-primary': TEXT_PRIMARY,
        '--text-secondary': TEXT_SECONDARY,
        '--text-muted': TEXT_MUTED,
      } as React.CSSProperties}
    >

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header style={{ position: 'relative', height: 220, overflow: 'hidden', flexShrink: 0 }}>
        {restaurant.banner_url ? (
          <>
            <img
              src={restaurant.banner_url}
              alt={restaurant.name}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.15) 50%, rgba(0,0,0,0.55) 100%)',
            }} />
          </>
        ) : (
          <div style={{ position: 'absolute', inset: 0, background: accent }}>
            {/* Subtle grain */}
            <div style={{
              position: 'absolute', inset: 0, opacity: 0.08,
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
              backgroundSize: '150px 150px',
            }} />
          </div>
        )}

        {/* Status badge top-right */}
        <div style={{ position: 'absolute', top: 14, right: 16, zIndex: 2 }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '5px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700,
            background: restaurant.is_open ? 'rgba(22,163,74,0.88)' : 'rgba(220,38,38,0.88)',
            color: '#fff', backdropFilter: 'blur(8px)',
            letterSpacing: '0.02em',
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: '50%',
              background: '#fff',
              boxShadow: restaurant.is_open ? '0 0 0 2px rgba(255,255,255,0.4)' : undefined,
              animation: restaurant.is_open ? 'pulse 2s ease-in-out infinite' : undefined,
            }} />
            {restaurant.is_open ? 'Abierto' : 'Cerrado'}
          </span>
        </div>

        {/* Header content */}
        <div style={{
          position: 'relative', zIndex: 1,
          height: '100%', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'flex-end',
          padding: '0 20px 20px',
          maxWidth: 640, margin: '0 auto',
        }}>
          {/* Logo */}
          {restaurant.logo && (
            <div style={{
              width: 60, height: 60, borderRadius: 18,
              overflow: 'hidden', marginBottom: 10,
              border: '2.5px solid rgba(255,255,255,0.4)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
              flexShrink: 0,
            }}>
              <img src={restaurant.logo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          )}

          <h1 style={{
            fontSize: 26, fontWeight: 800, color: '#fff',
            textAlign: 'center', lineHeight: 1.1, marginBottom: 4,
            textShadow: '0 2px 10px rgba(0,0,0,0.35)',
            fontFamily: b?.display_font ? `'${b.display_font}', sans-serif` : 'inherit',
          }}>
            {restaurant.name}
          </h1>

          {restaurant.tagline && (
            <p style={{
              fontSize: 12, color: 'rgba(255,255,255,0.75)',
              fontStyle: 'italic', marginBottom: 10, textAlign: 'center',
              textShadow: '0 1px 4px rgba(0,0,0,0.2)',
            }}>
              {restaurant.tagline}
            </p>
          )}

          {infoItems.length > 0 && (
            <InfoRotator items={infoItems} accent={accent} />
          )}
        </div>
      </header>

      {/* Closed banner */}
      {!restaurant.is_open && (
        <div style={{
          background: 'rgba(220,38,38,0.08)',
          borderBottom: '1px solid rgba(220,38,38,0.15)',
          padding: '10px 16px', textAlign: 'center',
          fontSize: 13, color: '#dc2626', fontWeight: 600,
        }}>
          🔒 El restaurante está cerrado. Podés explorar la carta igualmente.
        </div>
      )}

      {/* ── Search bar ──────────────────────────────────────────────────────── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 40,
        background: BG,
        padding: '10px 16px 6px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      }}>
        <div style={{ maxWidth: 640, margin: '0 auto', position: 'relative' }}>
          <Search
            size={15}
            style={{
              position: 'absolute', left: 14, top: '50%',
              transform: 'translateY(-50%)',
              color: TEXT_MUTED, pointerEvents: 'none',
            }}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Buscar en el menú..."
            style={{
              width: '100%', borderRadius: 999,
              border: `1.5px solid ${BORDER}`,
              padding: '11px 36px 11px 36px',
              background: SURFACE,
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              fontSize: 14, color: TEXT_PRIMARY,
              outline: 'none', boxSizing: 'border-box',
              fontFamily: 'inherit',
              transition: 'border-color 0.2s',
            }}
            onFocus={e => (e.currentTarget.style.borderColor = accent)}
            onBlur={e => (e.currentTarget.style.borderColor = BORDER)}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute', right: 12, top: '50%',
                transform: 'translateY(-50%)',
                background: SURFACE2, border: 'none',
                width: 22, height: 22, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: TEXT_MUTED,
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
          background: BG,
          paddingBottom: 2,
        }}>
          <div
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
              const count = cat.items.length
              return (
                <button
                  key={cat.id}
                  onClick={() => changeCategory(cat.id)}
                  style={{
                    flexShrink: 0,
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', gap: 3,
                    padding: '9px 14px',
                    borderRadius: 14,
                    border: isActive ? 'none' : `1.5px solid ${BORDER}`,
                    fontWeight: isActive ? 700 : 500,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    background: isActive ? accent : SURFACE,
                    color: isActive ? onAccent : TEXT_SECONDARY,
                    boxShadow: isActive ? `0 4px 16px ${accent}45` : '0 1px 3px rgba(0,0,0,0.06)',
                    WebkitTapHighlightColor: 'transparent',
                    minWidth: 56,
                    position: 'relative',
                  }}
                >
                  <span style={{ fontSize: 22, lineHeight: 1 }}>{cat.emoji}</span>
                  <span style={{ fontSize: 10, whiteSpace: 'nowrap' }}>{cat.name}</span>
                  {count > 0 && (
                    <span style={{
                      position: 'absolute', top: -4, right: -4,
                      fontSize: 9, fontWeight: 800,
                      width: 16, height: 16, borderRadius: '50%',
                      background: isActive ? 'rgba(255,255,255,0.3)' : SURFACE2,
                      color: isActive ? onAccent : TEXT_MUTED,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      border: `1.5px solid ${isActive ? 'transparent' : BORDER}`,
                    }}>
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Productos ───────────────────────────────────────────────────────── */}
      <div
        ref={productsRef}
        style={{
          maxWidth: 640,
          margin: '0 auto',
          padding: '8px 12px 120px',
        }}
      >
        {/* Search results label */}
        {searchQuery && (
          <p style={{ fontSize: 12, color: TEXT_MUTED, marginBottom: 10, paddingLeft: 4 }}>
            {filteredProducts.length} resultado{filteredProducts.length !== 1 ? 's' : ''} para &ldquo;{searchQuery}&rdquo;
          </p>
        )}

        {/* Category title when not searching */}
        {!searchQuery && currentCategory && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, paddingLeft: 4 }}>
            <span style={{ fontSize: 20 }}>{currentCategory.emoji}</span>
            <span style={{ fontSize: 16, fontWeight: 700, color: TEXT_PRIMARY }}>{currentCategory.name}</span>
            <span style={{ fontSize: 12, color: TEXT_MUTED }}>({currentCategory.items.length})</span>
          </div>
        )}

        {filteredProducts.length > 0 ? (
          <div key={animKey} className={searchQuery ? '' : 'menu-grid-enter'}>
            {filteredProducts.map((item) => {
              const qty = getQty(item.id)
              const soldOut = item.badge === 'Agotado'

              return (
                <div
                  key={item.id}
                  onClick={() => !soldOut && setSelectedItem(item)}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 12,
                    background: SURFACE,
                    borderRadius: 16,
                    padding: 14,
                    marginBottom: 8,
                    opacity: soldOut ? 0.55 : 1,
                    boxShadow: qty > 0
                      ? `0 3px 16px ${accent}22`
                      : '0 1px 4px rgba(0,0,0,0.06)',
                    border: `1.5px solid ${qty > 0 ? accent + '30' : BORDER}`,
                    cursor: soldOut ? 'default' : 'pointer',
                    WebkitTapHighlightColor: 'transparent',
                    transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
                  }}
                >
                  {/* Info (left) */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ marginBottom: 3 }}>
                      <span style={{ fontWeight: 700, fontSize: 15, color: TEXT_PRIMARY, lineHeight: 1.3 }}>
                        {item.name}
                      </span>
                    </div>

                    {item.badge && item.badge !== '' && (
                      <div style={{ marginBottom: 5 }}>
                        <Badge badge={item.badge} />
                      </div>
                    )}

                    {item.description && (
                      <p style={{
                        fontSize: 12, color: TEXT_SECONDARY,
                        margin: '0 0 8px', lineHeight: 1.45,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical' as React.CSSProperties['WebkitBoxOrient'],
                        overflow: 'hidden',
                      }}>
                        {item.description}
                      </p>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: 800, fontSize: 16, color: accent }}>
                        {fmt(item.price)}
                      </span>

                      {/* Inline stepper when no image */}
                      {!item.image && !soldOut && qty > 0 && (
                        <div
                          onClick={e => e.stopPropagation()}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            background: SURFACE2, borderRadius: 20, padding: '4px 8px',
                            border: `1px solid ${BORDER}`,
                          }}
                        >
                          <button
                            onClick={() => removeItem(item)}
                            style={{
                              width: 26, height: 26, borderRadius: '50%',
                              background: BORDER, border: 'none',
                              color: TEXT_PRIMARY, fontSize: 18,
                              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}
                          >−</button>
                          <span style={{ fontWeight: 700, fontSize: 14, minWidth: 18, textAlign: 'center' }}>{qty}</span>
                          <button
                            onClick={() => addItem(item)}
                            style={{
                              width: 26, height: 26, borderRadius: '50%',
                              background: accent, border: 'none', color: onAccent, fontSize: 18,
                              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}
                          >+</button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Image + add button (right) */}
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
                        background: `linear-gradient(135deg, ${accent}18, ${accent}08)`,
                        border: `1.5px solid ${accent}18`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 34,
                      }}>
                        {currentCategory?.emoji ?? '🍽️'}
                      </div>
                    )}

                    {/* + button or qty stepper on image */}
                    {!soldOut && (
                      qty === 0 ? (
                        <button
                          onClick={e => { e.stopPropagation(); addItem(item) }}
                          style={{
                            position: 'absolute', bottom: -7, right: -7,
                            width: 34, height: 34, borderRadius: '50%',
                            background: accent, color: onAccent,
                            border: `3px solid ${SURFACE}`,
                            fontSize: 22, fontWeight: 300,
                            cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: `0 3px 10px ${accent}55`,
                            transition: 'transform 0.12s ease',
                            WebkitTapHighlightColor: 'transparent',
                          }}
                          onTouchStart={e => (e.currentTarget.style.transform = 'scale(0.88)')}
                          onTouchEnd={e => (e.currentTarget.style.transform = 'scale(1)')}
                          onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.92)')}
                          onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
                        >+</button>
                      ) : (
                        <div
                          onClick={e => e.stopPropagation()}
                          style={{
                            position: 'absolute', bottom: -11, right: -7,
                            display: 'flex', alignItems: 'center', gap: 4,
                            background: SURFACE,
                            borderRadius: 20, padding: '3px 6px',
                            boxShadow: `0 2px 10px ${accent}40`,
                            border: `1.5px solid ${accent}30`,
                          }}
                        >
                          <button
                            onClick={() => removeItem(item)}
                            style={{
                              width: 24, height: 24, borderRadius: '50%',
                              background: accent + '18', border: 'none',
                              color: accent, fontSize: 16,
                              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontWeight: 700,
                            }}
                          >−</button>
                          <span style={{ fontWeight: 800, fontSize: 13, minWidth: 16, textAlign: 'center', color: TEXT_PRIMARY }}>{qty}</span>
                          <button
                            onClick={() => addItem(item)}
                            style={{
                              width: 24, height: 24, borderRadius: '50%',
                              background: accent, border: 'none', color: onAccent, fontSize: 16,
                              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontWeight: 700,
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
          <div style={{ textAlign: 'center', padding: '64px 0', color: TEXT_MUTED }}>
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: SURFACE2, margin: '0 auto 16px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 32,
            }}>
              {searchQuery ? '🔍' : (currentCategory?.emoji ?? '🍽️')}
            </div>
            <p style={{ fontSize: 15, fontWeight: 700, marginBottom: 6, color: TEXT_SECONDARY }}>
              {searchQuery ? 'Sin resultados' : 'Próximamente'}
            </p>
            <p style={{ fontSize: 13 }}>
              {searchQuery
                ? `No encontramos productos para "${searchQuery}"`
                : 'Estamos cargando esta categoría'
              }
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
            bottom: 16, left: 16, right: 16,
            zIndex: 60,
            display: 'flex', alignItems: 'center',
            background: accent, color: onAccent,
            border: 'none', borderRadius: 18,
            padding: '15px 18px',
            cursor: 'pointer',
            boxShadow: `0 8px 32px ${accent}55`,
            WebkitTapHighlightColor: 'transparent',
            maxWidth: 608, margin: '0 auto',
            transition: 'transform 0.1s',
          } as React.CSSProperties}
          onTouchStart={e => (e.currentTarget.style.transform = 'scale(0.98)')}
          onTouchEnd={e => (e.currentTarget.style.transform = 'scale(1)')}
        >
          {/* Count badge */}
          <span style={{
            background: 'rgba(255,255,255,0.25)',
            borderRadius: 20, padding: '3px 10px',
            fontSize: 13, fontWeight: 800,
            minWidth: 32, textAlign: 'center',
          }}>
            {totalItems}
          </span>

          {/* Label */}
          <span style={{
            flex: 1, textAlign: 'center',
            fontWeight: 700, fontSize: 15,
          }}>
            Ver pedido
          </span>

          {/* Price */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <span style={{ fontWeight: 800, fontSize: 15 }}>
              {fmt(subtotal)}
            </span>
            {hasDelivery && (
              <span style={{ fontSize: 10, opacity: 0.75, fontWeight: 500 }}>
                + envío {fmt(restaurant.delivery_cost)}
              </span>
            )}
          </div>
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
                       flex flex-col max-h-[88vh] md:max-h-full
                       rounded-t-3xl md:rounded-none md:rounded-l-3xl
                       shadow-2xl"
            style={{
              backgroundColor: SURFACE,
              borderTop: `2px solid ${accent}`,
              animation: 'slideUp 0.3s cubic-bezier(0.22,1,0.36,1)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 4px' }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: BORDER }} />
            </div>

            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 20px 16px',
              borderBottom: `1px solid ${BORDER}`,
              flexShrink: 0,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ShoppingBag size={18} style={{ color: accent }} />
                <h2 style={{ fontWeight: 800, fontSize: 17, color: TEXT_PRIMARY }}>Tu pedido</h2>
              </div>
              <button
                onClick={() => setCartOpen(false)}
                style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: SURFACE2, border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: TEXT_SECONDARY,
                }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {cart.map(item => (
                <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: 12, overflow: 'hidden',
                    flexShrink: 0, background: SURFACE2,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18,
                  }}>
                    {item.image
                      ? <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : currentCategory?.emoji ?? '🍽️'
                    }
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: TEXT_PRIMARY, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.name}
                    </p>
                    <p style={{ fontSize: 11, color: TEXT_MUTED }}>
                      {fmt(item.price)} c/u
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    <button
                      onClick={() => item.quantity === 1 ? removeAll(item) : removeItem(item)}
                      style={{
                        width: 28, height: 28, borderRadius: '50%',
                        background: SURFACE2, border: `1px solid ${BORDER}`,
                        color: TEXT_SECONDARY, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      {item.quantity === 1 ? <Trash2 size={11} /> : <Minus size={11} />}
                    </button>
                    <span style={{ fontSize: 14, fontWeight: 800, minWidth: 20, textAlign: 'center', color: TEXT_PRIMARY, fontVariantNumeric: 'tabular-nums' }}>
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => addItem(item)}
                      style={{
                        width: 28, height: 28, borderRadius: '50%',
                        background: accent, border: 'none', color: onAccent,
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <Plus size={11} />
                    </button>
                  </div>

                  <span style={{ fontSize: 13, fontWeight: 700, minWidth: 64, textAlign: 'right', color: TEXT_PRIMARY }}>
                    {fmt(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div style={{ borderTop: `1px solid ${BORDER}`, flexShrink: 0, padding: '12px 20px' }}>
              {hasDelivery && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 13, color: TEXT_MUTED }}>Envío</span>
                  <span style={{ fontSize: 13, color: TEXT_SECONDARY }}>{fmt(restaurant.delivery_cost)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 800, fontSize: 18, color: TEXT_PRIMARY }}>Total</span>
                <span style={{ fontWeight: 900, fontSize: 20, color: accent }}>
                  {fmt(subtotal + (hasDelivery ? restaurant.delivery_cost : 0))}
                </span>
              </div>
            </div>

            <div style={{
              padding: `12px 16px max(16px, env(safe-area-inset-bottom))`,
              borderTop: `1px solid ${BORDER}`, flexShrink: 0,
            }}>
              <button
                onClick={() => { setCartOpen(false); setCheckoutOpen(true) }}
                style={{
                  width: '100%', padding: '16px', borderRadius: 16,
                  background: accent, color: onAccent,
                  border: 'none', fontSize: 16, fontWeight: 800,
                  cursor: 'pointer', letterSpacing: '0.01em',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                Hacer pedido →
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── Product detail sheet ─────────────────────────────────────────────── */}
      {selectedItem && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={() => setSelectedItem(null)}
          />
          <div
            className="fixed bottom-0 left-0 right-0 z-50"
            style={{
              background: SURFACE,
              borderRadius: '24px 24px 0 0',
              maxHeight: '82vh',
              overflowY: 'auto',
              maxWidth: 640,
              margin: '0 auto',
              boxShadow: '0 -8px 48px rgba(0,0,0,0.2)',
              borderTop: `2px solid ${accent}`,
              animation: 'slideUp 0.3s cubic-bezier(0.22,1,0.36,1)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 0' }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: BORDER }} />
            </div>

            {selectedItem.image ? (
              <img
                src={selectedItem.image}
                alt={selectedItem.name}
                style={{ width: '100%', height: 220, objectFit: 'cover', marginTop: 12 }}
              />
            ) : (
              <div style={{
                width: '100%', height: 150, marginTop: 12,
                background: `linear-gradient(135deg, ${accent}20, ${accent}08)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 64,
              }}>
                {currentCategory?.emoji ?? '🍽️'}
              </div>
            )}

            <div style={{ padding: '20px 20px 32px' }}>
              {selectedItem.badge && <div style={{ marginBottom: 10 }}><Badge badge={selectedItem.badge} /></div>}

              <h2 style={{ fontWeight: 800, fontSize: 22, color: TEXT_PRIMARY, marginBottom: 8, lineHeight: 1.2 }}>
                {selectedItem.name}
              </h2>

              {selectedItem.description && (
                <p style={{ fontSize: 14, color: TEXT_SECONDARY, lineHeight: 1.65, marginBottom: 16 }}>
                  {selectedItem.description}
                </p>
              )}

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                <span style={{ fontWeight: 900, fontSize: 28, color: accent }}>
                  {fmt(selectedItem.price)}
                </span>
                {getQty(selectedItem.id) > 0 && (
                  <span style={{ fontSize: 12, color: TEXT_MUTED, background: SURFACE2, borderRadius: 8, padding: '4px 10px' }}>
                    En carrito: {getQty(selectedItem.id)}
                  </span>
                )}
              </div>

              {getQty(selectedItem.id) === 0 ? (
                <button
                  onClick={() => { addItem(selectedItem); setSelectedItem(null) }}
                  style={{
                    width: '100%', background: accent, color: onAccent,
                    border: 'none', borderRadius: 14, padding: '16px',
                    fontSize: 16, fontWeight: 700, cursor: 'pointer',
                    WebkitTapHighlightColor: 'transparent',
                    letterSpacing: '0.01em',
                  }}
                >
                  Agregar al pedido →
                </button>
              ) : (
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    background: SURFACE2, borderRadius: 12, padding: '8px 14px',
                    flex: 1, justifyContent: 'space-between',
                    border: `1px solid ${BORDER}`,
                  }}>
                    <button onClick={() => removeItem(selectedItem)} style={{ width: 36, height: 36, borderRadius: '50%', background: BORDER, border: 'none', color: TEXT_PRIMARY, fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>−</button>
                    <span style={{ fontWeight: 800, fontSize: 18, minWidth: 28, textAlign: 'center', color: TEXT_PRIMARY }}>{getQty(selectedItem.id)}</span>
                    <button onClick={() => addItem(selectedItem)} style={{ width: 36, height: 36, borderRadius: '50%', background: accent, border: 'none', color: onAccent, fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>+</button>
                  </div>
                  <button
                    onClick={() => setSelectedItem(null)}
                    style={{
                      padding: '0 20px', height: 52,
                      background: SURFACE2, border: `1px solid ${BORDER}`,
                      borderRadius: 12, fontSize: 14, fontWeight: 600,
                      color: TEXT_SECONDARY, cursor: 'pointer', whiteSpace: 'nowrap',
                    }}
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

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(30px); opacity: 0.8; }
          to   { transform: translateY(0); opacity: 1; }
        }
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(255,255,255,0.5); }
          50%       { box-shadow: 0 0 0 4px rgba(255,255,255,0); }
        }
        .menu-grid-enter > * {
          animation: menuFadeIn 0.2s ease both;
        }
        @keyframes menuFadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
