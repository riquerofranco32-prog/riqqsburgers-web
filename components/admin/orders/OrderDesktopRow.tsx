"use client";

import Link from "next/link";
import { ChevronDown, Bell } from "lucide-react";
import type { Order } from "@/types/supabase";
import { OrderDetailView } from "./OrderDetailView";
import { StatusBadge, OrderAgeBadge } from "./StatusBadge";
import {
  fmtARS,
  fmtFecha,
  vibrate,
  getOrderAgeMinutes,
  getNextStatus,
  getStatusMeta,
  paymentLabel,
  deliveryLabel,
  summarizeItems,
} from "./utils";

export function OrderDesktopRow({
  order,
  slug,
  isNew,
  isOpen,
  onToggleOpen,
  onUpdateStatus,
  onDeleteOrder,
  canDelete = true,
  selected = false,
  onToggleSelect,
}: {
  order: Order;
  slug: string;
  isNew: boolean;
  isOpen: boolean;
  onToggleOpen: () => void;
  onUpdateStatus: (id: string, status: string) => Promise<void>;
  onDeleteOrder: (id: string) => Promise<void>;
  canDelete?: boolean;
  selected?: boolean;
  onToggleSelect?: (id: string) => void;
}) {
  const isUrgent =
    (order.status === "pending" || order.status === "nuevo") &&
    getOrderAgeMinutes(order.created_at) >= 20;
  const next = getNextStatus(order.status);

  return (
    <div
      style={{
        background: isNew ? "rgba(255,107,53,0.06)" : undefined,
        borderBottom: "1px solid var(--dash-border)",
        borderLeft: isUrgent ? "3px solid #f87171" : undefined,
        transition: "background 1s ease",
        animation: isUrgent ? "urgentBlink 2s ease-in-out infinite" : undefined,
      }}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={onToggleOpen}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onToggleOpen();
          }
        }}
        style={{
          width: "100%",
          padding: "var(--row-py, 14px) 20px",
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
        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
      >
        {onToggleSelect && (
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onToggleSelect(order.id)}
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 16,
              height: 16,
              flexShrink: 0,
              accentColor: "var(--accent)",
              cursor: "pointer",
            }}
          />
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                color: "var(--dash-text)",
                fontWeight: 700,
                fontSize: 14,
              }}
            >
              {order.customer_name ?? "—"}
            </span>
            <Link
              href={`/${slug}/admin/pedidos/${order.order_ref ?? order.id}`}
              style={{
                color: "var(--dash-muted)",
                fontWeight: 600,
                fontSize: 11,
                textDecoration: "none",
                fontFamily: "var(--font-mono, monospace)",
                background: "var(--dash-surface-2)",
                border: "1px solid var(--dash-border)",
                borderRadius: 999,
                padding: "2px 8px",
                transition: "color 0.15s, border-color 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "var(--accent)";
                e.currentTarget.style.borderColor = "var(--accent)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "var(--dash-muted)";
                e.currentTarget.style.borderColor = "var(--dash-border)";
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
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <Bell style={{ width: 10, height: 10 }} />
                Nuevo
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
            {deliveryLabel(order.delivery_type)} ·{" "}
            {paymentLabel(order.payment_method)} · {fmtFecha(order.created_at)}{" "}
            <OrderAgeBadge createdAt={order.created_at} status={order.status} />
          </p>
          <p
            style={{
              fontSize: 12,
              color: "var(--dash-muted)",
              marginTop: 3,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxWidth: "100%",
            }}
          >
            🛒 {summarizeItems(order)}
          </p>
        </div>
        <span
          style={{
            fontWeight: 800,
            color: "var(--dash-text)",
            fontSize: 14,
            flexShrink: 0,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {fmtARS(order.total)}
        </span>
        {/* Quick advance button — no need to expand accordion */}
        {next &&
          (() => {
            const m = getStatusMeta(next);
            return (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  vibrate(40);
                  void onUpdateStatus(order.id, next);
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
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.7")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
              >
                {m.label}
              </button>
            );
          })()}
        <ChevronDown
          style={{
            width: 16,
            height: 16,
            color: "var(--dash-muted)",
            flexShrink: 0,
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s ease-out",
          }}
        />
      </div>

      {isOpen && (
        <OrderDetailView
          order={order}
          slug={slug}
          onUpdateStatus={onUpdateStatus}
          onDeleteOrder={onDeleteOrder}
          canDelete={canDelete}
        />
      )}
    </div>
  );
}
