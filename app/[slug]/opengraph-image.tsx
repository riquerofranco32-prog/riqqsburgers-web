import { createClient } from "@supabase/supabase-js";
import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Menú del restaurante";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data: tenant } = await supabase
    .from("tenants")
    .select("name, primary_color, logo_url, tagline")
    .eq("slug", slug)
    .eq("active", true)
    .single();

  const name = tenant?.name ?? slug;
  const accent = tenant?.primary_color ?? "#FF6B35";

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
        color: "white",
        fontFamily: "sans-serif",
        padding: "60px",
      }}
    >
      {tenant?.logo_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={tenant.logo_url}
          alt=""
          width={120}
          height={120}
          style={{ borderRadius: 28, marginBottom: 32, objectFit: "cover" }}
        />
      )}
      <div
        style={{
          fontSize: 72,
          fontWeight: 800,
          marginBottom: 16,
          textAlign: "center",
        }}
      >
        {name}
      </div>
      {tenant?.tagline && (
        <div
          style={{
            fontSize: 28,
            opacity: 0.85,
            marginBottom: 40,
            textAlign: "center",
          }}
        >
          {tenant.tagline}
        </div>
      )}
      <div
        style={{
          fontSize: 22,
          background: "rgba(255,255,255,0.2)",
          padding: "10px 28px",
          borderRadius: 999,
        }}
      >
        Ver menú y pedir por WhatsApp
      </div>
    </div>,
    { ...size },
  );
}
