'use client'

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { DailyRevenue } from '@/types/dashboard'

function fmtAxisARS(n: number) {
  if (n === 0) return '$0'
  if (n >= 1000000) return '$' + (n / 1000000).toFixed(1) + 'M'
  if (n >= 1000) return '$' + (n / 1000).toFixed(0) + 'k'
  return '$' + n
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value?: number }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'var(--dash-surface-2)', border: '1px solid var(--dash-border)', borderRadius: 12, padding: '8px 12px' }}>
      <p style={{ fontSize: 11, color: 'var(--dash-muted)', marginBottom: 4 }}>{label}</p>
      <p style={{ fontSize: 14, fontFamily: 'var(--font-mono, monospace)', fontWeight: 500, color: 'var(--accent)' }}>
        {'$' + (payload[0].value ?? 0).toLocaleString('es-AR')}
      </p>
    </div>
  )
}

interface SalesAreaChartProps {
  data: DailyRevenue[]
  loading?: boolean
  chartHeight?: number
}

export function SalesAreaChart({ data, loading = false, chartHeight = 280 }: SalesAreaChartProps) {
  if (loading) {
    return (
      <div className="bg-dash-surface border border-dash-border rounded-2xl p-5">
        <div className="h-2.5 w-44 bg-dash-surface-2 rounded animate-pulse mb-5" />
        <div className="h-[220px] bg-dash-surface-2/60 rounded-xl animate-pulse" />
      </div>
    )
  }

  return (
    <div className="bg-dash-surface border border-dash-border rounded-2xl p-5">
      <p className="text-[11px] uppercase tracking-wider text-dash-muted font-medium mb-5">
        Ventas últimos 7 días
      </p>
      <ResponsiveContainer width="100%" height={chartHeight}>
        <AreaChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="salesGradDash" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#FF6B35" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#FF6B35" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--dash-border)" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fill: 'var(--dash-muted)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={fmtAxisARS}
            tick={{ fill: 'var(--dash-muted)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={52}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--dash-border)', strokeWidth: 1 }} />
          <Area
            type="monotone"
            dataKey="total"
            stroke="#FF6B35"
            strokeWidth={2}
            fill="url(#salesGradDash)"
            dot={false}
            activeDot={{ r: 4, fill: '#FF6B35', strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
