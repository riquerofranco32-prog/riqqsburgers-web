"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ShoppingCart,
  DollarSign,
  TrendingUp,
  Package,
  Plus,
  ClipboardList,
  Eye,
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
import type { Order, Product } from "@/types/supabase";
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
  kpis: DashboardKPIs;
  salesData: DailyRevenue[];
  categoryData: CategoryRevenue[];
  recentOrders: Order[];
  allOrders: Order[];
  topProducts: TopProduct[];
  unavailableProducts: Product[];
}

export default function AdminDashboard({
  tenantName,
  slug,
  tenantId,
  isOpen: isOpenInitial,
  kpis,
  salesData,
  categoryData,
  recentOrders,
  allOrders,
  topProducts,
  unavailableProducts,
}: AdminDashboardProps) {
  const isMobile = useIsMobile();
  const dateLabel = getDateLabel();
  const greeting = getGreeting();

  const [range, setRange] = useState<AnalyticsRange>("today");
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsResponse | null>(
    null,
  );

  const [isOpen, setIsOpen] = useState(isOpenInitial);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("kitchen_chime_enabled");
      return saved !== "false";
    }
    return true;
  });

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
        </div>
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-2">
        <a
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
            background: "linear-gradient(135deg, var(--accent) 0%, #ff8c5a 100%)",
            color: "#fff",
            textDecoration: "none",
            transition: "transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s ease, opacity 0.2s ease",
            animationDelay: "80ms",
            boxShadow: "0 2px 8px rgba(255,107,53,0.2)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-1.5px) scale(1.02)";
            e.currentTarget.style.boxShadow = "0 6px 16px rgba(255,107,53,0.35)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "none";
            e.currentTarget.style.boxShadow = "0 2px 8px rgba(255,107,53,0.2)";
          }}
        >
          <Plus style={{ width: 14, height: 14 }} />
          Agregar producto
        </a>
        <a
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
            transition: "transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease",
            animationDelay: "120ms",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "rgba(255,107,53,0.4)";
            e.currentTarget.style.color = "var(--dash-text)";
            e.currentTarget.style.transform = "translateY(-1.5px) scale(1.02)";
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
        </a>
        <a
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
            transition: "transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease",
            animationDelay: "160ms",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "rgba(255,107,53,0.4)";
            e.currentTarget.style.color = "var(--dash-text)";
            e.currentTarget.style.transform = "translateY(-1.5px) scale(1.02)";
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
        </a>
      </div>

      {/* Control rápido de la tienda */}
      <div className="stagger-item w-full" style={{ animationDelay: "180ms" }}>
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
            label={`Pedidos${range === "today" ? " hoy" : ""}`}
            value={analyticsLoading ? "…" : String(activeOrderCount)}
            change={range === "today" ? kpis.ordersTodayChange : null}
            changeLabel={rangeLabel}
            icon={ShoppingCart}
          />
        </div>
        <div className="stagger-item" style={{ animationDelay: "300ms" }}>
          <KPICard
            label={`Ventas${range === "today" ? " hoy" : ""}`}
            value={analyticsLoading ? "…" : fmtARS(activeRevenue)}
            change={range === "today" ? kpis.revenueTodayChange : null}
            changeLabel={rangeLabel}
            icon={DollarSign}
          />
        </div>
        <div className="stagger-item" style={{ animationDelay: "360ms" }}>
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
        </div>
        <div className="stagger-item" style={{ animationDelay: "420ms" }}>
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
          <CategoryDonut data={categoryData} compact={isMobile} />
        </div>
      </div>

      {/* Horas pico + Top productos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="stagger-item" style={{ animationDelay: "640ms" }}>
          <PeakHoursWidget orders={allOrders} />
        </div>
        <div className="stagger-item" style={{ animationDelay: "700ms" }}>
          <TopProductsList products={topProducts} showRevenue={!isMobile} />
        </div>
      </div>

      {/* Tables */}
      <div className="stagger-item w-full" style={{ animationDelay: "780ms" }}>
        <RecentOrdersTable
          orders={recentOrders}
          slug={slug}
          tenantId={tenantId}
          maxRows={isMobile ? 5 : 10}
          soundEnabled={soundEnabled}
        />
      </div>

      {/* Export — mobile fallback */}
      <div className="sm:hidden stagger-item" style={{ animationDelay: "840ms" }}>
        <ExportReportButton slug={slug} />
      </div>
    </div>
  );
}
