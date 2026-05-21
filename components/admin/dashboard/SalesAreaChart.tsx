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
    <div className="bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 shadow-xl">
      <p className="text-[11px] text-zinc-400 mb-1">{label}</p>
      <p className="text-sm font-mono font-medium text-yellow-400">
        {'$' + (payload[0].value ?? 0).toLocaleString('es-AR')}
      </p>
    </div>
  )
}

interface SalesAreaChartProps {
  data: DailyRevenue[]
  loading?: boolean
}

export function SalesAreaChart({ data, loading = false }: SalesAreaChartProps) {
  if (loading) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
        <div className="h-2.5 w-44 bg-zinc-800 rounded animate-pulse mb-5" />
        <div className="h-[220px] bg-zinc-800/60 rounded-xl animate-pulse" />
      </div>
    )
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
      <p className="text-[11px] uppercase tracking-wider text-zinc-400 font-medium mb-5">
        Ventas últimos 7 días
      </p>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 5, right: 4, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="salesGradDash" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#facc15" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#facc15" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fill: '#71717a', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={fmtAxisARS}
            tick={{ fill: '#71717a', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={52}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#3f3f46', strokeWidth: 1 }} />
          <Area
            type="monotone"
            dataKey="total"
            stroke="#facc15"
            strokeWidth={2}
            fill="url(#salesGradDash)"
            dot={false}
            activeDot={{ r: 4, fill: '#facc15', strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
