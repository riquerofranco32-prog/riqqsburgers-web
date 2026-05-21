'use client'

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { salesLast7Days } from '@/lib/mockData'

function fmtARS(n: number) {
  return '$ ' + n.toLocaleString('es-AR')
}

export function SalesChart() {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
      <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-4">Ventas últimos 7 días</p>
      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={salesLast7Days} margin={{ top: 5, right: 4, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#FACC15" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#FACC15" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
          <XAxis dataKey="dia" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis hide />
          <Tooltip
            contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 12, padding: '8px 12px' }}
            labelStyle={{ color: '#a1a1aa', fontSize: 11, marginBottom: 4 }}
            formatter={(v) => [fmtARS(Number(v)), 'Ventas']}
            itemStyle={{ color: '#FACC15', fontSize: 13, fontWeight: 700 }}
          />
          <Area
            type="monotone"
            dataKey="total"
            stroke="#FACC15"
            strokeWidth={2}
            fill="url(#salesGrad)"
            dot={false}
            activeDot={{ r: 4, fill: '#FACC15', strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
