import type { Metadata } from "next";
import { getTenant } from "@/lib/tenants";
import BackButton from "@/components/BackButton";
import QRActions from "@/components/admin/QRActions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Código QR" };

export default async function QRPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const tenant = await getTenant(slug);
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
      {/* BackButton oculto en impresión */}
      <div className="no-print">
        <BackButton href={`/${slug}/admin`} label="Dashboard" />
      </div>

      <div className="no-print">
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
        id="qr-card-print"
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

      {/* Acciones interactivas (Client Component) */}
      <div className="no-print">
        <QRActions
          qrApiUrl={qrApiUrl}
          menuUrl={menuUrl}
          slug={slug}
          accent={accent}
        />
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
          .no-print { }
          @media print {
            .no-print { display: none !important; }
            body { margin: 0; background: #fff; }
            body > * { display: none !important; }
            #qr-card-print {
              display: flex !important;
              position: fixed;
              inset: 0;
              margin: auto;
              width: fit-content;
              height: fit-content;
              border-radius: 20px !important;
              page-break-inside: avoid;
            }
          }
        `,
        }}
      />
    </div>
  );
}
