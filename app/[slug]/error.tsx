"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[catalog-error]", error);
  }, [error]);

  const isAdmin = typeof window !== "undefined" && window.location.pathname.includes("/admin");
  
  const title = isAdmin ? "Error en el Panel Admin" : "Algo salió mal";
  const message = isAdmin
    ? "No pudimos cargar el panel de administración. Verificá tu conexión o intentá de nuevo."
    : "No pudimos cargar la carta. Intentá de nuevo en un momento.";

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "#111",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 20px",
        textAlign: "center",
        color: "#fff",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div style={{ fontSize: 48, marginBottom: 16 }}>😕</div>
      <h1 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 8px" }}>
        {title}
      </h1>
      <p
        style={{
          color: "#888",
          fontSize: 14,
          margin: "0 0 24px",
          maxWidth: 400,
          lineHeight: 1.5,
        }}
      >
        {message}
      </p>
      
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
        <button
          onClick={reset}
          style={{
            background: "#FF6B35",
            color: "#fff",
            border: "none",
            borderRadius: 12,
            padding: "12px 28px",
            fontSize: 15,
            fontWeight: 600,
            cursor: "pointer",
            transition: "opacity 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        >
          Reintentar
        </button>

        {error && (
          <details
            style={{
              marginTop: 12,
              textAlign: "left",
              width: "100%",
              maxWidth: 400,
              fontSize: 12,
              color: "rgba(255, 255, 255, 0.4)",
            }}
          >
            <summary style={{ cursor: "pointer", outline: "none", userSelect: "none" }}>
              Ver detalles técnicos del error
            </summary>
            <pre
              style={{
                marginTop: 8,
                padding: 12,
                background: "#1e1e1e",
                borderRadius: 8,
                border: "1px solid rgba(255,255,255,0.08)",
                overflowX: "auto",
                whiteSpace: "pre-wrap",
                color: "#ff8c8c",
                fontFamily: "monospace",
              }}
            >
              {error.message || String(error)}
              {error.digest && `\nDigest: ${error.digest}`}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}

