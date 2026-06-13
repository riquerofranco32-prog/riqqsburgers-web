"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { DailyRevenue } from "@/types/dashboard";

function fmtAxisARS(n: number) {
  if (n === 0) return "$0";
  if (n >= 1000000) return "$" + (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return "$" + (n / 1000).toFixed(0) + "k";
  return "$" + n;
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value?: number }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
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
        {label}
      </p>
      <p
        style={{
          fontSize: 14,
          fontFamily: "var(--font-mono, monospace)",
          fontWeight: 500,
          color: "var(--accent)",
        }}
      >
        {"$" + (payload[0].value ?? 0).toLocaleString("es-AR")}
      </p>
    </div>
  );
}

interface SalesAreaChartProps {
  data: DailyRevenue[];
  loading?: boolean;
  chartHeight?: number;
  title?: string;
}

export function SalesAreaChart({
  data,
  loading = false,
  chartHeight = 280,
  title = "Ventas últimos 7 días",
}: SalesAreaChartProps) {
  if (loading) {
    return (
      <div className="bg-dash-surface border border-dash-border rounded-2xl p-5">
        <div className="h-2.5 w-44 bg-dash-surface-2 rounded animate-pulse mb-5" />
        <div className="h-[220px] bg-dash-surface-2/60 rounded-xl animate-pulse" />
      </div>
    );
  }

  const maxVal = Math.max(...data.map((d) => d.total), 1);

  return (
    <div className="bg-dash-surface border border-dash-border rounded-2xl p-5">
      <p className="text-[11px] uppercase tracking-wider text-dash-muted font-medium mb-5">
        {title}
      </p>
      <ResponsiveContainer width="100%" height={chartHeight}>
        <BarChart
          data={data}
          margin={{ top: 5, right: 20, left: 0, bottom: 0 }}
          barCategoryGap="30%"
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--dash-border)"
            vertical={false}
          />
          <XAxis
            dataKey="date"
            tick={{ fill: "var(--dash-muted)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={fmtAxisARS}
            tick={{ fill: "var(--dash-muted)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={52}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ fill: "rgba(255,107,53,0.06)", radius: 6 }}
          />
          <Bar dataKey="total" radius={[6, 6, 0, 0]} maxBarSize={48}>
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={
                  entry.total === maxVal ? "#FF6B35" : "rgba(255,107,53,0.45)"
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
