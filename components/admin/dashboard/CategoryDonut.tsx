"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import type { CategoryRevenue } from "@/types/dashboard";

function fmtARS(n: number) {
  return "$" + n.toLocaleString("es-AR");
}

type PayloadEntry = {
  name: string;
  value: number;
  total: number;
};

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: PayloadEntry; value?: number }[];
}) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  const pct = item.total > 0 ? Math.round((item.value / item.total) * 100) : 0;
  return (
    <div
      style={{
        background: "var(--dash-surface-2)",
        border: "1px solid var(--dash-border)",
        borderRadius: 12,
        padding: "8px 12px",
      }}
    >
      <p style={{ fontSize: 11, color: "var(--dash-muted)", marginBottom: 4 }}>
        {item.name}
      </p>
      <p
        style={{
          fontSize: 14,
          fontFamily: "var(--font-mono, monospace)",
          fontWeight: 500,
          color: "var(--dash-text)",
        }}
      >
        {fmtARS(item.value)}
      </p>
      <p style={{ fontSize: 11, color: "var(--dash-muted)", marginTop: 2 }}>
        {pct}% del total
      </p>
    </div>
  );
}

interface CategoryDonutProps {
  data: CategoryRevenue[];
  loading?: boolean;
  compact?: boolean;
}

export function CategoryDonut({
  data,
  loading = false,
  compact = false,
}: CategoryDonutProps) {
  if (loading) {
    return (
      <div className="bg-dash-surface border border-dash-border rounded-2xl p-5">
        <div className="h-4 w-40 bg-dash-surface-2 rounded animate-pulse mb-1" />
        <div className="h-3 w-24 bg-dash-surface-2 rounded animate-pulse mb-5" />
        <div className="flex items-center gap-5">
          <div className="w-[160px] h-[160px] rounded-full bg-dash-surface-2 animate-pulse flex-shrink-0" />
          <div className="flex-1 flex flex-col gap-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex flex-col gap-1.5">
                <div className="h-3 bg-dash-surface-2 rounded animate-pulse" />
                <div className="h-1.5 bg-dash-surface-2/60 rounded-full animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-dash-surface border border-dash-border rounded-2xl p-5 flex flex-col items-center justify-center min-h-[240px]">
        <p className="text-dash-muted text-sm">Sin datos de ventas</p>
      </div>
    );
  }

  const total = data.reduce((s, d) => s + d.value, 0);
  // Total de pedidos: sum de count si existe, fallback a value como proxy
  const totalCount = data.reduce(
    (s, d) =>
      s +
      ("count" in d && typeof (d as { count?: number }).count === "number"
        ? (d as { count: number }).count
        : d.value),
    0,
  );
  const enriched = data.map((d) => ({ ...d, total }));

  return (
    <div className="bg-dash-surface border border-dash-border rounded-2xl p-5">
      {/* Header */}
      <div className="mb-5">
        <p
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: "var(--dash-text)",
            lineHeight: 1.2,
          }}
        >
          Ventas por categoría
        </p>
        <p style={{ fontSize: 12, color: "var(--dash-muted)", marginTop: 3 }}>
          Distribución del período
        </p>
      </div>

      <div className="flex items-center gap-5">
        {/* Donut */}
        <div
          className="relative flex-shrink-0"
          style={{ width: compact ? 160 : 220, height: compact ? 160 : 220 }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={enriched}
                cx="50%"
                cy="50%"
                innerRadius={compact ? 50 : 70}
                outerRadius={compact ? 72 : 100}
                dataKey="value"
                strokeWidth={0}
                paddingAngle={2}
              >
                {enriched.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          {/* Center label: total pedidos */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span
              style={{
                fontSize: 28,
                fontWeight: 800,
                color: "var(--dash-text)",
                lineHeight: 1,
                fontFamily: "var(--font-mono, monospace)",
                letterSpacing: "-0.02em",
              }}
            >
              {totalCount.toLocaleString("es-AR")}
            </span>
            <span
              style={{ fontSize: 11, color: "var(--dash-muted)", marginTop: 4 }}
            >
              pedidos
            </span>
          </div>
        </div>

        {/* Legend mejorada */}
        <div className="flex-1 flex flex-col gap-3.5 min-w-0">
          {data.map((item) => {
            const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
            return (
              <div key={item.name} className="flex flex-col gap-1 min-w-0">
                {/* Row: dot + name + pct */}
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className="flex-shrink-0"
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: item.color,
                    }}
                  />
                  <span
                    className="flex-1 truncate"
                    style={{ fontSize: 12, color: "var(--dash-muted)" }}
                  >
                    {item.name}
                  </span>
                  <span
                    className="flex-shrink-0"
                    style={{
                      fontSize: 12,
                      fontFamily: "var(--font-mono, monospace)",
                      color: "var(--dash-text)",
                      fontWeight: 500,
                    }}
                  >
                    {pct}%
                  </span>
                </div>
                {/* Progress bar */}
                <div
                  className="rounded-full overflow-hidden"
                  style={{ height: 4, background: item.color + "33" }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${pct}%`,
                      background: item.color,
                      transition: "width 0.6s ease",
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
