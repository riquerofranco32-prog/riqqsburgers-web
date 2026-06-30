import { useState, useEffect } from "react";
import type { TopProduct } from "@/types/dashboard";

function fmtARS(n: number) {
  return "$" + n.toLocaleString("es-AR");
}

function fallbackEmoji(categoryName: string | null): string {
  if (!categoryName) return "🍔";
  const lower = categoryName.toLowerCase();
  if (lower.includes("burger") || lower.includes("hambur")) return "🍔";
  if (
    lower.includes("beb") ||
    lower.includes("drink") ||
    lower.includes("gase")
  )
    return "🥤";
  if (lower.includes("promo") || lower.includes("combo")) return "🔥";
  if (lower.includes("papa") || lower.includes("frit")) return "🍟";
  if (lower.includes("postre")) return "🍰";
  return "🍽️";
}

interface TopProductsListProps {
  products: TopProduct[];
  loading?: boolean;
  showRevenue?: boolean;
}

export function TopProductsList({
  products,
  loading = false,
  showRevenue = true,
}: TopProductsListProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 80);
    return () => clearTimeout(t);
  }, []);

  if (loading) {
    return (
      <div className="bg-dash-surface border border-dash-border rounded-2xl p-5">
        <div className="h-2.5 w-40 bg-dash-surface-2 rounded animate-pulse mb-6" />
        <div className="flex flex-col gap-5">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-dash-surface-2 animate-pulse flex-shrink-0" />
              <div className="flex-1 flex flex-col gap-2">
                <div className="h-2.5 w-28 bg-dash-surface-2 rounded animate-pulse" />
                <div className="h-1.5 w-full bg-dash-surface-2 rounded-full animate-pulse" />
              </div>
              <div className="flex flex-col gap-1.5 items-end">
                <div className="h-2.5 w-16 bg-dash-surface-2 rounded animate-pulse" />
                <div className="h-2 w-10 bg-dash-surface-2 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="bg-dash-surface border border-dash-border rounded-2xl p-5 flex flex-col items-center justify-center min-h-[200px]">
        <p className="text-dash-muted text-sm">Sin datos esta semana</p>
      </div>
    );
  }

  const maxQty = products[0].quantity;

  return (
    <div className="bg-dash-surface border border-dash-border rounded-2xl p-5">
      <p className="text-[11px] uppercase tracking-wider text-dash-muted font-medium mb-6">
        Top productos — 7 días
      </p>
      <div className="flex flex-col gap-5">
        {products.map((product, i) => {
          const pct = maxQty > 0 ? (product.quantity / maxQty) * 100 : 0;
          const emoji =
            product.category_emoji ?? fallbackEmoji(product.category_name);

          return (
            <div key={product.product_id} className="flex items-center gap-3">
              {/* Avatar */}
              <div className="relative w-10 h-10 rounded-full bg-dash-surface-2 border border-dash-border flex items-center justify-center text-lg flex-shrink-0">
                <span>{emoji}</span>
                {i === 0 && (
                  <span className="absolute -top-1 -right-1 text-[10px] leading-none">
                    👑
                  </span>
                )}
              </div>

              {/* Name + bar */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-dash-text truncate">
                  {product.name}
                </p>
                {product.category_name && (
                  <p className="text-[10px] text-dash-muted mt-0.5">
                    {product.category_name}
                  </p>
                )}
                <div
                  className="mt-1.5 h-1.5 rounded-full overflow-hidden"
                  style={{ background: "rgba(255,107,53,0.15)" }}
                >
                  <div
                    className="h-full bg-accent rounded-full"
                    style={{
                      width: mounted ? `${pct}%` : "0%",
                      transition: `width 0.7s cubic-bezier(0.22,1,0.36,1) ${i * 80}ms`,
                    }}
                  />
                </div>
              </div>

              {/* Metrics */}
              <div className="text-right flex-shrink-0">
                {showRevenue && (
                  <p className="text-sm font-mono text-dash-text">
                    {fmtARS(product.revenue)}
                  </p>
                )}
                <p
                  className={`text-[11px] text-dash-muted ${showRevenue ? "mt-0.5" : ""}`}
                >
                  {product.quantity} uds
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
