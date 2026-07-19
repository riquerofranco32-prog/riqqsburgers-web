/** Contenedor base del admin — reemplaza el `div` con
 * `border/borderRadius/background` hand-rolleado que se repite en
 * PlanCard, CategoriesAdmin, OrdersTable, etc. cada uno con su propio
 * radio (6/8/9/10/12/14/16px sueltos). */
export function Card({
  children,
  padding = 20,
  accent = false,
  className,
}: {
  children: React.ReactNode;
  padding?: number | string;
  /** Borde con el color de marca en vez del borde neutro — para destacar (ej. plan actual). */
  accent?: boolean;
  className?: string;
}) {
  return (
    <div
      className={className}
      style={{
        background: "var(--dash-surface)",
        border: `1px solid ${accent ? "var(--dash-accent-glow)" : "var(--dash-border)"}`,
        borderRadius: "var(--radius-lg)",
        padding,
      }}
    >
      {children}
    </div>
  );
}
