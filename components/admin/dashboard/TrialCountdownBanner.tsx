"use client";

import { Sparkles } from "lucide-react";

const WHATSAPP_SUPPORT =
  "https://wa.me/542994247985?text=Hola%2C%20quiero%20mantener%20el%20plan%20Pro%20en%20Takefyy";

interface TrialCountdownBannerProps {
  daysLeft: number;
}

export function TrialCountdownBanner({ daysLeft }: TrialCountdownBannerProps) {
  const urgent = daysLeft <= 3;
  const color = urgent ? "#f87171" : "var(--accent)";
  const bg = urgent ? "rgba(248,113,113,0.08)" : "rgba(255,107,53,0.08)";
  const border = urgent ? "rgba(248,113,113,0.25)" : "rgba(255,107,53,0.25)";

  return (
    <div
      style={{
        background: bg,
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        border: `1px solid ${border}`,
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
            background: urgent
              ? "rgba(248,113,113,0.15)"
              : "rgba(255,107,53,0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: `1px solid ${border}`,
            flexShrink: 0,
          }}
        >
          <Sparkles size={15} style={{ color }} strokeWidth={2.5} />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <p
            style={{
              fontSize: 13,
              color,
              fontWeight: 600,
              lineHeight: 1.2,
            }}
          >
            {daysLeft === 1
              ? "Tu prueba Pro termina mañana"
              : `Te quedan ${daysLeft} días de prueba Pro`}
          </p>
          <p
            style={{
              fontSize: 11,
              color: "var(--dash-muted)",
              lineHeight: 1.3,
            }}
          >
            Cuando termine volvés al plan Starter: sin analytics ni
            personalización de marca (productos y categorías siguen ilimitados).
          </p>
        </div>
      </div>

      <a
        href={WHATSAPP_SUPPORT}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: "#fff",
          background: urgent
            ? "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)"
            : "linear-gradient(135deg, var(--accent) 0%, var(--accent-hover) 100%)",
          padding: "8px 16px",
          borderRadius: 8,
          textDecoration: "none",
          whiteSpace: "nowrap",
        }}
      >
        Mantener Pro →
      </a>
    </div>
  );
}
