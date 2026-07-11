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
        position: "relative",
      }}
    >
      {/* Arrow */}
      <div
        style={{
          position: "absolute",
          top: -6,
          left: "50%",
          transform: "translateX(-50%)",
          width: 0,
          height: 0,
          borderLeft: "6px solid transparent",
          borderRight: "6px solid transparent",
          borderBottom: "6px solid var(--dash-border)",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: -5,
          left: "50%",
          transform: "translateX(-50%)",
          width: 0,
          height: 0,
          borderLeft: "6px solid transparent",
          borderRight: "6px solid transparent",
          borderBottom: "6px solid var(--dash-surface-2)",
        }}
      />
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

function fmtTotal(n: number) {
  if (n >= 1000000) return "$" + (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return "$" + (n / 1000).toFixed(0) + "k";
  return "$" + n;
}

// Get today's abbreviated day name in es-AR
const TODAY_LABEL = new Date()
  .toLocaleDateString("es-AR", {
    weekday: "short",
    timeZone: "America/Argentina/Buenos_Aires",
  })
  .replace(".", "");

interface SalesAreaChartProps {
  data: DailyRevenue[];
  loading?: boolean;
  chartHeight?: number;
  title?: string;
  onDayClick?: (isoDate: string) => void;
}

export function SalesAreaChart({
  data,
  loading = false,
  chartHeight = 280,
  title = "Ventas últimos 7 días",
  onDayClick,
}: SalesAreaChartProps) {
  if (loading) {
    return (
      <div className="bg-dash-surface border border-dash-border rounded-2xl shadow-[0_4px_16px_rgba(0,0,0,0.15)] p-5">
        <div className="h-4 w-44 bg-dash-surface-2 rounded animate-pulse mb-1" />
        <div className="h-3 w-28 bg-dash-surface-2 rounded animate-pulse mb-5" />
        <div className="h-[220px] bg-dash-surface-2/60 rounded-xl animate-pulse" />
      </div>
    );
  }

  const weekTotal = data.reduce((s, d) => s + d.total, 0);
  const prevTotal = data.slice(0, -1).reduce((s, d) => s + d.total, 0);
  const todayTotal = data[data.length - 1]?.total ?? 0;
  const trend = weekTotal > prevTotal ? "↑" : weekTotal < prevTotal ? "↓" : "—";
  const trendColor =
    weekTotal > prevTotal
      ? "#22c55e"
      : weekTotal < prevTotal
        ? "#f87171"
        : "var(--dash-muted)";

  return (
    <div className="bg-dash-surface border border-dash-border rounded-2xl shadow-[0_4px_16px_rgba(0,0,0,0.15)] p-5">
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <p
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: "var(--dash-text)",
              lineHeight: 1.2,
            }}
          >
            Ventas de la semana
          </p>
          <p style={{ fontSize: 12, color: "var(--dash-muted)", marginTop: 3 }}>
            {title}
          </p>
        </div>
        <div style={{ textAlign: "right" }}>
          <p
            style={{
              fontSize: 20,
              fontWeight: 800,
              color: "var(--dash-text)",
              fontFamily: "var(--font-mono, monospace)",
              lineHeight: 1,
            }}
          >
            {fmtTotal(weekTotal)}
          </p>
          <p
            style={{
              fontSize: 11,
              color: trendColor,
              marginTop: 3,
              fontWeight: 600,
            }}
          >
            {trend} Hoy: {fmtTotal(todayTotal)}
          </p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={chartHeight}>
        <BarChart
          data={data}
          margin={{ top: 5, right: 20, left: 0, bottom: 0 }}
          barCategoryGap="30%"
        >
          <defs>
            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FF6B35" stopOpacity={1} />
              <stop offset="100%" stopColor="#FF6B35" stopOpacity={0.2} />
            </linearGradient>
            <linearGradient id="barGradientToday" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FF6B35" stopOpacity={1} />
              <stop offset="100%" stopColor="#ff8c5a" stopOpacity={0.6} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255,255,255,0.05)"
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
          <Bar
            dataKey="total"
            radius={[6, 6, 0, 0]}
            maxBarSize={48}
            isAnimationActive
            onClick={
              onDayClick
                ? (entry: { payload?: DailyRevenue }) => {
                    if (entry.payload) onDayClick(entry.payload.isoDate);
                  }
                : undefined
            }
            cursor={onDayClick ? "pointer" : undefined}
          >
            {data.map((entry, i) => {
              const isToday = entry.date
                .toLowerCase()
                .startsWith(TODAY_LABEL.toLowerCase());
              return (
                <Cell
                  key={i}
                  fill={
                    isToday ? "url(#barGradientToday)" : "url(#barGradient)"
                  }
                  opacity={isToday ? 1 : 0.6}
                  stroke={isToday ? "#FF6B35" : "none"}
                  strokeWidth={isToday ? 1 : 0}
                />
              );
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
