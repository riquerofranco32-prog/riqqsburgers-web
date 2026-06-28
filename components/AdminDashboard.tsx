"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Link from "next/link";
import {
  ShoppingCart,
  DollarSign,
  TrendingUp,
  Package,
  Plus,
  ClipboardList,
  Eye,
  RefreshCw,
} from "lucide-react";
import { KPICard } from "@/components/admin/dashboard/KPICard";
import { SalesAreaChart } from "@/components/admin/dashboard/SalesAreaChart";
import { CategoryDonut } from "@/components/admin/dashboard/CategoryDonut";
import { RecentOrdersTable } from "@/components/admin/dashboard/RecentOrdersTable";
import { TopProductsList } from "@/components/admin/dashboard/TopProductsList";
import { PeakHoursWidget } from "@/components/admin/dashboard/PeakHoursWidget";
import { LowStockAlert } from "@/components/admin/dashboard/LowStockAlert";
import { OperationControls } from "@/components/admin/dashboard/OperationControls";
import ExportReportButton from "@/components/admin/ExportReportButton";
import { createSupabaseBrowser } from "@/lib/supabase";
import type { Category, Product, Order, OrderItem } from "@/types/supabase";
import type {
  DashboardKPIs,
  DailyRevenue,
  CategoryRevenue,
  TopProduct,
  AnalyticsRange,
  AnalyticsResponse,
} from "@/types/dashboard";

function startOfDay(d: Date): Date {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  return r;
}

function computeKPIs(orders: Order[], products: Product[]): DashboardKPIs {
  const today = startOfDay(new Date());
  const yesterday = new Date(today.getTime() - 86_400_000);

  const todayOrders = orders.filter(
    (o) => new Date(o.created_at) >= today && o.status !== "cancelled",
  );
  const yesterdayOrders = orders.filter((o) => {
    const d = new Date(o.created_at);
    return d >= yesterday && d < today && o.status !== "cancelled";
  });

  const ordersToday = todayOrders.length;
  const ordersYesterday = yesterdayOrders.length;
  const ordersTodayChange =
    ordersYesterday > 0
      ? ((ordersToday - ordersYesterday) / ordersYesterday) * 100
      : null;

  const revenueToday = todayOrders.reduce((s, o) => s + o.total, 0);
  const revenueYesterday = yesterdayOrders.reduce((s, o) => s + o.total, 0);
  const revenueTodayChange =
    revenueYesterday > 0
      ? ((revenueToday - revenueYesterday) / revenueYesterday) * 100
      : null;

  const avgTicketToday =
    ordersToday > 0 ? Math.round(revenueToday / ordersToday) : 0;
  const avgTicketYesterday =
    ordersYesterday > 0 ? Math.round(revenueYesterday / ordersYesterday) : 0;
  const avgTicketChange =
    avgTicketYesterday > 0
      ? ((avgTicketToday - avgTicketYesterday) / avgTicketYesterday) * 100
      : null;

  const itemMap: Record<string, { name: string; qty: number }> = {};
  for (const order of todayOrders) {
    for (const item of (order.items || []) as OrderItem[]) {
      if (!itemMap[item.product_id])
        itemMap[item.product_id] = { name: item.name, qty: 0 };
      itemMap[item.product_id].qty += item.quantity;
    }
  }
  const topProductToday =
    Object.values(itemMap).sort((a, b) => b.qty - a.qty)[0] ?? null;

  const activeProducts = products.filter((p) => p.available).length;

  return {
    ordersToday,
    ordersTodayChange,
    revenueToday,
    revenueTodayChange,
    avgTicketToday,
    avgTicketChange,
    topProductToday,
    activeProducts,
  };
}

function computeSalesLast7Days(orders: Order[]): DailyRevenue[] {
  const result: DailyRevenue[] = [];
  const activeOrders = orders.filter((o) => o.status !== "cancelled");
  for (let i = 6; i >= 0; i--) {
    const day = startOfDay(new Date());
    day.setDate(day.getDate() - i);
    const nextDay = new Date(day.getTime() + 86_400_000);

    const dayTotal = activeOrders
      .filter((o) => {
        const d = new Date(o.created_at);
        return d >= day && d < nextDay;
      })
      .reduce((s, o) => s + o.total, 0);

    const isToday = i === 0;
    const raw = day.toLocaleDateString("es-AR", { weekday: "short" });
    const label = isToday
      ? "Hoy"
      : raw.charAt(0).toUpperCase() + raw.slice(1).replace(".", "");
    result.push({ date: label, total: dayTotal });
  }
  return result;
}

// TODO: unificar fuente de datos KPIs — "hoy" se computa client-side sobre `orders`
// (para mantener real-time via Supabase channel), mientras "week" y "month" van al
// endpoint /api/tenant/[slug]/analytics. Para unificar completamente habría que agregar
// polling al rango "today" o aceptar perder actualizaciones live sin refetch manual.
// ANALYTICS_RANGES exportada para facilitar esta tarea cuando se encare.
export const ANALYTICS_RANGES = ["today", "week", "month"] as const;

const CATEGORY_PALETTE = [
  "#f97316",
  "#3b82f6",
  "#22c55e",
  "#a855f7",
  "#eab308",
  "#ec4899",
  "#14b8a6",
  "#f43f5e",
] as const;

function categoryColor(name: string): string {
  if (!name) return "#71717a";
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return CATEGORY_PALETTE[Math.abs(hash) % CATEGORY_PALETTE.length];
}

function computeCategoryRevenue(
  orders: Order[],
  products: Product[],
  categories: Category[],
): CategoryRevenue[] {
  const activeOrders = orders.filter((o) => o.status !== "cancelled");
  const catMap: Record<string, number> = {};
  for (const order of activeOrders) {
    for (const item of (order.items || []) as OrderItem[]) {
      const product = products.find((p) => p.id === item.product_id);
      const category = product
        ? categories.find((c) => c.id === product.category_id)
        : null;
      const name = category?.name ?? "Otros";
      catMap[name] = (catMap[name] ?? 0) + item.price * item.quantity;
    }
  }
  return Object.entries(catMap)
    .map(([name, value]) => ({
      name,
      value,
      color: categoryColor(name),
    }))
    .sort((a, b) => b.value - a.value);
}

function computeTopProducts(
  orders: Order[],
  products: Product[],
  categories: Category[],
): TopProduct[] {
  const activeOrders = orders.filter((o) => o.status !== "cancelled");
  const map: Record<
    string,
    {
      name: string;
      qty: number;
      revenue: number;
      productRef?: Product;
    }
  > = {};

  for (const order of activeOrders) {
    for (const item of (order.items || []) as OrderItem[]) {
      if (!map[item.product_id]) {
        map[item.product_id] = {
          name: item.name,
          qty: 0,
          revenue: 0,
          productRef: products.find((p) => p.id === item.product_id),
        };
      }
      map[item.product_id].qty += item.quantity;
      map[item.product_id].revenue += item.price * item.quantity;
    }
  }

  return Object.entries(map)
    .map(([product_id, data]) => {
      const cat = data.productRef
        ? categories.find((c) => c.id === data.productRef!.category_id)
        : null;
      return {
        product_id,
        name: data.name,
        category_name: cat?.name ?? null,
        category_emoji: cat?.emoji ?? null,
        quantity: data.qty,
        revenue: data.revenue,
      };
    })
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);
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

function fmtARS(n: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(n);
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Buenos días";
  if (h < 19) return "Buenas tardes";
  return "Buenas noches";
}

function getDateLabel(): string {
  const raw = new Intl.DateTimeFormat("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

const RANGE_LABELS: Record<AnalyticsRange, string> = {
  today: "Hoy",
  week: "7 días",
  month: "30 días",
};

const RANGES: AnalyticsRange[] = ["today", "week", "month"];

interface AdminDashboardProps {
  tenantName: string;
  slug: string;
  tenantId: string;
  isOpen: boolean;
  // kpis y salesData eliminados: los KPIs de "hoy" se calculan solo en el cliente
  // (via currentKPIs/currentSalesData) para evitar mismatch SSR↔hydration con cancelados.
  // TODO: cuando analytics API soporte categoryData/topProducts por rango, mover esos al cliente también.
  categoryData: CategoryRevenue[];
  recentOrders: Order[];
  allOrders: Order[];
  topProducts: TopProduct[];
  unavailableProducts: Product[];
  products: Product[];
  categories: Category[];
}

export default function AdminDashboard({
  tenantName,
  slug,
  tenantId,
  isOpen: isOpenInitial,
  categoryData,
  recentOrders,
  allOrders,
  topProducts,
  unavailableProducts,
  products,
  categories,
}: AdminDashboardProps) {
  const isMobile = useIsMobile();
  const dateLabel = getDateLabel();
  const greeting = getGreeting();

  const [orders, setOrders] = useState<Order[]>(allOrders);
  const [range, setRange] = useState<AnalyticsRange>("today");
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsResponse | null>(
    null,
  );
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const [isOpen, setIsOpen] = useState(isOpenInitial);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("kitchen_chime_enabled");
      return saved !== "false";
    }
    return true;
  });

  const soundEnabledRef = useRef(soundEnabled);
  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  useEffect(() => {
    const supabase = createSupabaseBrowser();
    const uniqueId = Math.random().toString(36).substring(7);
    const channel = supabase
      .channel(`dashboard-orders-${tenantId}-${uniqueId}`)
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

  const currentKPIs = useMemo(() => {
    return computeKPIs(orders, products);
  }, [orders, products]);

  const currentSalesData = useMemo(() => {
    return computeSalesLast7Days(orders);
  }, [orders]);

  const currentCategoryData = useMemo(() => {
    return computeCategoryRevenue(orders, products, categories);
  }, [orders, products, categories]);

  const currentTopProducts = useMemo(() => {
    return computeTopProducts(orders, products, categories);
  }, [orders, products, categories]);

  const currentRecentOrders = useMemo(() => {
    return orders.slice(0, 10);
  }, [orders]);

  useEffect(() => {
    localStorage.setItem("kitchen_chime_enabled", String(soundEnabled));
  }, [soundEnabled]);

  const fetchAnalytics = useCallback(
    async (r: "week" | "month") => {
      setAnalyticsLoading(true);
      try {
        const res = await fetch(`/api/tenant/${slug}/analytics?range=${r}`);
        if (!res.ok) throw new Error("Error al cargar analytics");
        const data: AnalyticsResponse = await res.json();
        setAnalyticsData(data);
        setLastUpdated(new Date());
      } catch {
        setAnalyticsData(null);
      } finally {
        setAnalyticsLoading(false);
      }
    },
    [slug],
  );

  const handleRangeChange = (r: AnalyticsRange) => {
    setRange(r);
    if (r === "today") {
      setAnalyticsData(null);
      setLastUpdated(null);
    } else {
      void fetchAnalytics(r);
    }
  };

  const activeRevenue =
    range === "today"
      ? currentKPIs.revenueToday
      : (analyticsData?.revenue ?? 0);
  const activeOrderCount =
    range === "today"
      ? currentKPIs.ordersToday
      : (analyticsData?.orderCount ?? 0);
  const activeAvgTicket =
    range === "today"
      ? currentKPIs.avgTicketToday
      : (analyticsData?.avgTicket ?? 0);
  const activeSalesData =
    range === "today"
      ? currentSalesData
      : (analyticsData?.dailyRevenue ?? currentSalesData);

  const rangeLabel =
    range === "today"
      ? "vs ayer"
      : `últimos ${range === "week" ? "7" : "30"} días`;
  const chartTitle =
    range === "today"
      ? "Ventas últimos 7 días"
      : range === "week"
        ? "Ventas por día — 7 días"
        : "Ventas por día — 30 días";

  const isNewTenant = allOrders.length === 0 && products.length === 0;

  return (
    <div className="px-4 py-3 md:px-6 md:py-4 flex flex-col gap-6 w-full">
      <style>{`
        @keyframes premium-fade-up {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .stagger-item {
          opacity: 0;
          animation: premium-fade-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

      {/* Alerta productos sin stock */}
      <LowStockAlert unavailableProducts={unavailableProducts} slug={slug} />

      {/* Header */}
      <div
        className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-5 border-b border-dash-border/60 stagger-item"
        style={{
          animationDelay: "0ms",
        }}
      >
        {/* Left: greeting + date */}
        <div>
          <h1
            style={{
              fontSize: isMobile ? 22 : 26,
              fontWeight: 800,
              letterSpacing: "-0.03em",
              color: "var(--dash-text)",
              marginBottom: 6,
              lineHeight: 1.2,
            }}
          >
            {greeting}, {tenantName} 👋
          </h1>
          <p
            style={{
              fontSize: 12,
              color: "var(--dash-muted)",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span
              className="animate-pulse"
              style={{
                display: "inline-block",
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "#4ade80",
                boxShadow: "0 0 6px #4ade8088",
                flexShrink: 0,
              }}
            />
            {dateLabel} · Panel activo
          </p>
        </div>

        {/* Right: range selector + export */}
        <div
          className="flex items-center gap-3"
          style={{ alignSelf: isMobile ? "flex-start" : "flex-start" }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              gap: 4,
            }}
          >
            <div
              style={{
                display: "flex",
                gap: 4,
                background: "var(--dash-surface-2)",
                borderRadius: 10,
                padding: 4,
                border: "1px solid var(--dash-border)",
              }}
            >
              {RANGES.map((r) => (
                <button
                  key={r}
                  onClick={() => handleRangeChange(r)}
                  style={{
                    padding: "8px 14px",
                    minHeight: 36,
                    borderRadius: 7,
                    border: "none",
                    fontSize: 12,
                    fontWeight: range === r ? 700 : 500,
                    cursor: "pointer",
                    transition: "all 0.15s",
                    background:
                      range === r
                        ? "linear-gradient(135deg, var(--accent), #ff8c5a)"
                        : "transparent",
                    color: range === r ? "#fff" : "var(--dash-muted)",
                    boxShadow:
                      range === r ? "0 2px 8px rgba(255,107,53,0.3)" : "none",
                    WebkitTapHighlightColor: "transparent",
                  }}
                >
                  {RANGE_LABELS[r]}
                </button>
              ))}
            </div>

            {range !== "today" && lastUpdated && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <span style={{ fontSize: 11, color: "var(--dash-muted)" }}>
                  Actualizado a las{" "}
                  {lastUpdated.toLocaleTimeString("es-AR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                <button
                  onClick={() => void fetchAnalytics(range as "week" | "month")}
                  disabled={analyticsLoading}
                  title="Actualizar datos"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 4,
                    background: "none",
                    border: "1px solid var(--dash-border)",
                    borderRadius: 6,
                    cursor: analyticsLoading ? "not-allowed" : "pointer",
                    color: "var(--dash-muted)",
                    opacity: analyticsLoading ? 0.6 : 1,
                    transition: "border-color 0.15s, color 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    if (!analyticsLoading) {
                      e.currentTarget.style.borderColor =
                        "rgba(255,107,53,0.4)";
                      e.currentTarget.style.color = "var(--dash-text)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--dash-border)";
                    e.currentTarget.style.color = "var(--dash-muted)";
                  }}
                >
                  <RefreshCw
                    style={{ width: 14, height: 14 }}
                    className={analyticsLoading ? "animate-spin" : ""}
                  />
                </button>
              </div>
            )}
          </div>
          <ExportReportButton slug={slug} />
        </div>
      </div>

      {/* Empty state — tenant nuevo sin productos ni pedidos */}
      {isNewTenant && (
        <div
          className="stagger-item"
          style={{
            textAlign: "center",
            padding: "48px 24px",
            maxWidth: 480,
            margin: "0 auto",
            animationDelay: "80ms",
          }}
        >
          <h2
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: "var(--dash-text)",
              marginBottom: 8,
            }}
          >
            Bienvenido a Takefyy
          </h2>
          <p
            style={{
              color: "var(--dash-muted)",
              marginBottom: 32,
              fontSize: 14,
            }}
          >
            Seguí estos pasos para empezar a recibir pedidos
          </p>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 12,
              textAlign: "left",
            }}
          >
            {[
              {
                step: 1,
                label: "Cargá tus productos",
                sub: "Creá las categorías y los platos de tu carta",
                href: `/${slug}/admin/productos`,
              },
              {
                step: 2,
                label: "Compartí el link de tu menú",
                sub: `Tu menú público está en takefyy.com/${slug}`,
                href: `/${slug}`,
              },
              {
                step: 3,
                label: "Recibí tu primer pedido",
                sub: "Los pedidos llegan aquí y por WhatsApp",
                href: `/${slug}/admin/pedidos`,
              },
            ].map((item) => (
              <Link
                key={item.step}
                href={item.href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "14px 16px",
                  borderRadius: 12,
                  border: "1px solid var(--dash-border)",
                  textDecoration: "none",
                  color: "inherit",
                  background: "var(--dash-surface)",
                  transition: "border-color 0.15s, box-shadow 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--accent)";
                  e.currentTarget.style.boxShadow =
                    "0 4px 12px rgba(255,107,53,0.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--dash-border)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <span
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background:
                      "linear-gradient(135deg, var(--accent), #ff8c5a)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    fontSize: 13,
                    color: "#fff",
                    flexShrink: 0,
                  }}
                >
                  {item.step}
                </span>
                <div>
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: 14,
                      color: "var(--dash-text)",
                    }}
                  >
                    {item.label}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--dash-muted)",
                      marginTop: 2,
                    }}
                  >
                    {item.sub}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {!isNewTenant && (
        <>
          {/* Quick actions */}
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/${slug}/admin/productos?new=1`}
              className="stagger-item"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 14px",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 500,
                background:
                  "linear-gradient(135deg, var(--accent) 0%, #ff8c5a 100%)",
                color: "#fff",
                textDecoration: "none",
                transition:
                  "transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s ease, opacity 0.2s ease",
                animationDelay: "80ms",
                boxShadow: "0 2px 8px rgba(255,107,53,0.2)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform =
                  "translateY(-1.5px) scale(1.02)";
                e.currentTarget.style.boxShadow =
                  "0 6px 16px rgba(255,107,53,0.35)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "none";
                e.currentTarget.style.boxShadow =
                  "0 2px 8px rgba(255,107,53,0.2)";
              }}
            >
              <Plus style={{ width: 14, height: 14 }} />
              Agregar producto
            </Link>
            <Link
              href={`/${slug}/admin/pedidos`}
              className="stagger-item"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 14px",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 500,
                background: "var(--dash-surface-2)",
                color: "var(--dash-muted)",
                border: "1px solid var(--dash-border)",
                textDecoration: "none",
                transition:
                  "transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease",
                animationDelay: "120ms",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "rgba(255,107,53,0.4)";
                e.currentTarget.style.color = "var(--dash-text)";
                e.currentTarget.style.transform =
                  "translateY(-1.5px) scale(1.02)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--dash-border)";
                e.currentTarget.style.color = "var(--dash-muted)";
                e.currentTarget.style.transform = "none";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <ClipboardList style={{ width: 14, height: 14 }} />
              Ver pedidos
            </Link>
            <Link
              href={`/${slug}/admin/preview`}
              className="stagger-item"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 14px",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 500,
                background: "var(--dash-surface-2)",
                color: "var(--dash-muted)",
                border: "1px solid var(--dash-border)",
                textDecoration: "none",
                transition:
                  "transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease",
                animationDelay: "160ms",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "rgba(255,107,53,0.4)";
                e.currentTarget.style.color = "var(--dash-text)";
                e.currentTarget.style.transform =
                  "translateY(-1.5px) scale(1.02)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--dash-border)";
                e.currentTarget.style.color = "var(--dash-muted)";
                e.currentTarget.style.transform = "none";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <Eye style={{ width: 14, height: 14 }} />
              Ver menú
            </Link>
          </div>

          {/* Control rápido de la tienda */}
          <div
            className="stagger-item w-full"
            style={{ animationDelay: "180ms" }}
          >
            <OperationControls
              isOpen={isOpen}
              setIsOpen={setIsOpen}
              soundEnabled={soundEnabled}
              setSoundEnabled={setSoundEnabled}
              slug={slug}
            />
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="stagger-item" style={{ animationDelay: "240ms" }}>
              <KPICard
                loading={analyticsLoading}
                label={`Pedidos${range === "today" ? " hoy" : ""}`}
                value={String(activeOrderCount)}
                change={
                  range === "today" ? currentKPIs.ordersTodayChange : null
                }
                changeLabel={rangeLabel}
                icon={ShoppingCart}
              />
            </div>
            <div className="stagger-item" style={{ animationDelay: "300ms" }}>
              <KPICard
                loading={analyticsLoading}
                label={`Ventas${range === "today" ? " hoy" : ""}`}
                value={fmtARS(activeRevenue)}
                change={
                  range === "today" ? currentKPIs.revenueTodayChange : null
                }
                changeLabel={rangeLabel}
                icon={DollarSign}
              />
            </div>
            <div className="stagger-item" style={{ animationDelay: "360ms" }}>
              <KPICard
                loading={analyticsLoading}
                label="Ticket promedio"
                value={activeAvgTicket > 0 ? fmtARS(activeAvgTicket) : "—"}
                change={range === "today" ? currentKPIs.avgTicketChange : null}
                changeLabel={rangeLabel}
                icon={TrendingUp}
              />
            </div>
            <div className="stagger-item" style={{ animationDelay: "420ms" }}>
              <KPICard
                loading={analyticsLoading}
                label="Productos activos"
                value={String(currentKPIs.activeProducts)}
                sub={
                  currentKPIs.activeProducts === 1
                    ? "1 producto en carta"
                    : `${currentKPIs.activeProducts} productos en carta`
                }
                icon={Package}
              />
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-4">
            <div className="stagger-item" style={{ animationDelay: "500ms" }}>
              <SalesAreaChart
                data={activeSalesData}
                loading={analyticsLoading}
                chartHeight={isMobile ? 200 : 280}
                title={chartTitle}
              />
            </div>
            <div className="stagger-item" style={{ animationDelay: "560ms" }}>
              <CategoryDonut
                data={range === "today" ? currentCategoryData : categoryData}
                compact={isMobile}
              />
            </div>
          </div>

          {/* Horas pico + Top productos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="stagger-item" style={{ animationDelay: "640ms" }}>
              <PeakHoursWidget orders={orders} />
            </div>
            <div className="stagger-item" style={{ animationDelay: "700ms" }}>
              <TopProductsList
                products={range === "today" ? currentTopProducts : topProducts}
                showRevenue={!isMobile}
              />
            </div>
          </div>

          {/* Tables */}
          <div
            className="stagger-item w-full"
            style={{ animationDelay: "780ms" }}
          >
            <RecentOrdersTable
              orders={currentRecentOrders}
              slug={slug}
              tenantId={tenantId}
              maxRows={isMobile ? 5 : 10}
              soundEnabled={soundEnabled}
            />
          </div>
        </>
      )}
    </div>
  );
}
