import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Explorá restaurantes en Takefyy";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* Accent glow */}
        <div
          style={{
            position: "absolute",
            width: 600,
            height: 600,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(255,107,53,0.15), transparent 70%)",
            top: -200,
            right: -100,
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 400,
            height: 400,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(255,107,53,0.1), transparent 70%)",
            bottom: -150,
            left: -50,
          }}
        />

        {/* Content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 16,
            zIndex: 1,
          }}
        >
          <div
            style={{
              fontSize: 28,
              fontWeight: 600,
              color: "#ff6b35",
              letterSpacing: 2,
              textTransform: "uppercase",
            }}
          >
            TAKEFYY
          </div>
          <div
            style={{
              fontSize: 56,
              fontWeight: 800,
              color: "#ffffff",
              textAlign: "center",
              lineHeight: 1.15,
              maxWidth: 800,
            }}
          >
            Explorá restaurantes
          </div>
          <div
            style={{
              fontSize: 22,
              color: "#a3a3a3",
              textAlign: "center",
              maxWidth: 600,
              lineHeight: 1.5,
            }}
          >
            Descubrí negocios, mirá menús digitales y encontrá descuentos
            exclusivos
          </div>
        </div>

        {/* Bottom bar */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 6,
            background: "linear-gradient(90deg, #ff6b35, #ff8f65, #ff6b35)",
          }}
        />
      </div>
    ),
    { ...size },
  );
}
