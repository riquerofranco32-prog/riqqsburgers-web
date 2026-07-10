import type { Metadata } from "next";
import Link from "next/link";
import RelatedLinks from "@/app/components/RelatedLinks";

export const metadata: Metadata = {
  metadataBase: new URL("https://takefyy.com"),
  title: "Menú Digital para Hamburguerías | Pedidos por WhatsApp — Takefyy",
  description:
    "Creá el menú digital de tu hamburguesería en minutos. Recibí pedidos directo a tu WhatsApp, sin comisiones, sin Rappi. Fotos, combos, extras — todo incluido. Gratis para empezar.",
  keywords: [
    "menú digital hamburguesería",
    "carta digital hamburguesería argentina",
    "menú online hamburguesería gratis",
    "hamburguesería pedidos whatsapp",
    "sistema pedidos hamburguesería",
    "carta digital hamburguesas argentina",
    "menú hamburguesería sin rappi",
    "carta online hamburguesería",
    "pedidos whatsapp hamburguesería argentina",
    "menú digital para hamburguerías",
  ],
  alternates: { canonical: "https://takefyy.com/hamburgueserias" },
  openGraph: {
    title: "Menú Digital para Hamburguerías — Takefyy",
    description:
      "Menú digital para tu hamburguesería. Pedidos directo a tu WhatsApp, sin comisiones. Fotos, combos, extras y más.",
    url: "https://takefyy.com/hamburgueserias",
    siteName: "Takefyy",
    locale: "es_AR",
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Menú Digital para Hamburguerías — Takefyy",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Menú Digital para Hamburguerías — Takefyy",
    description:
      "Pedidos directo a WhatsApp. Sin comisiones. Gratis para empezar.",
  },
  robots: { index: true, follow: true },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      name: "Takefyy para Hamburguerías",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      url: "https://takefyy.com/hamburgueserias",
      description:
        "Menú digital especializado para hamburguerías argentinas. Pedidos directo a WhatsApp, sin comisiones, con fotos, combos y extras.",
      offers: [
        {
          "@type": "Offer",
          name: "Gratis",
          price: "0",
          priceCurrency: "ARS",
        },
      ],
    },
    {
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "¿Cómo funciona el menú digital para hamburguerías?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Tu cliente entra al link de tu hamburguesería, elige sus hamburguesas, combos y extras, y te manda el pedido directo por WhatsApp. Sin apps, sin intermediarios.",
          },
        },
        {
          "@type": "Question",
          name: "¿Puedo mostrar fotos de mis hamburguesas en el menú?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Sí. Subís fotos directamente desde el celular para cada producto. Las imágenes se muestran en el menú y ayudan a aumentar el ticket promedio.",
          },
        },
        {
          "@type": "Question",
          name: "¿Puedo agregar combos y extras (doble cheddar, bacon, etc.)?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Sí. En Takefyy configurás extras con precio propio en cada producto (doble cheddar, bacon, salsa especial, etc.) y el cliente los elige antes de hacer el pedido.",
          },
        },
        {
          "@type": "Question",
          name: "¿Cuánto cobra Takefyy por cada pedido de mi hamburguesería?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Cero. Takefyy cobra una suscripción mensual fija en pesos y no cobra comisión por pedido. El 100% de tu venta es tuyo.",
          },
        },
      ],
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
          name: "Menú Digital para Hamburguerías",
          item: "https://takefyy.com/hamburgueserias",
        },
      ],
    },
  ],
};

const features = [
  {
    icon: "📸",
    title: "Fotos que venden",
    desc: "Subí fotos de tus hamburguesas desde el celular. El queso derretido vende solo.",
  },
  {
    icon: "🍔",
    title: "Combos y extras",
    desc: "Configurá doble cheddar, bacon extra, salsas — y subí el ticket promedio automáticamente.",
  },
  {
    icon: "📱",
    title: "Pedidos a WhatsApp",
    desc: "El cliente arma su pedido y te manda el detalle completo directo a tu WhatsApp.",
  },
  {
    icon: "🔥",
    title: "Badge 'Popular'",
    desc: "Marcá tus hamburguesas estrella y activá el efecto de prueba social.",
  },
  {
    icon: "0%",
    title: "Sin comisiones",
    desc: "Sin Rappi, sin PedidosYa. El 100% de cada venta es tuyo.",
  },
  {
    icon: "⚡",
    title: "Listo en minutos",
    desc: "Cargás tus productos, publicás el link y empezás a recibir pedidos el mismo día.",
  },
];

export default function HamburgueseriasPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div
        style={{
          minHeight: "100vh",
          background: "var(--brand-cream)",
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
          <Link
            href="/"
            style={{
              display: "inline-block",
              marginBottom: 32,
              color: "rgba(255,255,255,0.4)",
              fontSize: 13,
              fontWeight: 500,
              textDecoration: "none",
            }}
          >
            ← Volver a Takefyy
          </Link>

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
            <span style={{ fontSize: 14 }}>🍔</span>
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "var(--accent)",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              Para hamburguerías
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
              maxWidth: 700,
              margin: "0 auto 20px",
            }}
          >
            Menú digital para tu{" "}
            <span style={{ color: "var(--accent)" }}>hamburguesería</span>
          </h1>

          <p
            style={{
              fontSize: 17,
              color: "rgba(255,255,255,0.55)",
              maxWidth: 540,
              margin: "0 auto 36px",
              lineHeight: 1.7,
            }}
          >
            Tus clientes eligen sus hamburguesas, combos y extras desde el
            celular y te mandan el pedido{" "}
            <strong style={{ color: "rgba(255,255,255,0.8)" }}>
              directo a tu WhatsApp
            </strong>
            . Sin comisiones. Sin apps.
          </p>

          <div
            style={{
              display: "flex",
              gap: 12,
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <a
              href="https://wa.me/542994247985?text=Hola!%20Quiero%20crear%20el%20men%C3%BA%20digital%20de%20mi%20hamburguesar%C3%ADa%20%F0%9F%94%A5"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "14px 28px",
                borderRadius: 99,
                background: "var(--accent)",
                color: "#fff",
                fontWeight: 700,
                fontSize: 15,
                textDecoration: "none",
              }}
            >
              Empezar gratis →
            </a>
            <Link
              href="/blog/menu-digital-hamburguesia-guia-completa"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "14px 28px",
                borderRadius: 99,
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "rgba(255,255,255,0.75)",
                fontWeight: 600,
                fontSize: 15,
                textDecoration: "none",
              }}
            >
              Ver guía completa
            </Link>
          </div>
        </div>

        {/* Features */}
        <div
          style={{
            maxWidth: 900,
            margin: "0 auto",
            padding: "72px 20px",
          }}
        >
          <p
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: "var(--accent)",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              textAlign: "center",
              marginBottom: 12,
            }}
          >
            Todo lo que necesita tu hamburguesería
          </p>
          <h2
            style={{
              fontFamily: "var(--font-anton)",
              fontSize: "clamp(1.8rem, 4vw, 2.8rem)",
              color: "var(--text-primary)",
              textAlign: "center",
              marginBottom: 48,
              letterSpacing: "0.01em",
            }}
          >
            Funciones pensadas para el rubro
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: 20,
            }}
          >
            {features.map((f) => (
              <div
                key={f.title}
                style={{
                  background: "#fff",
                  border: "1px solid var(--border)",
                  borderRadius: 16,
                  padding: "24px 24px",
                }}
              >
                <div style={{ fontSize: 28, marginBottom: 12 }}>{f.icon}</div>
                <h3
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: "var(--text-primary)",
                    marginBottom: 8,
                  }}
                >
                  {f.title}
                </h3>
                <p
                  style={{
                    fontSize: 14,
                    color: "var(--text-secondary)",
                    lineHeight: 1.6,
                  }}
                >
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* vs Rappi */}
        <div style={{ background: "#0E1116", padding: "64px 20px" }}>
          <div style={{ maxWidth: 640, margin: "0 auto", textAlign: "center" }}>
            <h2
              style={{
                fontFamily: "var(--font-anton)",
                fontSize: "clamp(1.6rem, 4vw, 2.4rem)",
                color: "#fff",
                marginBottom: 16,
                letterSpacing: "0.01em",
              }}
            >
              ¿Por qué no usar Rappi para tu hamburguesería?
            </h2>
            <p
              style={{
                fontSize: 15,
                color: "rgba(255,255,255,0.55)",
                lineHeight: 1.7,
                marginBottom: 32,
              }}
            >
              Rappi y PedidosYa cobran hasta el{" "}
              <strong style={{ color: "var(--accent)" }}>35% por pedido</strong>
              . En una hamburguesería con 50 pedidos mensuales de $10.000 cada
              uno, eso son{" "}
              <strong style={{ color: "var(--accent)" }}>
                $175.000 ARS que perdés
              </strong>{" "}
              en comisiones — más que el costo anual de Takefyy.
            </p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 16,
                maxWidth: 480,
                margin: "0 auto 32px",
              }}
            >
              {[
                {
                  label: "Rappi / PedidosYa",
                  value: "−35% por pedido",
                  bad: true,
                },
                { label: "Takefyy", value: "0% de comisión", bad: false },
              ].map((item) => (
                <div
                  key={item.label}
                  style={{
                    padding: "20px 16px",
                    borderRadius: 12,
                    border: item.bad
                      ? "1px solid rgba(239,68,68,0.2)"
                      : "1px solid rgba(34,197,94,0.2)",
                    background: item.bad
                      ? "rgba(239,68,68,0.06)"
                      : "rgba(34,197,94,0.06)",
                    textAlign: "center",
                  }}
                >
                  <p
                    style={{
                      fontSize: 12,
                      color: "rgba(255,255,255,0.4)",
                      marginBottom: 8,
                    }}
                  >
                    {item.label}
                  </p>
                  <p
                    style={{
                      fontSize: 20,
                      fontWeight: 700,
                      color: item.bad ? "#ef4444" : "#22c55e",
                    }}
                  >
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
            <a
              href="https://wa.me/542994247985?text=Hola!%20Quiero%20crear%20el%20men%C3%BA%20digital%20de%20mi%20hamburguesar%C3%ADa%20%F0%9F%94%A5"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "14px 32px",
                borderRadius: 99,
                background: "var(--accent)",
                color: "#fff",
                fontWeight: 700,
                fontSize: 15,
                textDecoration: "none",
              }}
            >
              Empezar gratis hoy →
            </a>
          </div>
        </div>

        {/* FAQ */}
        <div
          style={{
            maxWidth: 680,
            margin: "0 auto",
            padding: "72px 20px 80px",
          }}
        >
          <h2
            style={{
              fontFamily: "var(--font-anton)",
              fontSize: "clamp(1.6rem, 3vw, 2.2rem)",
              color: "var(--text-primary)",
              marginBottom: 36,
              textAlign: "center",
              letterSpacing: "0.01em",
            }}
          >
            Preguntas frecuentes
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {[
              {
                q: "¿Cómo funciona el menú digital para hamburguerías?",
                a: "Tu cliente entra al link de tu hamburguesería, elige sus hamburguesas, combos y extras, y te manda el pedido directo por WhatsApp. Sin apps, sin intermediarios.",
              },
              {
                q: "¿Puedo mostrar fotos de mis hamburguesas?",
                a: "Sí. Subís fotos directamente desde el celular para cada producto. Las imágenes se muestran en el menú y ayudan a aumentar el ticket promedio.",
              },
              {
                q: "¿Puedo agregar combos y extras como doble cheddar o bacon?",
                a: "Sí. Configurás extras con precio propio en cada producto y el cliente los elige antes de hacer el pedido.",
              },
              {
                q: "¿Cuánto cobra Takefyy por cada pedido?",
                a: "Cero. Takefyy cobra una suscripción mensual fija en pesos y no cobra comisión por pedido. El 100% de tu venta es tuyo.",
              },
            ].map((item) => (
              <div
                key={item.q}
                style={{
                  background: "#fff",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  padding: "20px 24px",
                }}
              >
                <p
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: "var(--text-primary)",
                    marginBottom: 8,
                  }}
                >
                  {item.q}
                </p>
                <p
                  style={{
                    fontSize: 14,
                    color: "var(--text-secondary)",
                    lineHeight: 1.6,
                  }}
                >
                  {item.a}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Related */}
        <div
          style={{
            background: "#F5F0EA",
            borderTop: "1px solid var(--border)",
            padding: "48px 20px",
          }}
        >
          <div style={{ maxWidth: 680, margin: "0 auto", textAlign: "center" }}>
            <p
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "var(--text-muted)",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                marginBottom: 20,
              }}
            >
              También te puede interesar
            </p>
            <div
              style={{
                display: "flex",
                gap: 12,
                justifyContent: "center",
                flexWrap: "wrap",
              }}
            >
              <Link
                href="/blog/menu-digital-hamburguesia-guia-completa"
                style={{
                  padding: "10px 20px",
                  borderRadius: 99,
                  background: "#fff",
                  border: "1px solid var(--border)",
                  color: "var(--text-primary)",
                  fontSize: 14,
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                Guía: Menú para hamburguerías →
              </Link>
              <Link
                href="/blog/pedidos-whatsapp-restaurante-vs-rappi-pedidosya"
                style={{
                  padding: "10px 20px",
                  borderRadius: 99,
                  background: "#fff",
                  border: "1px solid var(--border)",
                  color: "var(--text-primary)",
                  fontSize: 14,
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                WhatsApp vs Rappi: comparativa →
              </Link>
            </div>
          </div>
        </div>

        <RelatedLinks exclude="/hamburgueserias" />
      </div>
    </>
  );
}
