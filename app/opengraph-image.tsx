import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt =
  "Takefyy — Menú digital para restaurantes con pedidos por WhatsApp";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#0E1116",
        position: "relative",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      {/* Background glow */}
      <div
        style={{
          position: "absolute",
          top: "10%",
          left: "50%",
          width: 800,
          height: 800,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(255,107,53,0.18) 0%, transparent 65%)",
          transform: "translateX(-50%)",
        }}
      />

      {/* Badge */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: "rgba(255,107,53,0.12)",
          border: "1px solid rgba(255,107,53,0.3)",
          borderRadius: 999,
          padding: "8px 20px",
          marginBottom: 32,
        }}
      >
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: "#22c55e",
          }}
        />
        <span
          style={{
            fontSize: 18,
            fontWeight: 600,
            color: "#FF6B35",
            letterSpacing: "0.05em",
          }}
        >
          Hecho en Argentina · Precio en pesos · 0% comisión
        </span>
      </div>

      {/* Logo */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 16,
            background: "#FF6B35",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 32,
            fontWeight: 900,
            color: "#fff",
          }}
        >
          T
        </div>
        <span
          style={{
            fontSize: 72,
            fontWeight: 900,
            color: "#fff",
            letterSpacing: "-0.02em",
          }}
        >
          Takefyy
        </span>
      </div>

      {/* Headline */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          fontSize: 40,
          fontWeight: 700,
          color: "rgba(255,255,255,0.85)",
          textAlign: "center",
          maxWidth: 700,
          lineHeight: 1.3,
          marginBottom: 28,
        }}
      >
        <span>Tu menú digital en minutos.</span>
        <span style={{ color: "#FF6B35" }}>Pedidos directo a tu WhatsApp.</span>
      </div>

      {/* Features row */}
      <div
        style={{
          display: "flex",
          gap: 16,
        }}
      >
        {[
          "Sin comisiones",
          "Sin apps",
          "Panel admin incluido",
          "Gratis para empezar",
        ].map((feat) => (
          <div
            key={feat}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 20px",
              borderRadius: 999,
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.12)",
              fontSize: 18,
              color: "rgba(255,255,255,0.75)",
              fontWeight: 500,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M3 8.5l3.2 3.2L13 4.8"
                stroke="#FF6B35"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {feat}
          </div>
        ))}
      </div>

      {/* URL */}
      <div
        style={{
          position: "absolute",
          bottom: 32,
          fontSize: 20,
          color: "rgba(255,255,255,0.3)",
          fontWeight: 500,
          letterSpacing: "0.05em",
        }}
      >
        takefyy.com
      </div>
    </div>,
    { ...size },
  );
}
