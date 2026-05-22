'use client'

import { useState } from 'react'
import { createSupabaseBrowser } from '@/lib/supabase'

export interface CheckoutCartItem {
  id: string
  name: string
  price: number
  quantity: number
}

interface CheckoutModalProps {
  isOpen: boolean
  onClose: () => void
  cart: CheckoutCartItem[]
  onClearCart: () => void
  tenant: {
    id: string
    name: string
    slug: string
    whatsapp_number: string
    delivery_cost?: number
    primary_color?: string
  }
}

type DeliveryType = 'pickup' | 'delivery'
type PaymentMethod = 'cash' | 'transfer'

function generateRef(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export default function CheckoutModal({ isOpen, onClose, cart, onClearCart, tenant }: CheckoutModalProps) {
  const accent = tenant.primary_color || '#FF6B35'
  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0)

  const [loading, setLoading] = useState(false)
  const [orderRef, setOrderRef] = useState('')
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const [form, setForm] = useState({
    name: '',
    lastname: '',
    phone: '',
    address: '',
    notes: '',
    delivery: 'pickup' as DeliveryType,
    payment: 'cash' as PaymentMethod,
  })

  const deliveryCost = form.delivery === 'delivery' ? (tenant.delivery_cost ?? 0) : 0
  const grandTotal = subtotal + deliveryCost

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
    setError('')
  }

  async function handleConfirm() {
    if (!form.name || !form.lastname) { setError('Nombre y apellido son obligatorios'); return }
    if (form.delivery === 'delivery' && !form.address) { setError('Ingresá la dirección de entrega'); return }

    setLoading(true)
    setError('')

    const ref = generateRef()
    const supabase = createSupabaseBrowser()

    const { error: dbError } = await supabase.from('orders').insert({
      tenant_id: tenant.id,
      order_ref: ref,
      customer_name: `${form.name} ${form.lastname}`.trim(),
      customer_phone: form.phone || null,
      customer_address: form.delivery === 'delivery' ? form.address : null,
      delivery_type: form.delivery,
      payment_method: form.payment,
      notes: form.notes || null,
      items: cart.map(i => ({
        product_id: i.id,
        name: i.name,
        price: i.price,
        quantity: i.quantity,
      })),
      subtotal,
      delivery_cost: deliveryCost,
      total: grandTotal,
      status: 'pending',
    })

    if (dbError) {
      setError(`Error: ${dbError.message} (code: ${dbError.code})`)
      setLoading(false)
      return
    }

    const lines = [
      `🛒 *Nuevo pedido — ${tenant.name}*`,
      `📋 Ref: *${ref}*`,
      ``,
      `👤 *Cliente*`,
      `Nombre: ${form.name} ${form.lastname}`,
      form.phone ? `Tel: ${form.phone}` : null,
      ``,
      `📦 *Pedido*`,
      ...cart.map(i => `• ${i.name} x${i.quantity} — $${(i.price * i.quantity).toLocaleString('es-AR')}`),
      ``,
      form.delivery === 'delivery'
        ? `🚚 *Delivery* a: ${form.address}`
        : `🏠 *Retira en local*`,
      `💳 Pago: ${form.payment === 'cash' ? 'Efectivo' : 'Transferencia'}`,
      deliveryCost > 0 ? `🛵 Envío: $${deliveryCost.toLocaleString('es-AR')}` : null,
      ``,
      `💰 *Total: $${grandTotal.toLocaleString('es-AR')}*`,
      form.notes ? `\n📝 Nota: ${form.notes}` : null,
    ].filter(Boolean).join('\n')

    const phone = tenant.whatsapp_number.replace(/\D/g, '')
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(lines)}`, '_blank')

    setOrderRef(ref)
    setDone(true)
    onClearCart()
    setLoading(false)
  }

  if (!isOpen) return null

  const inputStyle = {
    width: '100%',
    background: '#1a1a1a',
    border: '1px solid #2a2a2a',
    borderRadius: 10,
    padding: '11px 14px',
    color: 'white',
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box' as const,
    transition: 'border-color 0.15s',
  }

  const labelStyle = {
    display: 'block' as const,
    color: '#888',
    fontSize: 11,
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.07em',
    marginBottom: 6,
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        background: '#111',
        borderRadius: '20px 20px 0 0',
        width: '100%',
        maxWidth: 480,
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: '24px 20px 32px',
      }}>

        {/* Handle */}
        <div style={{ width: 40, height: 4, background: '#333', borderRadius: 2, margin: '0 auto 20px' }} />

        {done ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
            <h2 style={{ color: 'white', fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
              ¡Pedido enviado!
            </h2>
            <p style={{ color: '#888', fontSize: 14, marginBottom: 20 }}>
              Tu número de pedido es
            </p>
            <div style={{
              background: '#1a1a1a',
              border: `2px solid ${accent}`,
              borderRadius: 12,
              padding: '16px 24px',
              display: 'inline-block',
              marginBottom: 24,
            }}>
              <span style={{ color: accent, fontSize: 28, fontWeight: 800, letterSpacing: '0.15em' }}>
                {orderRef}
              </span>
            </div>
            <p style={{ color: '#666', fontSize: 13, marginBottom: 28 }}>
              Guardá este código para hacer el seguimiento de tu pedido
            </p>
            <button
              onClick={onClose}
              style={{
                background: accent, color: 'white',
                border: 'none', borderRadius: 10,
                padding: '12px 32px', fontSize: 15,
                fontWeight: 600, cursor: 'pointer',
              }}
            >
              Cerrar
            </button>
          </div>
        ) : (
          <>
            <h2 style={{ color: 'white', fontSize: 20, fontWeight: 700, marginBottom: 24 }}>
              Completá tu pedido
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Nombre y apellido */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Nombre *</label>
                  <input
                    style={inputStyle}
                    placeholder="Juan"
                    value={form.name}
                    onChange={e => set('name', e.target.value)}
                    onFocus={e => (e.target.style.borderColor = accent)}
                    onBlur={e => (e.target.style.borderColor = '#2a2a2a')}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Apellido *</label>
                  <input
                    style={inputStyle}
                    placeholder="García"
                    value={form.lastname}
                    onChange={e => set('lastname', e.target.value)}
                    onFocus={e => (e.target.style.borderColor = accent)}
                    onBlur={e => (e.target.style.borderColor = '#2a2a2a')}
                  />
                </div>
              </div>

              {/* Teléfono */}
              <div>
                <label style={labelStyle}>Teléfono</label>
                <input
                  style={inputStyle}
                  placeholder="11 1234-5678"
                  type="tel"
                  value={form.phone}
                  onChange={e => set('phone', e.target.value)}
                  onFocus={e => (e.target.style.borderColor = accent)}
                  onBlur={e => (e.target.style.borderColor = '#2a2a2a')}
                />
              </div>

              {/* Delivery / Pickup */}
              <div>
                <label style={labelStyle}>¿Cómo lo recibís? *</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {([
                    { value: 'pickup' as DeliveryType, label: '🏠 Retiro en local', sub: 'Gratis' },
                    {
                      value: 'delivery' as DeliveryType,
                      label: '🚚 Delivery',
                      sub: (tenant.delivery_cost ?? 0) > 0 ? `+$${(tenant.delivery_cost ?? 0).toLocaleString('es-AR')}` : 'Consultar',
                    },
                  ]).map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => set('delivery', opt.value)}
                      style={{
                        padding: '12px',
                        borderRadius: 10,
                        border: `2px solid ${form.delivery === opt.value ? accent : '#2a2a2a'}`,
                        background: form.delivery === opt.value ? `${accent}18` : 'transparent',
                        color: form.delivery === opt.value ? accent : '#888',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.15s',
                      }}
                    >
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{opt.label}</div>
                      <div style={{ fontSize: 11, marginTop: 2, opacity: 0.7 }}>{opt.sub}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Dirección — solo si delivery */}
              {form.delivery === 'delivery' && (
                <div>
                  <label style={labelStyle}>Dirección de entrega *</label>
                  <input
                    style={inputStyle}
                    placeholder="Av. Corrientes 1234, CABA"
                    value={form.address}
                    onChange={e => set('address', e.target.value)}
                    onFocus={e => (e.target.style.borderColor = accent)}
                    onBlur={e => (e.target.style.borderColor = '#2a2a2a')}
                  />
                </div>
              )}

              {/* Método de pago */}
              <div>
                <label style={labelStyle}>Método de pago *</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {([
                    { value: 'cash' as PaymentMethod, label: '💵 Efectivo' },
                    { value: 'transfer' as PaymentMethod, label: '📲 Transferencia' },
                  ]).map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => set('payment', opt.value)}
                      style={{
                        padding: '12px',
                        borderRadius: 10,
                        border: `2px solid ${form.payment === opt.value ? accent : '#2a2a2a'}`,
                        background: form.payment === opt.value ? `${accent}18` : 'transparent',
                        color: form.payment === opt.value ? accent : '#888',
                        cursor: 'pointer',
                        fontSize: 13,
                        fontWeight: 600,
                        transition: 'all 0.15s',
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notas */}
              <div>
                <label style={labelStyle}>Notas / aclaraciones</label>
                <textarea
                  style={{ ...inputStyle, resize: 'none', minHeight: 72 }}
                  placeholder="Sin cebolla, extra salsa..."
                  value={form.notes}
                  onChange={e => set('notes', e.target.value)}
                  onFocus={e => (e.target.style.borderColor = accent)}
                  onBlur={e => (e.target.style.borderColor = '#2a2a2a')}
                />
              </div>

              {/* Resumen */}
              <div style={{
                background: '#1a1a1a',
                borderRadius: 12,
                padding: '16px',
                border: '1px solid #2a2a2a',
              }}>
                {cart.map(i => (
                  <div key={i.id} style={{
                    display: 'flex', justifyContent: 'space-between',
                    color: '#ccc', fontSize: 13, marginBottom: 6,
                  }}>
                    <span>{i.name} x{i.quantity}</span>
                    <span>${(i.price * i.quantity).toLocaleString('es-AR')}</span>
                  </div>
                ))}
                {deliveryCost > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#888', fontSize: 13, marginBottom: 6 }}>
                    <span>🛵 Envío</span>
                    <span>${deliveryCost.toLocaleString('es-AR')}</span>
                  </div>
                )}
                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  color: 'white', fontWeight: 700, fontSize: 16,
                  borderTop: '1px solid #2a2a2a', paddingTop: 10, marginTop: 6,
                }}>
                  <span>Total</span>
                  <span style={{ color: accent }}>${grandTotal.toLocaleString('es-AR')}</span>
                </div>
              </div>

              {error && (
                <p style={{ color: '#f87171', fontSize: 13, textAlign: 'center' }}>{error}</p>
              )}

              <button
                onClick={handleConfirm}
                disabled={loading}
                style={{
                  width: '100%',
                  background: loading ? '#333' : accent,
                  color: 'white',
                  fontWeight: 700,
                  fontSize: 16,
                  padding: '16px',
                  borderRadius: 12,
                  border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                {loading ? 'Enviando...' : '📲 Confirmar y enviar por WhatsApp'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
