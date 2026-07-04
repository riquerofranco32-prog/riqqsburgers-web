"use client";

import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { Order } from "@/types/supabase";
import { OrderDetailView } from "./OrderDetailView";
import { StatusBadge, OrderAgeBadge } from "./StatusBadge";
import {
  fmtARS,
  fmtFecha,
  vibrate,
  getOrderAgeMinutes,
  useNowMinute,
  getNextStatus,
  getStatusMeta,
  paymentLabel,
  deliveryLabel,
} from "./utils";

export function MobileOrderCard({
  order,
  slug,
  isNew,
  isFirst,
  onUpdateStatus,
  onDeleteOrder,
}: {
  order: Order;
  slug: string;
  isNew: boolean;
  isFirst: boolean;
  onUpdateStatus: (id: string, status: string) => Promise<void>;
  onDeleteOrder: (id: string) => Promise<void>;
}) {
  const [isOpen, setIsOpen] = useState(false);
  useNowMinute();

  const isUrgent =
    (order.status === "pending" || order.status === "nuevo") &&
    getOrderAgeMinutes(order.created_at) >= 20;

  const [showSwipeHint, setShowSwipeHint] = useState(() => {
    if (typeof window === "undefined") return false;
    return isFirst && !localStorage.getItem("tak_swipe_hint_seen");
  });

  useEffect(() => {
    if (!showSwipeHint) return;
    const t = setTimeout(() => {
      setShowSwipeHint(false);
      localStorage.setItem("tak_swipe_hint_seen", "1");
    }, 3000);
    return () => clearTimeout(t);
  }, [showSwipeHint]);

  const nextStatus = getNextStatus(order.status);

  return (
    <div
      style={{
        background: isNew ? "rgba(255,107,53,0.08)" : "var(--dash-surface)",
        border: "1px solid var(--dash-border)",
        borderLeft: isUrgent
          ? "3px solid #f87171"
          : "1px solid var(--dash-border)",
        borderRadius: 14,
        marginBottom: 10,
        overflow: "hidden",
        transition: "background 1s ease",
        animation: isUrgent ? "urgentBlink 2s ease-in-out infinite" : undefined,
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
            {showSwipeHint && (
              <span
                style={{
                  fontSize: 10,
                  color: "var(--dash-muted)",
                  opacity: 0.7,
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  userSelect: "none",
                }}
              >
                → Swipe
              </span>
            )}
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

      {/* Quick status actions — always visible on mobile */}
      {nextStatus && (
        <div
          style={{
            padding: "0 12px 12px",
            display: "flex",
            gap: 6,
            flexWrap: "wrap",
          }}
        >
          {(() => {
            const m = getStatusMeta(nextStatus);
            return (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  vibrate(40);
                  void onUpdateStatus(order.id, nextStatus);
                }}
                style={{
                  padding: "8px 14px",
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: 700,
                  border: `1px solid ${m.border}`,
                  background: m.bg,
                  color: m.color,
                  cursor: "pointer",
                  WebkitTapHighlightColor: "transparent",
                  userSelect: "none",
                }}
              >
                {m.label}
              </button>
            );
          })()}
          {order.status !== "cancelled" &&
            order.status !== "delivered" &&
            order.status !== "entregado" && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  vibrate([40, 30, 40]);
                  void onUpdateStatus(order.id, "cancelled");
                }}
                style={{
                  padding: "8px 14px",
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: 700,
                  border: "1px solid rgba(239,68,68,0.4)",
                  background: "rgba(239,68,68,0.08)",
                  color: "#f87171",
                  cursor: "pointer",
                  WebkitTapHighlightColor: "transparent",
                  userSelect: "none",
                }}
              >
                Cancelar
              </button>
            )}
        </div>
      )}

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
