"use client";

import { useState } from "react";
import { Download, Printer, Link2, Check } from "lucide-react";

interface QRActionsProps {
  qrApiUrl: string;
  menuUrl: string;
  slug: string;
  accent: string;
}

export default function QRActions({
  qrApiUrl,
  menuUrl,
  slug,
  accent,
}: QRActionsProps) {
  const [copied, setCopied] = useState(false);

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
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <a
          href={qrApiUrl}
          download={`qr-${slug}.png`}
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
          Descargar PNG
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

      <style>{`
        @media print {
          body { margin: 0; }
          body > * { display: none !important; }
          #qr-card-print { display: flex !important; }
        }
      `}</style>
    </>
  );
}
