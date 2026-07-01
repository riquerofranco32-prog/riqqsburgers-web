"use client";

import { useState, useEffect, useRef } from "react";
import { ArrowRight, Copy, Check } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { createSupabaseBrowser } from "@/lib/supabase";
import type { Order } from "@/types/supabase";

function fmtARS(n: number) {
  return "$" + n.toLocaleString("es-AR");
}

function fmtHora(iso: string) {
  return new Date(iso).toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

const STATUS_BADGE: Record<
  string,
  { label: string; bg: string; color: string }
> = {
  pending: {
    label: "Pendiente",
    bg: "rgba(245,158,11,0.12)",
    color: "#f59e0b",
  },
  nuevo: { label: "Nuevo", bg: "rgba(245,158,11,0.12)", color: "#f59e0b" },
  confirmed: {
    label: "Confirmado",
    bg: "rgba(59,130,246,0.12)",
    color: "#60a5fa",
  },
  preparando: {
    label: "Preparando",
    bg: "rgba(59,130,246,0.12)",
    color: "#60a5fa",
  },
  ready: { label: "Listo", bg: "rgba(34,197,94,0.12)", color: "#4ade80" },
  listo: { label: "Listo", bg: "rgba(34,197,94,0.12)", color: "#4ade80" },
  delivered: {
    label: "Entregado",
    bg: "rgba(113,113,122,0.15)",
    color: "#a1a1aa",
  },
  entregado: {
    label: "Entregado",
    bg: "rgba(113,113,122,0.15)",
    color: "#a1a1aa",
  },
  cancelled: {
    label: "Cancelado",
    bg: "rgba(239,68,68,0.12)",
    color: "#f87171",
  },
};

function CopyRef({ orderRef }: { orderRef: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        void navigator.clipboard.writeText(orderRef).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        });
      }}
      title="Copiar ref"
      style={{
        background: "none",
        border: "none",
        cursor: "pointer",
        color: copied ? "#4ade80" : "var(--dash-muted)",
        padding: "2px 4px",
        borderRadius: 4,
        display: "inline-flex",
        alignItems: "center",
        opacity: 0.7,
        transition: "opacity 0.15s, color 0.15s",
        verticalAlign: "middle",
        marginLeft: 3,
      }}
      onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
      onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.7")}
    >
      {copied ? <Check size={10} /> : <Copy size={10} />}
    </button>
  );
}

function StatusBadge({ status }: { status: string }) {
  const meta = STATUS_BADGE[status] ?? {
    label: status,
    bg: "rgba(113,113,122,0.12)",
    color: "#a1a1aa",
  };
  const isPending = status === "pending" || status === "nuevo";
  const isReady = status === "ready" || status === "listo";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "4px 10px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 700,
        background: meta.bg,
        color: meta.color,
        whiteSpace: "nowrap",
        letterSpacing: "0.01em",
      }}
    >
      {isPending && (
        <span
          style={{
            width: 5,
            height: 5,
            borderRadius: "50%",
            background: meta.color,
            boxShadow: `0 0 4px ${meta.color}`,
            flexShrink: 0,
            animation: "pulse-status 1.6s ease-in-out infinite",
          }}
        />
      )}
      {isReady && (
        <span
          style={{
            width: 5,
            height: 5,
            borderRadius: "50%",
            background: meta.color,
            flexShrink: 0,
          }}
        />
      )}
      {meta.label}
    </span>
  );
}

function deliveryLabel(type: string) {
  const isDelivery = type === "delivery" || type === "domicilio";
  return isDelivery ? "🚚 Delivery" : "🏠 Retiro";
}

function paymentLabel(method: string) {
  if (method === "mercadopago") return "📲 MP";
  if (method === "transfer") return "📲 Transfer";
  return "💵 Efectivo";
}

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

function playChime() {
  if (typeof window === "undefined") return;
  try {
    const AudioContextClass =
      window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const audioCtx = new AudioContextClass();

    const playTone = (freq: number, startTime: number, duration: number) => {
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, startTime);

      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.25, startTime + 0.04);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    const now = audioCtx.currentTime;
    playTone(523.25, now, 0.4); // C5
    playTone(659.25, now + 0.1, 0.5); // E5
  } catch (err) {
    console.error("Failed to play chime:", err);
  }
}

interface RecentOrdersTableProps {
  orders: Order[];
  slug: string;
  tenantId: string;
  loading?: boolean;
  maxRows?: number;
  soundEnabled?: boolean;
}

export function RecentOrdersTable({
  orders: initialOrders,
  slug,
  tenantId,
  loading = false,
  maxRows = 10,
  soundEnabled = true,
}: RecentOrdersTableProps) {
  const [orders, setOrders] = useState(initialOrders);
  const isMobile = useIsMobile();

  const soundEnabledRef = useRef(soundEnabled);
  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  useEffect(() => {
    setOrders(initialOrders);
  }, [initialOrders]);

  useEffect(() => {
    const supabase = createSupabaseBrowser();
    const uniqueId = Math.random().toString(36).substring(7);
    const channel = supabase
      .channel(`recent-orders-${tenantId}-${uniqueId}`)
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
            if (soundEnabledRef.current) {
              playChime();
            }
            return [incoming, ...prev].slice(0, 10);
          });
          toast.success(
            `🔔 Nuevo pedido #${incoming.order_ref || incoming.id.slice(0, 6)} · $${(incoming.total ?? 0).toLocaleString("es-AR")}`,
            {
              duration: 8000,
              action: {
                label: "Ver pedido",
                onClick: () => {
                  window.location.href = `/${slug}/admin/pedidos`;
                },
              },
            },
          );
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
          setOrders((prev) => {
            return prev.map((o) => (o.id === updated.id ? updated : o));
          });
          toast.info(
            `Pedido #${updated.order_ref || updated.id.slice(0, 6)} actualizado a "${updated.status}" ℹ️`,
            { duration: 4000 },
          );
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [tenantId]);

  if (loading) {
    return (
      <div className="bg-dash-surface border border-dash-border rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-dash-border flex items-center justify-between">
          <div className="h-3 w-36 bg-dash-surface-2 rounded animate-pulse" />
          <div className="h-3 w-16 bg-dash-surface-2 rounded animate-pulse" />
        </div>
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="px-5 py-3.5 border-b border-dash-border/40 flex items-center gap-4"
          >
            <div className="h-2.5 w-14 bg-dash-surface-2 rounded animate-pulse" />
            <div className="h-2.5 flex-1 bg-dash-surface-2 rounded animate-pulse" />
            <div className="h-6 w-20 bg-dash-surface-2 rounded-full animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="bg-dash-surface border border-dash-border rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-dash-border">
          <h2 className="text-sm font-semibold text-dash-text">
            Pedidos recientes
          </h2>
        </div>
        <div className="py-16 flex flex-col items-center gap-3 text-dash-muted">
          <span className="text-5xl">📋</span>
          <p className="text-sm">Aún no hay pedidos hoy</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-dash-surface border border-dash-border rounded-2xl overflow-hidden">
      <style>{`
        @keyframes slide-down-fade {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .order-row-animate {
          opacity: 0;
          animation: slide-down-fade 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes pulse-status {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.4; transform: scale(1.4); }
        }
      `}</style>
      <div className="px-5 py-4 border-b border-dash-border flex items-center justify-between">
        <h2 className="text-sm font-semibold text-dash-text">
          Pedidos recientes
        </h2>
        <Link
          href={`/${slug}/admin/pedidos`}
          className="flex items-center gap-1 text-xs text-dash-muted hover:text-accent transition-colors duration-150"
        >
          Ver todos <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {isMobile ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
            padding: 12,
          }}
        >
          {orders.slice(0, maxRows).map((order, idx) => (
            <Link
              key={order.id}
              href={`/${slug}/admin/pedidos/${order.order_ref ?? order.id}`}
              className="order-row-animate"
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
                background: "var(--dash-surface-2)",
                border: "1px solid var(--dash-border)",
                borderRadius: 12,
                padding: 14,
                textDecoration: "none",
                transition: "background 0.15s",
                animationDelay: `${idx * 40}ms`,
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "var(--dash-surface-3)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "var(--dash-surface-2)")
              }
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-mono, monospace)",
                    fontSize: 13,
                    fontWeight: 700,
                    color: "var(--accent)",
                  }}
                >
                  #{order.order_ref ?? order.id.slice(0, 6)}
                </span>
                <span style={{ fontSize: 11, color: "var(--dash-muted)" }}>
                  {fmtHora(order.created_at)}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: "var(--dash-text)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    maxWidth: "60%",
                  }}
                >
                  {order.customer_name ?? "—"}
                </span>
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: "var(--dash-text)",
                    fontFamily: "var(--font-mono, monospace)",
                  }}
                >
                  {fmtARS(order.total)}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingTop: 6,
                  borderTop:
                    "1px solid var(--dash-border-subtle, rgba(255,255,255,0.05))",
                }}
              >
                <span style={{ fontSize: 11, color: "var(--dash-muted)" }}>
                  {deliveryLabel(order.delivery_type)} ·{" "}
                  {paymentLabel(order.payment_method)}
                </span>
                <StatusBadge status={order.status} />
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px]">
            <thead>
              <tr className="border-b border-dash-border/50">
                {[
                  "#",
                  "Hora",
                  "Cliente",
                  "Tipo",
                  "Pago",
                  "Total",
                  "Estado",
                ].map((h, i) => (
                  <th
                    key={h}
                    className={`py-2.5 text-[11px] uppercase tracking-wider text-dash-muted font-medium
                    ${i === 0 ? "pl-5 pr-3 text-left" : i === 6 ? "pl-3 pr-5 text-right" : "px-3 text-left"}
                    ${i === 5 ? "text-right" : ""}`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.slice(0, maxRows).map((order, idx) => (
                <tr
                  key={order.id}
                  className="order-row-animate transition-colors duration-150"
                  style={{
                    borderBottom:
                      idx < Math.min(orders.length, maxRows) - 1
                        ? "1px solid var(--dash-border)"
                        : undefined,
                    cursor: "default",
                    animationDelay: `${idx * 40}ms`,
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "var(--dash-surface-2)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  <td className="pl-5 pr-3 py-3 text-xs font-mono">
                    <span
                      style={{ display: "inline-flex", alignItems: "center" }}
                    >
                      <Link
                        href={`/${slug}/admin/pedidos/${order.order_ref ?? order.id}`}
                        style={{
                          color: "var(--accent)",
                          textDecoration: "none",
                        }}
                        className="hover:underline"
                      >
                        #{order.order_ref ?? order.id.slice(0, 6)}
                      </Link>
                      <CopyRef
                        orderRef={order.order_ref ?? order.id.slice(0, 6)}
                      />
                    </span>
                  </td>
                  <td className="px-3 py-3 text-xs text-dash-muted tabular-nums">
                    {fmtHora(order.created_at)}
                  </td>
                  <td className="px-3 py-3 text-xs text-dash-text max-w-[120px] truncate">
                    {order.customer_name ?? "—"}
                  </td>
                  <td className="px-3 py-3 text-xs text-dash-muted whitespace-nowrap">
                    {deliveryLabel(order.delivery_type)}
                  </td>
                  <td className="px-3 py-3 text-xs text-dash-muted whitespace-nowrap">
                    {paymentLabel(order.payment_method)}
                  </td>
                  <td className="px-3 py-3 text-xs font-mono text-right text-dash-text">
                    {fmtARS(order.total)}
                  </td>
                  <td className="pl-3 pr-5 py-3 text-right">
                    <StatusBadge status={order.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {orders.length > maxRows && (
        <div
          style={{
            borderTop: "1px solid var(--dash-border)",
            padding: "10px 20px",
          }}
        >
          <Link
            href={`/${slug}/admin/pedidos`}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
              fontSize: 13,
              color: "var(--accent)",
              textDecoration: "none",
              fontWeight: 500,
            }}
          >
            Ver todos los pedidos{" "}
            <ArrowRight style={{ width: 14, height: 14 }} />
          </Link>
        </div>
      )}
    </div>
  );
}
