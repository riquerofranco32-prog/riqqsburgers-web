"use client";

import { useState } from "react";
import { Ticket, CheckCircle2, Copy } from "lucide-react";
import { fmt, type PublicCoupon } from "@/app/[slug]/catalogHelpers";

export default function CouponBanner({
  coupons,
  accent,
  text,
  text2,
  border,
  surface,
}: {
  coupons: PublicCoupon[];
  accent: string;
  text: string;
  text2: string;
  border: string;
  surface: string;
}) {
  const [copied, setCopied] = useState<string | null>(null);

  async function copy(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(code);
      setTimeout(() => setCopied(null), 2000);
    } catch {}
  }

  return (
    <div
      style={{
        margin: "16px 12px 0",
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      {coupons.map((c) => {
        const label =
          c.discount_type === "percent"
            ? `${c.discount_value}% OFF`
            : `${fmt(c.discount_value)} OFF`;
        return (
          <button
            key={c.code}
            onClick={() => void copy(c.code)}
            aria-label={`Copiar código ${c.code}`}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "12px 14px",
              borderRadius: 16,
              background: `linear-gradient(135deg, ${accent}14 0%, ${surface} 70%)`,
              border: `1.5px dashed ${accent}55`,
              cursor: "pointer",
              textAlign: "left",
              width: "100%",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                background: `${accent}1f`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Ticket size={19} style={{ color: accent }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p
                style={{
                  fontSize: 14,
                  fontWeight: 800,
                  color: text,
                  lineHeight: 1.2,
                }}
              >
                {label} en tu pedido
              </p>
              <p style={{ fontSize: 12, color: text2, marginTop: 2 }}>
                {c.min_order_amount
                  ? `Pedido mínimo ${fmt(c.min_order_amount)} · `
                  : ""}
                Usalo al finalizar tu compra
              </p>
            </div>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontFamily: "monospace",
                fontSize: 13,
                fontWeight: 700,
                color: copied === c.code ? "#22c55e" : accent,
                background: surface,
                border: `1px solid ${copied === c.code ? "#22c55e55" : border}`,
                borderRadius: 10,
                padding: "7px 10px",
                flexShrink: 0,
                transition: "color 0.15s, border-color 0.15s",
              }}
            >
              {copied === c.code ? (
                <>
                  <CheckCircle2 size={14} /> ¡Copiado!
                </>
              ) : (
                <>
                  {c.code} <Copy size={13} />
                </>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
