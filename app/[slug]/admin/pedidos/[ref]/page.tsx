import { createServerClient } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { OrderItem } from '@/types/supabase'

export const dynamic = 'force-dynamic'

export default async function OrderTicketPage({
  params,
}: {
  params: Promise<{ slug: string; ref: string }>
}) {
  const { slug, ref } = await params
  const supabase = createServerClient()

  const { data: order } = await supabase
    .from('orders')
    .select('*, tenants(name, address, whatsapp_number)')
    .eq('order_ref', ref.toUpperCase())
    .maybeSingle()

  if (!order) notFound()

  const items = order.items as OrderItem[]
  const tenant = order.tenants as { name: string; address?: string } | null
  const isDelivery = order.delivery_type === 'delivery'

  const createdAt = new Date(order.created_at).toLocaleString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })

  return (
    <div style={{
      maxWidth: 420,
      margin: '0 auto',
      padding: '24px 20px',
      fontFamily: 'system-ui, sans-serif',
      background: 'white',
      color: '#000',
      minHeight: '100vh',
    }}>

      {/* Acciones — no se imprimen */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 24 }} className="no-print">
        <button
          onClick={() => window.print()}
          style={{
            flex: 1, padding: '10px', background: '#111',
            color: 'white', border: 'none', borderRadius: 8,
            cursor: 'pointer', fontWeight: 600, fontSize: 14,
          }}
        >
          🖨️ Imprimir ticket
        </button>
        {isDelivery && (
          <button
            onClick={() => {
              const el = document.getElementById('delivery-slip')
              if (!el) return
              const w = window.open('', '_blank')
              if (!w) return
              w.document.write(`<html><head><style>body{font-family:sans-serif;padding:20px}@media print{.no-print{display:none}}</style></head><body>${el.innerHTML}</body></html>`)
              w.document.close()
              w.print()
            }}
            style={{
              flex: 1, padding: '10px', background: '#FF6B35',
              color: 'white', border: 'none', borderRadius: 8,
              cursor: 'pointer', fontWeight: 600, fontSize: 14,
            }}
          >
            🛵 Hoja repartidor
          </button>
        )}
        <Link
          href={`/${slug}/admin/pedidos`}
          style={{
            padding: '10px 14px', background: '#f3f3f3',
            color: '#333', borderRadius: 8,
            textDecoration: 'none', fontSize: 14, fontWeight: 600,
            display: 'flex', alignItems: 'center',
          }}
        >
          ← Volver
        </Link>
      </div>

      {/* TICKET DEL RESTAURANTE */}
      <div id="restaurant-ticket" style={{ fontFamily: 'monospace' }}>
        <div style={{ textAlign: 'center', borderBottom: '2px dashed #000', paddingBottom: 12, marginBottom: 12 }}>
          <div style={{ fontSize: 18, fontWeight: 700 }}>{tenant?.name ?? slug.toUpperCase()}</div>
          {tenant?.address && <div style={{ fontSize: 12, marginTop: 2 }}>{tenant.address}</div>}
          <div style={{ fontSize: 11, color: '#666', marginTop: 4 }}>{createdAt}</div>
        </div>

        <div style={{ textAlign: 'center', marginBottom: 12 }}>
          <div style={{ fontSize: 12 }}>PEDIDO</div>
          <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: '0.15em' }}>
            #{order.order_ref}
          </div>
        </div>

        <div style={{ borderBottom: '1px dashed #000', paddingBottom: 10, marginBottom: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 4 }}>CLIENTE</div>
          {order.customer_name && <div style={{ fontSize: 14 }}>{order.customer_name}</div>}
          {order.customer_phone && <div style={{ fontSize: 12 }}>{order.customer_phone}</div>}
        </div>

        <div style={{ borderBottom: '1px dashed #000', paddingBottom: 10, marginBottom: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 6 }}>ITEMS</div>
          {items.map((item, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 3 }}>
              <span>{item.quantity}x {item.name}</span>
              <span>${(item.price * item.quantity).toLocaleString('es-AR')}</span>
            </div>
          ))}
        </div>

        <div style={{ borderBottom: '1px dashed #000', paddingBottom: 10, marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
            <span>ENTREGA</span>
            <span>{isDelivery ? '🚚 DELIVERY' : '🏠 RETIRA EN LOCAL'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
            <span>PAGO</span>
            <span>{order.payment_method === 'cash' ? '💵 EFECTIVO' : '📲 TRANSFERENCIA'}</span>
          </div>
          {isDelivery && order.customer_address && (
            <div style={{ fontSize: 12, marginTop: 8, padding: '6px 8px', background: '#f5f5f5', borderRadius: 4 }}>
              📍 {order.customer_address}
            </div>
          )}
        </div>

        {order.notes && (
          <div style={{ borderBottom: '1px dashed #000', paddingBottom: 10, marginBottom: 10, fontSize: 12 }}>
            <span style={{ fontWeight: 700 }}>NOTA: </span>{order.notes}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 20, fontWeight: 800, marginTop: 4 }}>
          <span>TOTAL</span>
          <span>${order.total.toLocaleString('es-AR')}</span>
        </div>
      </div>

      {/* HOJA DEL REPARTIDOR — oculta, se abre en nueva ventana */}
      {isDelivery && (
        <div id="delivery-slip" style={{ display: 'none' }}>
          <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>
            🛵 ENTREGA — #{order.order_ref}
          </div>
          <div style={{ fontSize: 13, color: '#666', marginBottom: 24 }}>{createdAt}</div>

          <div style={{ background: '#f5f5f5', borderRadius: 8, padding: '16px', marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#666', marginBottom: 4, textTransform: 'uppercase' }}>Entregar a</div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>{order.customer_name}</div>
            {order.customer_phone && (
              <div style={{ fontSize: 14, color: '#333', marginTop: 4 }}>📞 {order.customer_phone}</div>
            )}
          </div>

          <div style={{ background: '#fff3e0', borderRadius: 8, padding: '16px', marginBottom: 16, border: '2px solid #FF6B35' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#666', marginBottom: 4, textTransform: 'uppercase' }}>Dirección</div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>{order.customer_address}</div>
          </div>

          <div style={{ background: '#f5f5f5', borderRadius: 8, padding: '16px', marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#666', marginBottom: 8, textTransform: 'uppercase' }}>Productos</div>
            {items.map((item, i) => (
              <div key={i} style={{ fontSize: 14, marginBottom: 4 }}>
                • {item.quantity}x {item.name}
              </div>
            ))}
          </div>

          <div style={{
            display: 'flex', justifyContent: 'space-between',
            fontSize: 16, fontWeight: 800,
            padding: '14px', background: '#111', color: 'white', borderRadius: 8, marginBottom: 16,
          }}>
            <span>COBRAR</span>
            <span>
              {order.payment_method === 'cash'
                ? `$${order.total.toLocaleString('es-AR')} EFECTIVO`
                : '✅ YA PAGÓ (Transferencia)'}
            </span>
          </div>

          {order.notes && (
            <div style={{ background: '#fff9c4', padding: '12px', borderRadius: 8, fontSize: 13 }}>
              ⚠️ <strong>NOTA:</strong> {order.notes}
            </div>
          )}
        </div>
      )}

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; }
        }
      `}</style>
    </div>
  )
}
