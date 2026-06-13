"use client";

import { useState, useEffect, useMemo } from "react";
import { ChevronDown, ChevronUp, Search, X, Printer, Trash2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { createSupabaseBrowser } from "@/lib/supabase";
import type { Order } from "@/types/supabase";

function fmtARS(n: number) {
  return "$ " + n.toLocaleString("es-AR");
}

function fmtFecha(iso: string) {
  return new Date(iso).toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function vibrate(pattern: number | number[]) {
  if (typeof window !== "undefined" && "vibrate" in navigator)
    navigator.vibrate(pattern);
}

// ── Media query hook ─────────────────────────────────────────────────────────

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return isMobile;
}

// ── Status helpers ───────────────────────────────────────────────────────────

const STATUS_META: Record<
  string,
  { label: string; bg: string; color: string; border: string }
> = {
  pending: {
    label: "Pendiente",
    bg: "rgba(245,158,11,0.12)",
    color: "#f59e0b",
    border: "rgba(245,158,11,0.3)",
  },
  nuevo: {
    label: "Nuevo",
    bg: "rgba(245,158,11,0.12)",
    color: "#f59e0b",
    border: "rgba(245,158,11,0.3)",
  },
  confirmed: {
    label: "Confirmado",
    bg: "rgba(59,130,246,0.12)",
    color: "#60a5fa",
    border: "rgba(59,130,246,0.3)",
  },
  preparando: {
    label: "Preparando",
    bg: "rgba(59,130,246,0.12)",
    color: "#60a5fa",
    border: "rgba(59,130,246,0.3)",
  },
  ready: {
    label: "Listo",
    bg: "rgba(34,197,94,0.12)",
    color: "#4ade80",
    border: "rgba(34,197,94,0.3)",
  },
  listo: {
    label: "Listo",
    bg: "rgba(34,197,94,0.12)",
    color: "#4ade80",
    border: "rgba(34,197,94,0.3)",
  },
  delivered: {
    label: "Entregado",
    bg: "rgba(113,113,122,0.12)",
    color: "#a1a1aa",
    border: "rgba(113,113,122,0.3)",
  },
  entregado: {
    label: "Entregado",
    bg: "rgba(113,113,122,0.12)",
    color: "#a1a1aa",
    border: "rgba(113,113,122,0.3)",
  },
  preparing: {
    label: "Preparando",
    bg: "rgba(59,130,246,0.12)",
    color: "#60a5fa",
    border: "rgba(59,130,246,0.3)",
  },
  cancelled: {
    label: "Cancelado",
    bg: "rgba(239,68,68,0.12)",
    color: "#f87171",
    border: "rgba(239,68,68,0.3)",
  },
};

const STATUS_FLOW = [
  { key: "pending", label: "Pendiente" },
  { key: "confirmed", label: "Confirmado" },
  { key: "ready", label: "Listo" },
  { key: "delivered", label: "Entregado" },
] as const;

const FILTER_PILLS = [
  { key: "all", label: "Todos" },
  { key: "pending", label: "Pendientes" },
  { key: "confirmed", label: "Confirmados" },
  { key: "ready", label: "Listos" },
  { key: "delivered", label: "Entregados" },
  { key: "cancelled", label: "Cancelados" },
] as const;

type FilterKey = (typeof FILTER_PILLS)[number]["key"];

function getStatusMeta(status: string) {
  return (
    STATUS_META[status] ?? {
      label: status,
      bg: "rgba(113,113,122,0.12)",
      color: "#a1a1aa",
      border: "rgba(113,113,122,0.3)",
    }
  );
}

function StatusBadge({ status }: { status: string }) {
  const meta = getStatusMeta(status);
  return (
    <span
      style={{
        display: "inline-block",
        padding: "3px 9px",
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 700,
        background: meta.bg,
        color: meta.color,
        border: `1px solid ${meta.border}`,
        whiteSpace: "nowrap",
      }}
    >
      {meta.label}
    </span>
  );
}

function paymentLabel(method: string) {
  if (method === "transfer") return "📲 Transfer";
  if (method === "mercadopago") return "📲 MP";
  return "💵 Efectivo";
}

function deliveryLabel(type: string) {
  return type === "delivery" || type === "domicilio"
    ? "🚚 Delivery"
    : "🏠 Retiro";
}

function matchesFilter(order: Order, filter: FilterKey): boolean {
  if (filter === "all") return true;
  const s = order.status;
  if (filter === "pending") return s === "pending" || s === "nuevo";
  if (filter === "confirmed") return s === "confirmed" || s === "preparando";
  if (filter === "ready") return s === "ready" || s === "listo";
  if (filter === "delivered") return s === "delivered" || s === "entregado";
  if (filter === "cancelled") return s === "cancelled";
  return false;
}

// ── Order detailed view & Invoice ─────────────────────────────────────────────

interface OrderItemDetailed {
  name: string;
  quantity: number;
  price: number;
  selected_extra?: {
    name: string;
    price: number;
  } | null;
}

function OrderDetailView({
  order,
  slug,
  onUpdateStatus,
  onDeleteOrder,
}: {
  order: Order;
  slug: string;
  onUpdateStatus: (id: string, status: string) => Promise<void>;
  onDeleteOrder: (id: string) => Promise<void>;
}) {
  const items = (order.items ?? []) as OrderItemDetailed[];
  const hasDelivery = order.delivery_type === "delivery" || order.delivery_type === "domicilio";
  const deliveryCost = order.delivery_cost ?? 0;
  const subtotal = order.subtotal ?? (order.total - deliveryCost);

  function handlePrintTicket() {
    window.open(
      `/${slug}/admin/pedidos/${order.order_ref ?? order.id}?print=1`,
      `print-${order.order_ref || order.id}`,
      "width=420,height=700,status=no,toolbar=no,menubar=no"
    );
  }

  return (
    <div
      style={{
        padding: "16px 20px",
        background: "rgba(0,0,0,0.2)",
        borderTop: "1px solid var(--dash-border)",
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      {/* Informacion de Cliente y Envio */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 12,
        }}
      >
        {/* Info cliente */}
        <div
          style={{
            background: "var(--dash-surface)",
            border: "1px solid var(--dash-border)",
            borderRadius: 12,
            padding: 14,
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <h4 style={{ fontSize: 11, fontWeight: 700, color: "var(--dash-muted)", textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>
            Contacto & Entrega
          </h4>
          <div style={{ fontSize: 13, display: "flex", flexDirection: "column", gap: 4 }}>
            <p style={{ margin: 0, color: "var(--dash-text)", fontWeight: 600 }}>{order.customer_name || "Sin nombre"}</p>
            {order.customer_phone && (
              <p style={{ margin: 0, color: "var(--dash-muted)" }}>
                📞 <a href={`tel:${order.customer_phone}`} style={{ color: "var(--accent)", textDecoration: "none" }}>{order.customer_phone}</a>
              </p>
            )}
            <p style={{ margin: 0, color: "var(--dash-muted)" }}>
              📍 {deliveryLabel(order.delivery_type)}
            </p>
            {(order.customer_address ?? order.address) && (
              <p style={{ margin: "4px 0 0 0", padding: "6px 8px", background: "var(--dash-surface-2)", borderRadius: 6, color: "var(--dash-text)", fontSize: 12 }}>
                {order.customer_address ?? order.address}
              </p>
            )}
          </div>
        </div>

        {/* Notas e Instrucciones */}
        <div
          style={{
            background: order.notes ? "rgba(251,146,60,0.05)" : "var(--dash-surface)",
            border: order.notes ? "1px solid rgba(251,146,60,0.2)" : "1px solid var(--dash-border)",
            borderRadius: 12,
            padding: 14,
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <h4 style={{ fontSize: 11, fontWeight: 700, color: order.notes ? "#fb923c" : "var(--dash-muted)", textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>
            Notas y Pago
          </h4>
          <div style={{ fontSize: 13, display: "flex", flexDirection: "column", gap: 4 }}>
            <p style={{ margin: 0, color: "var(--dash-muted)" }}>
              Método de Pago: <strong style={{ color: "var(--dash-text)" }}>{paymentLabel(order.payment_method)}</strong>
            </p>
            {order.notes ? (
              <div style={{ padding: 8, background: "rgba(251,146,60,0.1)", borderLeft: "3px solid #fb923c", borderRadius: 4, color: "#ffedd5", fontSize: 12, marginTop: 4 }}>
                <strong>Nota:</strong> &ldquo;{order.notes}&rdquo;
              </div>
            ) : (
              <p style={{ margin: 0, color: "var(--dash-muted)", fontStyle: "italic" }}>Sin notas del cliente</p>
            )}
          </div>
        </div>
      </div>

      {/* Detalle de Pedido (Factura/Invoice) */}
      <div
        style={{
          background: "var(--dash-surface)",
          border: "1px solid var(--dash-border)",
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "10px 14px",
            borderBottom: "1px solid var(--dash-border)",
            background: "var(--dash-surface-2)",
            display: "grid",
            gridTemplateColumns: "3fr 1.2fr 1.5fr",
            fontSize: 11,
            fontWeight: 700,
            color: "var(--dash-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          <span>Producto</span>
          <span style={{ textAlign: "right" }}>Unit.</span>
          <span style={{ textAlign: "right" }}>Total</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          {items.map((item, i) => {
            const extraPrice = item.selected_extra?.price ?? 0;
            const unitPrice = item.price + extraPrice;
            const itemTotal = unitPrice * item.quantity;

            return (
              <div
                key={i}
                style={{
                  padding: "12px 14px",
                  borderBottom: i < items.length - 1 ? "1px solid var(--dash-border)" : "none",
                  display: "grid",
                  gridTemplateColumns: "3fr 1.2fr 1.5fr",
                  alignItems: "center",
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span
                      style={{
                        background: "rgba(255,107,53,0.15)",
                        color: "var(--accent)",
                        fontWeight: 700,
                        fontSize: 11,
                        padding: "1px 6px",
                        borderRadius: 999,
                        minWidth: 16,
                        textAlign: "center",
                      }}
                    >
                      {item.quantity}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "var(--dash-text)" }}>{item.name}</span>
                  </div>
                  {item.selected_extra && (
                    <span style={{ fontSize: 11, color: "var(--dash-muted)", marginLeft: 28 }}>
                      + {item.selected_extra.name} {item.selected_extra.price > 0 && `(+${fmtARS(item.selected_extra.price)})`}
                    </span>
                  )}
                </div>
                <span style={{ fontSize: 12, color: "var(--dash-muted)", textAlign: "right" }}>
                  {fmtARS(item.price)}
                </span>
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--dash-text)", textAlign: "right" }}>
                  {fmtARS(itemTotal)}
                </span>
              </div>
            );
          })}
        </div>

        {/* Resumen de totales */}
        <div
          style={{
            background: "var(--dash-surface-2)",
            borderTop: "1px solid var(--dash-border)",
            padding: "12px 14px",
            display: "flex",
            flexDirection: "column",
            gap: 6,
            fontSize: 12,
          }}
        >
          {hasDelivery && deliveryCost > 0 && (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", color: "var(--dash-muted)" }}>
                <span>Subtotal</span>
                <span>{fmtARS(subtotal)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", color: "var(--dash-muted)" }}>
                <span>Costo de envío</span>
                <span>{fmtARS(deliveryCost)}</span>
              </div>
            </>
          )}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 14,
              fontWeight: 800,
              color: "var(--dash-text)",
              paddingTop: hasDelivery && deliveryCost > 0 ? 6 : 0,
              borderTop: hasDelivery && deliveryCost > 0 ? "1px dashed var(--dash-border)" : "none",
            }}
          >
            <span>Total</span>
            <span style={{ color: "#ffffff" }}>{fmtARS(order.total)}</span>
          </div>
        </div>
      </div>

      {/* Flujo de Estados y Botones Especiales */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
          borderTop: "1px solid var(--dash-border)",
          paddingTop: 14,
        }}
      >
        {/* Actualizacion de estados */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {STATUS_FLOW.map(({ key, label }) => {
            const m = getStatusMeta(key);
            const isCurrent =
              order.status === key ||
              (key === "pending" && order.status === "nuevo") ||
              (key === "confirmed" && order.status === "preparando") ||
              (key === "ready" && order.status === "listo") ||
              (key === "delivered" && order.status === "entregado");
            return (
              <button
                key={key}
                onClick={() => {
                  vibrate(40);
                  onUpdateStatus(order.id, key);
                }}
                style={{
                  padding: "6px 14px",
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.15s",
                  border: "1px solid",
                  background: isCurrent ? m.bg : "transparent",
                  color: isCurrent ? m.color : "var(--dash-muted)",
                  borderColor: isCurrent ? m.border : "var(--dash-border)",
                  minHeight: 32,
                  WebkitTapHighlightColor: "transparent",
                  userSelect: "none",
                }}
              >
                {label}
              </button>
            );
          })}
          {order.status !== "cancelled" &&
            order.status !== "delivered" &&
            order.status !== "entregado" && (
              <button
                onClick={() => {
                  vibrate([40, 30, 40]);
                  onUpdateStatus(order.id, "cancelled");
                }}
                style={{
                  padding: "6px 14px",
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.15s",
                  border: "1px solid rgba(239,68,68,0.4)",
                  background: "rgba(239,68,68,0.08)",
                  color: "#f87171",
                  minHeight: 32,
                  WebkitTapHighlightColor: "transparent",
                  userSelect: "none",
                }}
              >
                ✕ Cancelar
              </button>
            )}
        </div>

        {/* Acciones del sistema: Imprimir / Eliminar */}
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={handlePrintTicket}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "7px 12px",
              background: "var(--dash-surface-2)",
              border: "1px solid var(--dash-border)",
              color: "var(--dash-text)",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              transition: "border-color 0.15s, background 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--accent)";
              e.currentTarget.style.background = "rgba(255,107,53,0.05)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--dash-border)";
              e.currentTarget.style.background = "var(--dash-surface-2)";
            }}
          >
            <Printer style={{ width: 14, height: 14, color: "var(--accent)" }} />
            Imprimir Ticket
          </button>
          
          <button
            onClick={() => onDeleteOrder(order.id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "7px 12px",
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.3)",
              color: "#f87171",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              transition: "border-color 0.15s, background 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#ef4444";
              e.currentTarget.style.background = "rgba(239,68,68,0.15)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "rgba(239,68,68,0.3)";
              e.currentTarget.style.background = "rgba(239,68,68,0.08)";
            }}
          >
            <Trash2 style={{ width: 14, height: 14 }} />
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Mobile card layout ────────────────────────────────────────────────────────

function MobileOrderCard({
  order,
  slug,
  isNew,
  onUpdateStatus,
  onDeleteOrder,
}: {
  order: Order;
  slug: string;
  isNew: boolean;
  onUpdateStatus: (id: string, status: string) => Promise<void>;
  onDeleteOrder: (id: string) => Promise<void>;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      style={{
        background: isNew ? "rgba(255,107,53,0.08)" : "var(--dash-surface)",
        border: "1px solid var(--dash-border)",
        borderRadius: 14,
        marginBottom: 10,
        overflow: "hidden",
        transition: "background 1s ease",
      }}
    >
      {/* Clickable Header card */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: "100%",
          padding: 16,
          background: "none",
          border: "none",
          textAlign: "left",
          display: "flex",
          flexDirection: "column",
          cursor: "pointer",
          WebkitTapHighlightColor: "transparent",
        }}
      >
        {/* Row 1: ref + status */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            marginBottom: 6,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                color: "var(--dash-text)",
                fontWeight: 700,
                fontSize: 14,
                fontFamily: "var(--font-mono, monospace)",
              }}
            >
              #{order.order_ref ?? order.id.slice(0, 6)}
            </span>
            {isNew && (
              <span
                style={{
                  fontSize: 10,
                  padding: "2px 6px",
                  borderRadius: 999,
                  fontWeight: 700,
                  background: "rgba(255,107,53,0.2)",
                  color: "#ff6b35",
                  border: "1px solid rgba(255,107,53,0.4)",
                }}
              >
                🔔 Nuevo
              </span>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <StatusBadge status={order.status} />
            {isOpen ? (
              <ChevronUp style={{ width: 16, height: 16, color: "var(--dash-muted)" }} />
            ) : (
              <ChevronDown style={{ width: 16, height: 16, color: "var(--dash-muted)" }} />
            )}
          </div>
        </div>

        {/* Row 2: customer + delivery */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            marginBottom: 4,
          }}
        >
          <span
            style={{
              fontWeight: 600,
              fontSize: 14,
              color: "var(--dash-text)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxWidth: "60%",
            }}
          >
            {order.customer_name ?? "—"}
          </span>
          <span style={{ fontSize: 12, color: "var(--dash-muted)" }}>
            {deliveryLabel(order.delivery_type)}
          </span>
        </div>

        {/* Row 3: total + payment + time */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          <span style={{ fontWeight: 800, fontSize: 18, color: "var(--accent)" }}>
            {fmtARS(order.total)}
          </span>
          <span style={{ fontSize: 12, color: "var(--dash-muted)" }}>
            {paymentLabel(order.payment_method)} · {fmtFecha(order.created_at)}
          </span>
        </div>
      </button>

      {/* Expanded details */}
      {isOpen && (
        <OrderDetailView
          order={order}
          slug={slug}
          onUpdateStatus={onUpdateStatus}
          onDeleteOrder={onDeleteOrder}
        />
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function OrdersTable({
  initialOrders,
  slug,
  tenantId,
}: {
  initialOrders: Order[];
  slug: string;
  tenantId: string;
}) {
  const [orders, setOrders] = useState(initialOrders);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [newOrderIds, setNewOrderIds] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<FilterKey>("all");
  const [search, setSearch] = useState("");
  const isMobile = useIsMobile();

  useEffect(() => {
    const supabase = createSupabaseBrowser();
    const uniqueId = Math.random().toString(36).substring(7);
    const channel = supabase
      .channel(`orders-${tenantId}-${uniqueId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "orders",
          filter: `tenant_id=eq.${tenantId}`,
        },
        (payload) => {
          const incoming = payload.new as Order;
          setOrders((prev) => {
            if (prev.some((o) => o.id === incoming.id)) return prev;
            return [incoming, ...prev];
          });
          setNewOrderIds((prev) => {
            const s = new Set(prev);
            s.add(incoming.id);
            return s;
          });
          setTimeout(() => {
            setNewOrderIds((prev) => {
              const s = new Set(prev);
              s.delete(incoming.id);
              return s;
            });
          }, 8000);
          // Notification sound via Web Audio API
          try {
            const ctx = new AudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.setValueAtTime(880, ctx.currentTime);
            osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.1);
            gain.gain.setValueAtTime(0.28, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(
              0.001,
              ctx.currentTime + 0.4,
            );
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.4);
          } catch {}
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [tenantId]);

  async function updateStatus(orderId: string, status: string) {
    const prevStatus = orders.find((o) => o.id === orderId)?.status;
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status } : o)),
    );
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed");
      vibrate(40);
    } catch {
      if (prevStatus !== undefined) {
        setOrders((prev) =>
          prev.map((o) =>
            o.id === orderId ? { ...o, status: prevStatus } : o,
          ),
        );
      }
      vibrate([50, 30, 50]);
    }
  }

  async function deleteOrder(orderId: string) {
    if (!confirm("¿Estás seguro de que deseas eliminar este pedido de forma permanente? Esta acción no se puede deshacer.")) {
      return;
    }
    if (!confirm("Confirmación final: ¿Eliminar pedido permanentemente?")) {
      return;
    }

    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed");
      
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
      toast.success("Pedido eliminado correctamente.");
      vibrate([60, 40, 60]);
    } catch {
      toast.error("No se pudo eliminar el pedido. Verificá tu conexión o permisos.");
      vibrate([100, 50, 100]);
    }
  }

  const counts = useMemo(() => {
    const map: Record<string, number> = { all: orders.length };
    FILTER_PILLS.slice(1).forEach(({ key }) => {
      map[key] = orders.filter((o) => matchesFilter(o, key)).length;
    });
    return map;
  }, [orders]);

  const filtered = useMemo(() => {
    let list = orders.filter((o) => matchesFilter(o, filter));
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (o) =>
          o.customer_name?.toLowerCase().includes(q) ||
          o.order_ref?.toLowerCase().includes(q),
      );
    }
    return list;
  }, [orders, filter, search]);

  return (
    <div
      style={{
        background: "var(--dash-surface)",
        border: "1px solid var(--dash-border)",
        borderRadius: 16,
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "16px 20px",
          borderBottom: "1px solid var(--dash-border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <h2
          style={{ fontSize: 15, fontWeight: 700, color: "var(--dash-text)" }}
        >
          Pedidos
          <span
            style={{
              marginLeft: 8,
              fontSize: 12,
              fontWeight: 400,
              color: "var(--dash-muted)",
            }}
          >
            {orders.length} en total
          </span>
        </h2>
        <div
          style={{ position: "relative", minWidth: isMobile ? "100%" : 200 }}
        >
          <Search
            style={{
              position: "absolute",
              left: 10,
              top: "50%",
              transform: "translateY(-50%)",
              width: 14,
              height: 14,
              color: "var(--dash-muted)",
            }}
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por cliente o ref..."
            style={{
              background: "var(--dash-surface-2)",
              border: "1px solid var(--dash-border)",
              borderRadius: 8,
              paddingLeft: 30,
              paddingRight: search ? 30 : 10,
              paddingTop: 8,
              paddingBottom: 8,
              fontSize: 16, // prevent iOS zoom
              color: "var(--dash-text)",
              outline: "none",
              width: "100%",
            }}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              style={{
                position: "absolute",
                right: 8,
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--dash-muted)",
                display: "flex",
                padding: 0,
                WebkitTapHighlightColor: "transparent",
              }}
            >
              <X style={{ width: 12, height: 12 }} />
            </button>
          )}
        </div>
      </div>

      <div
        style={{
          padding: "10px 16px",
          borderBottom: "1px solid var(--dash-border)",
          display: "flex",
          gap: 8,
          overflowX: "auto",
          scrollbarWidth: "none",
        }}
      >
        {FILTER_PILLS.map((pill) => {
          const isActive = filter === pill.key;
          return (
            <button
              key={pill.key}
              onClick={() => setFilter(pill.key)}
              style={{
                flexShrink: 0,
                padding: "7px 16px",
                borderRadius: 999,
                fontSize: isMobile ? 14 : 13,
                fontWeight: 600,
                border: "1px solid",
                cursor: "pointer",
                transition: "all 0.15s",
                background: isActive
                  ? "rgba(255,107,53,0.12)"
                  : "var(--dash-surface-2)",
                color: isActive ? "var(--accent)" : "var(--dash-muted)",
                borderColor: isActive ? "rgba(255,107,53,0.3)" : "var(--dash-border)",
                minHeight: isMobile ? 36 : "auto",
                WebkitTapHighlightColor: "transparent",
                userSelect: "none",
              }}
            >
              {pill.label} ({counts[pill.key] ?? 0})
            </button>
          );
        })}
      </div>

      {/* Content */}
      {filtered.length === 0 ? (
        <div
          style={{
            padding: "56px 20px",
            textAlign: "center",
            color: "var(--dash-muted)",
          }}
        >
          <p style={{ fontSize: 32, marginBottom: 8 }}>📋</p>
          <p style={{ fontSize: 14 }}>
            {search ? "Sin resultados" : "No hay pedidos en esta categoría"}
          </p>
        </div>
      ) : isMobile ? (
        // ── Mobile: cards ──
        <div style={{ padding: "12px 12px 4px" }}>
          {filtered.map((order) => (
            <MobileOrderCard
              key={order.id}
              order={order}
              slug={slug}
              isNew={newOrderIds.has(order.id)}
              onUpdateStatus={updateStatus}
              onDeleteOrder={deleteOrder}
            />
          ))}
        </div>
      ) : (
        // ── Desktop: accordion rows ──
        <div>
          {filtered.map((order) => {
            const isOpen = expanded === order.id;
            const isNew = newOrderIds.has(order.id);

            return (
              <div
                key={order.id}
                style={{
                  background: isNew ? "rgba(255,107,53,0.06)" : undefined,
                  borderBottom: "1px solid var(--dash-border)",
                  transition: "background 1s ease",
                }}
              >
                <button
                  onClick={() => setExpanded(isOpen ? null : order.id)}
                  style={{
                    width: "100%",
                    padding: "12px 20px",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "background 0.15s",
                    WebkitTapHighlightColor: "transparent",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "var(--dash-surface-2)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        flexWrap: "wrap",
                      }}
                    >
                      <Link
                        href={`/${slug}/admin/pedidos/${order.order_ref ?? order.id}`}
                        style={{
                          color: "var(--dash-text)",
                          fontWeight: 700,
                          fontSize: 13,
                          textDecoration: "none",
                          fontFamily: "var(--font-mono, monospace)",
                          borderBottom: "1px dashed rgba(255,255,255,0.25)",
                          transition: "color 0.15s, border-color 0.15s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = "var(--accent)";
                          e.currentTarget.style.borderColor = "var(--accent)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = "var(--dash-text)";
                          e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)";
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        #{order.order_ref ?? order.id.slice(0, 6)}
                      </Link>
                      <StatusBadge status={order.status} />
                      {isNew && (
                        <span
                          style={{
                            fontSize: 10,
                            padding: "2px 6px",
                            borderRadius: 999,
                            fontWeight: 700,
                            background: "rgba(255,107,53,0.2)",
                            color: "#ff6b35",
                            border: "1px solid rgba(255,107,53,0.4)",
                          }}
                        >
                          🔔 Nuevo
                        </span>
                      )}
                    </div>
                    <p
                      style={{
                        fontSize: 12,
                        color: "var(--dash-muted)",
                        marginTop: 2,
                      }}
                    >
                      {order.customer_name ?? "—"} ·{" "}
                      {deliveryLabel(order.delivery_type)} ·{" "}
                      {paymentLabel(order.payment_method)} ·{" "}
                      {fmtFecha(order.created_at)}
                    </p>
                  </div>
                  <span
                    style={{
                      fontWeight: 800,
                      color: "var(--dash-text)",
                      fontSize: 14,
                      flexShrink: 0,
                    }}
                  >
                    {fmtARS(order.total)}
                  </span>
                  {isOpen ? (
                    <ChevronUp
                      style={{
                        width: 16,
                        height: 16,
                        color: "var(--dash-muted)",
                        flexShrink: 0,
                      }}
                    />
                  ) : (
                    <ChevronDown
                      style={{
                        width: 16,
                        height: 16,
                        color: "var(--dash-muted)",
                        flexShrink: 0,
                      }}
                    />
                  )}
                </button>

                {isOpen && (
                  <OrderDetailView
                    order={order}
                    slug={slug}
                    onUpdateStatus={updateStatus}
                    onDeleteOrder={deleteOrder}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
