import { type LucideIcon } from 'lucide-react'

interface KPICardProps {
  label: string
  value: string
  change?: number | null
  changeLabel?: string
  sub?: string
  icon: LucideIcon
  loading?: boolean
}

export function KPICard({ label, value, change, changeLabel, sub, icon: Icon, loading = false }: KPICardProps) {
  if (loading) {
    return (
      <div className="bg-dash-surface border border-dash-border rounded-2xl p-5 flex flex-col gap-4">
        <div className="flex items-start justify-between">
          <div className="h-2.5 w-24 bg-dash-surface-2 rounded animate-pulse" />
          <div className="h-4 w-4 bg-dash-surface-2 rounded animate-pulse" />
        </div>
        <div className="h-7 w-28 bg-dash-surface-2 rounded animate-pulse" />
        <div className="h-4 w-20 bg-dash-surface-2 rounded animate-pulse" />
      </div>
    )
  }

  const isPositive = change !== null && change !== undefined && change > 0
  const isNegative = change !== null && change !== undefined && change < 0
  const hasChange = change !== null && change !== undefined

  return (
    <div className="bg-dash-surface border border-dash-border rounded-2xl p-5 flex flex-col gap-3 transition-colors duration-150 hover:border-accent/30 min-h-[120px]">

      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] uppercase tracking-wider text-dash-muted font-medium leading-none">
          {label}
        </p>
        <Icon className="w-4 h-4 text-dash-muted/40 flex-shrink-0 mt-0.5" />
      </div>

      {/* Value */}
      <p className="text-[26px] font-mono font-semibold text-dash-text leading-none tracking-tight truncate">
        {value}
      </p>

      {/* Footer: change badge OR sub text */}
      {hasChange ? (
        <div className={`self-start flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
          isPositive
            ? 'bg-green-400/10 text-green-400'
            : isNegative
            ? 'bg-red-400/10 text-red-400'
            : 'bg-dash-surface-2 text-dash-muted'
        }`}>
          <span>{isPositive ? '↑' : '↓'} {isPositive ? '+' : ''}{change.toFixed(1)}%</span>
          {changeLabel && <span className="opacity-60 ml-0.5">{changeLabel}</span>}
        </div>
      ) : sub ? (
        <p className="text-[11px] text-dash-muted/60 leading-none truncate">{sub}</p>
      ) : null}

    </div>
  )
}
