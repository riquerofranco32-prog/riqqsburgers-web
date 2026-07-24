"use client";

import { useEffect, useState } from "react";
import {
  DollarSign,
  ShoppingCart,
  TrendingUp,
  Clock,
  ArrowUp,
  ArrowDown,
  Minus,
  AlertTriangle,
  Info,
  WifiOff,
  BarChart3,
} from "lucide-react";
import { KPICard } from "@/components/admin/dashboard/KPICard";
import { SalesAreaChart } from "@/components/admin/dashboard/SalesAreaChart";
import { TopProductsList } from "@/components/admin/dashboard/TopProductsList";
import ExportReportButton from "@/components/admin/ExportReportButton";
import EmptyState from "@/components/admin/EmptyState";
import type { AnalyticsResponse, AnalyticsRange } from "@/types/dashboard";

function fmtARS(n: number) {
  return "$" + n.toLocaleString("es-AR");
}

const RANGE_OPTIONS: Array<{ key: AnalyticsRange; label: string }> = [
  { key: "today", label: "Hoy" },
  { key: "week", label: "7 días" },
  { key: "twoWeeks", label: "14 días" },
  { key: "month", label: "30 días" },
];

const RANGE_LABEL: Record<AnalyticsRange, string> = {
  today: "vs. ayer",
  week: "vs. semana anterior",
  twoWeeks: "vs. quincena anterior",
  month: "vs. mes anterior",
};

function fmtHourRange(hour: number) {
  return `${hour}:00 - ${(hour + 1) % 24}:00hs`;
}

export default function ReportsAdmin({ slug }: { slug: string }) {
  const [range, setRange] = useState<AnalyticsRange>("week");
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setFailed(false);
    fetch(`/api/tenant/${slug}/analytics?range=${range}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((json: AnalyticsResponse) => {
        if (!cancelled) setData(json);
      })
      .catch(() => {
        if (!cancelled) {
          setData(null);
          setFailed(true);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug, range, reloadToken]);

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

      <ExportReportButton slug={slug} />

      {!loading && failed && (
        <EmptyState
          icon={WifiOff}
          title="No pudimos cargar los reportes"
          description="Revisá tu conexión e intentá de nuevo."
          action={{
            label: "Reintentar",
            onClick: () => setReloadToken((t) => t + 1),
          }}
        />
      )}

      {!loading && !failed && data?.orderCount === 0 && (
        <EmptyState
          icon={BarChart3}
          title="Sin pedidos en este período"
          description="Los reportes van a aparecer acá apenas entren pedidos en el rango seleccionado."
        />
      )}

      {!failed && (loading || (data?.orderCount ?? 0) > 0) && (
        <>
          {!loading && !!data?.insights.length && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {data.insights.map((insight, i) => {
                const isWarn = insight.severity === "warn";
                const Icon = isWarn ? AlertTriangle : Info;
                const color = isWarn ? "var(--dash-warning)" : "var(--accent)";
                return (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "10px 14px",
                      borderRadius: 10,
                      background: isWarn
                        ? "var(--dash-warning-bg)"
                        : "var(--dash-accent-subtle)",
                      border: `1px solid ${isWarn ? "var(--dash-warning-border)" : "var(--dash-accent-glow)"}`,
                    }}
                  >
                    <Icon size={16} color={color} strokeWidth={2} />
                    <span style={{ fontSize: 13, color: "var(--dash-text)" }}>
                      {insight.message}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <KPICard
              loading={loading}
              label="Ingresos"
              value={fmtARS(data?.revenue ?? 0)}
              change={data?.revenueChange ?? null}
              changeLabel={RANGE_LABEL[range]}
              icon={DollarSign}
              sparkline={data?.dailyRevenue.map((d) => d.total)}
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

          {/* Tasa de cancelación — subtexto discreto, no un KPI aparte */}
          {!!data?.cancelledCount && (
            <p
              style={{
                fontSize: 12,
                color: "var(--dash-muted)",
                marginTop: -12,
              }}
            >
              ⚠️ {data.cancelledCount} pedido
              {data.cancelledCount !== 1 ? "s" : ""} cancelado
              {data.cancelledCount !== 1 ? "s" : ""} (
              {data.cancelledRate.toFixed(0)}% del total en este período)
            </p>
          )}

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
                boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  background: "var(--dash-accent-subtle)",
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

          {!loading && (data?.categoryRevenueChange.length ?? 0) > 0 && (
            <div
              style={{
                background: "var(--dash-surface)",
                border: "1px solid var(--dash-border)",
                borderRadius: 16,
                padding: 20,
                boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
              }}
            >
              <p
                style={{
                  fontSize: 12,
                  color: "var(--dash-muted)",
                  marginBottom: 12,
                }}
              >
                Categorías — variación vs. período anterior
              </p>
              <div
                style={{ display: "flex", flexDirection: "column", gap: 10 }}
              >
                {data!.categoryRevenueChange.map((c) => {
                  const isUp = c.changePct !== null && c.changePct > 0;
                  const isDown = c.changePct !== null && c.changePct < 0;
                  const Icon = isUp ? ArrowUp : isDown ? ArrowDown : Minus;
                  const color = isUp
                    ? "var(--dash-success)"
                    : isDown
                      ? "var(--dash-danger)"
                      : "var(--dash-muted)";
                  return (
                    <div
                      key={c.name}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 12,
                      }}
                    >
                      <span style={{ fontSize: 13, color: "var(--dash-text)" }}>
                        {c.name}
                      </span>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: "var(--dash-text)",
                            fontVariantNumeric: "tabular-nums",
                          }}
                        >
                          {fmtARS(c.value)}
                        </span>
                        <span
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 3,
                            fontSize: 12,
                            fontWeight: 700,
                            color,
                            minWidth: 56,
                            justifyContent: "flex-end",
                          }}
                        >
                          <Icon size={12} />
                          {c.changePct !== null
                            ? `${Math.abs(c.changePct).toFixed(0)}%`
                            : "nuevo"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {!loading && !!data?.branchRevenue?.length && (
            <div
              style={{
                background: "var(--dash-surface)",
                border: "1px solid var(--dash-border)",
                borderRadius: 16,
                padding: 20,
                boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
              }}
            >
              <p
                style={{
                  fontSize: 12,
                  color: "var(--dash-muted)",
                  marginBottom: 12,
                }}
              >
                Sucursales — comparación en este período
              </p>
              <div
                style={{ display: "flex", flexDirection: "column", gap: 10 }}
              >
                {data.branchRevenue.map((b) => (
                  <div
                    key={b.branch_id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 12,
                    }}
                  >
                    <span style={{ fontSize: 13, color: "var(--dash-text)" }}>
                      {b.name}
                    </span>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 16 }}
                    >
                      <span
                        style={{ fontSize: 12, color: "var(--dash-muted)" }}
                      >
                        {b.orderCount} pedido{b.orderCount !== 1 ? "s" : ""}
                      </span>
                      {b.cancelledRate > 0 && (
                        <span
                          style={{ fontSize: 12, color: "var(--dash-danger)" }}
                        >
                          {b.cancelledRate.toFixed(0)}% cancelados
                        </span>
                      )}
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: "var(--dash-text)",
                          fontVariantNumeric: "tabular-nums",
                          minWidth: 90,
                          textAlign: "right",
                        }}
                      >
                        {fmtARS(b.revenue)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <TopProductsList
            products={data?.topProducts ?? []}
            loading={loading}
          />
        </>
      )}
    </div>
  );
}
