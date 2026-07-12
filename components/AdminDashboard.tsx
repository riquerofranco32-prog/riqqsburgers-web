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
import { TrialCountdownBanner } from "@/components/admin/dashboard/TrialCountdownBanner";
import {
  OnboardingChecklist,
  type OnboardingState,
} from "@/components/admin/dashboard/OnboardingChecklist";
import { OperationControls } from "@/components/admin/dashboard/OperationControls";
import CierreCaja, {
  dayLabelFor,
  type CajaData,
} from "@/components/admin/dashboard/CierreCaja";
import ExportReportButton from "@/components/admin/ExportReportButton";
import { useOrdersRealtime } from "@/hooks/useOrdersRealtime";
import type { Product, Order } from "@/types/supabase";
import type {
  TodayKPIsResponse,
  AnalyticsRange,
  AnalyticsResponse,
} from "@/types/dashboard";

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
  twoWeeks: "14 días",
  month: "30 días",
};

const RANGES: AnalyticsRange[] = ["today", "week", "twoWeeks", "month"];

interface AdminDashboardProps {
  tenantName: string;
  slug: string;
  tenantId: string;
  isOpen: boolean;
  allOrders: Order[];
  unavailableProducts: Product[];
  trialDaysLeft?: number | null;
  onboarding?: OnboardingState;
}

export default function AdminDashboard({
  tenantName,
  slug,
  tenantId,
  isOpen: isOpenInitial,
  allOrders,
  unavailableProducts,
  trialDaysLeft,
  onboarding,
}: AdminDashboardProps) {
  const isMobile = useIsMobile();
  // Saludo y fecha dependen de la hora local del usuario — calcularlos en el
  // render generaba mismatch de hidratación (el server corre en UTC, 3hs
  // adelantado a ART): #425 en prod. Se calculan recién montado el cliente.
  const [dateLabel, setDateLabel] = useState("");
  const [greeting, setGreeting] = useState("Hola");
  useEffect(() => {
    setDateLabel(getDateLabel());
    setGreeting(getGreeting());
  }, []);

  const [orders, setOrders] = useState<Order[]>(allOrders);
  const [range, setRange] = useState<AnalyticsRange>("today");
  const [cajaDate, setCajaDate] = useState<string | undefined>(undefined);
  const [cajaViewData, setCajaViewData] = useState<CajaData | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsResponse | null>(
    null,
  );
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [kpisData, setKpisData] = useState<TodayKPIsResponse | null>(null);
  const [kpisLoading, setKpisLoading] = useState(false);

  const [isOpen, setIsOpen] = useState(isOpenInitial);
  const [newOrderFlash, setNewOrderFlash] = useState(false);
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

  const fetchKPIs = useCallback(async () => {
    setKpisLoading(true);
    try {
      const res = await fetch(`/api/${slug}/admin/kpis`);
      if (!res.ok) throw new Error("Error al cargar KPIs");
      const data: TodayKPIsResponse = await res.json();
      setKpisData(data);
    } catch {
      // keep previous data on error
    } finally {
      setKpisLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    void fetchKPIs();
  }, [fetchKPIs]);

  const { status: realtimeStatus } = useOrdersRealtime(tenantId, {
    onInsert: (incoming) => {
      setOrders((prev) => {
        if (prev.some((o) => o.id === incoming.id)) return prev;
        return [incoming, ...prev];
      });
      void fetchKPIs();
      setNewOrderFlash(true);
      setTimeout(() => setNewOrderFlash(false), 2500);
    },
    onUpdate: (updated) => {
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
    },
    onDelete: (id) => {
      setOrders((prev) => prev.filter((o) => o.id !== id));
    },
  });

  const currentRecentOrders = useMemo(() => {
    return orders.slice(0, 10);
  }, [orders]);

  const pendingCount = useMemo(
    () =>
      orders.filter((o) => o.status === "pending" || o.status === "nuevo")
        .length,
    [orders],
  );

  useEffect(() => {
    localStorage.setItem("kitchen_chime_enabled", String(soundEnabled));
  }, [soundEnabled]);

  const fetchAnalytics = useCallback(
    async (r: "week" | "twoWeeks" | "month") => {
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
      void fetchKPIs();
    } else {
      void fetchAnalytics(r);
    }
  };

  // Cuando el usuario navegó a un día específico desde el cierre de caja
  // (flechas o click en una barra del gráfico), las KPI de arriba muestran
  // ese día puntual en vez del agregado del `range` elegido.
  const viewingSpecificDay = cajaDate !== undefined && cajaViewData !== null;

  const activeRevenue = viewingSpecificDay
    ? cajaViewData.total
    : range === "today"
      ? (kpisData?.revenueToday ?? 0)
      : (analyticsData?.revenue ?? 0);
  const activeOrderCount = viewingSpecificDay
    ? cajaViewData.cantidad
    : range === "today"
      ? (kpisData?.ordersToday ?? 0)
      : (analyticsData?.orderCount ?? 0);
  const activeAvgTicket = viewingSpecificDay
    ? cajaViewData.cantidad > 0
      ? Math.round(cajaViewData.total / cajaViewData.cantidad)
      : 0
    : range === "today"
      ? (kpisData?.avgTicketToday ?? 0)
      : (analyticsData?.avgTicket ?? 0);
  const activeSalesData =
    range === "today"
      ? (kpisData?.salesLast7Days ?? [])
      : (analyticsData?.dailyRevenue ?? []);

  const kpiDayLabel = viewingSpecificDay
    ? dayLabelFor(cajaViewData.fechaIso, cajaViewData.fecha)
    : null;

  const rangeLabel =
    range === "today"
      ? "vs ayer"
      : range === "week"
        ? "vs. semana anterior"
        : range === "twoWeeks"
          ? "vs. quincena anterior"
          : "vs. mes anterior";
  const chartTitle =
    range === "today"
      ? "Ventas últimos 7 días"
      : range === "week"
        ? "Ventas por día — 7 días"
        : range === "twoWeeks"
          ? "Ventas por día — 14 días"
          : "Ventas por día — 30 días";

  // ponytail: activeProducts defaults to 1 while kpisData loads to avoid flashing empty state
  const isNewTenant =
    allOrders.length === 0 && (kpisData?.activeProducts ?? 1) === 0;

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

      {/* Countdown de prueba Pro */}
      {trialDaysLeft !== null && trialDaysLeft !== undefined && (
        <TrialCountdownBanner daysLeft={trialDaysLeft} />
      )}

      {/* Checklist de activación — solo se ve hasta completar los pasos */}
      {onboarding && <OnboardingChecklist slug={slug} state={onboarding} />}

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
          {dateLabel ? (
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
          ) : (
            <div
              className="animate-pulse"
              style={{
                width: 220,
                height: isMobile ? 22 : 26,
                borderRadius: 6,
                background: "var(--dash-surface-2)",
                marginBottom: 6,
              }}
            />
          )}
          {viewingSpecificDay ? (
            <p
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "#f59e0b",
                background: "rgba(245,158,11,0.12)",
                border: "1px solid rgba(245,158,11,0.3)",
                borderRadius: 8,
                padding: "4px 10px",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                width: "fit-content",
              }}
            >
              📅 Viendo el reporte de {kpiDayLabel}
              {kpiDayLabel !== cajaViewData.fecha && ` (${cajaViewData.fecha})`}
              <button
                onClick={() => setCajaDate(undefined)}
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#f59e0b",
                  background: "none",
                  border: "none",
                  textDecoration: "underline",
                  cursor: "pointer",
                  padding: 0,
                  marginLeft: 4,
                }}
              >
                volver a hoy
              </button>
            </p>
          ) : (
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
          )}
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
              {pendingCount > 0 && (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minWidth: 18,
                    height: 18,
                    borderRadius: 999,
                    background: newOrderFlash
                      ? "var(--accent)"
                      : "rgba(255,107,53,0.75)",
                    color: "#fff",
                    fontSize: 10,
                    fontWeight: 800,
                    padding: "0 5px",
                    lineHeight: 1,
                    transition: "background 0.3s",
                    animation: newOrderFlash
                      ? "order-ring 1.1s ease-out forwards"
                      : "none",
                  }}
                >
                  {pendingCount}
                </span>
              )}
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
              realtimeStatus={realtimeStatus}
            />
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div
              className="stagger-item"
              style={{ animationDelay: "240ms", position: "relative" }}
            >
              {newOrderFlash && (
                <span
                  style={{
                    position: "absolute",
                    inset: -4,
                    borderRadius: 20,
                    border: "2px solid rgba(255,107,53,0.6)",
                    animation: "order-ring 1.1s ease-out forwards",
                    pointerEvents: "none",
                    zIndex: 10,
                  }}
                />
              )}
              <KPICard
                loading={
                  viewingSpecificDay
                    ? false
                    : range === "today"
                      ? kpisLoading
                      : analyticsLoading
                }
                label={
                  kpiDayLabel
                    ? `Pedidos (${kpiDayLabel})`
                    : `Pedidos${range === "today" ? " hoy" : ""}`
                }
                value={String(activeOrderCount)}
                change={
                  viewingSpecificDay
                    ? null
                    : range === "today"
                      ? (kpisData?.ordersTodayChange ?? null)
                      : (analyticsData?.orderCountChange ?? null)
                }
                changeLabel={rangeLabel}
                icon={ShoppingCart}
              />
            </div>
            <div className="stagger-item" style={{ animationDelay: "300ms" }}>
              <KPICard
                loading={
                  viewingSpecificDay
                    ? false
                    : range === "today"
                      ? kpisLoading
                      : analyticsLoading
                }
                label={
                  kpiDayLabel
                    ? `Ventas (${kpiDayLabel})`
                    : `Ventas${range === "today" ? " hoy" : ""}`
                }
                value={fmtARS(activeRevenue)}
                change={
                  viewingSpecificDay
                    ? null
                    : range === "today"
                      ? (kpisData?.revenueTodayChange ?? null)
                      : (analyticsData?.revenueChange ?? null)
                }
                changeLabel={rangeLabel}
                icon={DollarSign}
                sparkline={
                  viewingSpecificDay
                    ? undefined
                    : activeSalesData.map((d) => d.total)
                }
              />
            </div>
            <div className="stagger-item" style={{ animationDelay: "360ms" }}>
              <KPICard
                loading={
                  viewingSpecificDay
                    ? false
                    : range === "today"
                      ? kpisLoading
                      : analyticsLoading
                }
                label={
                  kpiDayLabel
                    ? `Ticket promedio (${kpiDayLabel})`
                    : "Ticket promedio"
                }
                value={activeAvgTicket > 0 ? fmtARS(activeAvgTicket) : "—"}
                change={
                  viewingSpecificDay
                    ? null
                    : range === "today"
                      ? (kpisData?.avgTicketChange ?? null)
                      : (analyticsData?.avgTicketChange ?? null)
                }
                changeLabel={rangeLabel}
                icon={TrendingUp}
              />
            </div>
            <div className="stagger-item" style={{ animationDelay: "420ms" }}>
              <KPICard
                loading={kpisLoading}
                label="Productos activos"
                value={String(kpisData?.activeProducts ?? "—")}
                sub={
                  kpisData?.activeProducts === 1
                    ? "1 producto en carta"
                    : `${kpisData?.activeProducts ?? 0} productos en carta`
                }
                icon={Package}
              />
            </div>
          </div>

          {/* Cierre de caja diario */}
          <div className="stagger-item" style={{ animationDelay: "480ms" }}>
            {cajaDate && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-end",
                  marginBottom: 8,
                }}
              >
                <button
                  onClick={() => setCajaDate(undefined)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--accent)",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    padding: 0,
                  }}
                >
                  ← Volver al cierre de hoy
                </button>
              </div>
            )}
            <CierreCaja
              slug={slug}
              date={cajaDate}
              onDateChange={setCajaDate}
              onData={setCajaViewData}
            />
          </div>

          {/* Empty state — no orders today (existing tenant) */}
          {!viewingSpecificDay &&
            range === "today" &&
            !kpisLoading &&
            kpisData !== null &&
            kpisData.ordersToday === 0 && (
              <div
                className="stagger-item"
                style={{
                  padding: "18px 22px",
                  border: "1px dashed rgba(255,107,53,0.25)",
                  borderRadius: 16,
                  background: "rgba(255,107,53,0.04)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 16,
                  flexWrap: "wrap",
                  animationDelay: "460ms",
                }}
              >
                <div>
                  <p
                    style={{
                      fontWeight: 700,
                      fontSize: 14,
                      color: "var(--dash-text)",
                      marginBottom: 4,
                    }}
                  >
                    Todavía no hay pedidos hoy
                  </p>
                  <p style={{ fontSize: 12, color: "var(--dash-muted)" }}>
                    Compartí tu menú con tus clientes para empezar a recibir
                  </p>
                </div>
                <Link
                  href={`/${slug}`}
                  target="_blank"
                  style={{
                    padding: "8px 16px",
                    borderRadius: 8,
                    border: "1px solid rgba(255,107,53,0.3)",
                    background: "rgba(255,107,53,0.08)",
                    color: "var(--accent)",
                    fontSize: 13,
                    fontWeight: 600,
                    textDecoration: "none",
                    flexShrink: 0,
                    transition: "background 0.15s",
                  }}
                >
                  Ver mi menú
                </Link>
              </div>
            )}

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-4">
            <div className="stagger-item" style={{ animationDelay: "500ms" }}>
              <SalesAreaChart
                data={activeSalesData}
                loading={range === "today" ? kpisLoading : analyticsLoading}
                chartHeight={isMobile ? 200 : 280}
                title={chartTitle}
                onDayClick={setCajaDate}
              />
            </div>
            <div className="stagger-item" style={{ animationDelay: "560ms" }}>
              <CategoryDonut
                data={
                  range === "today"
                    ? (kpisData?.categoryRevenue ?? [])
                    : (analyticsData?.categoryRevenue ?? [])
                }
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
                products={
                  range === "today"
                    ? (kpisData?.topProducts ?? [])
                    : (analyticsData?.topProducts ?? [])
                }
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
