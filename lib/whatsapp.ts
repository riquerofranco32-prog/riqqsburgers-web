import { createSupabaseBrowser } from '@/lib/supabase'
import type { CartItem } from '@/context/CartContext'

function sanitizePhone(raw: string): string {
  let n = raw.replace(/[\s\-\(\)\+]/g, '')
  if (n.startsWith('0054')) n = '54' + n.slice(4)
  if (n.startsWith('00549')) n = '549' + n.slice(5)
  if (n.startsWith('0')) n = '549' + n.slice(1)
  if (n.startsWith('54') && !n.startsWith('549')) n = '549' + n.slice(2)
  if (!n.startsWith('54') && n.length >= 8) n = '549' + n
  return n
}

function categoryEmoji(categoryName?: string | null): string {
  if (!categoryName) return '🍔'
  const lower = categoryName.toLowerCase()
  if (lower.includes('burger') || lower.includes('hambur')) return '🍔'
  if (lower.includes('beb') || lower.includes('drink') || lower.includes('gase') || lower.includes('agua') || lower.includes('jugo')) return '🥤'
  if (lower.includes('promo') || lower.includes('combo') || lower.includes('oferta')) return '🔥'
  if (lower.includes('postre') || lower.includes('dulce') || lower.includes('helado')) return '🍰'
  if (lower.includes('papa') || lower.includes('frit')) return '🍟'
  if (lower.includes('ensal')) return '🥗'
  if (lower.includes('pollo') || lower.includes('chicken')) return '🍗'
  return '🍔'
}

function fmtARS(n: number) {
  return '$' + n.toLocaleString('es-AR')
}

export function generateWhatsAppMessage(items: CartItem[], total: number): string {
  const lines = items.map(item => {
    const emoji = categoryEmoji(item.category_name)
    const subtotal = fmtARS(item.price * item.quantity)
    return `${emoji} ${item.quantity}x ${item.name} - ${subtotal}`
  })

  return `Hola! 👋 Quiero hacer un pedido:

${lines.join('\n')}

💰 *Total: ${fmtARS(total)}*

¡Gracias!`
}

export function buildWhatsAppUrl(whatsappNumber: string, message: string): string {
  const phone = sanitizePhone(whatsappNumber)
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
}

export async function sendWhatsAppOrder({
  tenantId,
  whatsappNumber,
  items,
  total,
}: {
  tenantId: string
  whatsappNumber: string
  items: CartItem[]
  total: number
}): Promise<void> {
  const supabase = createSupabaseBrowser()
  const orderRef = 'WA-' + Math.floor(1000000 + Math.random() * 9000000)

  supabase.from('orders').insert({
    tenant_id: tenantId,
    order_ref: orderRef,
    customer_name: null,
    customer_phone: null,
    delivery_type: 'retiro' as const,
    address: null,
    payment_method: 'efectivo' as const,
    items: items.map(i => ({
      product_id: i.product_id,
      name: i.name,
      price: i.price,
      quantity: i.quantity,
    })),
    subtotal: total,
    delivery_cost: 0,
    total,
    status: 'nuevo',
  }).then(({ error }) => {
    if (error) console.error('Error saving WA order:', error)
  })

  const message = generateWhatsAppMessage(items, total)
  const url = buildWhatsAppUrl(whatsappNumber, message)
  window.open(url, '_blank')
}
