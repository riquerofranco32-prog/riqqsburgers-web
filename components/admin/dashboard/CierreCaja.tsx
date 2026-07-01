"use client";

import { useEffect, useState } from "react";

interface CajaData {
  fecha: string;
  total: number;
  efectivo: number;
  transferencia: number;
  delivery: number;
  retiro: number;
  cantidad: number;
  cancelados: number;
  vs_ayer: { total: number; cantidad: number };
}

function fmt(n: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(n);
}

function pct(part: number, total: number) {
  if (total === 0) return "0%";
  return `${Math.round((part / total) * 100)}%`;
}

function changePct(current: number, prev: number): string | null {
  if (prev === 0) return null;
  const delta = ((current - prev) / prev) * 100;
  const sign = delta >= 0 ? "↑" : "↓";
  return `${sign} ${Math.abs(Math.round(delta))}% vs ayer`;
}

export default function CierreCaja({ slug }: { slug: string }) {
  const [data, setData] = useState<CajaData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetch(`/api/${slug}/admin/caja`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: CajaData | null) => setData(d))
      .finally(() => setLoading(false));
  }, [slug]);

  function handleShare() {
    if (!data) return;
    const text =
      `📊 Resumen ${data.fecha}\n` +
      `Total: ${fmt(data.total)}\n` +
      `Efectivo: ${fmt(data.efectivo)} | Transferencia: ${fmt(data.transferencia)}\n` +
      `Pedidos: ${data.cantidad} | Cancelados: ${data.cancelados}`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  }

  if (loading) {
    return (
      <div
        style={{
          background: "var(--dash-surface)",
          border: "1px solid var(--dash-border)",
          borderRadius: 16,
          padding: "20px 24px",
          height: 120,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span style={{ fontSize: 13, color: "var(--dash-muted)" }}>
          Cargando cierre de caja...
        </span>
      </div>
    );
  }

  if (!data) return null;

  const change = changePct(data.total, data.vs_ayer.total);
  const isUp = change?.startsWith("↑");

  return (
    <div
      style={{
        background: "var(--dash-surface)",
        border: "1px solid var(--dash-border)",
        borderRadius: 16,
        padding: "20px 24px",
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <div>
          <h3
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: "var(--dash-text)",
              margin: 0,
            }}
          >
            Cierre de caja — {data.fecha}
          </h3>
          <p style={{ fontSize: 12, color: "var(--dash-muted)", margin: 0 }}>
            {data.cantidad} pedido{data.cantidad !== 1 ? "s" : ""}
            {data.cancelados > 0 &&
              ` · ${data.cancelados} cancelado${data.cancelados !== 1 ? "s" : ""}`}
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {change && (
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: isUp ? "#4ade80" : "#f87171",
                background: isUp
                  ? "rgba(74,222,128,0.1)"
                  : "rgba(248,113,113,0.1)",
                border: `1px solid ${isUp ? "rgba(74,222,128,0.25)" : "rgba(248,113,113,0.25)"}`,
                borderRadius: 999,
                padding: "3px 10px",
              }}
            >
              {change}
            </span>
          )}
          <button
            onClick={handleShare}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              padding: "6px 12px",
              background: "rgba(37,211,102,0.1)",
              border: "1px solid rgba(37,211,102,0.3)",
              borderRadius: 8,
              color: "#25D366",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "rgba(37,211,102,0.18)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "rgba(37,211,102,0.1)")
            }
          >
            Compartir resumen
          </button>
        </div>
      </div>

      {/* Total */}
      <div
        style={{
          fontSize: 32,
          fontWeight: 800,
          color: "var(--dash-text)",
          lineHeight: 1,
          fontFamily: "var(--font-mono, monospace)",
        }}
      >
        {fmt(data.total)}
      </div>

      {/* Breakdown grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: 10,
        }}
      >
        {[
          {
            label: "Efectivo",
            value: data.efectivo,
            pctStr: pct(data.efectivo, data.total),
            color: "#f59e0b",
            bg: "rgba(245,158,11,0.08)",
            border: "rgba(245,158,11,0.2)",
          },
          {
            label: "Transferencia",
            value: data.transferencia,
            pctStr: pct(data.transferencia, data.total),
            color: "#60a5fa",
            bg: "rgba(96,165,250,0.08)",
            border: "rgba(96,165,250,0.2)",
          },
          {
            label: "Delivery",
            value: data.delivery,
            pctStr: pct(data.delivery, data.total),
            color: "#a78bfa",
            bg: "rgba(167,139,250,0.08)",
            border: "rgba(167,139,250,0.2)",
          },
          {
            label: "Retiro en local",
            value: data.retiro,
            pctStr: pct(data.retiro, data.total),
            color: "#34d399",
            bg: "rgba(52,211,153,0.08)",
            border: "rgba(52,211,153,0.2)",
          },
        ].map(({ label, value, pctStr, color, bg, border }) => (
          <div
            key={label}
            style={{
              background: bg,
              border: `1px solid ${border}`,
              borderRadius: 10,
              padding: "10px 12px",
            }}
          >
            <p
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "var(--dash-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                margin: "0 0 4px",
              }}
            >
              {label}
            </p>
            <p
              style={{
                fontSize: 16,
                fontWeight: 800,
                color,
                margin: 0,
                fontFamily: "var(--font-mono, monospace)",
              }}
            >
              {fmt(value)}
            </p>
            <p style={{ fontSize: 11, color: "var(--dash-muted)", margin: 0 }}>
              {pctStr} del total
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
