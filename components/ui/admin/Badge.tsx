type Tone = "neutral" | "accent" | "success" | "warning" | "danger";

const TONE_STYLE: Record<Tone, React.CSSProperties> = {
  neutral: {
    background: "var(--dash-surface-3)",
    color: "var(--dash-muted)",
    border: "1px solid var(--dash-border)",
  },
  accent: {
    background: "var(--dash-accent-subtle)",
    color: "var(--accent)",
    border: "1px solid var(--dash-accent-glow)",
  },
  success: {
    background: "var(--dash-success-bg)",
    color: "var(--dash-success)",
    border: "1px solid var(--dash-success-border)",
  },
  warning: {
    background: "var(--dash-warning-bg)",
    color: "var(--dash-warning)",
    border: "1px solid var(--dash-warning-border)",
  },
  danger: {
    background: "var(--dash-danger-bg)",
    color: "var(--dash-danger)",
    border: "1px solid var(--dash-danger-border)",
  },
};

/** Pill de estado/plan/badge — reemplaza los ~10 `<span>` con estilos
 * de color hardcodeados repetidos por el admin (PlanCard, banners de
 * plan, filas de producto, etc). */
export function Badge({
  tone = "neutral",
  children,
}: {
  tone?: Tone;
  children: React.ReactNode;
}) {
  return (
    <span
      style={{
        ...TONE_STYLE[tone],
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        fontSize: 11,
        fontWeight: 700,
        padding: "3px 9px",
        borderRadius: "var(--radius-pill)",
        lineHeight: 1.4,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}
