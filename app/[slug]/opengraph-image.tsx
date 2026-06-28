import { createClient } from "@supabase/supabase-js";
import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Menú del restaurante";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Devuelve '#1A1208' para fondos claros, '#FFFFFF' para oscuros */
function onColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const luma = 0.299 * r + 0.587 * g + 0.114 * b;
  return luma > 0.55 ? "#1A1208" : "#FFFFFF";
}

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let tenant: {
    name: string;
    primary_color: string | null;
    logo_url: string | null;
    tagline: string | null;
  } | null = null;

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
    const { data } = await supabase
      .from("tenants")
      .select("name, primary_color, logo_url, tagline")
      .eq("slug", slug)
      .eq("active", true)
      .single();
    tenant = data;
  } catch {
    // Fallback genérico si Supabase falla
  }

  const name = tenant?.name ?? "Carta digital";
  const accent = tenant?.primary_color ?? "#FF6B35";
  const fg = onColor(accent);
  const fgMuted =
    fg === "#FFFFFF" ? "rgba(255,255,255,0.75)" : "rgba(26,18,8,0.6)";
  const pillBg =
    fg === "#FFFFFF" ? "rgba(255,255,255,0.18)" : "rgba(26,18,8,0.12)";

  return new ImageResponse(
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        height: "100%",
        background: accent,
        color: fg,
        fontFamily: "sans-serif",
        padding: "60px",
        position: "relative",
      }}
    >
      {/* Branding Takefyy — esquina superior derecha */}
      <div
        style={{
          position: "absolute",
          top: 36,
          right: 48,
          fontSize: 20,
          fontWeight: 700,
          opacity: 0.6,
          letterSpacing: "0.08em",
          display: "flex",
        }}
      >
        takefyy.com
      </div>

      {tenant?.logo_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={tenant.logo_url}
          alt=""
          width={120}
          height={120}
          style={{ borderRadius: 28, marginBottom: 32, objectFit: "cover" }}
        />
      ) : null}

      <div
        style={{
          fontSize: 72,
          fontWeight: 800,
          marginBottom: 16,
          textAlign: "center",
          lineHeight: 1.1,
          display: "flex",
        }}
      >
        {name}
      </div>

      {tenant?.tagline ? (
        <div
          style={{
            fontSize: 28,
            color: fgMuted,
            marginBottom: 40,
            textAlign: "center",
            maxWidth: "800px",
            display: "flex",
          }}
        >
          {tenant.tagline}
        </div>
      ) : null}

      <div
        style={{
          fontSize: 22,
          background: pillBg,
          color: fg,
          padding: "10px 28px",
          borderRadius: 999,
          display: "flex",
        }}
      >
        Ver menú y pedir por WhatsApp
      </div>
    </div>,
    { ...size },
  );
}
