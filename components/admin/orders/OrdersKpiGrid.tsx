"use client";

import { Clock, ChefHat, CheckCircle, DollarSign } from "lucide-react";

export function OrdersKpiGrid({
  pending,
  active,
  ready,
  todaySales,
}: {
  pending: number;
  active: number;
  ready: number;
  todaySales: number;
}) {
  const cards = [
    {
      label: "Pendientes",
      value: pending,
      icon: Clock,
      color: "var(--dash-warning)",
      bg: "var(--dash-warning-bg)",
    },
    {
      label: "En Cocina",
      value: active,
      icon: ChefHat,
      color: "var(--dash-info)",
      bg: "var(--dash-info-bg)",
    },
    {
      label: "Listos",
      value: ready,
      icon: CheckCircle,
      color: "var(--dash-success)",
      bg: "var(--dash-success-bg)",
    },
    {
      label: "Ventas Hoy",
      value: "$ " + todaySales.toLocaleString("es-AR"),
      icon: DollarSign,
      color: "var(--accent, #ff6b35)",
      bg: "var(--dash-accent-subtle)",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {cards.map(({ label, value, icon: Icon, color, bg }) => (
        <div
          key={label}
          className="order-kpi-card"
          style={{
            position: "relative",
            overflow: "hidden",
            background:
              "linear-gradient(145deg, var(--dash-surface, #1e1e1e) 0%, rgba(28,33,40,0.95) 100%)",
            border: "1px solid var(--dash-border, rgba(255,255,255,0.08))",
            borderTop: `2px solid ${color}`,
            borderRadius: 12,
            padding: 16,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.setProperty("--spot-o", "1");
          }}
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            e.currentTarget.style.setProperty(
              "--spot-x",
              `${e.clientX - rect.left}px`,
            );
            e.currentTarget.style.setProperty(
              "--spot-y",
              `${e.clientY - rect.top}px`,
            );
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.setProperty("--spot-o", "0");
          }}
        >
          {/* Spotlight que sigue el cursor — ponytail: JS solo mueve custom
              properties, el radial-gradient vive en CSS puro sin re-render */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "inherit",
              pointerEvents: "none",
              opacity: "var(--spot-o, 0)",
              transition: "opacity 0.2s ease",
              background: `radial-gradient(160px circle at var(--spot-x, 50%) var(--spot-y, 50%), ${color}22, transparent 70%)`,
            }}
          />
          <div
            style={{
              background: bg,
              padding: 9,
              borderRadius: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              position: "relative",
            }}
          >
            <Icon style={{ color, width: 18, height: 18 }} />
          </div>
          <div style={{ minWidth: 0, position: "relative" }}>
            <p
              style={{
                margin: 0,
                fontSize: 11,
                color: "var(--dash-muted, #888)",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              {label}
            </p>
            <p
              style={{
                margin: 0,
                fontSize: 20,
                fontWeight: 800,
                color: "var(--dash-text, #fff)",
                fontFamily: "var(--font-mono, monospace)",
                fontVariantNumeric: "tabular-nums",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {value}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
