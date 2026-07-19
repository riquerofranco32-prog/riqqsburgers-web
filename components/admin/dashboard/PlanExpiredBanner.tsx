"use client";

import { AlertTriangle } from "lucide-react";

const WHATSAPP_SUPPORT =
  "https://wa.me/542994247985?text=Hola%2C%20mi%20plan%20Pro%20venci%C3%B3%20y%20quiero%20renovarlo";

export function PlanExpiredBanner() {
  return (
    <div
      style={{
        background: "rgba(248,113,113,0.08)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        border: "1px solid rgba(248,113,113,0.25)",
        borderRadius: 16,
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
            background: "rgba(248,113,113,0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "1px solid rgba(248,113,113,0.25)",
            flexShrink: 0,
          }}
        >
          <AlertTriangle
            size={15}
            style={{ color: "#f87171" }}
            strokeWidth={2.5}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <p
            style={{
              fontSize: 13,
              color: "#f87171",
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
            Volviste al plan Starter: sin estadísticas históricas ni
            personalización de marca.
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
          background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
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
