"use client";

import Link from "next/link";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

interface TicketActionsProps {
  slug: string;
  isDelivery: boolean;
  deliveryData?: {
    orderRef: string;
    createdAt: string;
    customerName: string;
    customerPhone?: string;
    customerAddress: string;
    items: Array<{ quantity: number; name: string }>;
    total: number;
    paymentMethod: string;
    notes?: string;
  };
}

export default function TicketActions({
  slug,
  isDelivery,
  deliveryData,
}: TicketActionsProps) {
  function handlePrint() {
    window.print();
  }

  function handleDeliverySlip() {
    if (!deliveryData) return;
    const w = window.open("", "_blank");
    if (!w) return;

    const itemsHtml = deliveryData.items
      .map(
        (item) =>
          `<div style="font-size:14px;margin-bottom:4px">• ${escapeHtml(String(item.quantity))}x ${escapeHtml(item.name)}</div>`,
      )
      .join("");

    const cobrarHtml =
      deliveryData.paymentMethod === "cash"
        ? `$${escapeHtml(deliveryData.total.toLocaleString("es-AR"))} EFECTIVO`
        : "YA PAGO (Transferencia)";

    const notesHtml = deliveryData.notes
      ? `<div style="background:#fff9c4;padding:12px;border-radius:8px;font-size:13px"><strong>NOTA:</strong> ${escapeHtml(deliveryData.notes)}</div>`
      : "";

    const html = `<html><head><style>body{font-family:sans-serif;padding:20px}@media print{.no-print{display:none}}</style></head><body>
      <div style="font-size:22px;font-weight:800;margin-bottom:4px">ENTREGA &mdash; #${escapeHtml(deliveryData.orderRef)}</div>
      <div style="font-size:13px;color:#666;margin-bottom:24px">${escapeHtml(deliveryData.createdAt)}</div>
      <div style="background:#f5f5f5;border-radius:8px;padding:16px;margin-bottom:16px">
        <div style="font-size:11px;font-weight:700;color:#666;margin-bottom:4px;text-transform:uppercase">Entregar a</div>
        <div style="font-size:18px;font-weight:700">${escapeHtml(deliveryData.customerName)}</div>
        ${deliveryData.customerPhone ? `<div style="font-size:14px;color:#333;margin-top:4px">${escapeHtml(deliveryData.customerPhone)}</div>` : ""}
      </div>
      <div style="background:#fff3e0;border-radius:8px;padding:16px;margin-bottom:16px;border:2px solid #FF6B35">
        <div style="font-size:11px;font-weight:700;color:#666;margin-bottom:4px;text-transform:uppercase">Direcci&oacute;n</div>
        <div style="font-size:16px;font-weight:600">${escapeHtml(deliveryData.customerAddress)}</div>
      </div>
      <div style="background:#f5f5f5;border-radius:8px;padding:16px;margin-bottom:16px">
        <div style="font-size:11px;font-weight:700;color:#666;margin-bottom:8px;text-transform:uppercase">Productos</div>
        ${itemsHtml}
      </div>
      <div style="display:flex;justify-content:space-between;font-size:16px;font-weight:800;padding:14px;background:#111;color:white;border-radius:8px;margin-bottom:16px">
        <span>COBRAR</span><span>${cobrarHtml}</span>
      </div>
      ${notesHtml}
    </body></html>`;

    w.document.write(html);
    w.document.close();
    w.print();
  }

  return (
    <div
      style={{ display: "flex", gap: 10, marginBottom: 24 }}
      className="no-print"
    >
      <button
        onClick={handlePrint}
        style={{
          flex: 1,
          padding: "10px",
          background: "#111",
          color: "white",
          border: "none",
          borderRadius: 8,
          cursor: "pointer",
          fontWeight: 600,
          fontSize: 14,
        }}
      >
        🖨️ Imprimir ticket
      </button>
      {isDelivery && (
        <button
          onClick={handleDeliverySlip}
          style={{
            flex: 1,
            padding: "10px",
            background: "#FF6B35",
            color: "white",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
            fontWeight: 600,
            fontSize: 14,
          }}
        >
          🛵 Hoja repartidor
        </button>
      )}
      <Link
        href={`/${slug}/admin/pedidos`}
        style={{
          padding: "10px 14px",
          background: "#f3f3f3",
          color: "#333",
          borderRadius: 8,
          textDecoration: "none",
          fontSize: 14,
          fontWeight: 600,
          display: "flex",
          alignItems: "center",
        }}
      >
        ← Volver
      </Link>
    </div>
  );
}
