"use client";

import { useState } from "react";
import { Download, Printer, Link2, Check } from "lucide-react";

interface QRActionsProps {
  menuUrl: string;
  slug: string;
  accent: string;
}

// api.qrserver.com acepta `size=WxH` directo en la URL — no hace falta
// generar el PNG nosotros mismos, solo variar el parámetro.
const QR_SIZES = [
  { key: "small", label: "Chico", px: 300, hint: "Tarjeta / servilleta" },
  { key: "medium", label: "Mediano", px: 600, hint: "Mostrador / mesa" },
  { key: "large", label: "Grande", px: 1200, hint: "Vidriera / cartel" },
] as const;

function buildQrDownloadUrl(menuUrl: string, px: number) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${px}x${px}&data=${encodeURIComponent(menuUrl)}&bgcolor=FFFAF7&color=1A1208&margin=24&format=png`;
}

export default function QRActions({ menuUrl, slug, accent }: QRActionsProps) {
  const [copied, setCopied] = useState(false);
  const [size, setSize] = useState<(typeof QR_SIZES)[number]>(QR_SIZES[1]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(menuUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback for browsers that deny clipboard without interaction
    }
  }

  return (
    <>
      {/* Tamaño de descarga — el QR impreso en la tarjeta de arriba no
          cambia, solo el PNG que se descarga. */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          flexWrap: "wrap",
        }}
      >
        <span style={{ fontSize: 12, color: "var(--dash-muted)" }}>
          Tamaño:
        </span>
        {QR_SIZES.map((s) => (
          <button
            key={s.key}
            onClick={() => setSize(s)}
            title={s.hint}
            style={{
              padding: "5px 12px",
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              border: `1px solid ${size.key === s.key ? accent : "var(--dash-border)"}`,
              background:
                size.key === s.key ? `${accent}18` : "var(--dash-surface-2)",
              color: size.key === s.key ? accent : "var(--dash-muted)",
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <a
          href={buildQrDownloadUrl(menuUrl, size.px)}
          download={`qr-${slug}-${size.px}.png`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "12px 20px",
            borderRadius: 12,
            background: accent,
            color: "#fff",
            fontSize: 14,
            fontWeight: 600,
            textDecoration: "none",
            cursor: "pointer",
          }}
        >
          <Download size={15} strokeWidth={2} />
          Descargar PNG ({size.px}px)
        </a>

        <button
          onClick={() => window.print()}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "12px 20px",
            borderRadius: 12,
            background: "var(--dash-surface-2)",
            color: "var(--dash-text)",
            border: "1px solid var(--dash-border)",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          <Printer size={15} strokeWidth={2} />
          Imprimir
        </button>

        <button
          onClick={handleCopy}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "12px 20px",
            borderRadius: 12,
            background: copied ? `${accent}18` : "var(--dash-surface-2)",
            color: copied ? accent : "var(--dash-text)",
            border: `1px solid ${copied ? `${accent}40` : "var(--dash-border)"}`,
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
        >
          {copied ? (
            <Check size={15} strokeWidth={2.5} />
          ) : (
            <Link2 size={15} strokeWidth={2} />
          )}
          {copied ? "¡Copiado!" : "Copiar link"}
        </button>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        @media print {
          body { margin: 0; }
          body > * { display: none !important; }
          #qr-card-print { display: flex !important; }
        }
      `,
        }}
      />
    </>
  );
}
