import type { TopProduct } from '@/types/dashboard'

function fmtARS(n: number) {
  return '$' + n.toLocaleString('es-AR')
}

function fallbackEmoji(categoryName: string | null): string {
  if (!categoryName) return '🍔'
  const lower = categoryName.toLowerCase()
  if (lower.includes('burger') || lower.includes('hambur')) return '🍔'
  if (lower.includes('beb') || lower.includes('drink') || lower.includes('gase')) return '🥤'
  if (lower.includes('promo') || lower.includes('combo')) return '🔥'
  if (lower.includes('papa') || lower.includes('frit')) return '🍟'
  if (lower.includes('postre')) return '🍰'
  return '🍽️'
}

interface TopProductsListProps {
  products: TopProduct[]
  loading?: boolean
}

export function TopProductsList({ products, loading = false }: TopProductsListProps) {
  if (loading) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
        <div className="h-2.5 w-40 bg-zinc-800 rounded animate-pulse mb-6" />
        <div className="flex flex-col gap-5">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-zinc-800 animate-pulse flex-shrink-0" />
              <div className="flex-1 flex flex-col gap-2">
                <div className="h-2.5 w-28 bg-zinc-800 rounded animate-pulse" />
                <div className="h-1.5 w-full bg-zinc-800 rounded-full animate-pulse" />
              </div>
              <div className="flex flex-col gap-1.5 items-end">
                <div className="h-2.5 w-16 bg-zinc-800 rounded animate-pulse" />
                <div className="h-2 w-10 bg-zinc-800 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex flex-col items-center justify-center min-h-[200px]">
        <p className="text-zinc-600 text-sm">Sin datos esta semana</p>
      </div>
    )
  }

  const maxQty = products[0].quantity

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
      <p className="text-[11px] uppercase tracking-wider text-zinc-400 font-medium mb-6">
        Top productos — 7 días
      </p>
      <div className="flex flex-col gap-5">
        {products.map((product, i) => {
          const pct = maxQty > 0 ? (product.quantity / maxQty) * 100 : 0
          const emoji = product.category_emoji ?? fallbackEmoji(product.category_name)

          return (
            <div key={product.product_id} className="flex items-center gap-3">
              {/* Avatar */}
              <div className="relative w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-lg flex-shrink-0">
                <span>{emoji}</span>
                {i === 0 && (
                  <span className="absolute -top-1 -right-1 text-[10px] leading-none">👑</span>
                )}
              </div>

              {/* Name + bar */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-200 truncate">{product.name}</p>
                {product.category_name && (
                  <p className="text-[10px] text-zinc-600 mt-0.5">{product.category_name}</p>
                )}
                <div className="mt-1.5 h-1.5 bg-yellow-400/15 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-400 rounded-full"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>

              {/* Metrics */}
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-mono text-zinc-200">{fmtARS(product.revenue)}</p>
                <p className="text-[11px] text-zinc-500 mt-0.5">{product.quantity} uds</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
