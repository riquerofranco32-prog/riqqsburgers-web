"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";

interface Props {
  slug: string;
}

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function ExportReportButton({ slug }: Props) {
  const [month, setMonth] = useState(currentMonth());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleDownload() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `/api/${slug}/admin/export-report?month=${month}`,
      );
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(data.error ?? "Error al generar el reporte");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `reporte-${slug}-${month}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 10,
        padding: "16px 20px",
        background: "var(--dash-surface)",
        border: "1px solid var(--dash-border)",
        borderRadius: 12,
      }}
    >
      <p
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: "var(--dash-text)",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          margin: 0,
        }}
      >
        Reporte mensual
      </p>

      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          style={{
            padding: "8px 12px",
            borderRadius: 8,
            fontSize: 14,
            background: "var(--dash-surface-2)",
            border: "1.5px solid var(--dash-border)",
            color: "var(--dash-text)",
            outline: "none",
            cursor: "pointer",
          }}
        />
        <button
          onClick={handleDownload}
          disabled={loading}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 16px",
            borderRadius: 8,
            background: loading ? "var(--dash-surface-2)" : "var(--accent)",
            color: loading ? "var(--dash-muted)" : "#fff",
            border: "none",
            fontSize: 13,
            fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer",
            transition: "background 0.15s",
          }}
        >
          {loading ? (
            <Loader2
              size={14}
              style={{ animation: "spin 1s linear infinite" }}
            />
          ) : (
            <Download size={14} />
          )}
          {loading ? "Generando..." : "Descargar Excel"}
        </button>
      </div>

      {error && (
        <p style={{ fontSize: 12, color: "#f87171", margin: 0 }}>{error}</p>
      )}
    </div>
  );
}
