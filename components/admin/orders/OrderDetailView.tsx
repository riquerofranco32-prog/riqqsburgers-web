"use client";

import { useState } from "react";
import { Printer, Trash2, MessageCircle, Check } from "lucide-react";
import type { Order } from "@/types/supabase";
import { buildWhatsAppLink } from "@/lib/whatsapp-notify";
import { StatusBadge } from "./StatusBadge";
import {
  fmtARS,
  vibrate,
  paymentLabel,
  deliveryLabel,
  getStatusMeta,
  STATUS_FLOW,
  normalizeStatus,
} from "./utils";

interface OrderItemDetailed {
  name: string;
  quantity: number;
  price: number;
  selected_extra?: {
    name: string;
    price: number;
  } | null;
  addons?: Array<{ name: string; price: number }>;
  removed_ingredients?: string[];
  combined_with?: { id: string; name: string };
}

export function OrderDetailView({
  order,
  slug,
  onUpdateStatus,
  onDeleteOrder,
  canDelete = true,
}: {
  order: Order;
  slug: string;
  onUpdateStatus: (id: string, status: string) => Promise<void>;
  onDeleteOrder: (id: string) => Promise<void>;
  canDelete?: boolean;
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
            {order.delivery_lat != null && order.delivery_lng != null && (
              <a
                href={`https://www.google.com/maps?q=${order.delivery_lat},${order.delivery_lng}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: "var(--accent)",
                  textDecoration: "none",
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                🗺️ Abrir en Google Maps
              </a>
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

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {items.map((item, i) => {
            const extraPrice = item.selected_extra?.price ?? 0;
            const addonsPrice = (item.addons ?? []).reduce(
              (s, a) => s + a.price,
              0,
            );
            const unitPrice = item.price + extraPrice + addonsPrice;
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
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "var(--dash-surface-2)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
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
                      {item.combined_with
                        ? `Mitad ${item.name} / Mitad ${item.combined_with.name}`
                        : item.name}
                    </span>
                  </div>
                  {item.selected_extra && (
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: "var(--dash-text)",
                        marginLeft: 28,
                      }}
                    >
                      + {item.selected_extra.name}{" "}
                      {item.selected_extra.price > 0 &&
                        `(+${fmtARS(item.selected_extra.price)})`}
                    </span>
                  )}
                  {item.addons && item.addons.length > 0 && (
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: "var(--dash-text)",
                        marginLeft: 28,
                      }}
                    >
                      +{" "}
                      {item.addons
                        .map((a) =>
                          a.price > 0
                            ? `${a.name} (+${fmtARS(a.price)})`
                            : a.name,
                        )
                        .join(", ")}
                    </span>
                  )}
                  {item.removed_ingredients &&
                    item.removed_ingredients.length > 0 && (
                      <span
                        style={{
                          fontSize: 12,
                          color: "#d97706",
                          marginLeft: 28,
                          fontWeight: 800,
                        }}
                      >
                        ⚠ Sin: {item.removed_ingredients.join(", ")}
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
            fontVariantNumeric: "tabular-nums",
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
          flexDirection: "column",
          gap: 14,
          borderTop: "1px solid var(--dash-border)",
          paddingTop: 14,
        }}
      >
        {/* Stepper de progreso del pedido */}
        {order.status === "cancelled" ? (
          <p
            style={{
              margin: 0,
              fontSize: 12,
              fontWeight: 600,
              color: "#f87171",
            }}
          >
            Este pedido fue cancelado.
          </p>
        ) : (
          <div>
            <div style={{ display: "flex", alignItems: "center" }}>
              {STATUS_FLOW.map(({ key, label }, i) => {
                const currentIdx = STATUS_FLOW.findIndex(
                  (s) => s.key === normalizeStatus(order.status),
                );
                const isDone = i < currentIdx;
                const isCurrent = i === currentIdx;
                const m = getStatusMeta(key);
                return (
                  <div
                    key={key}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      flex: i < STATUS_FLOW.length - 1 ? 1 : undefined,
                    }}
                  >
                    <button
                      onClick={() => {
                        vibrate(40);
                        onUpdateStatus(order.id, key);
                      }}
                      title={label}
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: "50%",
                        flexShrink: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: "pointer",
                        border: "1.5px solid",
                        transition: "all 0.2s",
                        background: isDone || isCurrent ? m.bg : "transparent",
                        color:
                          isDone || isCurrent ? m.color : "var(--dash-muted)",
                        borderColor:
                          isDone || isCurrent ? m.border : "var(--dash-border)",
                        WebkitTapHighlightColor: "transparent",
                      }}
                    >
                      {isDone ? <Check size={12} strokeWidth={3} /> : i + 1}
                    </button>
                    {i < STATUS_FLOW.length - 1 && (
                      <div
                        style={{
                          flex: 1,
                          height: 2,
                          background: isDone
                            ? "var(--accent)"
                            : "var(--dash-border)",
                          transition: "background 0.2s",
                        }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
            <div style={{ display: "flex", marginTop: 4 }}>
              {STATUS_FLOW.map(({ key, label }, i) => {
                const currentIdx = STATUS_FLOW.findIndex(
                  (s) => s.key === normalizeStatus(order.status),
                );
                return (
                  <span
                    key={key}
                    style={{
                      flex: i === STATUS_FLOW.length - 1 ? undefined : 1,
                      width: i === STATUS_FLOW.length - 1 ? "auto" : undefined,
                      maxWidth: i === STATUS_FLOW.length - 1 ? 70 : undefined,
                      textAlign:
                        i === 0
                          ? "left"
                          : i === STATUS_FLOW.length - 1
                            ? "right"
                            : "center",
                      fontSize: 10,
                      fontWeight: i === currentIdx ? 700 : 500,
                      color:
                        i === currentIdx
                          ? "var(--dash-text)"
                          : "var(--dash-muted)",
                    }}
                  >
                    {label}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {order.status !== "cancelled" &&
          order.status !== "delivered" &&
          order.status !== "entregado" && (
            <button
              onClick={() => {
                vibrate([40, 30, 40]);
                onUpdateStatus(order.id, "cancelled");
              }}
              style={{
                alignSelf: "flex-start",
                padding: "6px 14px",
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                transition:
                  "background-color 0.15s, color 0.15s, border-color 0.15s",
                border: "1px solid rgba(239,68,68,0.4)",
                background: "rgba(239,68,68,0.08)",
                color: "#f87171",
                minHeight: 32,
                WebkitTapHighlightColor: "transparent",
                userSelect: "none",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(239,68,68,0.15)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(239,68,68,0.08)";
              }}
            >
              ✕ Cancelar pedido
            </button>
          )}

        {/* Acciones del sistema: Imprimir / WA / Eliminar */}
        <div
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          {order.customer_phone &&
            (
              ["confirmed", "preparing", "ready", "delivered"] as string[]
            ).includes(order.status) &&
            (() => {
              const waLink = buildWhatsAppLink(
                order.customer_phone,
                order.order_ref ?? "",
                order.status,
                window.location.origin,
              );
              if (!waLink) return null;
              return (
                <a
                  href={waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "7px 12px",
                    background: "rgba(37,211,102,0.1)",
                    border: "1px solid rgba(37,211,102,0.3)",
                    color: "#25D366",
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    textDecoration: "none",
                    transition: "background 0.15s, border-color 0.15s",
                    whiteSpace: "nowrap",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(37,211,102,0.18)";
                    e.currentTarget.style.borderColor = "rgba(37,211,102,0.5)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(37,211,102,0.1)";
                    e.currentTarget.style.borderColor = "rgba(37,211,102,0.3)";
                  }}
                >
                  <MessageCircle style={{ width: 14, height: 14 }} />
                  Avisar WA
                </a>
              );
            })()}
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

          {canDelete &&
            (confirmingDelete ? (
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <span
                  style={{ fontSize: 12, color: "#f87171", fontWeight: 600 }}
                >
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
            ))}
        </div>
      </div>
    </div>
  );
}
