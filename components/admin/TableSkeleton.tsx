/**
 * Skeleton "fantasma" para tablas/listas del admin mientras se resuelve el
 * fetch inicial (route-level loading.tsx). Puramente presentacional — sin
 * estado, se puede usar desde un server component.
 */
export default function TableSkeleton({
  rows = 6,
  columns = 4,
  className = "",
}: {
  rows?: number;
  columns?: number;
  className?: string;
}) {
  return (
    <div
      className={`overflow-hidden rounded-2xl ${className}`}
      style={{
        background: "var(--dash-surface)",
        border: "1px solid var(--dash-border)",
      }}
      aria-hidden="true"
    >
      {Array.from({ length: rows }).map((_, r) => (
        <div
          key={r}
          className="flex items-center gap-4 px-5 py-4"
          style={{
            borderBottom:
              r === rows - 1 ? "none" : "1px solid var(--dash-border)",
          }}
        >
          {Array.from({ length: columns }).map((_, c) => (
            <div
              key={c}
              className="h-3 animate-pulse rounded-md"
              style={{
                background: "var(--dash-surface-2)",
                width: c === 0 ? "30%" : `${60 / columns}%`,
                flexShrink: 0,
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
