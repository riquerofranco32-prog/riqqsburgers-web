"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Bell, ChevronRight } from "lucide-react";
import type { Order } from "@/types/supabase";
import { OrderDetailView } from "./OrderDetailView";
import { OrderAgeBadge } from "./StatusBadge";
import {
  fmtARS,
  vibrate,
  normalizeStatus,
  getNextStatus,
  getStatusMeta,
  summarizeItems,
  STATUS_FLOW,
} from "./utils";

export function OrdersBoard({
  orders,
  slug,
  newOrderIds,
  expanded,
  onToggleOpen,
  onUpdateStatus,
  onDeleteOrder,
  canDelete = true,
}: {
  orders: Order[];
  slug: string;
  newOrderIds: Set<string>;
  expanded: string | null;
  onToggleOpen: (id: string) => void;
  onUpdateStatus: (id: string, status: string) => Promise<void>;
  onDeleteOrder: (id: string) => Promise<void>;
  canDelete?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: 12,
        padding: 16,
        overflowX: "auto",
      }}
    >
      {STATUS_FLOW.map(({ key, label }) => {
        const columnOrders = orders.filter(
          (o) => normalizeStatus(o.status) === key,
        );
        const meta = getStatusMeta(key);
        return (
          <div
            key={key}
            style={{
              flex: "0 0 270px",
              display: "flex",
              flexDirection: "column",
              background: "var(--dash-surface-2)",
              border: "1px solid var(--dash-border)",
              borderRadius: 14,
              maxHeight: "72vh",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "10px 12px",
                borderBottom: "1px solid var(--dash-border)",
                display: "flex",
                alignItems: "center",
                gap: 8,
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: meta.color,
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "var(--dash-text)",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                {label}
              </span>
              <span
                style={{
                  marginLeft: "auto",
                  fontSize: 11,
                  fontWeight: 700,
                  color: "var(--dash-muted)",
                  background: "var(--dash-surface-3)",
                  borderRadius: 999,
                  padding: "1px 8px",
                }}
              >
                {columnOrders.length}
              </span>
            </div>

            <div
              style={{
                overflowY: "auto",
                padding: 8,
                display: "flex",
                flexDirection: "column",
                gap: 8,
                flex: 1,
              }}
            >
              <AnimatePresence initial={false}>
                {columnOrders.map((order) => (
                  <motion.div
                    key={order.id}
                    layoutId={order.id}
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.92 }}
                    transition={{ type: "spring", stiffness: 500, damping: 34 }}
                  >
                    <BoardCard
                      order={order}
                      slug={slug}
                      isNew={newOrderIds.has(order.id)}
                      isOpen={expanded === order.id}
                      onToggleOpen={() => onToggleOpen(order.id)}
                      onUpdateStatus={onUpdateStatus}
                      onDeleteOrder={onDeleteOrder}
                      canDelete={canDelete}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>

              {columnOrders.length === 0 && (
                <div
                  style={{
                    padding: "20px 8px",
                    textAlign: "center",
                    fontSize: 12,
                    color: "var(--dash-muted)",
                  }}
                >
                  Sin pedidos acá
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function BoardCard({
  order,
  slug,
  isNew,
  isOpen,
  onToggleOpen,
  onUpdateStatus,
  onDeleteOrder,
  canDelete,
}: {
  order: Order;
  slug: string;
  isNew: boolean;
  isOpen: boolean;
  onToggleOpen: () => void;
  onUpdateStatus: (id: string, status: string) => Promise<void>;
  onDeleteOrder: (id: string) => Promise<void>;
  canDelete: boolean;
}) {
  const next = getNextStatus(order.status);

  return (
    <div
      className="order-row-trigger"
      style={{
        background: isNew ? "var(--dash-accent-subtle)" : "var(--dash-surface)",
        border: "1px solid var(--dash-border)",
        borderRadius: 12,
        overflow: "hidden",
        boxShadow: "var(--shadow-sm)",
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
          padding: "10px 12px",
          cursor: "pointer",
          WebkitTapHighlightColor: "transparent",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 6,
          }}
        >
          <span
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: "var(--dash-text)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {order.customer_name ?? "—"}
          </span>
          {isNew && (
            <Bell size={12} style={{ color: "var(--accent)", flexShrink: 0 }} />
          )}
        </div>
        <p
          style={{
            fontSize: 11,
            color: "var(--dash-muted)",
            margin: "2px 0 0",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          #{order.order_ref ?? order.id.slice(0, 6)} ·{" "}
          {summarizeItems(order, 34)}
        </p>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: 6,
          }}
        >
          <span
            style={{
              fontSize: 13,
              fontWeight: 800,
              color: "var(--dash-text)",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {fmtARS(order.total)}
          </span>
          <OrderAgeBadge createdAt={order.created_at} status={order.status} />
        </div>
      </div>

      {next && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            vibrate(40);
            void onUpdateStatus(order.id, next);
          }}
          className="order-advance-btn"
          style={{
            width: "100%",
            padding: "7px 12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 4,
            fontSize: 11,
            fontWeight: 700,
            border: "none",
            borderTop: "1px solid var(--dash-border)",
            background: "var(--dash-surface-2)",
            color: "var(--accent)",
            cursor: "pointer",
          }}
        >
          Mover a {getStatusMeta(next).label}
          <ChevronRight size={12} />
        </button>
      )}

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
