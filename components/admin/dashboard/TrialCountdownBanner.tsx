"use client";

import { Sparkles } from "lucide-react";

const WHATSAPP_SUPPORT =
  "https://wa.me/542994247985?text=Hola%2C%20quiero%20mantener%20el%20plan%20Pro%20en%20Takefyy";

interface TrialCountdownBannerProps {
  daysLeft: number;
  /** true cuando es un plan pago con vencimiento fijo (no un trial gratis) */
  isPaidPlan?: boolean;
}

export function TrialCountdownBanner({
  daysLeft,
  isPaidPlan = false,
}: TrialCountdownBannerProps) {
  const urgent = daysLeft <= 3;
  const color = urgent ? "var(--dash-danger)" : "var(--accent)";
  const bg = urgent ? "var(--dash-danger-bg)" : "var(--dash-accent-subtle)";
  const border = urgent
    ? "var(--dash-danger-border)"
    : "var(--dash-accent-glow)";

  return (
    <div
      style={{
        background: bg,
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        border: `1px solid ${border}`,
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
            {isPaidPlan
              ? daysLeft === 1
                ? "Tu plan Pro vence mañana"
                : `Tu plan Pro vence en ${daysLeft} días`
              : daysLeft === 1
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
            {isPaidPlan
              ? "Renová antes del vencimiento para no volver al plan Starter: perderías analytics, personalización de marca y productos ilimitados."
              : "Cuando termine volvés al plan Starter: sin analytics, sin personalización de marca y tu menú público se recorta a 5 productos."}
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
            ? "linear-gradient(135deg, var(--dash-danger) 0%, #dc2626 100%)"
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
