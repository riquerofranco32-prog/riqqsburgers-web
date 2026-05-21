'use client'

import { useState } from 'react'
import type { Tenant, OrderItem } from '@/types/supabase'
import type { Product } from '@/types/supabase'
import { supabase } from '@/lib/supabase'

type CartItem = { product: Product; cantidad: number }

// ── Types ─────────────────────────────────────────────────────────────────────

interface FormState {
  nombre: string
  telefono: string
  tipoServicio: 'domicilio' | 'retiro'
  direccion: string
  metodoPago: 'mercadopago' | 'efectivo'
}

interface FormErrors {
  nombre?: string
  telefono?: string
  direccion?: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function randomOrderId() {
  return 'RQ-' + Math.floor(1000000 + Math.random() * 9000000)
}

function fmtARS(n: number) {
  return '$ ' + n.toLocaleString('es-AR')
}

function buildMessage(form: FormState, cart: CartItem[], tenant: Tenant): string {
  const now = new Date()
  const fecha = now.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  const hora = now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
  const orderId = randomOrderId()

  const subtotal = cart.reduce((acc, c) => acc + c.product.price * c.cantidad, 0)
  const envio = form.tipoServicio === 'domicilio' ? tenant.delivery_cost : 0
  const total = subtotal + envio

  const productos = cart
    .map(c => `X${c.cantidad} ${c.product.name}  ${fmtARS(c.product.price * c.cantidad)}`)
    .join('\n')

  const mpLine = form.metodoPago === 'mercadopago' ? `Mercado Pago ${total}` : ''

  let msg = `Vengo de ${tenant.name}
${orderId}
🗓️ ${fecha} ⏰ ${hora}
Tipo de servicio: ${form.tipoServicio === 'domicilio' ? 'Domicilio' : 'Retiro en local'}
Nombre: ${form.nombre}
Teléfono: ${form.telefono}`

  if (form.tipoServicio === 'domicilio') msg += `\nDirección: ${form.direccion}`

  msg += `
📝 Productos
${productos}

Subtotal: ${fmtARS(subtotal)}`

  if (form.tipoServicio === 'domicilio') msg += `\nEntrega: ${fmtARS(tenant.delivery_cost)}`

  msg += `\nTotal: ${fmtARS(total)}
💲 Pago
Estado del pago: No pagado
Total a pagar: ${fmtARS(total)}`

  if (form.metodoPago === 'mercadopago') msg += `\n${mpLine}`

  msg += `\n👆 Envianos este mensaje ahora. En cuanto lo recibamos te estamos atendiendo.`

  return msg
}

async function saveOrder(
  form: FormState,
  cart: CartItem[],
  tenant: Tenant,
  orderRef: string
) {
  const subtotal = cart.reduce((acc, c) => acc + c.product.price * c.cantidad, 0)
  const deliveryCost = form.tipoServicio === 'domicilio' ? tenant.delivery_cost : 0
  const total = subtotal + deliveryCost

  const items: OrderItem[] = cart.map(c => ({
    product_id: c.product.id,
    name: c.product.name,
    price: c.product.price,
    quantity: c.cantidad,
  }))

  const { error } = await supabase.from('orders').insert({
    tenant_id: tenant.id,
    order_ref: orderRef,
    customer_name: form.nombre,
    customer_phone: form.telefono,
    delivery_type: form.tipoServicio,
    address: form.direccion || null,
    payment_method: form.metodoPago,
    items,
    subtotal,
    delivery_cost: deliveryCost,
    total,
  })

  if (error) console.error('Error guardando orden:', error)
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-semibold text-[#888] uppercase tracking-wide mb-1.5">{children}</p>
}

function Input({
  type = 'text', value, onChange, placeholder, error, prefix,
}: {
  type?: string; value: string; onChange: (v: string) => void
  placeholder?: string; error?: string; prefix?: string
}) {
  return (
    <div>
      <div className={`flex items-center bg-[#111] border rounded-xl overflow-hidden transition-colors ${error ? 'border-red-500' : 'border-[#2a2a2a] focus-within:border-[var(--color-accent)]'}`}>
        {prefix && <span className="pl-4 pr-1 text-[#555] text-sm select-none">{prefix}</span>}
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 bg-transparent px-4 py-3 text-white text-sm placeholder-[#444] outline-none min-h-[48px]"
        />
      </div>
      {error && <p className="text-red-400 text-xs mt-1 ml-1">{error}</p>}
    </div>
  )
}

function ToggleGroup<T extends string>({
  options, value, onChange, accentColor,
}: {
  options: { value: T; label: string; icon: string }[]
  value: T
  onChange: (v: T) => void
  accentColor?: string
}) {
  return (
    <div className="flex gap-2">
      {options.map(o => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl text-sm font-semibold border transition-all min-h-[48px] ${
            value === o.value
              ? 'text-black'
              : 'bg-transparent text-[#888] border-[#2a2a2a] hover:text-white'
          }`}
          style={value === o.value ? {
            backgroundColor: accentColor ?? '#f5c518',
            borderColor: accentColor ?? '#f5c518',
          } : undefined}
        >
          <span>{o.icon}</span> {o.label}
        </button>
      ))}
    </div>
  )
}

// ── Success view ──────────────────────────────────────────────────────────────

function SuccessView({ total, metodoPago, mpLink, onClose }: {
  total: number; metodoPago: string; mpLink: string | null; onClose: () => void
}) {
  return (
    <div className="flex flex-col items-center gap-5 py-6 text-center">
      <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center text-4xl">🎉</div>
      <div>
        <h3 className="font-bold text-xl font-[family-name:var(--font-syne)]">¡Pedido enviado!</h3>
        <p className="text-[#888] text-sm mt-1">Ya abrimos WhatsApp con tu pedido armado. Solo tocá enviar.</p>
      </div>

      {metodoPago === 'mercadopago' && mpLink && (
        <div className="w-full bg-[#009ee3]/10 border border-[#009ee3]/30 rounded-2xl p-4 flex flex-col gap-3">
          <p className="text-sm font-semibold text-[#009ee3]">Ahora completá el pago 👇</p>
          <p className="text-[#888] text-xs">Total a pagar: <span className="text-white font-bold">{fmtARS(total)}</span></p>
          <a
            href={mpLink}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-[#009ee3] text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 hover:bg-[#0087c7] active:scale-95 transition-all"
          >
            Pagar con Mercado Pago
          </a>
        </div>
      )}

      <button onClick={onClose} className="text-[#888] text-sm hover:text-white transition-colors">
        Cerrar
      </button>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export function CheckoutModal({ cart, tenant, onClose }: {
  cart: CartItem[]
  tenant: Tenant
  onClose: () => void
}) {
  const [form, setForm] = useState<FormState>({
    nombre: '', telefono: '', tipoServicio: 'domicilio',
    direccion: '', metodoPago: 'mercadopago',
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [submitted, setSubmitted] = useState(false)
  const [orderTotal, setOrderTotal] = useState(0)

  const subtotal = cart.reduce((acc, c) => acc + c.product.price * c.cantidad, 0)
  const envio = form.tipoServicio === 'domicilio' ? tenant.delivery_cost : 0
  const total = subtotal + envio

  function set<K extends keyof FormState>(key: K, val: FormState[K]) {
    setForm(f => ({ ...f, [key]: val }))
    if (key in errors) setErrors(e => ({ ...e, [key]: undefined }))
  }

  function validate(): boolean {
    const errs: FormErrors = {}
    if (!form.nombre.trim()) errs.nombre = 'El nombre es requerido'
    if (!form.telefono.trim()) errs.telefono = 'El teléfono es requerido'
    if (form.tipoServicio === 'domicilio' && !form.direccion.trim())
      errs.direccion = 'Ingresá tu dirección'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit() {
    if (!validate()) return
    const orderRef = randomOrderId()
    const msg = buildMessage(form, cart, tenant)

    // Guardar en Supabase (sin bloquear el flujo si falla)
    saveOrder(form, cart, tenant, orderRef)

    window.open(`https://wa.me/${tenant.whatsapp_number}?text=${encodeURIComponent(msg)}`, '_blank')
    setOrderTotal(total)
    setSubmitted(true)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ '--color-accent': tenant.primary_color } as React.CSSProperties}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-[#1a1714] w-full max-w-lg rounded-t-3xl flex flex-col max-h-[92dvh] shadow-2xl">
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-[#333]" />
        </div>

        <div className="flex items-center justify-between px-5 py-3 border-b border-[#2a2a2a] flex-shrink-0">
          <h2 className="font-bold text-lg font-[family-name:var(--font-syne)]">
            {submitted ? 'Pedido confirmado' : 'Confirmar pedido'}
          </h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-[#111] flex items-center justify-center text-[#888] hover:text-white transition-colors">
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {submitted ? (
            <SuccessView
              total={orderTotal}
              metodoPago={form.metodoPago}
              mpLink={tenant.mp_link}
              onClose={onClose}
            />
          ) : (
            <div className="flex flex-col gap-5 pb-4">

              {/* Order summary */}
              <div className="bg-[#111] rounded-2xl p-4 flex flex-col gap-2 border border-[#2a2a2a]">
                {cart.map(c => (
                  <div key={c.product.id} className="flex justify-between text-sm">
                    <span className="text-[#aaa]">{c.cantidad}× {c.product.name}</span>
                    <span className="text-white font-semibold">{fmtARS(c.product.price * c.cantidad)}</span>
                  </div>
                ))}
                <div className="border-t border-[#2a2a2a] mt-1 pt-2 flex flex-col gap-1">
                  <div className="flex justify-between text-sm text-[#888]">
                    <span>Subtotal</span><span>{fmtARS(subtotal)}</span>
                  </div>
                  {form.tipoServicio === 'domicilio' && (
                    <div className="flex justify-between text-sm text-[#888]">
                      <span>Envío</span><span>{fmtARS(tenant.delivery_cost)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-base mt-1">
                    <span>Total</span>
                    <span style={{ color: tenant.primary_color }}>{fmtARS(total)}</span>
                  </div>
                </div>
              </div>

              {/* Nombre */}
              <div>
                <Label>Nombre completo</Label>
                <Input value={form.nombre} onChange={v => set('nombre', v)} placeholder="Ej: Franco Riquero" error={errors.nombre} />
              </div>

              {/* Teléfono */}
              <div>
                <Label>Teléfono</Label>
                <Input type="tel" value={form.telefono} onChange={v => set('telefono', v)} placeholder="2994130648" prefix="+54" error={errors.telefono} />
              </div>

              {/* Tipo de servicio */}
              <div>
                <Label>Tipo de servicio</Label>
                <ToggleGroup
                  options={[
                    { value: 'domicilio', label: 'Domicilio', icon: '🛵' },
                    { value: 'retiro', label: 'Retiro en local', icon: '📍' },
                  ]}
                  value={form.tipoServicio}
                  onChange={v => set('tipoServicio', v)}
                  accentColor={tenant.primary_color}
                />
              </div>

              {/* Dirección */}
              {form.tipoServicio === 'domicilio' && (
                <div>
                  <Label>Dirección</Label>
                  <Input
                    value={form.direccion}
                    onChange={v => set('direccion', v)}
                    placeholder="Ej: Av. San Martín 456, Piso 2"
                    error={errors.direccion}
                  />
                </div>
              )}

              {/* Método de pago */}
              <div>
                <Label>Método de pago</Label>
                <ToggleGroup
                  options={[
                    { value: 'mercadopago', label: 'Mercado Pago', icon: '💳' },
                    { value: 'efectivo', label: 'Efectivo', icon: '💵' },
                  ]}
                  value={form.metodoPago}
                  onChange={v => set('metodoPago', v)}
                  accentColor={tenant.primary_color}
                />
              </div>

            </div>
          )}
        </div>

        {!submitted && (
          <div className="px-5 py-4 border-t border-[#2a2a2a] flex-shrink-0">
            <button
              onClick={handleSubmit}
              className="w-full text-black font-bold py-4 rounded-2xl flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all text-base min-h-[56px]"
              style={{ backgroundColor: tenant.primary_color }}
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Enviar pedido por WhatsApp
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
