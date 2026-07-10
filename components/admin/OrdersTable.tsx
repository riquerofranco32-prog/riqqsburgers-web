"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import {
  Search,
  X,
  AlertTriangle,
  WifiOff,
  ClipboardList,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import { createSupabaseBrowser } from "@/lib/supabase";
import { useOrdersRealtime } from "@/hooks/useOrdersRealtime";
import { playSound } from "@/lib/sounds";
import type { Order } from "@/types/supabase";
import { MobileOrderCard } from "@/components/admin/orders/MobileOrderCard";
import { OrderDesktopRow } from "@/components/admin/orders/OrderDesktopRow";
import { OrdersKpiGrid } from "@/components/admin/orders/OrdersKpiGrid";
import {
  vibrate,
  useNowMinute,
  useIsMobile,
  getOrderAgeMinutes,
  matchesFilter,
  exportOrdersToCsv,
  FILTER_PILLS,
  type FilterKey,
} from "@/components/admin/orders/utils";

export function OrdersTable({
  initialOrders,
  slug,
  tenantId,
  canDelete = true,
}: {
  initialOrders: Order[];
  slug: string;
  tenantId: string;
  canDelete?: boolean;
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
  useNowMinute();

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

  const { status: realtimeStatus, forceReconnect } = useOrdersRealtime(
    tenantId,
    {
      onInsert: (incoming) => {
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
        // Notification sound using saved preference
        playSound();
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
      onUpdate: (updated) => {
        setOrders((prev) =>
          prev.map((o) => (o.id === updated.id ? updated : o)),
        );
      },
      onDelete: (id) => {
        setOrders((prev) => prev.filter((o) => o.id !== id));
      },
    },
  );

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
      toast.error("No se pudo actualizar el estado del pedido.");
      vibrate([50, 30, 50]);
    }
  }

  async function deleteOrder(orderId: string) {
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

  // `counts` y `stats.pending/active/ready` arriba solo ven lo cargado en el
  // cliente (máx. 50 + "cargar más" manual) — igual que pasaba con
  // todaySales, un local con más de 50 pedidos en total ve badges y KPIs
  // incompletos. Se recalculan con una query aparte, trayendo solo la
  // columna status sin límite, para tener conteos exactos.
  const [accurateStatusCounts, setAccurateStatusCounts] = useState<Record<
    string,
    number
  > | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchStatusCounts() {
      const supabase = createSupabaseBrowser();
      const { data } = await supabase
        .from("orders")
        .select("status")
        .eq("tenant_id", tenantId);
      if (cancelled) return;
      const rows = (data ?? []) as { status: string }[];
      const map: Record<string, number> = { all: rows.length };
      FILTER_PILLS.slice(1).forEach(({ key }) => {
        map[key] = rows.filter((o) => matchesFilter(o as Order, key)).length;
      });
      setAccurateStatusCounts(map);
    }
    void fetchStatusCounts();
    return () => {
      cancelled = true;
    };
  }, [tenantId, orders]);

  const accurateStats = useMemo(() => {
    if (!accurateStatusCounts) return null;
    return {
      pending: accurateStatusCounts.pending ?? 0,
      active: accurateStatusCounts.confirmed ?? 0,
      ready: accurateStatusCounts.ready ?? 0,
    };
  }, [accurateStatusCounts]);

  // Las ventas de hoy derivadas de `orders` solo cubren la página cargada
  // (máx. 50 + "cargar más"); en un día con más pedidos que eso el KPI
  // quedaría mal. Se recalcula con una query aparte, sin límite, filtrada
  // por fecha en el servidor.
  const [todaySalesAccurate, setTodaySalesAccurate] = useState<number | null>(
    null,
  );

  useEffect(() => {
    let cancelled = false;
    async function fetchTodaySales() {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const supabase = createSupabaseBrowser();
      const { data } = await supabase
        .from("orders")
        .select("total")
        .eq("tenant_id", tenantId)
        .in("status", ["delivered", "entregado"])
        .gte("created_at", today.toISOString());
      if (cancelled) return;
      setTodaySalesAccurate(
        (data ?? []).reduce((sum, o) => sum + (o.total as number), 0),
      );
    }
    void fetchTodaySales();
    return () => {
      cancelled = true;
    };
  }, [tenantId, orders]);

  // El "Período" filtraba solo lo ya cargado en el cliente (máx. 50 +
  // "cargar más" manual), así que un local con más de 50 pedidos en la
  // semana/mes veía datos incompletos sin darse cuenta. Al elegir un rango
  // que no sea "Todos" se trae directo de la DB, sin el límite de 50.
  const [loadingRange, setLoadingRange] = useState(false);

  useEffect(() => {
    if (dateRange === "all") return;
    let cancelled = false;
    async function fetchRange() {
      setLoadingRange(true);
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
      const supabase = createSupabaseBrowser();
      const { data } = await supabase
        .from("orders")
        .select("*")
        .eq("tenant_id", tenantId)
        .gte("created_at", cutoff.toISOString())
        .order("created_at", { ascending: false });
      if (cancelled) return;
      const incoming = (data ?? []) as Order[];
      setOrders((prev) => {
        const existingIds = new Set(prev.map((o) => o.id));
        const fresh = incoming.filter((o) => !existingIds.has(o.id));
        return fresh.length > 0 ? [...prev, ...fresh] : prev;
      });
      setLoadingRange(false);
    }
    void fetchRange();
    return () => {
      cancelled = true;
    };
  }, [dateRange, tenantId]);

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
      const qDigits = search.replace(/\D/g, "");
      list = list.filter(
        (o) =>
          o.customer_name?.toLowerCase().includes(q) ||
          o.order_ref?.toLowerCase().includes(q) ||
          (qDigits.length >= 4 &&
            o.customer_phone?.replace(/\D/g, "").includes(qDigits)),
      );
    }
    return list;
  }, [orders, filter, dateRange, search]);

  return (
    <>
      {/* Live stats KPIs */}
      <OrdersKpiGrid
        pending={accurateStats?.pending ?? stats.pending}
        active={accurateStats?.active ?? stats.active}
        ready={accurateStats?.ready ?? stats.ready}
        todaySales={todaySalesAccurate ?? stats.todaySales}
      />

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
              placeholder="Buscar por cliente, teléfono o ref..."
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
          <button
            onClick={() => exportOrdersToCsv(filtered)}
            disabled={filtered.length === 0}
            title="Exportar pedidos filtrados a CSV"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 12px",
              borderRadius: 8,
              background: "var(--dash-surface-2)",
              border: "1px solid var(--dash-border)",
              color: "var(--dash-text)",
              fontSize: 13,
              fontWeight: 600,
              cursor: filtered.length === 0 ? "not-allowed" : "pointer",
              opacity: filtered.length === 0 ? 0.5 : 1,
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            <Download size={14} strokeWidth={2} />
            CSV
          </button>
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
                {pill.label} ({(accurateStatusCounts ?? counts)[pill.key] ?? 0})
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
          {loadingRange && (
            <span
              style={{
                fontSize: 12,
                color: "var(--dash-muted)",
                flexShrink: 0,
              }}
            >
              Cargando período completo...
            </span>
          )}
        </div>

        {/* Realtime connection banner */}
        {realtimeStatus === "disconnected" && (
          <div
            style={{
              padding: "10px 16px",
              background: "rgba(239,68,68,0.1)",
              borderBottom: "1px solid rgba(239,68,68,0.2)",
              fontSize: 13,
              fontWeight: 600,
              color: "#f87171",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <WifiOff style={{ width: 14, height: 14, flexShrink: 0 }} />
              Se perdió la conexión en vivo — puede que no veas pedidos nuevos
              hasta reconectar.
            </span>
            <button
              onClick={forceReconnect}
              style={{
                flexShrink: 0,
                background: "none",
                border: "1px solid rgba(239,68,68,0.4)",
                borderRadius: 8,
                padding: "5px 12px",
                color: "#f87171",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Reconectar
            </button>
          </div>
        )}

        {/* Urgent orders banner */}
        {(() => {
          const urgentCount = orders.filter(
            (o) =>
              (o.status === "pending" || o.status === "nuevo") &&
              getOrderAgeMinutes(o.created_at) >= 20,
          ).length;
          if (urgentCount === 0) return null;
          return (
            <div
              style={{
                margin: "0",
                padding: "10px 16px",
                background: "rgba(239,68,68,0.1)",
                borderBottom: "1px solid rgba(239,68,68,0.2)",
                fontSize: 13,
                fontWeight: 600,
                color: "#f87171",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <AlertTriangle style={{ width: 14, height: 14, flexShrink: 0 }} />
              Hay {urgentCount} pedido{urgentCount !== 1 ? "s" : ""} esperando
              hace más de 20 minutos
            </div>
          );
        })()}

        {/* Content */}
        {filtered.length === 0 ? (
          <div
            style={{
              padding: "56px 20px",
              textAlign: "center",
              color: "var(--dash-muted)",
            }}
          >
            <ClipboardList
              style={{
                width: 32,
                height: 32,
                margin: "0 auto 8px",
                opacity: 0.5,
              }}
            />
            <p style={{ fontSize: 14 }}>
              {search ? "Sin resultados" : "No hay pedidos en esta categoría"}
            </p>
          </div>
        ) : isMobile ? (
          // ── Mobile: cards ──
          <div style={{ padding: "12px 12px 4px" }}>
            {filtered.map((order, idx) => (
              <MobileOrderCard
                key={order.id}
                order={order}
                slug={slug}
                isNew={newOrderIds.has(order.id)}
                isFirst={idx === 0}
                onUpdateStatus={updateStatus}
                onDeleteOrder={deleteOrder}
                canDelete={canDelete}
              />
            ))}
          </div>
        ) : (
          // ── Desktop: accordion rows ──
          <div>
            {filtered.map((order) => (
              <OrderDesktopRow
                key={order.id}
                order={order}
                slug={slug}
                isNew={newOrderIds.has(order.id)}
                isOpen={expanded === order.id}
                onToggleOpen={() =>
                  setExpanded(expanded === order.id ? null : order.id)
                }
                onUpdateStatus={updateStatus}
                onDeleteOrder={deleteOrder}
                canDelete={canDelete}
              />
            ))}
          </div>
        )}

        {/* Cargar más pedidos — oculto con un rango de fecha activo: esa
            consulta ya trae el período completo sin límite, y mezclar sus
            resultados con la paginación por offset de acá desincroniza
            offset/hasMore. */}
        {hasMore && dateRange === "all" && (
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
