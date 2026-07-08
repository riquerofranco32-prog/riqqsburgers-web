import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  metadataBase: new URL("https://takefyy.com"),
  title:
    "Menú Digital para Restaurantes en Argentina | Gratis — Takefyy",
  description:
    "Creá el menú digital de tu restaurante en minutos. Sin programar, sin costos en dólares. Pedidos directo a tu WhatsApp, sin comisiones. Gratis para empezar.",
  keywords: [
    "menú digital restaurante",
    "menú digital argentina",
    "menú digital gratis",
    "menú digital para restaurantes",
    "menú online restaurante",
    "carta digital restaurante",
    "menú digital sin comisiones",
    "menú digital whatsapp",
    "menú digital 2026",
    "menu digital",
  ],
  alternates: { canonical: "https://takefyy.com/menu-digital" },
  openGraph: {
    title: "Menú Digital para Restaurantes — Takefyy",
    description:
      "Creá el menú digital de tu restaurante en minutos. Pedidos directo a tu WhatsApp, sin comisiones, sin apps. Gratis para empezar.",
    url: "https://takefyy.com/menu-digital",
    siteName: "Takefyy",
    locale: "es_AR",
    type: "website",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Menú Digital para Restaurantes — Takefyy" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Menú Digital para Restaurantes — Takefyy",
    description:
      "Creá el menú digital de tu restaurante. Pedidos por WhatsApp. Sin comisiones. Gratis.",
    images: ["/opengraph-image"],
  },
  robots: { index: true, follow: true },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      name: "Takefyy — Menú Digital",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      url: "https://takefyy.com/menu-digital",
      description:
        "Plataforma de menú digital para restaurantes argentinos. Cargás tus productos, publicás el link y recibís pedidos directo por WhatsApp. Sin apps, sin comisiones.",
      offers: [
        { "@type": "Offer", name: "Gratis", price: "0", priceCurrency: "ARS" },
        {
          "@type": "Offer",
          name: "Pro",
          price: "17000",
          priceCurrency: "ARS",
          billingDuration: "P1M",
        },
      ],
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Inicio", item: "https://takefyy.com" },
        { "@type": "ListItem", position: 2, name: "Menú Digital", item: "https://takefyy.com/menu-digital" },
      ],
    },
    {
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "¿Qué es un menú digital para restaurantes?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Un menú digital es la versión online de tu carta física. Tus clientes lo acceden desde el celular con un link o un QR, eligen sus productos y te mandan el pedido directo por WhatsApp — sin apps ni intermediarios.",
          },
        },
        {
          "@type": "Question",
          name: "¿Cuánto cuesta un menú digital con Takefyy?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Takefyy tiene un plan gratuito permanente con todas las funciones básicas. El plan Pro cuesta $17.000 ARS por mes con URL propia, colores personalizados y más. Sin costos en dólares.",
          },
        },
        {
          "@type": "Question",
          name: "¿Cómo llegan los pedidos del menú digital?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Directo a tu WhatsApp. El cliente arma su pedido en el menú digital, hace click en 'Hacer pedido' y te llega un mensaje con todos los detalles: nombre, dirección, productos y monto total.",
          },
        },
        {
          "@type": "Question",
          name: "¿El menú digital funciona con código QR?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Sí. Tu menú digital tiene una URL propia (takefyy.com/tu-local) que podés convertir en código QR para las mesas, la puerta del local o las redes sociales. Gratuito incluido.",
          },
        },
        {
          "@type": "Question",
          name: "¿Hay comisión por cada pedido del menú digital?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "No. Con Takefyy pagás una suscripción mensual fija en pesos y el 100% de cada venta es tuyo. Sin porcentajes, sin sorpresas.",
          },
        },
      ],
    },
  ],
};

const features = [
  {
    icon: "📱",
    title: "Menú accesible desde el celular",
    desc: "Tu carta digital se ve perfecta en cualquier celular, sin necesidad de app. Cargada por link o QR.",
  },
  {
    icon: "💬",
    title: "Pedidos directo a WhatsApp",
    desc: "El cliente elige y te manda el pedido completo por WhatsApp. Sin intermediarios, sin comisiones.",
  },
  {
    icon: "📸",
    title: "Fotos de alta calidad",
    desc: "Subí fotos de tus productos desde el celular. Las imágenes aumentan el ticket promedio.",
  },
  {
    icon: "🎨",
    title: "Tu marca, tus colores",
    desc: "Personalizá tu menú con tu logo, colores y estética de tu negocio. Tu identidad, no la nuestra.",
  },
  {
    icon: "⚡",
    title: "Listo en minutos",
    desc: "Sin programar, sin técnicos. Cargás los productos, publicás el link y empezás a recibir pedidos.",
  },
  {
    icon: "📊",
    title: "Panel de administración",
    desc: "Gestioná productos, precios, stock y pedidos desde un panel simple y rápido.",
  },
];

const steps = [
  {
    n: "1",
    title: "Creá tu cuenta gratis",
    desc: "Registrate en takefyy.com. Sin tarjeta de crédito, sin datos de pago.",
  },
  {
    n: "2",
    title: "Cargá tu carta",
    desc: "Agregá categorías, productos, precios y fotos desde el panel admin.",
  },
  {
    n: "3",
    title: "Compartí el link",
    desc: "Publicá tu menú digital en redes, WhatsApp o con un QR en las mesas.",
  },
  {
    n: "4",
    title: "Recibí pedidos",
    desc: "Cada pedido llega directo a tu WhatsApp con todos los detalles.",
  },
];

const ACCENT = "var(--accent, #FF6B35)";

export default function MenuDigitalPage() {
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
        {/* Hero */}
        <div
          style={{
            background: "#0E1116",
            padding: "80px 20px 72px",
            textAlign: "center",
          }}
        >
          {/* Breadcrumb visible */}
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
              style={{ color: "rgba(255,255,255,0.35)", textDecoration: "none" }}
            >
              Takefyy
            </Link>
            <span style={{ color: "rgba(255,255,255,0.2)" }}>›</span>
            <span style={{ color: "rgba(255,255,255,0.55)" }}>
              Menú Digital
            </span>
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
            <span style={{ fontSize: 14 }}>🍽️</span>
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: ACCENT,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              Menú digital para restaurantes
            </span>
          </div>

          <h1
            style={{
              fontFamily: "var(--font-anton)",
              fontSize: "clamp(2.4rem, 6vw, 4.2rem)",
              color: "#fff",
              letterSpacing: "0.01em",
              lineHeight: 1.05,
              marginBottom: 20,
              maxWidth: 680,
              margin: "0 auto 20px",
            }}
          >
            El menú digital que tu restaurante necesitaba
          </h1>

          <p
            style={{
              fontSize: "clamp(1rem, 2vw, 1.2rem)",
              color: "rgba(255,255,255,0.6)",
              maxWidth: 540,
              margin: "0 auto 36px",
              lineHeight: 1.65,
            }}
          >
            Creá tu carta online en minutos. Pedidos directo a tu WhatsApp,
            sin Rappi, sin comisiones, sin costos en dólares. Gratis para
            empezar.
          </p>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 12,
              justifyContent: "center",
            }}
          >
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
              Crear mi menú digital gratis →
            </a>
            <a
              href="/belmont"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "15px 28px",
                borderRadius: 99,
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "rgba(255,255,255,0.8)",
                fontWeight: 600,
                fontSize: 15,
                textDecoration: "none",
              }}
            >
              Ver demo en vivo
            </a>
          </div>

          <p
            style={{
              fontSize: 12,
              color: "rgba(255,255,255,0.3)",
              marginTop: 20,
            }}
          >
            Sin tarjeta de crédito · Sin contrato · 14 días gratis
          </p>
        </div>

        {/* Features */}
        <div style={{ maxWidth: 960, margin: "0 auto", padding: "72px 20px" }}>
          <h2
            style={{
              fontFamily: "var(--font-anton)",
              fontSize: "clamp(1.6rem, 3.5vw, 2.4rem)",
              textAlign: "center",
              marginBottom: 48,
              color: "#0E1116",
            }}
          >
            Todo lo que incluye tu menú digital
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: 24,
            }}
          >
            {features.map((f) => (
              <div
                key={f.title}
                style={{
                  background: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: 14,
                  padding: "24px 22px",
                }}
              >
                <div style={{ fontSize: 28, marginBottom: 12 }}>{f.icon}</div>
                <h3
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    marginBottom: 8,
                    color: "#0E1116",
                  }}
                >
                  {f.title}
                </h3>
                <p style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.6 }}>
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Cómo funciona */}
        <div
          style={{
            background: "#0E1116",
            padding: "72px 20px",
          }}
        >
          <div style={{ maxWidth: 720, margin: "0 auto" }}>
            <h2
              style={{
                fontFamily: "var(--font-anton)",
                fontSize: "clamp(1.6rem, 3.5vw, 2.4rem)",
                color: "#fff",
                textAlign: "center",
                marginBottom: 48,
              }}
            >
              Cómo crear tu menú digital en 4 pasos
            </h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                gap: 20,
              }}
            >
              {steps.map((s) => (
                <div
                  key={s.n}
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 14,
                    padding: "22px 20px",
                    display: "flex",
                    gap: 16,
                    alignItems: "flex-start",
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      background: ACCENT,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 800,
                      fontSize: 16,
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
                        color: "#fff",
                        fontSize: 15,
                        marginBottom: 4,
                      }}
                    >
                      {s.title}
                    </p>
                    <p
                      style={{
                        fontSize: 13,
                        color: "rgba(255,255,255,0.5)",
                        lineHeight: 1.6,
                      }}
                    >
                      {s.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* FAQ */}
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
            Preguntas frecuentes sobre menú digital
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

        {/* Internal links */}
        <div
          style={{
            background: "rgba(255,107,53,0.04)",
            borderTop: "1px solid rgba(255,107,53,0.1)",
            padding: "48px 20px",
          }}
        >
          <div style={{ maxWidth: 720, margin: "0 auto" }}>
            <p
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "#9ca3af",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                marginBottom: 20,
                textAlign: "center",
              }}
            >
              Menú digital por tipo de negocio
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
                {
                  href: "/hamburgueserias",
                  label: "🍔 Hamburguerías",
                },
                { href: "/pizzerias", label: "🍕 Pizzerías" },
                {
                  href: "/dark-kitchens",
                  label: "🌒 Dark Kitchens",
                },
                {
                  href: "/menu-qr",
                  label: "📲 Menú con QR",
                },
                {
                  href: "/pedidos-whatsapp",
                  label: "💬 Pedidos por WhatsApp",
                },
              ].map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  style={{
                    padding: "8px 18px",
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

        {/* CTA final */}
        <div
          style={{
            background: "#0E1116",
            padding: "72px 20px",
            textAlign: "center",
          }}
        >
          <h2
            style={{
              fontFamily: "var(--font-anton)",
              fontSize: "clamp(1.8rem, 4vw, 2.8rem)",
              color: "#fff",
              marginBottom: 16,
            }}
          >
            Tu menú digital, listo hoy
          </h2>
          <p
            style={{
              color: "rgba(255,255,255,0.55)",
              fontSize: 16,
              marginBottom: 32,
            }}
          >
            Sin técnicos, sin contratos, sin costos en dólares.
          </p>
          <a
            href="/signup"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "16px 40px",
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
      </div>
    </>
  );
}
