'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { categorySales } from '@/lib/mockData'

function fmtARS(n: number) {
  return '$ ' + n.toLocaleString('es-AR')
}

export function CategoryChart() {
  const total = categorySales.reduce((sum, c) => sum + c.value, 0)

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
      <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-4">Ventas por categoría</p>
      <div className="flex items-center gap-4">
        <ResponsiveContainer width="50%" height={140}>
          <PieChart>
            <Pie
              data={categorySales}
              cx="50%"
              cy="50%"
              innerRadius={45}
              outerRadius={65}
              dataKey="value"
              strokeWidth={0}
            >
              {categorySales.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 12, padding: '6px 10px' }}
              formatter={(v) => [fmtARS(Number(v))]}
              itemStyle={{ color: '#fff', fontSize: 12, fontWeight: 600 }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex-1 flex flex-col gap-2.5">
          {categorySales.map(item => (
            <div key={item.name} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: item.color }} />
                <span className="text-xs text-zinc-400">{item.name}</span>
              </div>
              <span className="text-xs text-zinc-300 font-semibold">{Math.round(item.value / total * 100)}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
