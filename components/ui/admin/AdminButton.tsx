"use client";

type Variant = "primary" | "secondary" | "danger";

const VARIANT_STYLE: Record<Variant, React.CSSProperties> = {
  primary: { background: "var(--accent)", color: "#fff", border: "none" },
  secondary: {
    background: "var(--dash-surface-2)",
    color: "var(--dash-text)",
    border: "1px solid var(--dash-border)",
  },
  danger: {
    background: "rgba(239,68,68,0.12)",
    color: "#f87171",
    border: "1px solid rgba(239,68,68,0.3)",
  },
};

export function AdminButton({
  variant = "primary",
  disabled,
  fullWidth,
  children,
  onClick,
  type = "button",
}: {
  variant?: Variant;
  disabled?: boolean;
  fullWidth?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        ...VARIANT_STYLE[disabled ? "secondary" : variant],
        width: fullWidth ? "100%" : undefined,
        borderRadius: 12,
        padding: "13px 20px",
        fontSize: 15,
        fontWeight: 700,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.6 : 1,
        WebkitTapHighlightColor: "transparent",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        transition: "filter 0.15s, transform 0.15s",
      }}
      onMouseEnter={(e) => {
        if (disabled) return;
        e.currentTarget.style.filter = "brightness(1.1)";
      }}
      onMouseLeave={(e) => {
        if (disabled) return;
        e.currentTarget.style.filter = "none";
      }}
      onMouseDown={(e) => {
        if (disabled) return;
        e.currentTarget.style.transform = "scale(0.98)";
      }}
      onMouseUp={(e) => {
        if (disabled) return;
        e.currentTarget.style.transform = "scale(1)";
      }}
    >
      {children}
    </button>
  );
}
