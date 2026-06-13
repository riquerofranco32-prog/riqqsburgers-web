"use client";

import { useState } from "react";
import type { Order } from "@/types/supabase";

interface PeakHoursWidgetProps {
  orders: Order[];
}

export function PeakHoursWidget({ orders }: PeakHoursWidgetProps) {
  const [hoveredHour, setHoveredHour] = useState<number | null>(null);

  // Calcular conteo por hora
  const hourCounts = Array(24).fill(0) as number[];
  orders.forEach((o) => {
    if (o.created_at) {
      const h = new Date(o.created_at).getHours();
      hourCounts[h]++;
    }
  });

  const max = Math.max(...hourCounts, 1);
  const totalOrders = hourCounts.reduce((s, c) => s + c, 0);

  const amHours = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  const pmHours = [12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23];

  function formatHourLabel(h: number): string {
    const isPm = h >= 12;
    const displayHour = h % 12 === 0 ? 12 : h % 12;
    const period = isPm ? "PM" : "AM";
    return `${displayHour}:00 ${period}`;
  }

  function getCellStyles(count: number) {
    if (count === 0) {
      return {
        background: "rgba(255, 255, 255, 0.03)",
        border: "1px solid rgba(255, 255, 255, 0.05)",
        boxShadow: "none",
      };
    }
    const intensity = count / max;
    const alpha = 0.15 + intensity * 0.7; // 0.15 a 0.85
    const isMax = count === max;
    return {
      background: `rgba(255, 107, 53, ${alpha.toFixed(2)})`,
      border: `1px solid rgba(255, 107, 53, ${(0.2 + intensity * 0.5).toFixed(2)})`,
      boxShadow: isMax ? "0 0 10px rgba(255, 107, 53, 0.4)" : "none",
    };
  }

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
        gap: 18,
        position: "relative",
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
            ? `Basado en ${totalOrders} pedido${totalOrders !== 1 ? "s" : ""} de los últimos 8 días`
            : "Sin pedidos registrados en la última semana"}
        </p>
      </div>

      {/* Heatmap Container */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {/* AM Row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "24px repeat(12, 1fr)",
            gap: 6,
            alignItems: "center",
          }}
        >
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: "var(--dash-muted)",
              textAlign: "left",
            }}
          >
            AM
          </span>
          {amHours.map((h) => {
            const count = hourCounts[h];
            const pct = totalOrders > 0 ? ((count / totalOrders) * 100).toFixed(1) : "0.0";
            return (
              <div
                key={h}
                onMouseEnter={() => setHoveredHour(h)}
                onMouseLeave={() => setHoveredHour(null)}
                style={{
                  aspectRatio: "1",
                  borderRadius: 6,
                  cursor: "default",
                  position: "relative",
                  transition: "all 0.15s cubic-bezier(0.4, 0, 0.2, 1)",
                  transform: hoveredHour === h ? "scale(1.18)" : "scale(1)",
                  zIndex: hoveredHour === h ? 10 : 1,
                  ...getCellStyles(count),
                }}
              >
                {/* Custom absolute Tooltip */}
                {hoveredHour === h && (
                  <div
                    style={{
                      position: "absolute",
                      bottom: "135%",
                      left: "50%",
                      transform: "translateX(-50%)",
                      background: "rgba(18, 18, 18, 0.95)",
                      backdropFilter: "blur(6px)",
                      border: "1px solid var(--dash-border)",
                      color: "#fff",
                      padding: "8px 12px",
                      borderRadius: 8,
                      fontSize: 11,
                      whiteSpace: "nowrap",
                      zIndex: 999,
                      pointerEvents: "none",
                      boxShadow: "0 6px 20px rgba(0,0,0,0.45)",
                      textAlign: "center",
                      display: "flex",
                      flexDirection: "column",
                      gap: 2,
                    }}
                  >
                    <span style={{ fontWeight: 700, color: "var(--accent)" }}>
                      {formatHourLabel(h)}
                    </span>
                    <span style={{ color: "var(--dash-text)", fontWeight: 500 }}>
                      {count} pedido{count !== 1 ? "s" : ""}
                    </span>
                    <span style={{ fontSize: 9, color: "var(--dash-muted)" }}>
                      {pct}% del total
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* PM Row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "24px repeat(12, 1fr)",
            gap: 6,
            alignItems: "center",
          }}
        >
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: "var(--dash-muted)",
              textAlign: "left",
            }}
          >
            PM
          </span>
          {pmHours.map((h) => {
            const count = hourCounts[h];
            const pct = totalOrders > 0 ? ((count / totalOrders) * 100).toFixed(1) : "0.0";
            return (
              <div
                key={h}
                onMouseEnter={() => setHoveredHour(h)}
                onMouseLeave={() => setHoveredHour(null)}
                style={{
                  aspectRatio: "1",
                  borderRadius: 6,
                  cursor: "default",
                  position: "relative",
                  transition: "all 0.15s cubic-bezier(0.4, 0, 0.2, 1)",
                  transform: hoveredHour === h ? "scale(1.18)" : "scale(1)",
                  zIndex: hoveredHour === h ? 10 : 1,
                  ...getCellStyles(count),
                }}
              >
                {/* Custom absolute Tooltip */}
                {hoveredHour === h && (
                  <div
                    style={{
                      position: "absolute",
                      bottom: "135%",
                      left: "50%",
                      transform: "translateX(-50%)",
                      background: "rgba(18, 18, 18, 0.95)",
                      backdropFilter: "blur(6px)",
                      border: "1px solid var(--dash-border)",
                      color: "#fff",
                      padding: "8px 12px",
                      borderRadius: 8,
                      fontSize: 11,
                      whiteSpace: "nowrap",
                      zIndex: 999,
                      pointerEvents: "none",
                      boxShadow: "0 6px 20px rgba(0,0,0,0.45)",
                      textAlign: "center",
                      display: "flex",
                      flexDirection: "column",
                      gap: 2,
                    }}
                  >
                    <span style={{ fontWeight: 700, color: "var(--accent)" }}>
                      {formatHourLabel(h)}
                    </span>
                    <span style={{ color: "var(--dash-text)", fontWeight: 500 }}>
                      {count} pedido{count !== 1 ? "s" : ""}
                    </span>
                    <span style={{ fontSize: 9, color: "var(--dash-muted)" }}>
                      {pct}% del total
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Labels Row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "24px repeat(12, 1fr)",
            gap: 6,
            marginTop: 4,
          }}
        >
          <div /> {/* Spacing label header */}
          {amHours.map((h) => {
            const displayHour = h % 12 === 0 ? 12 : h % 12;
            return (
              <span
                key={h}
                style={{
                  fontSize: 9,
                  color: "var(--dash-muted)",
                  textAlign: "center",
                  fontWeight: 500,
                }}
              >
                {displayHour}
              </span>
            );
          })}
        </div>
      </div>

      {/* Legend & Guide */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginTop: 4,
        }}
      >
        <span
          style={{ fontSize: 10, color: "var(--dash-muted)", flexShrink: 0 }}
        >
          Tranquilo
        </span>
        <div
          style={{
            flex: 1,
            height: 6,
            borderRadius: 999,
            background:
              "linear-gradient(90deg, rgba(255,107,53,0.05) 0%, rgba(255,107,53,0.45) 50%, rgba(255,107,53,0.95) 100%)",
            border: "1px solid rgba(255,255,255,0.03)",
          }}
        />
        <span
          style={{ fontSize: 10, color: "var(--dash-muted)", flexShrink: 0 }}
        >
          Pico ocupado
        </span>
      </div>
    </div>
  );
}
