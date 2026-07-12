import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  /** "dashed" para listas de gestión (categorías, productos), "solid" para tablas/paneles */
  variant?: "dashed" | "solid";
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  variant = "solid",
}: EmptyStateProps) {
  return (
    <div
      style={{
        background: "var(--dash-surface)",
        border: `1px ${variant === "dashed" ? "dashed" : "solid"} var(--dash-border)`,
        borderRadius: 16,
        padding: "56px 20px",
        textAlign: "center",
        color: "var(--dash-muted)",
      }}
    >
      <Icon
        style={{ width: 32, height: 32, margin: "0 auto 12px", opacity: 0.5 }}
      />
      <p
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: "var(--dash-text)",
          marginBottom: description ? 4 : 0,
        }}
      >
        {title}
      </p>
      {description && (
        <p style={{ fontSize: 13, maxWidth: 360, margin: "0 auto" }}>
          {description}
        </p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          style={{
            marginTop: 20,
            padding: "9px 18px",
            borderRadius: 9999,
            background: "var(--accent)",
            color: "#fff",
            fontSize: 13,
            fontWeight: 700,
            border: "none",
            cursor: "pointer",
          }}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
