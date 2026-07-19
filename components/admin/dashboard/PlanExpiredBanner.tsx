"use client";

import { AlertTriangle } from "lucide-react";

const WHATSAPP_SUPPORT =
  "https://wa.me/542994247985?text=Hola%2C%20mi%20plan%20Pro%20venci%C3%B3%20y%20quiero%20renovarlo";

export function PlanExpiredBanner() {
  return (
    <div
      style={{
        background: "var(--dash-danger-bg)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        border: "1px solid var(--dash-danger-border)",
        borderRadius: "var(--radius-lg)",
        padding: "14px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
        flexWrap: "wrap",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          flex: 1,
          minWidth: 260,
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: "var(--dash-danger-bg)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "1px solid var(--dash-danger-border)",
            flexShrink: 0,
          }}
        >
          <AlertTriangle
            size={15}
            style={{ color: "var(--dash-danger)" }}
            strokeWidth={2.5}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <p
            style={{
              fontSize: 13,
              color: "var(--dash-danger)",
              fontWeight: 600,
              lineHeight: 1.2,
            }}
          >
            Tu plan Pro venció
          </p>
          <p
            style={{
              fontSize: 11,
              color: "var(--dash-muted)",
              lineHeight: 1.3,
            }}
          >
            Volviste al plan Starter: sin estadísticas históricas, sin
            personalización de marca y tu menú público se recorta a 5 productos.
          </p>
        </div>
      </div>

      <a
        href={WHATSAPP_SUPPORT}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontSize: 12,
          fontWeight: 700,
          color: "#fff",
          background: "linear-gradient(135deg, var(--dash-danger) 0%, #dc2626 100%)",
          padding: "8px 16px",
          borderRadius: 8,
          textDecoration: "none",
          whiteSpace: "nowrap",
        }}
      >
        Renovar por WhatsApp →
      </a>
    </div>
  );
}
