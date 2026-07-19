"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Search,
  X,
  AlertTriangle,
  WifiOff,
  ClipboardList,
  Download,
  SearchX,
} from "lucide-react";
import { toast } from "sonner";
import EmptyState from "@/components/admin/EmptyState";
import { createSupabaseBrowser } from "@/lib/supabase";
import { useOrdersRealtime } from "@/hooks/useOrdersRealtime";
import { useTableDensity } from "@/hooks/useTableDensity";
import { playSound } from "@/lib/sounds";
import type { Order } from "@/types/supabase";
import { MobileOrderCard } from "@/components/admin/orders/MobileOrderCard";
import { OrderDesktopRow } from "@/components/admin/orders/OrderDesktopRow";
import { OrdersKpiGrid } from "@/components/admin/orders/OrdersKpiGrid";
import { InlineConfirm } from "@/components/ui/admin/InlineConfirm";
import { DensityToggle } from "@/components/ui/admin/DensityToggle";
import {
  vibrate,
  useNowMinute,
  useIsMobile,
  getOrderAgeMinutes,
  matchesFilter,
  exportOrdersToCsv,
  getStatusMeta,
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
  const searchParams = useSearchParams();
  const [filter, setFilter] = useState<FilterKey>(() => {
    const requested = searchParams.get("filter");
    return FILTER_PILLS.some((p) => p.key === requested)
      ? (requested as FilterKey)
      : "all";
  });
  const [search, setSearch] = useState("");
  const [dateRange, setDateRange] = useState<
    "all" | "today" | "week" | "month"
  >("all");
  const isMobile = useIsMobile();
  useNowMinute();
  const { density, toggleDensity } = useTableDensity();

  // Selección bulk — solo tiene UI en desktop (ver nota junto a la barra de
  // acciones más abajo). Se resetea al cambiar filtro/período/búsqueda: no
  // hace falta persistirla entre navegaciones (YAGNI).
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkWorking, setBulkWorking] = useState(false);
  const [bulkConfirmCancel, setBulkConfirmCancel] = useState(false);
  useEffect(() => {
    setSelectedIds(new Set());
    setBulkConfirmCancel(false);
  }, [filter, dateRange, search]);

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function clearSelection() {
    setSelectedIds(new Set());
    setBulkConfirmCancel(false);
  }

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

  // Soporta el atajo del Cmd+K ("Confirmar pendientes" → /pedidos?bulk=confirm-pending)
  const router = useRouter();
  const bulkActionRan = useRef(false);
  useEffect(() => {
    if (bulkActionRan.current) return;
    if (searchParams.get("bulk") !== "confirm-pending") return;
    bulkActionRan.current = true;
    router.replace(`/${slug}/admin/pedidos`);
    const pendingIds = orders
      .filter((o) => matchesFilter(o, "pending"))
      .map((o) => o.id);
    if (pendingIds.length === 0) {
      toast.info("No hay pedidos pendientes para confirmar");
      return;
    }
    void Promise.all(
      pendingIds.map((id) => updateStatus(id, "confirmed", true)),
    ).then(() => {
      toast.success(
        `${pendingIds.length} pedido${pendingIds.length !== 1 ? "s" : ""} confirmado${pendingIds.length !== 1 ? "s" : ""}`,
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function updateStatus(orderId: string, status: string, silent = false) {
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
      if (!silent && prevStatus !== undefined && prevStatus !== status) {
        toast(`Pedido → ${getStatusMeta(status).label}`, {
          action: {
            label: "Deshacer",
            onClick: () => void updateStatus(orderId, prevStatus, true),
          },
          duration: 5000,
        });
      }
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

  // Reutiliza `updateStatus` fila por fila, igual que el atajo de Cmd+K
  // ("Confirmar pendientes" → bulk=confirm-pending, más arriba en este
  // archivo) — sin duplicar la lógica de fetch/optimistic update.
  async function bulkConfirmSelected() {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    setBulkWorking(true);
    await Promise.all(ids.map((id) => updateStatus(id, "confirmed", true)));
    toast.success(
      `${ids.length} pedido${ids.length !== 1 ? "s" : ""} confirmado${ids.length !== 1 ? "s" : ""}`,
    );
    setBulkWorking(false);
    clearSelection();
  }

  async function bulkCancelSelected() {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    setBulkWorking(true);
    await Promise.all(ids.map((id) => updateStatus(id, "cancelled", true)));
    toast.success(
      `${ids.length} pedido${ids.length !== 1 ? "s" : ""} cancelado${ids.length !== 1 ? "s" : ""}`,
    );
    setBulkWorking(false);
    clearSelection();
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
        style={
          {
            background: "var(--dash-surface)",
            border: "1px solid var(--dash-border)",
            borderRadius: 16,
            overflow: "hidden",
            boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
            "--row-py": density === "compact" ? "7px" : "14px",
          } as React.CSSProperties
        }
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
                transition: "border-color 0.15s, box-shadow 0.15s",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "var(--accent)";
                e.currentTarget.style.boxShadow =
                  "0 0 0 3px rgba(255,107,53,0.15)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "var(--dash-border)";
                e.currentTarget.style.boxShadow = "none";
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
              transition: "border-color 0.15s, background 0.15s",
            }}
            onMouseEnter={(e) => {
              if (filtered.length === 0) return;
              e.currentTarget.style.borderColor = "var(--accent)";
              e.currentTarget.style.background = "rgba(255,107,53,0.05)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--dash-border)";
              e.currentTarget.style.background = "var(--dash-surface-2)";
            }}
          >
            <Download size={14} strokeWidth={2} />
            CSV
          </button>
          <DensityToggle density={density} onToggle={toggleDensity} />
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
                onMouseEnter={(e) => {
                  if (isActive) return;
                  e.currentTarget.style.borderColor = "var(--dash-muted)";
                }}
                onMouseLeave={(e) => {
                  if (isActive) return;
                  e.currentTarget.style.borderColor = "var(--dash-border)";
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
                onMouseEnter={(e) => {
                  if (isActive) return;
                  e.currentTarget.style.borderColor = "var(--dash-muted)";
                }}
                onMouseLeave={(e) => {
                  if (isActive) return;
                  e.currentTarget.style.borderColor = "var(--dash-border)";
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
              color: "var(--dash-danger)",
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
                color: "var(--dash-danger)",
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
                color: "var(--dash-danger)",
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
          search || filter !== "all" ? (
            <EmptyState
              icon={SearchX}
              title="Sin resultados"
              description={
                search
                  ? `No encontramos pedidos para "${search}".`
                  : "No hay pedidos en esta categoría."
              }
              action={{
                label: "Limpiar filtros",
                onClick: () => {
                  setSearch("");
                  setFilter("all");
                },
              }}
            />
          ) : (
            <EmptyState
              icon={ClipboardList}
              title="Sin pedidos hoy"
              description="Los pedidos nuevos van a aparecer acá apenas los clientes empiecen a comprar."
            />
          )
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
            <div
              style={{
                padding: "8px 20px",
                borderBottom: "1px solid var(--dash-border)",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <input
                type="checkbox"
                checked={
                  filtered.length > 0 &&
                  filtered.every((o) => selectedIds.has(o.id))
                }
                onChange={() => {
                  setSelectedIds((prev) => {
                    const allSelected =
                      filtered.length > 0 &&
                      filtered.every((o) => prev.has(o.id));
                    if (allSelected) return new Set();
                    return new Set(filtered.map((o) => o.id));
                  });
                }}
                style={{
                  width: 16,
                  height: 16,
                  accentColor: "var(--accent)",
                  cursor: "pointer",
                }}
              />
              <span style={{ fontSize: 12, color: "var(--dash-muted)" }}>
                Seleccionar todos
              </span>
            </div>
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
                selected={selectedIds.has(order.id)}
                onToggleSelect={toggleSelect}
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

      {/* Barra de acciones bulk — solo desktop: la selección solo tiene
          checkbox en OrderDesktopRow (ver nota ahí). En mobile, cada card
          ocupa todo el ancho para el tap-to-expand y ya tiene acciones
          rápidas de estado por pedido, así que el multi-select no suma. */}
      {!isMobile && selectedIds.size > 0 && (
        <div
          style={{
            position: "fixed",
            bottom: 16,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 70,
            background: "var(--dash-surface)",
            border: "1px solid var(--dash-border)",
            borderRadius: 16,
            boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
            padding: "10px 14px",
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexWrap: "nowrap",
            maxWidth: "95vw",
            overflowX: "auto",
          }}
        >
          <span
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: "var(--dash-text)",
              padding: "0 4px",
              flexShrink: 0,
              whiteSpace: "nowrap",
            }}
          >
            {selectedIds.size} seleccionado{selectedIds.size !== 1 ? "s" : ""}
          </span>
          <button
            onClick={() => void bulkConfirmSelected()}
            disabled={bulkWorking}
            style={{
              fontSize: 12,
              fontWeight: 700,
              padding: "8px 12px",
              borderRadius: 10,
              background: "rgba(96,165,250,0.12)",
              color: "#60a5fa",
              border: "1px solid rgba(96,165,250,0.3)",
              cursor: bulkWorking ? "not-allowed" : "pointer",
              opacity: bulkWorking ? 0.5 : 1,
              flexShrink: 0,
              whiteSpace: "nowrap",
            }}
          >
            Confirmar
          </button>
          <button
            onClick={() =>
              exportOrdersToCsv(orders.filter((o) => selectedIds.has(o.id)))
            }
            style={{
              fontSize: 12,
              fontWeight: 700,
              padding: "8px 12px",
              borderRadius: 10,
              background: "var(--dash-surface-2)",
              color: "var(--dash-text)",
              border: "1px solid var(--dash-border)",
              cursor: "pointer",
              flexShrink: 0,
              whiteSpace: "nowrap",
            }}
          >
            Exportar CSV
          </button>
          <InlineConfirm
            active={bulkConfirmCancel}
            itemKey="bulk-cancel"
            confirm={
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span
                  style={{
                    fontSize: 12,
                    color: "var(--dash-danger)",
                    fontWeight: 600,
                    flexShrink: 0,
                    whiteSpace: "nowrap",
                  }}
                >
                  ¿Cancelar {selectedIds.size}?
                </span>
                <button
                  onClick={() => void bulkCancelSelected()}
                  disabled={bulkWorking}
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    padding: "8px 12px",
                    borderRadius: 10,
                    background: "#dc2626",
                    color: "#fff",
                    border: "none",
                    cursor: bulkWorking ? "not-allowed" : "pointer",
                    opacity: bulkWorking ? 0.5 : 1,
                    flexShrink: 0,
                    whiteSpace: "nowrap",
                  }}
                >
                  Sí, cancelar
                </button>
                <button
                  onClick={() => setBulkConfirmCancel(false)}
                  disabled={bulkWorking}
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    padding: "8px 12px",
                    borderRadius: 10,
                    background: "var(--dash-surface-2)",
                    color: "var(--dash-muted)",
                    border: "1px solid var(--dash-border)",
                    cursor: "pointer",
                    flexShrink: 0,
                    whiteSpace: "nowrap",
                  }}
                >
                  No
                </button>
              </div>
            }
            trigger={
              <button
                onClick={() => setBulkConfirmCancel(true)}
                disabled={bulkWorking}
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  padding: "8px 12px",
                  borderRadius: 10,
                  background: "rgba(239,68,68,0.08)",
                  color: "var(--dash-danger)",
                  border: "1px solid rgba(239,68,68,0.3)",
                  cursor: bulkWorking ? "not-allowed" : "pointer",
                  opacity: bulkWorking ? 0.5 : 1,
                  flexShrink: 0,
                  whiteSpace: "nowrap",
                }}
              >
                Cancelar pedidos
              </button>
            }
          />
          <button
            onClick={clearSelection}
            disabled={bulkWorking}
            style={{
              fontSize: 12,
              fontWeight: 700,
              padding: "8px 10px",
              borderRadius: 10,
              background: "none",
              color: "var(--dash-muted)",
              border: "none",
              cursor: "pointer",
              flexShrink: 0,
              whiteSpace: "nowrap",
            }}
          >
            Deseleccionar
          </button>
        </div>
      )}
    </>
  );
}
