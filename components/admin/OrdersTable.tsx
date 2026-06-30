"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import {
  ChevronDown,
  ChevronUp,
  Search,
  X,
  Printer,
  Trash2,
  Clock,
  ChefHat,
  CheckCircle,
  DollarSign,
} from "lucide-react";
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

// ── Order age ─────────────────────────────────────────────────────────────────

function getOrderAgeMinutes(createdAt: string): number {
  return Math.floor((Date.now() - new Date(createdAt).getTime()) / 60_000);
}

function useNowMinute() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(id);
  }, []);
}

function OrderAgeBadge({
  createdAt,
  status,
}: {
  createdAt: string;
  status: string;
}) {
  useNowMinute();
  const activeStatuses = [
    "pending",
    "nuevo",
    "confirmed",
    "preparando",
    "preparing",
  ];
  if (!activeStatuses.includes(status)) return null;
  const mins = getOrderAgeMinutes(createdAt);
  if (mins < 2) return null;
  const color =
    mins >= 30 ? "#f87171" : mins >= 15 ? "#fb923c" : "var(--dash-muted)";
  return (
    <span style={{ fontSize: 11, color, fontWeight: mins >= 15 ? 700 : 400 }}>
      hace {mins}m
    </span>
  );
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
  { key: "preparing", label: "Preparando" },
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

function normalizeStatus(status: string): string {
  const aliases: Record<string, string> = {
    nuevo: "pending",
    preparando: "confirmed",
    listo: "ready",
    entregado: "delivered",
  };
  return aliases[status] ?? status;
}

function getNextStatus(
  status: string,
): (typeof STATUS_FLOW)[number]["key"] | null {
  const normalized = normalizeStatus(status);
  const idx = STATUS_FLOW.findIndex((s) => s.key === normalized);
  if (idx === -1 || idx >= STATUS_FLOW.length - 1) return null;
  return STATUS_FLOW[idx + 1].key;
}

function StatusBadge({ status }: { status: string }) {
  const meta = getStatusMeta(status);
  return (
    <span
      style={{
        display: "inline-block",
        padding: "4px 12px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 700,
        background: meta.bg,
        color: meta.color,
        border: `1px solid ${meta.border}`,
        whiteSpace: "nowrap",
        letterSpacing: "0.01em",
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
    ? "Delivery"
    : "Retiro en local";
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
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const items = (order.items ?? []) as OrderItemDetailed[];
  const hasDelivery =
    order.delivery_type === "delivery" || order.delivery_type === "domicilio";
  const deliveryCost = order.delivery_cost ?? 0;
  const subtotal = order.subtotal ?? order.total - deliveryCost;

  function handlePrintTicket() {
    window.open(
      `/${slug}/admin/pedidos/${order.order_ref ?? order.id}?print=1`,
      `print-${order.order_ref || order.id}`,
      "width=420,height=700,status=no,toolbar=no,menubar=no",
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
          <h4
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "var(--dash-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              margin: 0,
            }}
          >
            Contacto & Entrega
          </h4>
          <div
            style={{
              fontSize: 13,
              display: "flex",
              flexDirection: "column",
              gap: 4,
            }}
          >
            <p
              style={{ margin: 0, color: "var(--dash-text)", fontWeight: 600 }}
            >
              {order.customer_name || "Sin nombre"}
            </p>
            {order.customer_phone && (
              <p style={{ margin: 0, color: "var(--dash-muted)" }}>
                📞{" "}
                <a
                  href={`tel:${order.customer_phone}`}
                  style={{ color: "var(--accent)", textDecoration: "none" }}
                >
                  {order.customer_phone}
                </a>
              </p>
            )}
            <p style={{ margin: 0, color: "var(--dash-muted)" }}>
              📍 {deliveryLabel(order.delivery_type)}
            </p>
            {(order.customer_address ?? order.address) && (
              <p
                style={{
                  margin: "4px 0 0 0",
                  padding: "6px 8px",
                  background: "var(--dash-surface-2)",
                  borderRadius: 6,
                  color: "var(--dash-text)",
                  fontSize: 12,
                }}
              >
                {order.customer_address ?? order.address}
              </p>
            )}
          </div>
        </div>

        {/* Notas e Instrucciones */}
        <div
          style={{
            background: order.notes
              ? "rgba(251,146,60,0.05)"
              : "var(--dash-surface)",
            border: order.notes
              ? "1px solid rgba(251,146,60,0.2)"
              : "1px solid var(--dash-border)",
            borderRadius: 12,
            padding: 14,
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <h4
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: order.notes ? "#fb923c" : "var(--dash-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              margin: 0,
            }}
          >
            Notas y Pago
          </h4>
          <div
            style={{
              fontSize: 13,
              display: "flex",
              flexDirection: "column",
              gap: 4,
            }}
          >
            <p style={{ margin: 0, color: "var(--dash-muted)" }}>
              Método de Pago:{" "}
              <strong style={{ color: "var(--dash-text)" }}>
                {paymentLabel(order.payment_method)}
              </strong>
            </p>
            {order.notes ? (
              <div
                style={{
                  padding: 8,
                  background: "rgba(251,146,60,0.1)",
                  borderLeft: "3px solid #fb923c",
                  borderRadius: 4,
                  color: "var(--dash-text)",
                  fontSize: 12,
                  marginTop: 4,
                }}
              >
                <strong>Nota:</strong> &ldquo;{order.notes}&rdquo;
              </div>
            ) : (
              <p
                style={{
                  margin: 0,
                  color: "var(--dash-muted)",
                  fontStyle: "italic",
                }}
              >
                Sin notas del cliente
              </p>
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
                  borderBottom:
                    i < items.length - 1
                      ? "1px solid var(--dash-border)"
                      : "none",
                  display: "grid",
                  gridTemplateColumns: "3fr 1.2fr 1.5fr",
                  alignItems: "center",
                }}
              >
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 2 }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
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
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "var(--dash-text)",
                      }}
                    >
                      {item.name}
                    </span>
                  </div>
                  {item.selected_extra && (
                    <span
                      style={{
                        fontSize: 11,
                        color: "var(--dash-muted)",
                        marginLeft: 28,
                      }}
                    >
                      + {item.selected_extra.name}{" "}
                      {item.selected_extra.price > 0 &&
                        `(+${fmtARS(item.selected_extra.price)})`}
                    </span>
                  )}
                </div>
                <span
                  style={{
                    fontSize: 12,
                    color: "var(--dash-muted)",
                    textAlign: "right",
                  }}
                >
                  {fmtARS(item.price)}
                </span>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--dash-text)",
                    textAlign: "right",
                  }}
                >
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
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  color: "var(--dash-muted)",
                }}
              >
                <span>Subtotal</span>
                <span>{fmtARS(subtotal)}</span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  color: "var(--dash-muted)",
                }}
              >
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
              borderTop:
                hasDelivery && deliveryCost > 0
                  ? "1px dashed var(--dash-border)"
                  : "none",
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
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
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
            <Printer
              style={{ width: 14, height: 14, color: "var(--accent)" }}
            />
            Imprimir Ticket
          </button>

          {confirmingDelete ? (
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <span style={{ fontSize: 12, color: "#f87171", fontWeight: 600 }}>
                ¿Eliminar?
              </span>
              <button
                onClick={() => {
                  setConfirmingDelete(false);
                  onDeleteOrder(order.id);
                }}
                style={{
                  padding: "7px 12px",
                  background: "rgba(239,68,68,0.15)",
                  border: "1px solid #ef4444",
                  color: "#f87171",
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Sí, eliminar
              </button>
              <button
                onClick={() => setConfirmingDelete(false)}
                style={{
                  padding: "7px 12px",
                  background: "var(--dash-surface-2)",
                  border: "1px solid var(--dash-border)",
                  color: "var(--dash-muted)",
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Cancelar
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmingDelete(true)}
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
          )}
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
              <ChevronUp
                style={{ width: 16, height: 16, color: "var(--dash-muted)" }}
              />
            ) : (
              <ChevronDown
                style={{ width: 16, height: 16, color: "var(--dash-muted)" }}
              />
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
          <span
            style={{ fontWeight: 800, fontSize: 18, color: "var(--accent)" }}
          >
            {fmtARS(order.total)}
          </span>
          <span
            style={{
              fontSize: 12,
              color: "var(--dash-muted)",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <OrderAgeBadge createdAt={order.created_at} status={order.status} />
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
  const [offset, setOffset] = useState(initialOrders.length);
  const [hasMore, setHasMore] = useState(initialOrders.length === 50);
  const [loadingMore, setLoadingMore] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [newOrderIds, setNewOrderIds] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<FilterKey>("all");
  const [search, setSearch] = useState("");
  const [dateRange, setDateRange] = useState<
    "all" | "today" | "week" | "month"
  >("all");
  const isMobile = useIsMobile();

  const notifPermissionRef = useRef<NotificationPermission>("default");
  const unseenCountRef = useRef(0);

  // Request browser notification permission once on mount
  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission === "granted") {
      notifPermissionRef.current = "granted";
    } else if (Notification.permission !== "denied") {
      void Notification.requestPermission().then((perm) => {
        notifPermissionRef.current = perm;
      });
    } else {
      notifPermissionRef.current = "denied";
    }
  }, []);

  // Reset tab title badge when user returns to the tab
  useEffect(() => {
    if (typeof document === "undefined") return;
    const handleVisibility = () => {
      if (!document.hidden && unseenCountRef.current > 0) {
        unseenCountRef.current = 0;
        document.title = "Pedidos — Admin";
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

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
          // Tab title badge when tab is in background
          if (typeof document !== "undefined" && document.hidden) {
            unseenCountRef.current += 1;
            document.title = `(${unseenCountRef.current}) Nuevo pedido — Admin`;
          }
          // Browser push notification
          if (
            typeof window !== "undefined" &&
            "Notification" in window &&
            notifPermissionRef.current === "granted"
          ) {
            try {
              new Notification("Nuevo pedido", {
                body: incoming.customer_name
                  ? `${incoming.customer_name} — $ ${incoming.total.toLocaleString("es-AR")}`
                  : `Pedido por $ ${incoming.total.toLocaleString("es-AR")}`,
                icon: "/favicon.ico",
              });
            } catch {}
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `tenant_id=eq.${tenantId}`,
        },
        (payload) => {
          const updated = payload.new as Order;
          setOrders((prev) =>
            prev.map((o) => (o.id === updated.id ? updated : o)),
          );
        },
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "orders",
          filter: `tenant_id=eq.${tenantId}`,
        },
        (payload) => {
          const deleted = payload.old as { id: string };
          setOrders((prev) => prev.filter((o) => o.id !== deleted.id));
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
    if (
      !confirm(
        "¿Eliminar este pedido permanentemente? Esta acción no se puede deshacer.",
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(data.error ?? `Error ${res.status}`);
      }

      setOrders((prev) => prev.filter((o) => o.id !== orderId));
      if (expanded === orderId) setExpanded(null);
      toast.success("Pedido eliminado correctamente.");
      vibrate([60, 40, 60]);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "No se pudo eliminar el pedido.",
      );
      vibrate([100, 50, 100]);
    }
  }

  async function loadMore() {
    setLoadingMore(true);
    try {
      const supabase = createSupabaseBrowser();
      const { data } = await supabase
        .from("orders")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false })
        .range(offset, offset + 49);
      const incoming = (data ?? []) as Order[];
      if (incoming.length > 0) {
        setOrders((prev) => {
          const existingIds = new Set(prev.map((o) => o.id));
          const fresh = incoming.filter((o) => !existingIds.has(o.id));
          return [...prev, ...fresh];
        });
        setOffset((prev) => prev + incoming.length);
      }
      if (incoming.length < 50) setHasMore(false);
    } catch {
      // silently fail — la tabla sigue mostrando los pedidos actuales
    } finally {
      setLoadingMore(false);
    }
  }

  const counts = useMemo(() => {
    const map: Record<string, number> = { all: orders.length };
    FILTER_PILLS.slice(1).forEach(({ key }) => {
      map[key] = orders.filter((o) => matchesFilter(o, key)).length;
    });
    return map;
  }, [orders]);

  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return {
      pending: orders.filter(
        (o) => o.status === "pending" || o.status === "nuevo",
      ).length,
      active: orders.filter(
        (o) =>
          o.status === "confirmed" ||
          o.status === "preparando" ||
          o.status === "preparing",
      ).length,
      ready: orders.filter((o) => o.status === "ready" || o.status === "listo")
        .length,
      todaySales: orders
        .filter(
          (o) =>
            (o.status === "delivered" || o.status === "entregado") &&
            new Date(o.created_at) >= today,
        )
        .reduce((sum, o) => sum + o.total, 0),
    };
  }, [orders]);

  const filtered = useMemo(() => {
    let list = orders.filter((o) => matchesFilter(o, filter));

    if (dateRange !== "all") {
      const now = new Date();
      const startOfToday = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
      );
      const cutoff =
        dateRange === "today"
          ? startOfToday
          : dateRange === "week"
            ? new Date(startOfToday.getTime() - 6 * 86_400_000)
            : new Date(startOfToday.getTime() - 29 * 86_400_000);
      list = list.filter((o) => new Date(o.created_at) >= cutoff);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (o) =>
          o.customer_name?.toLowerCase().includes(q) ||
          o.order_ref?.toLowerCase().includes(q),
      );
    }
    return list;
  }, [orders, filter, dateRange, search]);

  return (
    <>
      {/* Live stats KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            label: "Pendientes",
            value: stats.pending,
            icon: Clock,
            color: "#f59e0b",
            bg: "rgba(245,158,11,0.1)",
          },
          {
            label: "En Cocina",
            value: stats.active,
            icon: ChefHat,
            color: "#60a5fa",
            bg: "rgba(59,130,246,0.1)",
          },
          {
            label: "Listos",
            value: stats.ready,
            icon: CheckCircle,
            color: "#4ade80",
            bg: "rgba(34,197,94,0.1)",
          },
          {
            label: "Ventas Hoy",
            value: "$ " + stats.todaySales.toLocaleString("es-AR"),
            icon: DollarSign,
            color: "var(--accent, #ff6b35)",
            bg: "rgba(255,107,53,0.1)",
          },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div
            key={label}
            style={{
              background:
                "linear-gradient(145deg, var(--dash-surface, #1e1e1e) 0%, rgba(28,33,40,0.95) 100%)",
              border: "1px solid var(--dash-border, rgba(255,255,255,0.08))",
              borderRadius: 12,
              padding: 14,
              display: "flex",
              alignItems: "center",
              gap: 12,
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            }}
          >
            <div
              style={{
                background: bg,
                padding: 8,
                borderRadius: 10,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Icon style={{ color, width: 18, height: 18 }} />
            </div>
            <div>
              <p
                style={{
                  margin: 0,
                  fontSize: 11,
                  color: "var(--dash-muted, #888)",
                  fontWeight: 500,
                }}
              >
                {label}
              </p>
              <p
                style={{
                  margin: 0,
                  fontSize: 18,
                  fontWeight: 800,
                  color: "var(--dash-text, #fff)",
                  fontFamily: "var(--font-mono, monospace)",
                }}
              >
                {value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Orders table */}
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
                  fontSize: 13,
                  fontWeight: 600,
                  border: "1px solid",
                  cursor: "pointer",
                  transition: "all 0.15s",
                  background: isActive
                    ? "rgba(255,107,53,0.12)"
                    : "var(--dash-surface-2)",
                  color: isActive ? "var(--accent)" : "var(--dash-muted)",
                  borderColor: isActive
                    ? "rgba(255,107,53,0.3)"
                    : "var(--dash-border)",
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

        {/* Date range filter */}
        <div
          style={{
            padding: "8px 16px",
            borderBottom: "1px solid var(--dash-border)",
            display: "flex",
            gap: 6,
            overflowX: "auto",
            scrollbarWidth: "none",
            alignItems: "center",
          }}
        >
          <span
            style={{
              fontSize: 11,
              color: "var(--dash-muted)",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              flexShrink: 0,
              marginRight: 2,
            }}
          >
            Período:
          </span>
          {(
            [
              { key: "all", label: "Todos" },
              { key: "today", label: "Hoy" },
              { key: "week", label: "7 días" },
              { key: "month", label: "30 días" },
            ] as const
          ).map(({ key, label }) => {
            const isActive = dateRange === key;
            return (
              <button
                key={key}
                onClick={() => setDateRange(key)}
                style={{
                  flexShrink: 0,
                  padding: "5px 13px",
                  borderRadius: 999,
                  fontSize: 13,
                  fontWeight: 600,
                  border: "1px solid",
                  cursor: "pointer",
                  transition: "all 0.15s",
                  background: isActive
                    ? "rgba(96,165,250,0.12)"
                    : "var(--dash-surface-2)",
                  color: isActive ? "#60a5fa" : "var(--dash-muted)",
                  borderColor: isActive
                    ? "rgba(96,165,250,0.3)"
                    : "var(--dash-border)",
                  minHeight: isMobile ? 34 : "auto",
                  WebkitTapHighlightColor: "transparent",
                  userSelect: "none",
                }}
              >
                {label}
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
                      (e.currentTarget.style.background =
                        "var(--dash-surface-2)")
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
                            e.currentTarget.style.borderColor =
                              "rgba(255,255,255,0.25)";
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
                        {fmtFecha(order.created_at)}{" "}
                        <OrderAgeBadge
                          createdAt={order.created_at}
                          status={order.status}
                        />
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
                    {/* Quick advance button — no need to expand accordion */}
                    {(() => {
                      const next = getNextStatus(order.status);
                      if (!next) return null;
                      const m = getStatusMeta(next);
                      return (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            vibrate(40);
                            void updateStatus(order.id, next);
                          }}
                          title={`Marcar como ${m.label}`}
                          style={{
                            padding: "4px 10px",
                            borderRadius: 999,
                            fontSize: 11,
                            fontWeight: 700,
                            border: `1px solid ${m.border}`,
                            background: m.bg,
                            color: m.color,
                            cursor: "pointer",
                            flexShrink: 0,
                            transition: "opacity 0.15s",
                            whiteSpace: "nowrap",
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.opacity = "0.7")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.opacity = "1")
                          }
                        >
                          {m.label}
                        </button>
                      );
                    })()}
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

        {/* Cargar más pedidos */}
        {hasMore && (
          <div
            style={{
              padding: "12px 20px",
              borderTop: "1px solid var(--dash-border)",
              textAlign: "center",
            }}
          >
            <button
              onClick={() => void loadMore()}
              disabled={loadingMore}
              style={{
                padding: "8px 20px",
                borderRadius: 8,
                border: "1px solid var(--dash-border)",
                background: "var(--dash-surface-2)",
                color: loadingMore ? "var(--dash-muted)" : "var(--dash-text)",
                fontSize: 13,
                fontWeight: 600,
                cursor: loadingMore ? "not-allowed" : "pointer",
                opacity: loadingMore ? 0.6 : 1,
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                if (!loadingMore) {
                  e.currentTarget.style.borderColor = "var(--accent)";
                  e.currentTarget.style.background = "rgba(255,107,53,0.05)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--dash-border)";
                e.currentTarget.style.background = "var(--dash-surface-2)";
              }}
            >
              {loadingMore ? "Cargando..." : "Cargar más pedidos"}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
