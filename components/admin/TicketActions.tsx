'use client'

import Link from 'next/link'

interface TicketActionsProps {
  slug: string
  isDelivery: boolean
}

export default function TicketActions({ slug, isDelivery }: TicketActionsProps) {
  function handlePrint() {
    window.print()
  }

  function handleDeliverySlip() {
    const el = document.getElementById('delivery-slip')
    if (!el) return
    const w = window.open('', '_blank')
    if (!w) return
    w.document.write(
      `<html><head><style>body{font-family:sans-serif;padding:20px}@media print{.no-print{display:none}}</style></head><body>${el.innerHTML}</body></html>`
    )
    w.document.close()
    w.print()
  }

  return (
    <div style={{ display: 'flex', gap: 10, marginBottom: 24 }} className="no-print">
      <button
        onClick={handlePrint}
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
          onClick={handleDeliverySlip}
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
  )
}
