'use client'

import { createContext, useContext, useState, useEffect, useMemo, useCallback, type ReactNode } from 'react'

export type CartItem = {
  product_id: string
  name: string
  price: number
  quantity: number
  image_url?: string | null
  category_name?: string | null
}

type CartCtx = {
  items: CartItem[]
  totalItems: number
  totalPrice: number
  addItem: (item: Omit<CartItem, 'quantity'>) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
}

const CartContext = createContext<CartCtx | null>(null)

export function CartProvider({ children, tenantId }: { children: ReactNode; tenantId: string }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(`cart_${tenantId}`)
      if (raw) setItems(JSON.parse(raw))
    } catch {}
    setHydrated(true)
  }, [tenantId])

  useEffect(() => {
    if (!hydrated) return
    localStorage.setItem(`cart_${tenantId}`, JSON.stringify(items))
  }, [items, tenantId, hydrated])

  const addItem = useCallback((incoming: Omit<CartItem, 'quantity'>) => {
    setItems(prev => {
      const found = prev.find(i => i.product_id === incoming.product_id)
      if (found) return prev.map(i => i.product_id === incoming.product_id ? { ...i, quantity: i.quantity + 1 } : i)
      return [...prev, { ...incoming, quantity: 1 }]
    })
  }, [])

  const removeItem = useCallback((productId: string) => {
    setItems(prev => prev.filter(i => i.product_id !== productId))
  }, [])

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems(prev => prev.filter(i => i.product_id !== productId))
      return
    }
    setItems(prev => prev.map(i => i.product_id === productId ? { ...i, quantity } : i))
  }, [])

  const clearCart = useCallback(() => setItems([]), [])

  const totalItems = useMemo(() => items.reduce((s, i) => s + i.quantity, 0), [items])
  const totalPrice = useMemo(() => items.reduce((s, i) => s + i.price * i.quantity, 0), [items])

  return (
    <CartContext.Provider value={{ items, totalItems, totalPrice, addItem, removeItem, updateQuantity, clearCart }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
