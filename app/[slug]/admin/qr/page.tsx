import type { Metadata } from "next";
import { createServerClient } from "@/lib/supabase";
import type { Tenant } from "@/types/supabase";
import BackButton from "@/components/BackButton";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Código QR" };

export default async function QRPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const db = createServerClient();
  const { data: rawTenant } = await db
    .from("tenants")
    .select("id, name, slug, logo_url, primary_color")
    .eq("slug", slug)
    .maybeSingle();

  const tenant = rawTenant as Pick<
    Tenant,
    "id" | "name" | "slug" | "logo_url" | "primary_color"
  > | null;
  if (!tenant) return null;

  const menuUrl = `https://takefyy.com/${slug}`;
  const accent = tenant.primary_color ?? "#FF6B35";
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(menuUrl)}&bgcolor=FFFAF7&color=1A1208&margin=24&format=png`;

  return (
    <div
      style={{
        padding: "24px",
        maxWidth: 640,
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        gap: 24,
      }}
    >
      <BackButton href={`/${slug}/admin`} label="Dashboard" />

      <div>
        <h1
          style={{
            fontSize: 22,
            fontWeight: 800,
            color: "var(--dash-text)",
            marginBottom: 6,
          }}
        >
          Código QR del menú
        </h1>
        <p style={{ fontSize: 13, color: "var(--dash-muted)" }}>
          Ponelo en la mesa o en la caja para que los clientes accedan directo
          al menú.
        </p>
      </div>

      {/* QR Card — diseño imprimible */}
      <div
        id="qr-card"
        style={{
          background: "#FFFAF7",
          border: `2px solid ${accent}`,
          borderRadius: 20,
          padding: "32px 24px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 16,
        }}
      >
        {tenant.logo_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={tenant.logo_url}
            alt={tenant.name}
            style={{
              width: 72,
              height: 72,
              borderRadius: 18,
              objectFit: "cover",
              border: `2px solid ${accent}40`,
            }}
          />
        )}

        <p
          style={{
            fontSize: 20,
            fontWeight: 800,
            color: "#1A1208",
            textAlign: "center",
          }}
        >
          {tenant.name}
        </p>

        {/* QR image */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={qrApiUrl}
          alt="QR code"
          style={{
            width: 240,
            height: 240,
            borderRadius: 12,
          }}
        />

        <p
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: "#1A1208",
            textAlign: "center",
          }}
        >
          Escaneá para ver el menú y pedir
        </p>

        <p
          style={{
            fontSize: 12,
            color: "#888",
            fontFamily: "monospace",
          }}
        >
          {menuUrl}
        </p>
      </div>

      {/* Acciones */}
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
          Imprimir
        </button>

        <button
          onClick={() => {
            navigator.clipboard.writeText(menuUrl).catch(() => {});
          }}
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
          Copiar link
        </button>
      </div>

      {/* Print styles */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
          @media print {
            body > *:not(#qr-card) { display: none !important; }
            #qr-card {
              border: 2px solid #ccc !important;
              page-break-inside: avoid;
            }
          }
        `,
        }}
      />
    </div>
  );
}
