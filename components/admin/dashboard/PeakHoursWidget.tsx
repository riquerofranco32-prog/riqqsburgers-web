"use client";

import { useState } from "react";
import type { Order } from "@/types/supabase";

interface PeakHoursWidgetProps {
  orders: Order[];
}

export function PeakHoursWidget({ orders }: PeakHoursWidgetProps) {
  const [hoveredHour, setHoveredHour] = useState<number | null>(null);

  // ── Data ────────────────────────────────────────────────────────────────────
  const hourCounts = Array(24).fill(0) as number[];
  orders.forEach((o) => {
    if (o.created_at) {
      const h = new Date(o.created_at).getHours();
      hourCounts[h]++;
    }
  });

  const max = Math.max(...hourCounts, 1);
  const totalOrders = hourCounts.reduce((s, c) => s + c, 0);

  // Top 3 hours
  const top3 = [...hourCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .filter(([, c]) => c > 0)
    .map(([h]) => h);

  const amHours = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  const pmHours = [12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23];

  function formatHourLabel(h: number): string {
    const isPm = h >= 12;
    const displayHour = h % 12 === 0 ? 12 : h % 12;
    const period = isPm ? "PM" : "AM";
    return `${displayHour}:00 ${period}`;
  }

  function getRank(h: number): number | null {
    const idx = top3.indexOf(h);
    return idx === -1 ? null : idx + 1;
  }

  // ── Cell styling ─────────────────────────────────────────────────────────
  function getCellStyles(count: number, h: number) {
    const isHovered = hoveredHour === h;
    const rank = getRank(h);

    if (count === 0) {
      return {
        background: isHovered ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.025)",
        border: `1px solid ${isHovered ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.04)"}`,
        boxShadow: "none",
      };
    }

    const intensity = count / max;
    const alpha = 0.12 + intensity * 0.75;
    const isMax = rank === 1;
    const is2nd = rank === 2;
    const is3rd = rank === 3;

    let glowColor = `rgba(255,107,53,${(0.15 + intensity * 0.45).toFixed(2)})`;
    if (isMax) glowColor = "rgba(255,107,53,0.7)";
    if (is2nd) glowColor = "rgba(255,107,53,0.45)";
    if (is3rd) glowColor = "rgba(255,107,53,0.3)";

    return {
      background: `rgba(255, 107, 53, ${alpha.toFixed(2)})`,
      border: `1px solid ${glowColor}`,
      boxShadow: isMax
        ? "0 0 14px rgba(255,107,53,0.5), inset 0 1px 0 rgba(255,255,255,0.1)"
        : is2nd
        ? "0 0 8px rgba(255,107,53,0.3)"
        : is3rd
        ? "0 0 5px rgba(255,107,53,0.2)"
        : "none",
    };
  }

  // ── Cell component ─────────────────────────────────────────────────────────
  function Cell({ h }: { h: number }) {
    const count = hourCounts[h];
    const pct = totalOrders > 0 ? ((count / totalOrders) * 100).toFixed(1) : "0.0";
    const rank = getRank(h);
    const isHovered = hoveredHour === h;
    const isTop = rank !== null && rank <= 3;

    return (
      <div
        key={h}
        onMouseEnter={() => setHoveredHour(h)}
        onMouseLeave={() => setHoveredHour(null)}
        style={{
          aspectRatio: "1",
          borderRadius: 7,
          cursor: count > 0 ? "default" : "default",
          position: "relative",
          transition: "all 0.18s cubic-bezier(0.4, 0, 0.2, 1)",
          transform: isHovered ? "scale(1.22)" : isTop ? "scale(1.04)" : "scale(1)",
          zIndex: isHovered ? 20 : isTop ? 5 : 1,
          ...getCellStyles(count, h),
        }}
      >
        {/* Rank badge */}
        {isTop && !isHovered && rank === 1 && count > 0 && (
          <span
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 8,
              fontWeight: 900,
              color: "rgba(255,255,255,0.85)",
              pointerEvents: "none",
            }}
          >
            #1
          </span>
        )}

        {/* Tooltip */}
        {isHovered && (
          <div
            style={{
              position: "absolute",
              bottom: "140%",
              left: "50%",
              transform: "translateX(-50%)",
              background: "rgba(14, 17, 22, 0.97)",
              backdropFilter: "blur(8px)",
              border: "1px solid rgba(255,107,53,0.25)",
              color: "#fff",
              padding: "10px 14px",
              borderRadius: 10,
              fontSize: 11,
              whiteSpace: "nowrap",
              zIndex: 999,
              pointerEvents: "none",
              boxShadow: "0 8px 24px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,107,53,0.1)",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              gap: 3,
            }}
          >
            <span style={{ fontWeight: 800, color: "#ff6b35", fontSize: 12 }}>
              {formatHourLabel(h)}
            </span>
            <span style={{ color: "var(--dash-text)", fontWeight: 600 }}>
              {count} pedido{count !== 1 ? "s" : ""}
            </span>
            <span style={{ fontSize: 10, color: "var(--dash-muted)" }}>
              {pct}% del total
            </span>
            {rank && rank <= 3 && (
              <span
                style={{
                  marginTop: 2,
                  fontSize: 9,
                  fontWeight: 800,
                  color:
                    rank === 1 ? "#fbbf24" : rank === 2 ? "#94a3b8" : "#b45309",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                {rank === 1 ? "🥇 Hora pico" : rank === 2 ? "🥈 2° lugar" : "🥉 3° lugar"}
              </span>
            )}
            {/* Arrow */}
            <div
              style={{
                position: "absolute",
                top: "100%",
                left: "50%",
                transform: "translateX(-50%)",
                width: 0,
                height: 0,
                borderLeft: "6px solid transparent",
                borderRight: "6px solid transparent",
                borderTop: "6px solid rgba(255,107,53,0.25)",
              }}
            />
          </div>
        )}
      </div>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────────
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
        overflow: "hidden",
      }}
    >
      {/* Subtle bg glow */}
      <div
        style={{
          position: "absolute",
          bottom: -60,
          right: -60,
          width: 200,
          height: 200,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(255,107,53,0.06) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <p
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: "var(--dash-text)",
              marginBottom: 3,
              letterSpacing: "-0.01em",
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

        {/* Top peak summary */}
        {top3.length > 0 && (
          <div
            style={{
              display: "flex",
              gap: 6,
              alignItems: "center",
            }}
          >
            {top3.slice(0, 1).map((h) => (
              <span
                key={h}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#ff6b35",
                  background: "rgba(255,107,53,0.1)",
                  border: "1px solid rgba(255,107,53,0.25)",
                  padding: "4px 9px",
                  borderRadius: 99,
                }}
              >
                🔥 {formatHourLabel(h)}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Heatmap Container */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {/* AM Row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "24px repeat(12, 1fr)",
            gap: 5,
            alignItems: "center",
          }}
        >
          <span
            style={{
              fontSize: 9,
              fontWeight: 800,
              color: "var(--dash-muted)",
              letterSpacing: "0.05em",
            }}
          >
            AM
          </span>
          {amHours.map((h) => (
            <Cell key={h} h={h} />
          ))}
        </div>

        {/* PM Row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "24px repeat(12, 1fr)",
            gap: 5,
            alignItems: "center",
          }}
        >
          <span
            style={{
              fontSize: 9,
              fontWeight: 800,
              color: "var(--dash-muted)",
              letterSpacing: "0.05em",
            }}
          >
            PM
          </span>
          {pmHours.map((h) => (
            <Cell key={h} h={h} />
          ))}
        </div>

        {/* Hour labels */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "24px repeat(12, 1fr)",
            gap: 5,
            marginTop: 2,
          }}
        >
          <div />
          {amHours.map((h) => {
            const displayHour = h % 12 === 0 ? 12 : h % 12;
            return (
              <span
                key={h}
                style={{
                  fontSize: 9,
                  color:
                    hoveredHour === h || hoveredHour === h + 12
                      ? "var(--dash-text)"
                      : "var(--dash-muted)",
                  textAlign: "center",
                  fontWeight: 500,
                  transition: "color 0.15s",
                }}
              >
                {displayHour}
              </span>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginTop: 2,
        }}
      >
        <span style={{ fontSize: 10, color: "var(--dash-muted)", flexShrink: 0 }}>
          Tranquilo
        </span>
        <div
          style={{
            flex: 1,
            height: 5,
            borderRadius: 999,
            background:
              "linear-gradient(90deg, rgba(255,107,53,0.05) 0%, rgba(255,107,53,0.45) 50%, rgba(255,107,53,0.95) 100%)",
            border: "1px solid rgba(255,255,255,0.03)",
          }}
        />
        <span style={{ fontSize: 10, color: "var(--dash-muted)", flexShrink: 0 }}>
          Pico ocupado
        </span>
      </div>
    </div>
  );
}
