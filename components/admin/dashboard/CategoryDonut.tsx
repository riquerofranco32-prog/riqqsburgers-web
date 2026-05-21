'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import type { CategoryRevenue } from '@/types/dashboard'

function fmtARS(n: number) {
  return '$' + n.toLocaleString('es-AR')
}

type PayloadEntry = {
  name: string
  value: number
  total: number
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: { payload: PayloadEntry; value?: number }[] }) {
  if (!active || !payload?.length) return null
  const item = payload[0].payload
  const pct = item.total > 0 ? Math.round((item.value / item.total) * 100) : 0
  return (
    <div className="bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 shadow-xl">
      <p className="text-[11px] text-zinc-400 mb-1">{item.name}</p>
      <p className="text-sm font-mono font-medium text-zinc-100">{fmtARS(item.value)}</p>
      <p className="text-[11px] text-zinc-500 mt-0.5">{pct}% del total</p>
    </div>
  )
}

interface CategoryDonutProps {
  data: CategoryRevenue[]
  loading?: boolean
}

export function CategoryDonut({ data, loading = false }: CategoryDonutProps) {
  if (loading) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
        <div className="h-2.5 w-44 bg-zinc-800 rounded animate-pulse mb-5" />
        <div className="flex items-center gap-5">
          <div className="w-[160px] h-[160px] rounded-full bg-zinc-800 animate-pulse flex-shrink-0" />
          <div className="flex-1 flex flex-col gap-3">
            {[0, 1, 2].map(i => (
              <div key={i} className="h-3.5 bg-zinc-800 rounded animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex flex-col items-center justify-center min-h-[240px]">
        <p className="text-zinc-600 text-sm">Sin datos de ventas</p>
      </div>
    )
  }

  const total = data.reduce((s, d) => s + d.value, 0)
  const dominant = data[0]
  const domPct = total > 0 ? Math.round((dominant.value / total) * 100) : 0
  const enriched = data.map(d => ({ ...d, total }))

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
      <p className="text-[11px] uppercase tracking-wider text-zinc-400 font-medium mb-5">
        Ventas por categoría
      </p>
      <div className="flex items-center gap-5">
        {/* Donut */}
        <div className="relative flex-shrink-0" style={{ width: 220, height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={enriched}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={100}
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
          {/* Center label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-[22px] font-mono font-bold text-zinc-50 leading-none">
              {domPct}%
            </span>
            <span className="text-[10px] text-zinc-500 mt-1 max-w-[70px] text-center leading-tight">
              {dominant.name}
            </span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex-1 flex flex-col gap-3 min-w-0">
          {data.map(item => {
            const pct = total > 0 ? Math.round((item.value / total) * 100) : 0
            return (
              <div key={item.name} className="flex items-center gap-2 min-w-0">
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: item.color }}
                />
                <span className="text-xs text-zinc-400 flex-1 truncate">{item.name}</span>
                <span className="text-xs font-mono text-zinc-300 flex-shrink-0">{pct}%</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
