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
      color: "#f59e0b",
      bg: "rgba(245,158,11,0.1)",
    },
    {
      label: "En Cocina",
      value: active,
      icon: ChefHat,
      color: "#60a5fa",
      bg: "rgba(59,130,246,0.1)",
    },
    {
      label: "Listos",
      value: ready,
      icon: CheckCircle,
      color: "#4ade80",
      bg: "rgba(34,197,94,0.1)",
    },
    {
      label: "Ventas Hoy",
      value: "$ " + todaySales.toLocaleString("es-AR"),
      icon: DollarSign,
      color: "var(--accent, #ff6b35)",
      bg: "rgba(255,107,53,0.1)",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {cards.map(({ label, value, icon: Icon, color, bg }) => (
        <div
          key={label}
          style={{
            background:
              "linear-gradient(145deg, var(--dash-surface, #1e1e1e) 0%, rgba(28,33,40,0.95) 100%)",
            border: "1px solid var(--dash-border, rgba(255,255,255,0.08))",
            borderTop: `2px solid ${color}`,
            borderRadius: 12,
            padding: 16,
            display: "flex",
            alignItems: "center",
            gap: 12,
            boxShadow: "0 4px 12px rgba(0,0,0,0.18)",
            transition: "transform 0.15s ease, box-shadow 0.15s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.25)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.18)";
          }}
        >
          <div
            style={{
              background: bg,
              padding: 9,
              borderRadius: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Icon style={{ color, width: 18, height: 18 }} />
          </div>
          <div style={{ minWidth: 0 }}>
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
