"use client";

import { useEffect, useState } from "react";
import { DollarSign, ShoppingCart, TrendingUp, Clock } from "lucide-react";
import { KPICard } from "@/components/admin/dashboard/KPICard";
import { SalesAreaChart } from "@/components/admin/dashboard/SalesAreaChart";
import { TopProductsList } from "@/components/admin/dashboard/TopProductsList";
import type { AnalyticsResponse, AnalyticsRange } from "@/types/dashboard";

function fmtARS(n: number) {
  return "$" + n.toLocaleString("es-AR");
}

const RANGE_OPTIONS: Array<{ key: AnalyticsRange; label: string }> = [
  { key: "today", label: "Hoy" },
  { key: "week", label: "7 días" },
  { key: "month", label: "30 días" },
];

const RANGE_LABEL: Record<AnalyticsRange, string> = {
  today: "vs. ayer",
  week: "vs. semana anterior",
  month: "vs. mes anterior",
};

function fmtHourRange(hour: number) {
  return `${hour}:00 - ${(hour + 1) % 24}:00hs`;
}

export default function ReportsAdmin({ slug }: { slug: string }) {
  const [range, setRange] = useState<AnalyticsRange>("week");
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/tenant/${slug}/analytics?range=${range}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((json: AnalyticsResponse) => {
        if (!cancelled) setData(json);
      })
      .catch(() => {
        if (!cancelled) setData(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug, range]);

  return (
    <div className="p-5 md:p-8 flex flex-col gap-5 w-full">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-bold font-[family-name:var(--font-syne)]">
            Reportes
          </h1>
          <p style={{ fontSize: 13, color: "var(--dash-muted)" }}>
            Ventas, producto top y horario pico por período
          </p>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setRange(opt.key)}
              style={{
                padding: "8px 14px",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                background:
                  range === opt.key ? "var(--accent)" : "var(--dash-surface-2)",
                color: range === opt.key ? "#fff" : "var(--dash-text)",
                border: "1px solid var(--dash-border)",
                transition: "border-color 0.15s, filter 0.15s",
              }}
              onMouseEnter={(e) => {
                if (range === opt.key) {
                  e.currentTarget.style.filter = "brightness(1.1)";
                } else {
                  e.currentTarget.style.borderColor = "var(--dash-muted)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.filter = "none";
                e.currentTarget.style.borderColor = "var(--dash-border)";
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPICard
          loading={loading}
          label="Ingresos"
          value={fmtARS(data?.revenue ?? 0)}
          change={data?.revenueChange ?? null}
          changeLabel={RANGE_LABEL[range]}
          icon={DollarSign}
        />
        <KPICard
          loading={loading}
          label="Pedidos"
          value={String(data?.orderCount ?? 0)}
          change={data?.orderCountChange ?? null}
          changeLabel={RANGE_LABEL[range]}
          icon={ShoppingCart}
        />
        <KPICard
          loading={loading}
          label="Ticket promedio"
          value={data && data.avgTicket > 0 ? fmtARS(data.avgTicket) : "—"}
          change={data?.avgTicketChange ?? null}
          changeLabel={RANGE_LABEL[range]}
          icon={TrendingUp}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-4">
        <SalesAreaChart
          data={data?.dailyRevenue ?? []}
          loading={loading}
          title="Ventas por día"
        />
        <div
          style={{
            background: "var(--dash-surface)",
            border: "1px solid var(--dash-border)",
            borderRadius: 16,
            padding: 20,
            display: "flex",
            flexDirection: "column",
            gap: 8,
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: "rgba(255,107,53,0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 4,
            }}
          >
            <Clock size={18} color="var(--accent)" strokeWidth={1.8} />
          </div>
          <p style={{ fontSize: 12, color: "var(--dash-muted)" }}>
            Horario pico de pedidos
          </p>
          {loading ? (
            <div
              style={{
                height: 24,
                width: 140,
                borderRadius: 6,
                background: "var(--dash-surface-2)",
              }}
            />
          ) : data?.peakHour ? (
            <>
              <p
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  color: "var(--dash-text)",
                }}
              >
                {fmtHourRange(data.peakHour.hour)}
              </p>
              <p style={{ fontSize: 12, color: "var(--dash-muted)" }}>
                {data.peakHour.count}{" "}
                {data.peakHour.count === 1 ? "pedido" : "pedidos"}
              </p>
            </>
          ) : (
            <p style={{ fontSize: 13, color: "var(--dash-muted)" }}>
              Sin pedidos en este período
            </p>
          )}
        </div>
      </div>

      <TopProductsList products={data?.topProducts ?? []} loading={loading} />
    </div>
  );
}
