import { type LucideIcon } from 'lucide-react'

interface KPICardProps {
  label: string
  value: string
  change?: number | null
  changeLabel?: string
  icon: LucideIcon
  loading?: boolean
}

export function KPICard({ label, value, change, changeLabel, icon: Icon, loading = false }: KPICardProps) {
  if (loading) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex flex-col gap-4">
        <div className="flex items-start justify-between">
          <div className="h-2.5 w-24 bg-zinc-800 rounded animate-pulse" />
          <div className="h-4 w-4 bg-zinc-800 rounded animate-pulse" />
        </div>
        <div className="h-7 w-28 bg-zinc-800 rounded animate-pulse" />
        <div className="h-5 w-16 bg-zinc-800 rounded-full animate-pulse" />
      </div>
    )
  }

  const isPositive = change !== null && change !== undefined && change > 0
  const isNegative = change !== null && change !== undefined && change < 0
  const hasChange = change !== null && change !== undefined

  const badgeClass = isPositive
    ? 'bg-green-400/10 text-green-400'
    : isNegative
    ? 'bg-red-400/10 text-red-400'
    : 'bg-zinc-800 text-zinc-500'

  const arrow = isPositive ? '↑' : isNegative ? '↓' : ''
  const sign = isPositive ? '+' : ''
  const badgeText = hasChange ? `${arrow} ${sign}${change.toFixed(1)}%` : '—'

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex flex-col gap-4 transition-colors duration-150 hover:border-zinc-700">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] uppercase tracking-wider text-zinc-400 font-medium leading-none">
          {label}
        </p>
        <Icon className="w-4 h-4 text-zinc-600 flex-shrink-0 mt-0.5" />
      </div>

      <p className="text-[26px] font-mono font-medium text-zinc-50 leading-none tracking-tight">
        {value}
      </p>

      <div className={`self-start flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${badgeClass}`}>
        <span>{badgeText}</span>
        {hasChange && changeLabel && (
          <span className="opacity-60">{changeLabel}</span>
        )}
      </div>
    </div>
  )
}
