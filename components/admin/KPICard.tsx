import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface KPICardProps {
  title: string
  value: string
  delta?: string
  deltaType?: 'up' | 'down' | 'neutral'
  accent?: boolean
  sub?: string
}

export function KPICard({ title, value, delta, deltaType = 'neutral', accent = false, sub }: KPICardProps) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
      <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-3">{title}</p>
      <p className={`text-2xl font-bold font-[family-name:var(--font-syne)] leading-tight ${accent ? 'text-yellow-400' : 'text-white'}`}>
        {value}
      </p>
      {sub && <p className="text-xs text-zinc-600 mt-1 truncate">{sub}</p>}
      {delta && (
        <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${
          deltaType === 'up' ? 'text-emerald-400' : deltaType === 'down' ? 'text-red-400' : 'text-zinc-600'
        }`}>
          {deltaType === 'up' ? <TrendingUp className="w-3.5 h-3.5" /> : deltaType === 'down' ? <TrendingDown className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
          <span>{delta} vs ayer</span>
        </div>
      )}
    </div>
  )
}
