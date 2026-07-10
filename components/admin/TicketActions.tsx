"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { buildWhatsAppLink } from "@/lib/whatsapp-notify";

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
  orderId: string;
  currentStatus: string;
  isDelivery: boolean;
  customerPhone?: string | null;
  orderRef?: string | null;
  initialKitchenNotes?: string | null;
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
  orderId,
  currentStatus,
  isDelivery,
  customerPhone,
  orderRef,
  initialKitchenNotes,
  deliveryData,
}: TicketActionsProps) {
  const router = useRouter();
  const [cancelling, setCancelling] = useState(false);
  const [kitchenNotes, setKitchenNotes] = useState(initialKitchenNotes ?? "");
  const [savingNotes, setSavingNotes] = useState(false);
  const [notesSaved, setNotesSaved] = useState(false);

  async function handleSaveNotes() {
    setSavingNotes(true);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kitchen_notes: kitchenNotes.trim() || null }),
      });
      if (!res.ok) throw new Error("Error al guardar la nota");
      setNotesSaved(true);
      setTimeout(() => setNotesSaved(false), 2000);
    } catch {
      toast.error("No se pudo guardar la nota, probá de nuevo");
    } finally {
      setSavingNotes(false);
    }
  }

  function handlePrint() {
    window.print();
  }

  async function handleCancel() {
    if (!confirm("¿Cancelar este pedido? No se podrá revertir.")) return;
    setCancelling(true);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" }),
      });
      if (!res.ok) throw new Error("Error al cancelar");
      router.refresh();
      toast.success("Pedido cancelado");
    } catch {
      toast.error("No se pudo cancelar. Intentá de nuevo.");
    } finally {
      setCancelling(false);
    }
  }

  function handleDeliverySlip() {
    if (!deliveryData) return;
    const w = window.open("", "_blank");
    if (!w) return;

    const itemsHtml = deliveryData.items
      .map(
        (item) =>
          `<div style="font-size:15px;margin-bottom:6px">• ${escapeHtml(String(item.quantity))}x ${escapeHtml(item.name)}</div>`,
      )
      .join("");

    const cobrarHtml =
      deliveryData.paymentMethod === "cash"
        ? `$${escapeHtml(deliveryData.total.toLocaleString("es-AR"))} EFECTIVO`
        : "YA PAGO (Transferencia)";

    const notesHtml = deliveryData.notes
      ? `<div style="background:#fff9c4;padding:12px;border-radius:8px;font-size:14px;border:2px solid #f0c040"><strong>*** NOTA: ***</strong> ${escapeHtml(deliveryData.notes)}</div>`
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

  const isCancellable =
    currentStatus !== "cancelled" &&
    currentStatus !== "delivered" &&
    currentStatus !== "entregado";

  const waLink =
    (
      ["pending", "confirmed", "preparing", "ready", "delivered"] as string[]
    ).includes(currentStatus) &&
    customerPhone &&
    orderRef
      ? buildWhatsAppLink(
          customerPhone,
          orderRef,
          currentStatus,
          typeof window !== "undefined" ? window.location.origin : undefined,
        )
      : null;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        marginBottom: 24,
      }}
      className="no-print"
    >
      {/* Nota interna del equipo */}
      <div
        style={{
          background: "rgba(251,191,36,0.08)",
          border: "1px solid rgba(251,191,36,0.25)",
          borderRadius: 10,
          padding: "12px 14px",
          marginBottom: 4,
        }}
      >
        <p
          style={{
            fontSize: 11,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: "#f59e0b",
            margin: "0 0 8px",
          }}
        >
          🍳 Nota interna del equipo
        </p>
        <textarea
          value={kitchenNotes}
          onChange={(e) => setKitchenNotes(e.target.value)}
          placeholder="Ej: sin cebolla en mesa 3, pedir confirmación de pago..."
          rows={3}
          style={{
            width: "100%",
            background: "rgba(0,0,0,0.2)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 7,
            color: "#f5f5f5",
            fontSize: 13,
            padding: "8px 10px",
            resize: "vertical",
            fontFamily: "inherit",
            lineHeight: 1.5,
            boxSizing: "border-box",
          }}
        />
        <button
          onClick={handleSaveNotes}
          disabled={savingNotes}
          style={{
            marginTop: 8,
            padding: "6px 16px",
            background: notesSaved
              ? "rgba(34,197,94,0.15)"
              : "rgba(251,191,36,0.15)",
            border: `1px solid ${notesSaved ? "rgba(34,197,94,0.4)" : "rgba(251,191,36,0.4)"}`,
            borderRadius: 6,
            color: notesSaved ? "#86efac" : "#fbbf24",
            fontSize: 12,
            fontWeight: 600,
            cursor: savingNotes ? "not-allowed" : "pointer",
            transition: "all 0.2s",
          }}
        >
          {notesSaved
            ? "✓ Guardado"
            : savingNotes
              ? "Guardando..."
              : "Guardar nota"}
        </button>
      </div>

      {isDelivery && (
        <button
          onClick={handleDeliverySlip}
          style={{
            width: "100%",
            padding: "12px",
            background: "#FF6B35",
            color: "white",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
            fontWeight: 600,
            fontSize: 15,
          }}
        >
          Hoja repartidor
        </button>
      )}
      {waLink && (
        <a
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            width: "100%",
            padding: "12px",
            background: "rgba(37,211,102,0.12)",
            color: "#25D366",
            border: "1px solid rgba(37,211,102,0.35)",
            borderRadius: 8,
            fontWeight: 600,
            fontSize: 15,
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            boxSizing: "border-box",
          }}
        >
          Avisar al cliente por WhatsApp
        </a>
      )}
      {isCancellable && (
        <button
          onClick={handleCancel}
          disabled={cancelling}
          style={{
            width: "100%",
            padding: "12px",
            background: "rgba(239,68,68,0.1)",
            color: "#f87171",
            border: "1px solid rgba(239,68,68,0.4)",
            borderRadius: 8,
            cursor: cancelling ? "not-allowed" : "pointer",
            fontWeight: 600,
            fontSize: 15,
            opacity: cancelling ? 0.7 : 1,
          }}
        >
          {cancelling ? "Cancelando..." : "✕ Cancelar pedido"}
        </button>
      )}
      <Link
        href={`/${slug}/admin/pedidos`}
        style={{
          width: "100%",
          padding: "12px",
          background: "#f3f3f3",
          color: "#333",
          borderRadius: 8,
          textDecoration: "none",
          fontSize: 15,
          fontWeight: 600,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxSizing: "border-box",
        }}
      >
        ← Volver a pedidos
      </Link>
    </div>
  );
}
