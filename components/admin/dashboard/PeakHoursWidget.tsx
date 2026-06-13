"use client";

import type { Order } from "@/types/supabase";

interface PeakHoursWidgetProps {
  orders: Order[];
}

export function PeakHoursWidget({ orders }: PeakHoursWidgetProps) {
  // Calcular conteo por hora
  const hourCounts = Array(24).fill(0) as number[];
  orders.forEach((o) => {
    const h = new Date(o.created_at).getHours();
    hourCounts[h]++;
  });
  const max = Math.max(...hourCounts, 1);

  // Filas de 6 horas: 0-5, 6-11, 12-17, 18-23
  const rows = [
    [0, 1, 2, 3, 4, 5],
    [6, 7, 8, 9, 10, 11],
    [12, 13, 14, 15, 16, 17],
    [18, 19, 20, 21, 22, 23],
  ];

  function cellBg(count: number): string {
    const intensity = count / max;
    const alpha = 0.05 + intensity * 0.8;
    return `rgba(255,107,53,${alpha.toFixed(2)})`;
  }

  function formatHour(h: number): string {
    return `${h.toString().padStart(2, "0")}hs`;
  }

  const totalOrders = hourCounts.reduce((s, c) => s + c, 0);

  return (
    <div
      style={{
        background:
          "linear-gradient(145deg, var(--dash-surface) 0%, rgba(28,33,40,0.95) 100%)",
        border: "1px solid var(--dash-border)",
        borderRadius: 16,
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      {/* Header */}
      <div>
        <p
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: "var(--dash-text)",
            marginBottom: 2,
          }}
        >
          Horas pico
        </p>
        <p style={{ fontSize: 12, color: "var(--dash-muted)" }}>
          {totalOrders > 0
            ? `Basado en ${totalOrders} pedido${totalOrders !== 1 ? "s" : ""} del historial`
            : "Sin pedidos registrados aún"}
        </p>
      </div>

      {/* Grid 4×6 */}
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {rows.map((row, ri) => (
          <div
            key={ri}
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(6, 1fr)",
              gap: 4,
            }}
          >
            {row.map((h) => (
              <div
                key={h}
                title={`${formatHour(h)}: ${hourCounts[h]} pedido${hourCounts[h] !== 1 ? "s" : ""}`}
                style={{
                  aspectRatio: "1",
                  borderRadius: 4,
                  background: cellBg(hourCounts[h]),
                  border: "1px solid rgba(255,107,53,0.1)",
                  cursor: "default",
                  position: "relative",
                  transition: "transform 0.1s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "scale(1.15)";
                  e.currentTarget.style.zIndex = "1";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.zIndex = "0";
                }}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Etiquetas de hora — primera y última de cada fila */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 4,
        }}
      >
        {[0, 6, 12, 18].map((h) => (
          <span
            key={h}
            style={{
              fontSize: 10,
              color: "var(--dash-muted)",
              textAlign: "center",
            }}
          >
            {formatHour(h)}
          </span>
        ))}
      </div>

      {/* Leyenda gradiente */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginTop: -4,
        }}
      >
        <span
          style={{ fontSize: 10, color: "var(--dash-muted)", flexShrink: 0 }}
        >
          Más tranquilo
        </span>
        <div
          style={{
            flex: 1,
            height: 6,
            borderRadius: 999,
            background:
              "linear-gradient(90deg, rgba(255,107,53,0.05), rgba(255,107,53,0.85))",
          }}
        />
        <span
          style={{ fontSize: 10, color: "var(--dash-muted)", flexShrink: 0 }}
        >
          Más ocupado
        </span>
      </div>
    </div>
  );
}
