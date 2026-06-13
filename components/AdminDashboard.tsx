"use client";

import { useState, useEffect, useCallback } from "react";
import { ShoppingCart, DollarSign, TrendingUp, Package } from "lucide-react";
import { KPICard } from "@/components/admin/dashboard/KPICard";
import { SalesAreaChart } from "@/components/admin/dashboard/SalesAreaChart";
import { CategoryDonut } from "@/components/admin/dashboard/CategoryDonut";
import { RecentOrdersTable } from "@/components/admin/dashboard/RecentOrdersTable";
import { TopProductsList } from "@/components/admin/dashboard/TopProductsList";
import ExportReportButton from "@/components/admin/ExportReportButton";
import type { Order } from "@/types/supabase";
import type {
  DashboardKPIs,
  DailyRevenue,
  CategoryRevenue,
  TopProduct,
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
  kpis: DashboardKPIs;
  salesData: DailyRevenue[];
  categoryData: CategoryRevenue[];
  recentOrders: Order[];
  topProducts: TopProduct[];
}

export default function AdminDashboard({
  tenantName,
  slug,
  tenantId,
  kpis,
  salesData,
  categoryData,
  recentOrders,
  topProducts,
}: AdminDashboardProps) {
  const isMobile = useIsMobile();
  const dateLabel = getDateLabel();

  const [range, setRange] = useState<AnalyticsRange>("today");
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsResponse | null>(
    null,
  );

  const fetchAnalytics = useCallback(
    async (r: "week" | "month") => {
      setAnalyticsLoading(true);
      try {
        const res = await fetch(`/api/tenant/${slug}/analytics?range=${r}`);
        if (!res.ok) throw new Error("Error al cargar analytics");
        const data: AnalyticsResponse = await res.json();
        setAnalyticsData(data);
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
    } else {
      void fetchAnalytics(r);
    }
  };

  // Valores derivados según el rango activo
  const activeRevenue =
    range === "today" ? kpis.revenueToday : (analyticsData?.revenue ?? 0);
  const activeOrderCount =
    range === "today" ? kpis.ordersToday : (analyticsData?.orderCount ?? 0);
  const activeAvgTicket =
    range === "today" ? kpis.avgTicketToday : (analyticsData?.avgTicket ?? 0);
  const activeSalesData =
    range === "today" ? salesData : (analyticsData?.dailyRevenue ?? salesData);

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

  return (
    <div className="px-4 py-3 md:px-6 md:py-4 flex flex-col gap-6 w-full">
      {/* Header */}
      <div
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-dash-border/60"
        style={{
          paddingBottom: 20,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: isMobile ? 24 : 28,
              fontWeight: 800,
              letterSpacing: "-0.03em",
              background:
                "linear-gradient(135deg, var(--dash-text), var(--dash-muted))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              marginBottom: 4,
            }}
          >
            {tenantName}
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
              style={{
                display: "inline-block",
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "#4ade80",
                boxShadow: "0 0 6px #4ade8088",
                animation: "pulse-dot 2s ease-in-out infinite",
              }}
            />
            {dateLabel}
          </p>
        </div>

        {/* Range selector */}
        <div
          style={{
            display: "flex",
            gap: 4,
            background: "var(--dash-surface-2)",
            borderRadius: 10,
            padding: 4,
            border: "1px solid var(--dash-border)",
            alignSelf: isMobile ? "flex-start" : "auto",
          }}
        >
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => handleRangeChange(r)}
              style={{
                padding: "8px 14px",
                minHeight: 40,
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
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <KPICard
          label={`Pedidos${range === "today" ? " hoy" : ""}`}
          value={analyticsLoading ? "…" : String(activeOrderCount)}
          change={range === "today" ? kpis.ordersTodayChange : null}
          changeLabel={rangeLabel}
          icon={ShoppingCart}
        />
        <KPICard
          label={`Ventas${range === "today" ? " hoy" : ""}`}
          value={analyticsLoading ? "…" : fmtARS(activeRevenue)}
          change={range === "today" ? kpis.revenueTodayChange : null}
          changeLabel={rangeLabel}
          icon={DollarSign}
        />
        <KPICard
          label="Ticket promedio"
          value={
            analyticsLoading
              ? "…"
              : activeAvgTicket > 0
                ? fmtARS(activeAvgTicket)
                : "—"
          }
          change={range === "today" ? kpis.avgTicketChange : null}
          changeLabel={rangeLabel}
          icon={TrendingUp}
        />
        <KPICard
          label="Productos activos"
          value={analyticsLoading ? "…" : String(kpis.activeProducts)}
          sub={
            kpis.activeProducts === 1
              ? "1 producto en carta"
              : `${kpis.activeProducts} productos en carta`
          }
          icon={Package}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-4">
        <SalesAreaChart
          data={activeSalesData}
          loading={analyticsLoading}
          chartHeight={isMobile ? 200 : 280}
          title={chartTitle}
        />
        <CategoryDonut data={categoryData} compact={isMobile} />
      </div>

      {/* Tables */}
      <div className="grid md:grid-cols-2 gap-4">
        <RecentOrdersTable
          orders={recentOrders}
          slug={slug}
          tenantId={tenantId}
          maxRows={isMobile ? 5 : 10}
        />
        <TopProductsList products={topProducts} showRevenue={!isMobile} />
      </div>

      {/* Reportes */}
      <ExportReportButton slug={slug} />
    </div>
  );
}
