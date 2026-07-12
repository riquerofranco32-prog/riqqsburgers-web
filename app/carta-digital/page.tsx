// /carta-digital → contenido propio, no redirect, para capturar tráfico de "carta digital"
import type { Metadata } from "next";
import Link from "next/link";
import RelatedLinks from "@/app/components/RelatedLinks";

export const metadata: Metadata = {
  metadataBase: new URL("https://takefyy.com"),
  title: "Carta Digital para Restaurantes | Menú Online Gratis — Takefyy",
  description:
    "Creá la carta digital de tu restaurante en minutos. Tus clientes la ven desde el celular y te mandan el pedido por WhatsApp. Sin comisiones, sin apps. Gratis para empezar.",
  keywords: [
    "carta digital restaurante",
    "carta digital argentina",
    "carta digital gratis",
    "carta online restaurante",
    "carta digital whatsapp",
    "carta digital para restaurantes argentina",
    "carta digital hamburguesería",
    "carta digital pizzería",
    "carta digital sin comisiones",
    "carta digital 2026",
  ],
  alternates: { canonical: "https://takefyy.com/carta-digital" },
  openGraph: {
    title: "Carta Digital para Restaurantes — Takefyy",
    description:
      "Tu carta digital online. Pedidos directo a WhatsApp, sin comisiones. Gratis para empezar.",
    url: "https://takefyy.com/carta-digital",
    siteName: "Takefyy",
    locale: "es_AR",
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Carta Digital para Restaurantes — Takefyy",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Carta Digital para Restaurantes — Takefyy",
    description: "Carta digital. Pedidos por WhatsApp. Sin comisiones. Gratis.",
    images: ["/opengraph-image"],
  },
  robots: { index: true, follow: true },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      name: "Takefyy — Carta Digital",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      url: "https://takefyy.com/carta-digital",
      description:
        "Carta digital para restaurantes argentinos. El cliente accede desde el celular, elige los productos y hace el pedido por WhatsApp.",
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
          name: "Carta Digital",
          item: "https://takefyy.com/carta-digital",
        },
      ],
    },
    {
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "¿Qué diferencia hay entre una carta digital y un menú digital?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Ninguna funcional: son dos formas de nombrar lo mismo. Con Takefyy tu carta digital incluye productos, precios, fotos y pedidos por WhatsApp, sin importar cómo la llames.",
          },
        },
        {
          "@type": "Question",
          name: "¿Puedo tener una carta digital sin pagar nada?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Sí. Takefyy tiene un plan gratuito permanente con las funciones básicas para publicar tu carta y recibir pedidos por WhatsApp.",
          },
        },
        {
          "@type": "Question",
          name: "¿Cuánto tarda en estar lista mi carta digital?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Minutos. Cargás tus categorías y productos desde el panel, sin programar ni depender de un técnico, y tu carta queda publicada al instante.",
          },
        },
        {
          "@type": "Question",
          name: "¿Puedo actualizar precios y productos de mi carta digital cuando quiera?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Sí, en cualquier momento desde el panel de administración. Los cambios se reflejan al instante para todos los que vean tu carta.",
          },
        },
      ],
    },
  ],
};

const ACCENT = "var(--accent, #FF6B35)";

const benefits = [
  {
    icon: "📋",
    title: "Tu carta, siempre actualizada",
    desc: "Cambiá precios, agregá o quitá productos en segundos desde el panel.",
  },
  {
    icon: "📱",
    title: "Visible desde cualquier celular",
    desc: "Sin apps, sin descargas. El cliente la abre desde el navegador.",
  },
  {
    icon: "💬",
    title: "Pedidos por WhatsApp",
    desc: "El pedido llega directo a tu WhatsApp con todos los detalles.",
  },
  {
    icon: "📲",
    title: "Link y QR incluidos",
    desc: "Compartí la carta por Instagram, WhatsApp o un código QR para las mesas.",
  },
  {
    icon: "🎨",
    title: "Con tu identidad",
    desc: "Logo, colores y nombre de tu negocio. Tu carta, no la de Takefyy.",
  },
  {
    icon: "0%",
    title: "Sin comisiones",
    desc: "Precio fijo en pesos. Cada peso de la venta es tuyo.",
  },
];

export default function CartaDigitalPage() {
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
            <span style={{ color: "rgba(255,255,255,0.55)" }}>
              Carta Digital
            </span>
          </nav>

          <h1
            style={{
              fontFamily: "var(--font-anton)",
              fontSize: "clamp(2.4rem, 6vw, 4rem)",
              color: "#fff",
              lineHeight: 1.05,
              marginBottom: 20,
              maxWidth: 660,
              margin: "0 auto 20px",
            }}
          >
            La carta digital de tu restaurante, lista en minutos
          </h1>
          <p
            style={{
              fontSize: "clamp(1rem, 2vw, 1.15rem)",
              color: "rgba(255,255,255,0.6)",
              maxWidth: 520,
              margin: "0 auto 36px",
              lineHeight: 1.65,
            }}
          >
            Tus clientes la ven desde el celular. Eligen, hacen el pedido por
            WhatsApp y vos lo recibís sin intermediarios. Sin comisiones, sin
            costos en dólares.
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
            Crear mi carta digital gratis →
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

        <div style={{ maxWidth: 920, margin: "0 auto", padding: "72px 20px" }}>
          <h2
            style={{
              fontFamily: "var(--font-anton)",
              fontSize: "clamp(1.6rem, 3.5vw, 2.3rem)",
              textAlign: "center",
              marginBottom: 48,
              color: "#0E1116",
            }}
          >
            Beneficios de una carta digital con Takefyy
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: 20,
            }}
          >
            {benefits.map((b) => (
              <div
                key={b.title}
                style={{
                  background: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: 14,
                  padding: "22px 20px",
                }}
              >
                <div style={{ fontSize: 26, marginBottom: 10 }}>{b.icon}</div>
                <h3
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    marginBottom: 6,
                    color: "#0E1116",
                  }}
                >
                  {b.title}
                </h3>
                <p style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.6 }}>
                  {b.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div
          style={{ maxWidth: 720, margin: "0 auto", padding: "0 20px 72px" }}
        >
          <h2
            style={{
              fontFamily: "var(--font-anton)",
              fontSize: "clamp(1.6rem, 3.5vw, 2.2rem)",
              textAlign: "center",
              marginBottom: 40,
              color: "#0E1116",
            }}
          >
            Preguntas frecuentes sobre carta digital
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {(
              jsonLd["@graph"][2] as {
                mainEntity: Array<{
                  name: string;
                  acceptedAnswer: { text: string };
                }>;
              }
            ).mainEntity.map((q) => (
              <details
                key={q.name}
                style={{
                  background: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: 12,
                  padding: "18px 20px",
                }}
              >
                <summary
                  style={{
                    fontWeight: 600,
                    fontSize: 15,
                    cursor: "pointer",
                    color: "#0E1116",
                    listStyle: "none",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  {q.name}
                  <span style={{ flexShrink: 0, fontSize: 18, color: ACCENT }}>
                    +
                  </span>
                </summary>
                <p
                  style={{
                    marginTop: 12,
                    fontSize: 14,
                    color: "#6b7280",
                    lineHeight: 1.7,
                  }}
                >
                  {q.acceptedAnswer.text}
                </p>
              </details>
            ))}
          </div>
        </div>

        <div style={{ borderTop: "1px solid #e5e7eb", padding: "40px 20px" }}>
          <div style={{ maxWidth: 720, margin: "0 auto", textAlign: "center" }}>
            <p
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "#9ca3af",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                marginBottom: 16,
              }}
            >
              Carta digital por tipo de negocio
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
                { href: "/hamburgueserias", label: "🍔 Hamburguerías" },
                { href: "/pizzerias", label: "🍕 Pizzerías" },
                { href: "/menu-qr", label: "📲 Con código QR" },
                { href: "/pedidos-whatsapp", label: "💬 Pedidos por WhatsApp" },
              ].map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 99,
                    background: "#fff",
                    border: "1px solid #e5e7eb",
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#374151",
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
            Tu carta digital, hoy
          </h2>
          <p
            style={{
              color: "rgba(255,255,255,0.5)",
              fontSize: 15,
              marginBottom: 28,
            }}
          >
            Gratis para siempre. Sin contrato. Sin técnicos.
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

        <RelatedLinks exclude="/carta-digital" />
      </div>
    </>
  );
}
