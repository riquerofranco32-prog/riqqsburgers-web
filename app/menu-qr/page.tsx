import type { Metadata } from "next";
import Link from "next/link";
import RelatedLinks from "@/app/components/RelatedLinks";

export const metadata: Metadata = {
  metadataBase: new URL("https://takefyy.com"),
  title: "Menú QR para Restaurantes | Carta Digital con Código QR — Takefyy",
  description:
    "Creá el menú QR de tu restaurante en minutos. Imprimí el código QR para las mesas y tus clientes acceden a la carta digital al instante desde el celular.",
  keywords: [
    "menú qr restaurante",
    "carta qr restaurante argentina",
    "menú qr gratis",
    "código qr menú restaurante",
    "carta digital qr",
    "qr para mesas restaurante",
    "menú digital qr argentina",
    "menu qr",
    "menú qr sin comisiones",
    "qr restaurante pedidos whatsapp",
  ],
  alternates: { canonical: "https://takefyy.com/menu-qr" },
  openGraph: {
    title: "Menú QR para Restaurantes — Takefyy",
    description:
      "Menú con código QR para tus mesas. Pedidos directo a WhatsApp. Sin apps, sin comisiones. Gratis para empezar.",
    url: "https://takefyy.com/menu-qr",
    siteName: "Takefyy",
    locale: "es_AR",
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Menú QR para Restaurantes — Takefyy",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Menú QR para Restaurantes — Takefyy",
    description:
      "Menú con QR para tus mesas. Pedidos por WhatsApp. Sin comisiones.",
    images: ["/opengraph-image"],
  },
  robots: { index: true, follow: true },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      name: "Takefyy — Menú QR",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      url: "https://takefyy.com/menu-qr",
      description:
        "Menú digital con código QR para restaurantes. El cliente escanea el QR, ve la carta digital y hace el pedido por WhatsApp.",
      offers: [{ "@type": "Offer", price: "0", priceCurrency: "ARS" }],
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Inicio",
          item: "https://takefyy.com",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Menú QR",
          item: "https://takefyy.com/menu-qr",
        },
      ],
    },
    {
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "¿Cómo funciona el menú QR con Takefyy?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Cada restaurante en Takefyy tiene una URL propia (takefyy.com/tu-local). Convertís esa URL en un código QR (gratis con cualquier generador online), lo imprimís y lo ponés en las mesas. Tus clientes lo escanean con el celular y acceden al menú al instante.",
          },
        },
        {
          "@type": "Question",
          name: "¿El código QR del menú funciona sin internet del restaurante?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "El QR solo necesita internet en el celular del cliente, no en el del restaurante. Funciona con el 4G/5G del cliente sin que el local provea wifi.",
          },
        },
        {
          "@type": "Question",
          name: "¿Puedo actualizar el menú QR sin imprimir nuevos códigos?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Sí. El código QR apunta siempre a la misma URL. Cualquier cambio que hagas en el menú (precios, productos, fotos) se refleja instantáneamente sin necesidad de imprimir QRs nuevos.",
          },
        },
      ],
    },
  ],
};

const ACCENT = "var(--accent, #FF6B35)";
const steps = [
  {
    n: "1",
    title: "Creá tu menú digital",
    desc: "Registrate gratis en Takefyy y cargá tus productos en minutos.",
  },
  {
    n: "2",
    title: "Copiá tu URL",
    desc: "Tu menú queda en takefyy.com/tu-local. Esa es la URL del QR.",
  },
  {
    n: "3",
    title: "Generá el QR",
    desc: "Usá cualquier generador de QR online gratuito con tu URL.",
  },
  {
    n: "4",
    title: "Imprimilo y poné en las mesas",
    desc: "En papel, acrílico, sticker — como prefieras. Listo.",
  },
];

export default function MenuQRPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div
        style={{
          minHeight: "100vh",
          background: "var(--brand-cream, #FFF8F0)",
          fontFamily: "var(--font-sans)",
        }}
      >
        <div
          style={{
            background: "#0E1116",
            padding: "80px 20px 72px",
            textAlign: "center",
          }}
        >
          <nav
            aria-label="Breadcrumb"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              marginBottom: 32,
              fontSize: 12,
            }}
          >
            <Link
              href="/"
              style={{
                color: "rgba(255,255,255,0.35)",
                textDecoration: "none",
              }}
            >
              Takefyy
            </Link>
            <span style={{ color: "rgba(255,255,255,0.2)" }}>›</span>
            <span style={{ color: "rgba(255,255,255,0.55)" }}>Menú QR</span>
          </nav>

          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "rgba(255,107,53,0.1)",
              border: "1px solid rgba(255,107,53,0.25)",
              borderRadius: 99,
              padding: "6px 16px",
              marginBottom: 28,
            }}
          >
            <span style={{ fontSize: 16 }}>📲</span>
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: ACCENT,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              Menú QR para restaurantes
            </span>
          </div>

          <h1
            style={{
              fontFamily: "var(--font-anton)",
              fontSize: "clamp(2.4rem, 6vw, 4rem)",
              color: "#fff",
              lineHeight: 1.05,
              marginBottom: 20,
              maxWidth: 640,
              margin: "0 auto 20px",
            }}
          >
            Menú QR para tu restaurante — listo hoy
          </h1>
          <p
            style={{
              fontSize: "clamp(1rem, 2vw, 1.2rem)",
              color: "rgba(255,255,255,0.6)",
              maxWidth: 520,
              margin: "0 auto 36px",
              lineHeight: 1.65,
            }}
          >
            Tus clientes escanean el QR en la mesa y acceden al menú digital al
            instante. Hacen el pedido por WhatsApp, sin apps, sin comisiones.
          </p>
          <a
            href="/signup"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "15px 36px",
              borderRadius: 99,
              background: ACCENT,
              color: "#fff",
              fontWeight: 700,
              fontSize: 16,
              textDecoration: "none",
            }}
          >
            Crear mi menú QR gratis →
          </a>
          <p
            style={{
              fontSize: 12,
              color: "rgba(255,255,255,0.3)",
              marginTop: 16,
            }}
          >
            Sin tarjeta · 14 días gratis
          </p>
        </div>

        <div style={{ maxWidth: 720, margin: "0 auto", padding: "72px 20px" }}>
          <h2
            style={{
              fontFamily: "var(--font-anton)",
              fontSize: "clamp(1.6rem, 3.5vw, 2.2rem)",
              textAlign: "center",
              marginBottom: 40,
              color: "#0E1116",
            }}
          >
            4 pasos para tener tu menú QR
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: 16,
            }}
          >
            {steps.map((s) => (
              <div
                key={s.n}
                style={{
                  background: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: 14,
                  padding: "20px 18px",
                  display: "flex",
                  gap: 14,
                  alignItems: "flex-start",
                }}
              >
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: "50%",
                    background: ACCENT,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 800,
                    fontSize: 15,
                    color: "#fff",
                    flexShrink: 0,
                  }}
                >
                  {s.n}
                </div>
                <div>
                  <p
                    style={{
                      fontWeight: 700,
                      color: "#0E1116",
                      fontSize: 14,
                      marginBottom: 4,
                    }}
                  >
                    {s.title}
                  </p>
                  <p
                    style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.6 }}
                  >
                    {s.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: "#0E1116", padding: "40px 20px" }}>
          <div style={{ maxWidth: 720, margin: "0 auto", textAlign: "center" }}>
            <p
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "rgba(255,255,255,0.3)",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                marginBottom: 16,
              }}
            >
              También te puede interesar
            </p>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 10,
                justifyContent: "center",
              }}
            >
              {[
                { href: "/menu-digital", label: "🍽️ Menú Digital" },
                { href: "/pedidos-whatsapp", label: "💬 Pedidos por WhatsApp" },
                { href: "/carta-digital", label: "📋 Carta Digital" },
                { href: "/hamburgueserias", label: "🍔 Para Hamburguerías" },
              ].map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 99,
                    background: "rgba(255,255,255,0.07)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    fontSize: 13,
                    fontWeight: 600,
                    color: "rgba(255,255,255,0.7)",
                    textDecoration: "none",
                  }}
                >
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div
          style={{
            background: "#0E1116",
            borderTop: "1px solid rgba(255,255,255,0.05)",
            padding: "64px 20px",
            textAlign: "center",
          }}
        >
          <h2
            style={{
              fontFamily: "var(--font-anton)",
              fontSize: "clamp(1.8rem, 4vw, 2.6rem)",
              color: "#fff",
              marginBottom: 16,
            }}
          >
            Tu menú QR, listo en minutos
          </h2>
          <p
            style={{
              color: "rgba(255,255,255,0.5)",
              fontSize: 15,
              marginBottom: 28,
            }}
          >
            Gratis para siempre en el plan básico.
          </p>
          <a
            href="/signup"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "15px 36px",
              borderRadius: 99,
              background: ACCENT,
              color: "#fff",
              fontWeight: 700,
              fontSize: 16,
              textDecoration: "none",
            }}
          >
            Empezar gratis →
          </a>
        </div>

        <RelatedLinks exclude="/menu-qr" />
      </div>
    </>
  );
}
