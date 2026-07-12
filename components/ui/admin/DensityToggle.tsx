"use client";

import { Rows2, Rows4 } from "lucide-react";
import type { TableDensity } from "@/hooks/useTableDensity";

export function DensityToggle({
  density,
  onToggle,
}: {
  density: TableDensity;
  onToggle: () => void;
}) {
  const isCompact = density === "compact";
  return (
    <button
      onClick={onToggle}
      title={isCompact ? "Vista cómoda" : "Vista compacta"}
      aria-label={
        isCompact ? "Cambiar a vista cómoda" : "Cambiar a vista compacta"
      }
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 34,
        height: 34,
        borderRadius: 8,
        background: "var(--dash-surface-2)",
        border: "1px solid var(--dash-border)",
        color: "var(--dash-muted)",
        cursor: "pointer",
        flexShrink: 0,
        transition: "border-color 0.15s, color 0.15s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--accent)";
        e.currentTarget.style.color = "var(--accent)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--dash-border)";
        e.currentTarget.style.color = "var(--dash-muted)";
      }}
    >
      {isCompact ? <Rows4 size={16} /> : <Rows2 size={16} />}
    </button>
  );
}
