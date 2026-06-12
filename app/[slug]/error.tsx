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
        Algo salió mal
      </h1>
      <p
        style={{
          color: "#888",
          fontSize: 14,
          margin: "0 0 28px",
          maxWidth: 300,
        }}
      >
        No pudimos cargar la carta. Intentá de nuevo en un momento.
      </p>
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
        }}
      >
        Reintentar
      </button>
    </div>
  );
}
